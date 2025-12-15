import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseDb, isFirebaseAvailable } from '@/lib/firebase-admin';
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  limit,
} from 'firebase/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface InboundAttachment {
  fileName: string;
  fileUrl?: string; // e.g. OneDrive link
  contentType?: string;
  size?: number;
  isPdf?: boolean;
  parsedDateFromPdf?: string;
  parsedVehicleFromPdf?: string;
}

interface InboundPayload {
  messageId?: string;
  from?: string;
  subject?: string;
  receivedAt?: string;
  attachments?: InboundAttachment[];
  note?: string;
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
  // Try to find "Start date" style first
  const startDateRe = /start\s*date[:\s-]*((?:\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2})|(?:\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4}))/i;
  const genericRe = /(\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}|\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})/;
  const normalize = (raw: string) => {
    const parts = raw.includes('-')
      ? raw.split('-')
      : raw.includes('.')
      ? raw.split('.')
      : raw.split('/');
    if (parts.length !== 3) return null;
    // Detect format
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
    const res = await fetch(fileUrl);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    // @ts-ignore dynamic import without types
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
    const doc = await pdfjsLib.getDocument({ data }).promise;
    let text = '';
    const maxPages = Math.min(doc.numPages, 5); // first 5 pages usually enough
    for (let i = 1; i <= maxPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((it: any) => it.str || '').join(' ');
      text += ' ' + pageText;
    }
    return text;
  } catch (err) {
    console.error('PDF parse error', err);
    return null;
  }
}

export async function GET() {
  const db = getFirebaseDb();
  if (!isFirebaseAvailable() || !db) {
    return NextResponse.json(
      { success: false, error: 'Firebase er ikke konfigurert' },
      { status: 500 }
    );
  }

  // Robust: hent siste N og filtrer i kode (unngår Firestore composite-index problemer)
  const snap = await getDocs(
    query(collection(db, 'inboundRoutes'), orderBy('createdAt', 'desc'), limit(250))
  );
  const allItems = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
  const items = allItems.filter((it) =>
    ['pending', 'auto_pending', 'failed', 'manual_review'].includes((it as any)?.status)
  );

  // Hent siste rapport (hvis finnes)
  let latestReport: any = null;
  try {
    const runSnap = await getDocs(
      query(collection(db, 'inboundRouteRuns'), orderBy('createdAt', 'desc'), limit(1))
    );
    if (!runSnap.empty) {
      latestReport = runSnap.docs[0].data()?.report || null;
    }
  } catch (e) {
    // ignore
  }

  return NextResponse.json({ success: true, items, latestReport });
}

export async function POST(req: NextRequest) {
  const db = getFirebaseDb();
  if (!isFirebaseAvailable() || !db) {
    return NextResponse.json(
      { success: false, error: 'Firebase er ikke konfigurert' },
      { status: 500 }
    );
  }

  try {
    const payload = (await req.json()) as InboundPayload;
    const now = new Date();
    const fromEmail = (payload.from || '').toLowerCase();
    const isElkjop = fromEmail.includes('@elkjop.no');

    // Helper: keep only PDFs and normalize fields
    const attachments: InboundAttachment[] = Array.isArray(payload.attachments)
      ? payload.attachments.map((a) => ({
          fileName: a.fileName,
          fileUrl: a.fileUrl,
          contentType: a.contentType,
          size: a.size,
          isPdf:
            !!(
              (a.contentType && a.contentType.toLowerCase() === 'application/pdf') ||
              (a.fileName && a.fileName.toLowerCase().endsWith('.pdf'))
            ),
          parsedDateFromPdf: undefined,
          parsedVehicleFromPdf: undefined,
        }))
      : [];

    let parsedDateFromPdf: string | null = null;
    let parsedVehicleFromPdf: string | null = null;

    // Attempt to parse date/vehicle from PDF contents if autoProcess and URLs are present
    if (isElkjop && attachments.some((a) => a.isPdf && a.fileUrl)) {
      for (const att of attachments) {
        if (!att.isPdf || !att.fileUrl) continue;
        const txt = await extractPdfText(att.fileUrl);
        if (!txt) continue;
        const v = extractVehicleFromText(txt);
        const d = extractDateFromText(txt);
        att.parsedDateFromPdf = d || undefined;
        att.parsedVehicleFromPdf = v || undefined;
        if (!parsedVehicleFromPdf && v) parsedVehicleFromPdf = v;
        if (!parsedDateFromPdf && d) parsedDateFromPdf = d;
      }
    }

    const docData = {
      messageId: payload.messageId || `msg-${now.getTime()}`,
      from: payload.from || '',
      subject: payload.subject || '',
      receivedAt: payload.receivedAt || now.toISOString(),
      attachments,
      note: payload.note || '',
      sourceDomain: fromEmail.split('@')[1] || '',
      autoProcess: isElkjop, // Elkjøp-epost skal behandles automatisk
      status: isElkjop ? 'auto_pending' : 'pending', // auto_pending -> processed/failed
      parsedDate: parsedDateFromPdf || undefined,
      parsedVehicle: parsedVehicleFromPdf || undefined,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };

    const ref = await addDoc(collection(db, 'inboundRoutes'), docData);

    return NextResponse.json({
      success: true,
      id: ref.id,
      message: 'Mottatt og logget. Prosessering kommer i neste steg.',
    });
  } catch (error: any) {
    console.error('Inbound SAP error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal error' },
      { status: 500 }
    );
  }
}

