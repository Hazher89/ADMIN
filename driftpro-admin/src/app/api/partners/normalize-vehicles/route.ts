import { NextRequest, NextResponse } from 'next/server';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { getFirebaseDb, isFirebaseAvailable } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const formatVehicle = (v?: string) => {
  if (!v) return '';
  const digits = (v.match(/\d+/g) || []).join('');
  if (!digits) return '';
  const n = parseInt(digits, 10);
  if (Number.isNaN(n)) return '';
  if (n <= 0) return '';
  if (n < 10) return `M00${n}`;
  if (n < 100) return `M0${n}`;
  return `M${n}`;
};

export async function POST(_req: NextRequest) {
  const db = getFirebaseDb();
  if (!isFirebaseAvailable() || !db) {
    return NextResponse.json(
      { success: false, error: 'Firebase er ikke konfigurert' },
      { status: 500 }
    );
  }

  try {
    const snap = await getDocs(collection(db, 'partners'));
    let updated = 0;
    for (const d of snap.docs) {
      const data = d.data() as any;
      const vehicles = Array.isArray(data.vehicles) ? data.vehicles : [];
      const formatted = vehicles
        .map((v: any) => {
          const num = formatVehicle(v?.vehicleNumber || v?.registrationNumber || v?.vehicleName);
          if (!num) return null;
          return { ...v, vehicleNumber: num };
        })
        .filter(Boolean);
      // deduplicate
      const seen = new Set<string>();
      const dedup = formatted.filter((v: any) => {
        if (seen.has(v.vehicleNumber)) return false;
        seen.add(v.vehicleNumber);
        return true;
      });
      await updateDoc(doc(db, 'partners', d.id), {
        vehicles: dedup,
        updatedAt: new Date().toISOString(),
      });
      updated += 1;
    }

    return NextResponse.json({
      success: true,
      message: `Oppdatert ${updated} partnere med M###-format på bilnummer`,
    });
  } catch (error: any) {
    console.error('normalize-vehicles error', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal error' },
      { status: 500 }
    );
  }
}

