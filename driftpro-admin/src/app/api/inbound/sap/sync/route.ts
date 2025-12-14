import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseDb, isFirebaseAvailable } from '@/lib/firebase-admin';
import {
  addDoc,
  collection,
  Timestamp,
  query,
  where,
  getDocs,
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
    
    const processed: string[] = [];
    const skipped: string[] = [];
    const errors: Array<{ messageId: string; error: string }> = [];

    for (const email of emails) {
      const messageId = email.id;

      // Hopp over hvis allerede prosessert
      if (existingMessageIds.has(messageId)) {
        skipped.push(messageId);
        continue;
      }

      const fromEmail = (email.from?.emailAddress?.address || email.sender?.emailAddress?.address || '').toLowerCase();
      const isElkjop = fromEmail.includes('@elkjop.no');

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

      // Prosesser alle PDF-vedlegg
      for (const att of emailAttachments) {
        if (att.contentType === 'application/pdf' || att.name?.toLowerCase().endsWith('.pdf')) {
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
            fileName: att.name || 'vedlegg.pdf',
            fileUrl: fileUrl,
            contentType: att.contentType || 'application/pdf',
            size: att.size || 0,
            isPdf: true,
          });
        }
      }

      try {
        const docData = {
          messageId: messageId,
          from: email.from?.emailAddress?.address || email.sender?.emailAddress?.address || '',
          subject: email.subject || '',
          receivedAt: email.receivedDateTime || new Date().toISOString(),
          attachments,
          note: 'Synkronisert fra Microsoft Graph',
          sourceDomain: fromEmail.split('@')[1] || '',
          autoProcess: isElkjop,
          status: isElkjop ? 'auto_pending' : 'pending',
          createdAt: Timestamp.fromDate(new Date(email.receivedDateTime || Date.now())),
          updatedAt: Timestamp.now(),
        };

        await addDoc(collection(db, 'inboundRoutes'), docData);
        processed.push(messageId);
        console.log(`✅ Prosessert e-post: ${email.subject} (${attachments.length} PDF-vedlegg)`);
      } catch (docError: any) {
        console.error(`❌ Feil ved lagring av e-post ${messageId}:`, docError);
        errors.push({ messageId, error: docError?.message || 'Ukjent feil' });
      }
    }

    return NextResponse.json({
      success: true,
      processed: processed.length,
      skipped: skipped.length,
      errors: errors.length,
      message: `Prosessert ${processed.length} nye e-poster, hoppet over ${skipped.length} duplikater${errors.length > 0 ? `, ${errors.length} feil` : ''}`,
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

