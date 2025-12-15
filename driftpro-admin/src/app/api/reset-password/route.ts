import { NextRequest, NextResponse } from 'next/server';
import { getAuth, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
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
    const { oobCode, password } = body;

    if (!oobCode || !password) {
      return NextResponse.json(
        { error: 'Reset-kode og passord er påkrevd' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Passordet må være minst 8 tegn langt' },
        { status: 400 }
      );
    }

    console.log('🔐 Processing password reset with Firebase actionCode');

    try {
      // Verify the reset code first
      const email = await verifyPasswordResetCode(auth, oobCode);
      console.log('✅ Reset code verified for email:', email);

      // Confirm password reset
      await confirmPasswordReset(auth, oobCode, password);
      console.log('✅ Password reset confirmed successfully');

      // Update user document in Firestore
      const usersQuery = query(collection(db, 'users'), where('email', '==', email));
      const usersSnapshot = await getDocs(usersQuery);

      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0];
        await updateDoc(doc(db, 'users', userDoc.id), {
          passwordSet: true,
          passwordUpdatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log('✅ User document updated in Firestore');
      }

      return NextResponse.json({
        success: true,
        message: 'Passordet ditt har blitt tilbakestilt. Du kan nå logge inn med ditt nye passord.',
        email: email
      });

    } catch (firebaseError: any) {
      console.error('❌ Firebase error during password reset:', firebaseError);
      
      // Handle specific Firebase errors
      if (firebaseError.code === 'auth/expired-action-code') {
        return NextResponse.json(
          { error: 'Tilbakestillingslenken har utløpt. Vennligst be om en ny lenke.' },
          { status: 400 }
        );
      }
      
      if (firebaseError.code === 'auth/invalid-action-code') {
        return NextResponse.json(
          { error: 'Ugyldig tilbakestillingslenke. Vennligst be om en ny lenke.' },
          { status: 400 }
        );
      }
      
      if (firebaseError.code === 'auth/weak-password') {
        return NextResponse.json(
          { error: 'Passordet er for svakt. Vennligst velg et sterkere passord.' },
          { status: 400 }
        );
      }
      
      throw firebaseError;
    }

  } catch (error: any) {
    console.error('❌ Error in reset-password API:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Kunne ikke tilbakestille passordet. Prøv igjen senere.',
        code: error.code
      },
      { status: 500 }
    );
  }
}
