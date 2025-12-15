import { NextRequest, NextResponse } from 'next/server';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCyE4S4B5q2JLdtaTtr8kVVvg8y-3Zm7ZE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "driftpro-40ccd.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "driftpro-40ccd",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "driftpro-40ccd.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// Initialize Firebase
let app;
let auth;
let db;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'E-postadresse er påkrevd' },
        { status: 400 }
      );
    }

    console.log('📧 Processing forgot password request for:', email);

    // Check if user exists in Firestore
    const usersQuery = query(collection(db, 'users'), where('email', '==', email));
    const usersSnapshot = await getDocs(usersQuery);

    if (usersSnapshot.empty) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { 
          message: 'Hvis en bruker med denne e-postadressen eksisterer, vil du motta en e-post med instruksjoner for å tilbakestille passordet.',
          success: true
        },
        { status: 200 }
      );
    }

    // User exists, send password reset email using Firebase
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://admin.driftpro.no'}/reset-password`,
        handleCodeInApp: true
      });

      console.log('✅ Password reset email sent successfully via Firebase');

      return NextResponse.json({
        success: true,
        message: 'E-post for tilbakestilling av passord er sendt! Sjekk innboksen din og følg lenken for å sette et nytt passord.'
      });
    } catch (firebaseError: any) {
      console.error('❌ Firebase error sending password reset email:', firebaseError);
      
      // Handle specific Firebase errors
      if (firebaseError.code === 'auth/user-not-found') {
        // Don't reveal if user exists
        return NextResponse.json(
          { 
            message: 'Hvis en bruker med denne e-postadressen eksisterer, vil du motta en e-post med instruksjoner for å tilbakestille passordet.',
            success: true
          },
          { status: 200 }
        );
      }
      
      throw firebaseError;
    }
  } catch (error: any) {
    console.error('❌ Error in forgot-password API:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Kunne ikke sende e-post for tilbakestilling av passord. Prøv igjen senere.',
        code: error.code
      },
      { status: 500 }
    );
  }
}
