import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseDb, isFirebaseAvailable } from '@/lib/firebase-admin';
import {
  addDoc,
  collection,
  Timestamp,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from 'firebase/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Sync endpoint som leser innkommende e-poster fra Microsoft Graph
 * og legger dem til i inboundRoutes samlingen
 */
async function getGraphAccessToken(): Promise<string | null> {
  const tenantId = process.env.GRAPH_TENANT_ID;
  const clientId = process.env.GRAPH_CLIENT_ID;
  const clientSecret = process.env.GRAPH_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    console.error('Microsoft Graph credentials not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials',
        }),
      }
    );

    if (!response.ok) {
      console.error('Failed to get access token:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

async function fetchEmailsFromGraph(): Promise<any[]> {
  const accessToken = await getGraphAccessToken();
  if (!accessToken) {
    return [];
  }

  const senderEmail = process.env.GRAPH_SENDER_UPN || 'driftpro@mavilogistikk.no';
  
  try {
    // Hent e-poster fra innboks med attachments inkludert
    const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(senderEmail)}/messages?$top=50&$orderby=receivedDateTime desc&$expand=attachments&$select=id,subject,from,sender,receivedDateTime,hasAttachments,attachments`;
    console.log(`📧 Fetching emails from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to fetch emails (${response.status} ${response.statusText}):`, errorText);
      throw new Error(`Graph API feil: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const emails = data.value || [];
    console.log(`✅ Hentet ${emails.length} e-poster fra Graph API`);
    return emails;
  } catch (error: any) {
    console.error('❌ Error fetching emails:', error);
    throw error; // Re-throw for å få bedre feilmelding i responsen
  }
}

async function downloadAttachment(attachmentId: string, messageId: string, accessToken: string): Promise<{ content: string; contentType: string } | null> {
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(process.env.GRAPH_SENDER_UPN || 'driftpro@mavilogistikk.no')}/messages/${messageId}/attachments/${attachmentId}/$value`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    // For PDF, lagre base64 som data URL (kan også lagres til OneDrive)
    return {
      content: `data:${contentType};base64,${base64}`,
      contentType,
    };
  } catch (error) {
    console.error('Error downloading attachment:', error);
    return null;
  }
}

const normalizeVehicle = (val: string): string => {
  const m = val.match(/\d+/);
  if (!m) return '';
  const n = parseInt(m[0], 10);
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n < 10) return `M00${n}`;
  if (n < 100) return `M0${n}`;
  return `M${n}`;
};

const extractVehicleFromText = (text: string): string | null => {
  const checks = [
    /NO[_\s-]?O[_\s-]?M0*?(\d{1,4})/i,
    /RESOURCE\s*ID[^A-Za-z0-9]+M0*?(\d{1,4})/i,
    /\bM0*?(\d{1,4})\b/i,
  ];
  for (const re of checks) {
    const m = text.match(re);
    if (m && m[1]) {
      const v = normalizeVehicle(m[1]);
      if (v && v !== 'M000') return v;
    }
  }
  return null;
};

const extractDateFromText = (text: string): string | null => {
  const startDateRe = /start\s*date[:\s-]*((?:\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2})|(?:\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4}))/i;
  const genericRe = /(\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}|\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})/;
  const normalize = (raw: string) => {
    const parts = raw.includes('-')
      ? raw.split('-')
      : raw.includes('.')
      ? raw.split('.')
      : raw.split('/');
    if (parts.length !== 3) return null;
    let y: number, m: number, d: number;
    if (parts[0].length === 4) {
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      d = parseInt(parts[2], 10);
    } else {
      d = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      y = parseInt(parts[2], 10);
      if (y < 100) y += 2000;
    }
    if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;
    const mm = m < 10 ? `0${m}` : `${m}`;
    const dd = d < 10 ? `0${d}` : `${d}`;
    return `${y}-${mm}-${dd}`;
  };
  const first = text.match(startDateRe);
  if (first && first[1]) {
    const norm = normalize(first[1]);
    if (norm) return norm;
  }
  const fallback = text.match(genericRe);
  if (fallback && fallback[1]) {
    const norm = normalize(fallback[1]);
    if (norm) return norm;
  }
  return null;
};

async function extractPdfText(fileUrl: string): Promise<string | null> {
  try {
    let data: Uint8Array | null = null;

    if (fileUrl.startsWith('data:')) {
      const idx = fileUrl.indexOf('base64,');
      if (idx !== -1) {
        const b64 = fileUrl.slice(idx + 'base64,'.length);
        data = new Uint8Array(Buffer.from(b64, 'base64'));
      }
    } else {
      const res = await fetch(fileUrl);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      data = new Uint8Array(arrayBuffer);
    }

    if (!data) return null;

    // @ts-ignore
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
    const doc = await pdfjsLib.getDocument({ data }).promise;
    let text = '';
    const maxPages = Math.min(doc.numPages, 5);
    for (let i = 1; i <= maxPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = (content.items as any[]).map((it: any) => it.str || '').join(' ');
      text += ' ' + pageText;
    }
    return text;
  } catch (err) {
    console.error('PDF parse error (sync)', err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!isFirebaseAvailable()) {
    return NextResponse.json(
      { success: false, error: 'Firebase er ikke konfigurert' },
      { status: 500 }
    );
  }
  
  const db = getFirebaseDb();
  if (!db) {
    return NextResponse.json(
      { success: false, error: 'Firebase database ikke tilgjengelig' },
      { status: 500 }
    );
  }

  try {
    // Sjekk miljøvariabler
    const tenantId = process.env.GRAPH_TENANT_ID;
    const clientId = process.env.GRAPH_CLIENT_ID;
    const clientSecret = process.env.GRAPH_CLIENT_SECRET;
    const senderUpn = process.env.GRAPH_SENDER_UPN || 'driftpro@mavilogistikk.no';
    
    if (!tenantId || !clientId || !clientSecret) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Microsoft Graph ikke konfigurert. Sjekk miljøvariablene GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET',
          debug: {
            hasTenantId: !!tenantId,
            hasClientId: !!clientId,
            hasClientSecret: !!clientSecret,
            senderUpn: senderUpn,
          }
        },
        { status: 500 }
      );
    }

    const accessToken = await getGraphAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Kunne ikke få access token fra Microsoft Graph. Sjekk at credentials er riktige og at app registration har riktige permissions.',
          debug: {
            tenantId: tenantId ? 'satt' : 'mangler',
            clientId: clientId ? 'satt' : 'mangler',
            clientSecret: clientSecret ? 'satt' : 'mangler',
          }
        },
        { status: 500 }
      );
    }

    // Hent alle eksisterende message IDs for å unngå duplikater
    const existingQuery = query(collection(db, 'inboundRoutes'));
    const existingSnapshot = await getDocs(existingQuery);
    const existingMessageIds = new Set(
      existingSnapshot.docs.map((doc) => doc.data().messageId || '').filter(Boolean)
    );

    // Hent nye e-poster fra Microsoft Graph
    console.log(`📧 Henter e-poster fra ${senderUpn}...`);
    const emails = await fetchEmailsFromGraph();
    console.log(`✅ Fant ${emails.length} e-poster`);
    
    // Log alle e-post emner for debugging
    emails.forEach((email: any, idx: number) => {
      console.log(`📨 E-post ${idx + 1}: "${email.subject}" fra ${email.from?.emailAddress?.address || email.sender?.emailAddress?.address}`);
    });
    
    const processed: string[] = [];
    const skipped: string[] = [];
    const errors: Array<{ messageId: string; error: string }> = [];
    const reportDetails: Array<{
      messageId: string;
      fileName: string;
      date?: string;
      vehicle?: string;
      partnerName?: string;
      status: 'sent' | 'no_vehicle' | 'no_partner' | 'failed';
      error?: string;
    }> = [];

    for (const email of emails) {
      const messageId = email.id;

      // Hopp over hvis allerede prosessert
      if (existingMessageIds.has(messageId)) {
        skipped.push(messageId);
        console.log(`⏭️  Hoppet over (allerede prosessert): ${email.subject}`);
        continue;
      }

      const fromEmail = (email.from?.emailAddress?.address || email.sender?.emailAddress?.address || '').toLowerCase();
      const isElkjop = fromEmail.includes('@elkjop.no');
      
      console.log(`🔄 Prosesserer: "${email.subject}" fra ${fromEmail} (Elkjøp: ${isElkjop})`);

      // Hent vedlegg (kan være inkludert i email-objektet eller må hentes separat)
      const attachments: any[] = [];
      const emailAttachments = email.attachments || [];
      
      // Hvis attachments ikke er inkludert, hent dem separat
      if (email.hasAttachments && (!emailAttachments || emailAttachments.length === 0)) {
        try {
          const attachmentsResponse = await fetch(
            `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(process.env.GRAPH_SENDER_UPN || 'driftpro@mavilogistikk.no')}/messages/${messageId}/attachments`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (attachmentsResponse.ok) {
            const attachmentsData = await attachmentsResponse.json();
            emailAttachments.push(...(attachmentsData.value || []));
          }
        } catch (error) {
          console.error('Error fetching attachments:', error);
        }
      }

      // Prosesser alle PDF-vedlegg (eller alle vedlegg hvis det er "Backup Form")
      const isBackupForm = (email.subject || '').toLowerCase().includes('backup form');
      
      for (const att of emailAttachments) {
        const isPdf = att.contentType === 'application/pdf' || att.name?.toLowerCase().endsWith('.pdf');
        
        // Inkluder alle vedlegg for "Backup Form", ikke bare PDF
        if (isPdf || isBackupForm) {
          let fileUrl = '';
          
          // Hvis attachment har contentBytes, bruk det direkte
          if (att.contentBytes) {
            try {
              fileUrl = `data:application/pdf;base64,${att.contentBytes}`;
            } catch (contentError) {
              console.error('Error processing contentBytes:', contentError);
            }
          } else if (att.id) {
            // Hvis ikke, hent innholdet via $value endpoint
            try {
              const contentResponse = await fetch(
                `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(process.env.GRAPH_SENDER_UPN || 'driftpro@mavilogistikk.no')}/messages/${messageId}/attachments/${att.id}/$value`,
                {
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                  },
                }
              );

              if (contentResponse.ok) {
                const arrayBuffer = await contentResponse.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString('base64');
                fileUrl = `data:application/pdf;base64,${base64}`;
              }
            } catch (contentError) {
              console.error('Error downloading attachment content:', contentError);
            }
          }

          attachments.push({
            fileName: att.name || (isPdf ? 'vedlegg.pdf' : 'vedlegg'),
            fileUrl: fileUrl,
            contentType: att.contentType || (isPdf ? 'application/pdf' : 'application/octet-stream'),
            size: att.size || 0,
            isPdf: isPdf,
          });
          
          console.log(`  ✅ Lagt til vedlegg: ${att.name} (${isPdf ? 'PDF' : att.contentType})`);
        }
      }

      // Parse bilnummer + dato fra PDF (samme prinsipp som mass rute tildeling)
      let parsedVehicle: string | null = null;
      let parsedDate: string | null = null;
      const firstPdf = attachments.find((a) => a?.isPdf && a?.fileUrl);
      if (firstPdf?.fileUrl) {
        const txt = await extractPdfText(firstPdf.fileUrl);
        if (txt) {
          parsedVehicle = extractVehicleFromText(txt);
          parsedDate = extractDateFromText(txt);
        }
      }

      const routeDate = parsedDate || (email.receivedDateTime ? email.receivedDateTime.split('T')[0] : new Date().toISOString().split('T')[0]);
      const autoProcess = isElkjop || isBackupForm;

      try {
        const docData: any = {
          messageId: messageId,
          from: email.from?.emailAddress?.address || email.sender?.emailAddress?.address || '',
          subject: email.subject || '',
          receivedAt: email.receivedDateTime || new Date().toISOString(),
          attachments,
          note: 'Synkronisert fra Microsoft Graph',
          sourceDomain: fromEmail.split('@')[1] || '',
          autoProcess,
          status: autoProcess ? 'auto_pending' : 'pending',
          parsedDate: parsedDate || undefined,
          parsedVehicle: parsedVehicle || undefined,
          createdAt: Timestamp.fromDate(new Date(email.receivedDateTime || Date.now())),
          updatedAt: Timestamp.now(),
        };

        const inboundRef = await addDoc(collection(db, 'inboundRoutes'), docData);
        processed.push(messageId);

        // AUTO-DELING: hvis vi har bilnummer og dato, finn partner og opprett routeAssignment direkte
        if (autoProcess) {
          if (!parsedVehicle) {
            await updateDoc(doc(db, 'inboundRoutes', inboundRef.id), {
              status: 'failed',
              error: 'Fant ikke bilnummer i PDF',
              updatedAt: Timestamp.now(),
            });
            reportDetails.push({
              messageId,
              fileName: firstPdf?.fileName || attachments?.[0]?.fileName || 'Ukjent',
              date: routeDate,
              status: 'no_vehicle',
              error: 'Fant ikke bilnummer i PDF',
            });
          } else {
            const normalizedVehicle = parsedVehicle;

            // Finn partner ut fra bilnummer
            const partnersSnap = await getDocs(collection(db, 'partners'));
            let matchedPartner: { id: string; name: string } | null = null;
            for (const p of partnersSnap.docs) {
              const pdata: any = p.data();
              const vehicles = Array.isArray(pdata.vehicles) ? pdata.vehicles : [];
              for (const v of vehicles) {
                const vn = normalizeVehicle(v?.vehicleNumber || v?.registrationNumber || v?.vehicleName || '');
                if (vn && vn === normalizedVehicle) {
                  matchedPartner = { id: p.id, name: pdata.name || 'Ukjent' };
                  break;
                }
              }
              if (matchedPartner) break;
            }

            if (!matchedPartner) {
              await updateDoc(doc(db, 'inboundRoutes', inboundRef.id), {
                status: 'failed',
                error: `Ingen partner funnet for bilnummer ${normalizedVehicle}`,
                updatedAt: Timestamp.now(),
              });
              reportDetails.push({
                messageId,
                fileName: firstPdf?.fileName || attachments?.[0]?.fileName || 'Ukjent',
                date: routeDate,
                vehicle: normalizedVehicle,
                status: 'no_partner',
                error: `Ingen partner funnet for bilnummer ${normalizedVehicle}`,
              });
            } else {
              const pdfFiles = attachments.filter((a) => a?.isPdf && a?.fileUrl);
              const title = `SAP Rute ${routeDate} (${normalizedVehicle})`;

              const assignmentRef = await addDoc(collection(db, 'routeAssignments'), {
                partnerId: matchedPartner.id,
                partnerName: matchedPartner.name,
                date: routeDate, // IMPORTANT: YYYY-MM-DD (kalenderen matcher på dette)
                files: pdfFiles,
                title,
                job: '',
                users: [],
                source: 'sap_inbound',
                vehicleNumber: normalizedVehicle,
                inboundMessageId: messageId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });

              await updateDoc(doc(db, 'inboundRoutes', inboundRef.id), {
                status: 'processed',
                processedAt: Timestamp.now(),
                assignmentId: assignmentRef.id,
                partnerId: matchedPartner.id,
                partnerName: matchedPartner.name,
                updatedAt: Timestamp.now(),
              });

              reportDetails.push({
                messageId,
                fileName: firstPdf?.fileName || attachments?.[0]?.fileName || 'Ukjent',
                date: routeDate,
                vehicle: normalizedVehicle,
                partnerName: matchedPartner.name,
                status: 'sent',
              });
            }
          }
        }

        console.log(`✅ Prosessert e-post: ${email.subject} (${attachments.length} vedlegg)`);
      } catch (docError: any) {
        console.error(`❌ Feil ved lagring av e-post ${messageId}:`, docError);
        errors.push({ messageId, error: docError?.message || 'Ukjent feil' });
      }
    }

    // Lag en enkel rapport per dato (som du beskrev)
    const byDate: Record<string, { total: number; sent: number; failed: number }> = {};
    for (const d of reportDetails) {
      const dateKey = d.date || 'ukjent';
      byDate[dateKey] = byDate[dateKey] || { total: 0, sent: 0, failed: 0 };
      byDate[dateKey].total += 1;
      if (d.status === 'sent') byDate[dateKey].sent += 1;
      else byDate[dateKey].failed += 1;
    }

    const report = {
      total: reportDetails.length,
      sent: reportDetails.filter((d) => d.status === 'sent').length,
      failed: reportDetails.filter((d) => d.status !== 'sent').length,
      byDate,
      details: reportDetails,
      createdAt: new Date().toISOString(),
    };

    // Lagre "siste rapport" i Firestore så UI kan vise den når man åpner modalen
    await addDoc(collection(db, 'inboundRouteRuns'), {
      createdAt: Timestamp.now(),
      report,
    });

    return NextResponse.json({
      success: true,
      processed: processed.length,
      skipped: skipped.length,
      errors: errors.length,
      report,
      message: `Synk ferdig: ${processed.length} nye e-poster, ${skipped.length} duplikater${errors.length > 0 ? `, ${errors.length} feil` : ''}. Auto-sending: ${report.sent} sendt, ${report.failed} feilet.`,
      debug: {
        totalEmails: emails.length,
        emailsWithAttachments: emails.filter(e => e.hasAttachments).length,
        errors: errors,
      }
    });
  } catch (error: any) {
    console.error('❌ Sync inbound error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Internal error',
        debug: {
          errorType: error?.constructor?.name,
          stack: error?.stack?.split('\n').slice(0, 5),
        }
      },
      { status: 500 }
    );
  }
}

