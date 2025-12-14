export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { getFirebaseDb, isFirebaseAvailable } from '@/lib/firebase-admin';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
} from 'firebase/firestore';

/**
 * Destructive import: deletes all existing partners and recreates them from firma.xlsx.
 * File location (absolute): /Users/hazherprivat/Desktop/DriftPro/driftpro-admin/firma.xlsx
 */

export async function POST(_req: NextRequest) {
  try {
    const db = getFirebaseDb();
    if (!isFirebaseAvailable() || !db) {
      return NextResponse.json(
        { success: false, error: 'Firebase er ikke konfigurert' },
        { status: 500 }
      );
    }

    const excelPath = path.resolve(
      '/Users/hazherprivat/Desktop/DriftPro/driftpro-admin/firma.xlsx'
    );
    if (!fs.existsSync(excelPath)) {
      return NextResponse.json(
        { success: false, error: `Finner ikke fil: ${excelPath}` },
        { status: 400 }
      );
    }

    let workbook;
    try {
      const fileBuf = fs.readFileSync(excelPath);
      workbook = XLSX.read(fileBuf, { type: 'buffer' });
    } catch (fileErr: any) {
      return NextResponse.json(
        { success: false, error: `Klarer ikke lese ${excelPath}: ${fileErr?.message || fileErr}` },
        { status: 500 }
      );
    }
    const firstSheet = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheet];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
      defval: '',
    });

    // 1) Slett alle eksisterende partnere
    const partnersRef = collection(db, 'partners');
    const snap = await getDocs(partnersRef);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }

    // 2) Opprett nye
    let created = 0;
    const errors: Array<{ row: any; error: string }> = [];

    for (const row of rows) {
      try {
        const name = (row['Firma'] || row['firma'] || '').toString().trim();
        if (!name) continue; // hopp over tomme rader

        const address =
          (row['Adresse'] || row['adresse'] || '').toString().trim();
        const orgnr = (row['Orgnr'] || row['orgnr'] || '').toString().trim();
        const contactName = (
          row['Kontaktperson'] ||
          row['kontaktperson'] ||
          ''
        ).toString().trim();
        const phone =
          (row['Tlf'] || row['tlf'] || row['Telefon'] || '').toString().trim();

        // bilnummer: splitt på alt som ikke er tall, og filtrer ut korte tomme
        const vehicleRaw = (
          row['bilnummer'] ||
          row['Bilnummer'] ||
          row['bilnummer '] ||
          ''
        ).toString();
        const vehicleNumbers = Array.from(
          new Set((vehicleRaw.match(/\d+/g) || []).filter(Boolean))
        );

        const partnerDoc = {
          name,
          description: '',
          type: 'supplier' as const,
          orgNumber: orgnr || undefined,
          status: 'active' as const,
          address: {
            street: address || '',
            city: '',
            postalCode: '',
            country: 'Norge',
          },
          contactPerson: {
            name: contactName || '',
            email: '',
            phone: phone || '',
            position: '',
          },
          vehicles: vehicleNumbers.map((v) => ({
            vehicleNumber: v,
          })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await addDoc(partnersRef, partnerDoc);
        created += 1;
      } catch (e: any) {
        errors.push({ row, error: e?.message || 'Ukjent feil' });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import fullført. Opprettet ${created} partnere.`,
      errors,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal error' },
      { status: 500 }
    );
  }
}
