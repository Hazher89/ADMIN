import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCyE4S4B5q2JLdtaTtr8kVVvg8y-3Zm7ZE",
  authDomain: "driftpro-40ccd.firebaseapp.com",
  projectId: "driftpro-40ccd",
  storageBucket: "driftpro-40ccd.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminEmail, adminName, companyName, setupToken } = body;

    if (!adminEmail || !adminName || !companyName || !setupToken) {
      return NextResponse.json(
        { error: 'Missing required fields: adminEmail, adminName, companyName, setupToken' },
        { status: 400 }
      );
    }

    console.log('📧 Sending admin setup email via Cloudflare Email Routing:', {
      adminEmail,
      adminName,
      companyName,
      provider: 'cloudflare_email_routing'
    });

    // Store setup token in Firestore
    await addDoc(collection(db, 'setupTokens'), {
      email: adminEmail,
      token: setupToken,
      adminName: adminName,
      companyName: companyName,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      createdAt: serverTimestamp(),
      used: false
    });

    // Use the email service to send the admin setup email
    const result = await emailService.sendAdminSetupEmail(adminEmail, adminName, companyName, setupToken);

    if (result.success) {
      console.log('✅ Admin setup email sent successfully via Cloudflare Email Routing');
      return NextResponse.json({
        success: true,
        message: 'Admin setup email sent successfully via Cloudflare Email Routing',
        messageId: result.messageId,
        provider: 'cloudflare_email_routing'
      });
    } else {
      console.error('❌ Admin setup email sending failed:', result.error);
      return NextResponse.json(
        { 
          error: 'Failed to send admin setup email',
          details: result.error,
          provider: 'cloudflare_email_routing'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error in send-admin-setup-email API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        provider: 'cloudflare_email_routing'
      },
      { status: 500 }
    );
  }
} 