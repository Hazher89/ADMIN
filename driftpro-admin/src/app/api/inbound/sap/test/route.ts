import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseDb, isFirebaseAvailable } from '@/lib/firebase-admin';
import {
  addDoc,
  collection,
  Timestamp,
} from 'firebase/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Test endpoint for å manuelt legge til innkommende e-poster
 * Dette kan brukes til å teste systemet før webhook er satt opp
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
    const { from, subject, attachments } = body;

    if (!from || !subject) {
      return NextResponse.json(
        { success: false, error: 'Mangler "from" eller "subject"' },
        { status: 400 }
      );
    }

    const now = new Date();
    const fromEmail = from.toLowerCase();
    const isElkjop = fromEmail.includes('@elkjop.no');

    const normalizedAttachments = Array.isArray(attachments)
      ? attachments.map((a: any) => ({
          fileName: a.fileName || a.name || 'ukjent.pdf',
          fileUrl: a.fileUrl || a.url || '',
          contentType: a.contentType || 'application/pdf',
          size: a.size || 0,
          isPdf: true,
        }))
      : [];

    const docData = {
      messageId: `test-${now.getTime()}`,
      from: from,
      subject: subject,
      receivedAt: now.toISOString(),
      attachments: normalizedAttachments,
      note: 'Manuelt lagt til via test-endepunkt',
      sourceDomain: fromEmail.split('@')[1] || '',
      autoProcess: isElkjop,
      status: isElkjop ? 'auto_pending' : 'pending',
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };

    const ref = await addDoc(collection(db, 'inboundRoutes'), docData);

    return NextResponse.json({
      success: true,
      id: ref.id,
      message: 'Test e-post lagt til i systemet',
      data: docData,
    });
  } catch (error: any) {
    console.error('Test inbound error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal error' },
      { status: 500 }
    );
  }
}




