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
    const { email, displayName, adminName, companyName, departmentName, position } = body;

    if (!email || !displayName) {
      return NextResponse.json(
        { error: 'Email and display name are required' },
        { status: 400 }
      );
    }

    console.log('📧 Processing welcome email request:', {
      email,
      displayName,
      adminName,
      companyName,
      departmentName,
      position,
      provider: 'office365_smtp'
    });

    // Generate setup token for password setup
    const setupToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const setupUrl = `https://admin.driftpro.no/setup-password?token=${setupToken}&email=${encodeURIComponent(email)}`;

    // Store setup token in Firestore
    await addDoc(collection(db, 'setupTokens'), {
      email: email,
      token: setupToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: serverTimestamp(),
      used: false,
      type: 'employee_welcome'
    });

    console.log('📧 Sending welcome email via Office 365 SMTP');

    // Send welcome email using Office 365 SMTP
    const result = await emailService.sendWelcomeEmail(
      email,
      displayName,
      companyName || 'Bedriften',
      adminName || 'Administrator',
      departmentName || 'Avdeling',
      position || 'Ansatt',
      setupUrl
    );

    if (result.success) {
      console.log('✅ Welcome email sent successfully via Office 365 SMTP');
      return NextResponse.json({
        success: true,
        message: 'Welcome email sent successfully',
        provider: 'office365_smtp'
      });
    } else {
      console.error('❌ Welcome email sending failed:', result.error);
      return NextResponse.json(
        { 
          error: 'Failed to send welcome email',
          details: result.error,
          provider: 'office365_smtp'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error in send-welcome-email API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        provider: 'office365_smtp'
      },
      { status: 500 }
    );
  }
}
