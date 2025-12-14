import { NextRequest, NextResponse } from 'next/server';
import { Timestamp, collection, doc, serverTimestamp, setDoc, addDoc } from 'firebase/firestore';
import { getFirebaseDb, isFirebaseAvailable } from '@/lib/firebase-admin';
import { sveveSMS } from '@/lib/sveve-sms-service';

function normalizePhone(phone: string): string {
  return phone.replace(/\s/g, '');
}

function phoneToEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `${digits}@partner.driftpro.no`;
}

export async function POST(request: NextRequest) {
  try {
    const db = getFirebaseDb();
    if (!isFirebaseAvailable() || !db) {
      return NextResponse.json({ success: false, error: 'Firebase ikke konfigurert' }, { status: 500 });
    }

    const body = await request.json();
    const { partnerId, partnerName, fullName, phoneNumber } = body as {
      partnerId?: string;
      partnerName?: string;
      fullName?: string;
      phoneNumber?: string;
    };

    if (!partnerId || !fullName || !phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Mangler påkrevde felter: partnerId, fullName, phoneNumber' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phoneNumber);
    const email = phoneToEmail(normalizedPhone);

    // Create Firestore user profile WITHOUT creating Firebase Auth user.
    // The user will create their password via /setup-password which will then create Firebase Auth user.
    const userId = doc(collection(db, 'users')).id;

    const nowIso = new Date().toISOString();
    const userDoc = {
      id: userId,
      uid: '', // will be filled when /setup-password creates Firebase Auth user
      email,
      displayName: fullName,
      role: 'partner_user',
      status: 'pending',
      partnerId,
      partnerName: partnerName || '',
      phone: normalizedPhone,
      passwordSet: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      permissions: {
        // Partner users should only access their own routes/docs/audits in the partner portal
        canViewRoutes: true,
        canViewDocuments: true,
        canViewAudits: true
      }
    };

    await setDoc(doc(db, 'users', userId), userDoc, { merge: true });

    // Also store in partnerUsers collection for existing admin UI tooling
    await setDoc(doc(db, 'partnerUsers', userId), {
      partnerId,
      fullName,
      email,
      phoneNumber: normalizedPhone,
      status: 'active',
      createdAt: nowIso,
      updatedAt: nowIso
    }, { merge: true });

    // Create setup token (72h)
    const setupToken =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72);

    await addDoc(collection(db, 'setupTokens'), {
      token: setupToken,
      userId,
      email,
      partnerId,
      expiresAt: Timestamp.fromDate(expiresAt),
      used: false,
      createdAt: serverTimestamp(),
      type: 'partner_invite',
      companyName: 'DriftPro Partner',
      adminName: 'DriftPro'
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://admin.driftpro.no';
    const setupPasswordUrl = `${appUrl}/setup-password?token=${setupToken}`;

    // Send SMS invite link
    const smsText =
      `Hei ${fullName}! Du er invitert til DriftPro Partner.\n` +
      `Opprett passord her: ${setupPasswordUrl}\n` +
      `Etterpå kan du logge inn og se dine tildelte ruter, dokumenter og audit.`;

    const smsResult = await sveveSMS.sendSMS({
      to: normalizedPhone,
      message: smsText,
      priority: 'high'
    });

    if (!smsResult.success) {
      return NextResponse.json(
        { success: false, error: smsResult.error || 'Kunne ikke sende SMS' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      userId,
      email,
      setupPasswordUrl
    });
  } catch (error: any) {
    console.error('❌ Partner invite error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

