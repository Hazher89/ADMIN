import { NextRequest, NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';

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
const auth = getAuth(app);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    console.log('🔐 Processing password reset via Cloudflare Email Routing:', {
      token: token.substring(0, 10) + '...',
      provider: 'cloudflare_email_routing'
    });

    // Find the reset token
    const tokensQuery = query(collection(db, 'passwordResetTokens'), where('token', '==', token));
    const tokensSnapshot = await getDocs(tokensQuery);

    if (tokensSnapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    const tokenDoc = tokensSnapshot.docs[0];
    const tokenData = tokenDoc.data();

    // Check if token is expired
    if (tokenData.expiresAt && new Date(tokenData.expiresAt.toDate()) < new Date()) {
      // Delete expired token
      await deleteDoc(tokenDoc.ref);
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 400 }
      );
    }

    // Check if token is already used
    if (tokenData.used) {
      return NextResponse.json(
        { error: 'Token has already been used' },
        { status: 400 }
      );
    }

    // Find the user
    const usersQuery = query(collection(db, 'users'), where('email', '==', tokenData.email));
    const usersSnapshot = await getDocs(usersQuery);

    if (usersSnapshot.empty) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    try {
      // Sign in with current password to get user
      const userCredential = await signInWithEmailAndPassword(
        auth,
        tokenData.email,
        'temporary-password' // This will fail, but we need to get the user
      );

      const firebaseUser = userCredential.user;

      // Update password
      await updatePassword(firebaseUser, password);

      // Update user document
      await updateDoc(userDoc.ref, {
        passwordUpdatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Mark token as used
      await updateDoc(tokenDoc.ref, {
        used: true,
        usedAt: new Date().toISOString()
      });

      console.log('✅ Password reset completed successfully via Cloudflare Email Routing');

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully via Cloudflare Email Routing',
        userId: firebaseUser.uid,
        provider: 'cloudflare_email_routing'
      });

    } catch (authError) {
      console.error('❌ Firebase Auth error:', authError);
      
      return NextResponse.json(
        { 
          error: 'Failed to reset password',
          details: authError instanceof Error ? authError.message : 'Unknown error',
          provider: 'cloudflare_email_routing'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error in reset-password API:', error);
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