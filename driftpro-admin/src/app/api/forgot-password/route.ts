import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

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
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('📧 Processing forgot password request via Cloudflare Email Routing:', {
      email,
      provider: 'cloudflare_email_routing'
    });

    // Check if user exists
    const usersQuery = query(collection(db, 'users'), where('email', '==', email));
    const usersSnapshot = await getDocs(usersQuery);

    if (usersSnapshot.empty) {
      return NextResponse.json(
        { error: 'No user found with this email address' },
        { status: 404 }
      );
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const resetUrl = `https://driftpro-admin.netlify.app/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Store reset token in Firestore
    await addDoc(collection(db, 'passwordResetTokens'), {
      email: email,
      token: resetToken,
      userId: userDoc.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      createdAt: serverTimestamp(),
      used: false
    });

    console.log('📧 Sending password reset email via Cloudflare Email Routing');

    // Send password reset email using Cloudflare Email Routing
    const result = await emailService.sendPasswordResetEmail(email, resetToken);

    if (result.success) {
      console.log('✅ Password reset email sent successfully via Cloudflare Email Routing');
      return NextResponse.json({
        success: true,
        message: 'Password reset email sent successfully via Cloudflare Email Routing',
        provider: 'cloudflare_email_routing'
      });
    } else {
      console.error('❌ Password reset email sending failed:', result.error);
      return NextResponse.json(
        { 
          error: 'Failed to send password reset email',
          details: result.error,
          provider: 'cloudflare_email_routing'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error in forgot-password API:', error);
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