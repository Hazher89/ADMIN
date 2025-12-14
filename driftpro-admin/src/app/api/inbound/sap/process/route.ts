import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseDb, isFirebaseAvailable } from '@/lib/firebase-admin';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { firebaseService } from '@/lib/firebase-services';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ProcessReport {
  total: number;
  processed: number;
  failed: number;
  skipped: number;
  details: Array<{
    inboundId: string;
    fileName: string;
    vehicle: string;
    date?: string;
    partnerName?: string;
    status: 'sent' | 'no_vehicle' | 'no_partner' | 'failed';
    error?: string;
  }>;
}

/**
 * Prosesserer auto_pending inbound routes og deler dem automatisk til partnere
 */
export async function POST(req: NextRequest) {
  const db = getFirebaseDb();
  if (!isFirebaseAvailable() || !db) {
    return NextResponse.json(
      { success: false, error: 'Firebase er ikke konfigurert' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const companyId = body.companyId;
    
    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId er påkrevd' },
        { status: 400 }
      );
    }

    // Hent alle auto_pending inbound routes
    const pendingQuery = query(
      collection(db, 'inboundRoutes'),
      where('status', '==', 'auto_pending')
    );
    const pendingSnapshot = await getDocs(pendingQuery);

    if (pendingSnapshot.empty) {
      return NextResponse.json({
        success: true,
        report: {
          total: 0,
          processed: 0,
          failed: 0,
          skipped: 0,
          details: [],
        },
        message: 'Ingen pending routes å prosessere',
      });
    }

    // Hent alle partnere
    const partners = await firebaseService.getPartners(companyId);

    const report: ProcessReport = {
      total: pendingSnapshot.docs.length,
      processed: 0,
      failed: 0,
      skipped: 0,
      details: [],
    };

    // Prosesser hver pending route
    for (const inboundDoc of pendingSnapshot.docs) {
      const inboundData = inboundDoc.data();
      const inboundId = inboundDoc.id;

      try {
        // Sjekk om vi har parsed vehicle og date
        const vehicleNumber = inboundData.parsedVehicle;
        const routeDate = inboundData.parsedDate || inboundData.receivedAt?.split('T')[0];

        if (!vehicleNumber) {
          // Ingen bilnummer funnet
          await updateDoc(doc(db, 'inboundRoutes', inboundId), {
            status: 'failed',
            error: 'Fant ikke bilnummer i PDF',
            updatedAt: Timestamp.now(),
          });

          report.failed++;
          report.details.push({
            inboundId,
            fileName: inboundData.attachments?.[0]?.fileName || 'Ukjent',
            vehicle: 'Ingen',
            date: routeDate,
            status: 'no_vehicle',
            error: 'Fant ikke bilnummer i PDF',
          });
          continue;
        }

        // Normaliser bilnummer (sørg for M### format)
        const normalizedVehicle = vehicleNumber.startsWith('M') 
          ? vehicleNumber 
          : `M${vehicleNumber.padStart(3, '0')}`;

        // Finn partner med dette bilnummeret
        let matchedPartner = null;
        let matchedVehicle = null;

        for (const partner of partners) {
          if (partner.vehicles && Array.isArray(partner.vehicles)) {
            for (const vehicle of partner.vehicles) {
              const vehicleNum = vehicle.vehicleNumber || vehicle.registrationNumber || '';
              const normalizedVehicleNum = vehicleNum.startsWith('M') 
                ? vehicleNum 
                : `M${vehicleNum.padStart(3, '0')}`;

              if (normalizedVehicleNum === normalizedVehicle) {
                matchedPartner = partner;
                matchedVehicle = vehicle;
                break;
              }
            }
            if (matchedPartner) break;
          }
        }

        if (!matchedPartner) {
          // Ingen partner funnet for dette bilnummeret
          await updateDoc(doc(db, 'inboundRoutes', inboundId), {
            status: 'failed',
            error: `Ingen partner funnet for bilnummer ${normalizedVehicle}`,
            updatedAt: Timestamp.now(),
          });

          report.failed++;
          report.details.push({
            inboundId,
            fileName: inboundData.attachments?.[0]?.fileName || 'Ukjent',
            vehicle: normalizedVehicle,
            date: routeDate,
            status: 'no_partner',
            error: `Ingen partner funnet for bilnummer ${normalizedVehicle}`,
          });
          continue;
        }

        // Opprett route assignment
        const attachment = inboundData.attachments?.[0];
        const fileName = attachment?.fileName || 'rute.pdf';
        const fileUrl = attachment?.fileUrl || '';

        const assignmentData: any = {
          partnerId: matchedPartner.id,
          title: `Rute ${routeDate} - ${normalizedVehicle}`,
          description: `Automatisk tildelt rute fra SAP. Bilnummer: ${normalizedVehicle}. ${inboundData.subject ? `Emne: ${inboundData.subject}` : ''}`,
          startTime: routeDate ? `${routeDate}T08:00:00` : new Date().toISOString(),
          endTime: routeDate ? `${routeDate}T18:00:00` : new Date().toISOString(),
          status: 'pending' as const,
          assignedBy: 'system',
        };
        
        // Legg til companyId hvis createPartnerAssignment støtter det
        if (companyId) {
          assignmentData.companyId = companyId;
        }

        const assignmentId = await firebaseService.createPartnerAssignment(assignmentData);

        // Oppdater inbound route status til processed
        await updateDoc(doc(db, 'inboundRoutes', inboundId), {
          status: 'processed',
          processedAt: Timestamp.now(),
          assignmentId: assignmentId,
          partnerId: matchedPartner.id,
          partnerName: matchedPartner.name,
          updatedAt: Timestamp.now(),
        });

        report.processed++;
        report.details.push({
          inboundId,
          fileName: fileName,
          vehicle: normalizedVehicle,
          date: routeDate,
          partnerName: matchedPartner.name,
          status: 'sent',
        });

      } catch (error: any) {
        console.error(`Error processing inbound route ${inboundId}:`, error);
        
        await updateDoc(doc(db, 'inboundRoutes', inboundId), {
          status: 'failed',
          error: error?.message || 'Ukjent feil',
          updatedAt: Timestamp.now(),
        });

        report.failed++;
        report.details.push({
          inboundId,
          fileName: inboundData.attachments?.[0]?.fileName || 'Ukjent',
          vehicle: inboundData.parsedVehicle || 'Ukjent',
          date: inboundData.parsedDate,
          status: 'failed',
          error: error?.message || 'Ukjent feil',
        });
      }
    }

    return NextResponse.json({
      success: true,
      report,
      message: `Prosessert ${report.processed} ruter, ${report.failed} feilet`,
    });

  } catch (error: any) {
    console.error('Process inbound routes error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal error' },
      { status: 500 }
    );
  }
}

/**
 * Henter rapport over prosesserte routes
 */
export async function GET(req: NextRequest) {
  const db = getFirebaseDb();
  if (!isFirebaseAvailable() || !db) {
    return NextResponse.json(
      { success: false, error: 'Firebase er ikke konfigurert' },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status'); // 'processed', 'failed', 'all'

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId er påkrevd' },
        { status: 400 }
      );
    }

    let q;
    if (status && status !== 'all') {
      q = query(
        collection(db, 'inboundRoutes'),
        where('status', '==', status)
      );
    } else {
      q = query(collection(db, 'inboundRoutes'));
    }

    const snapshot = await getDocs(q);
    const routes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      processedAt: doc.data().processedAt?.toDate?.() || doc.data().processedAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    }));

    // Filtrer basert på companyId (hvis routes har companyId)
    const filteredRoutes = routes.filter((route: any) => {
      // Hvis routes ikke har companyId, returner alle
      return !route.companyId || route.companyId === companyId;
    });

    return NextResponse.json({
      success: true,
      routes: filteredRoutes,
      total: filteredRoutes.length,
    });

  } catch (error: any) {
    console.error('Get process report error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal error' },
      { status: 500 }
    );
  }
}

