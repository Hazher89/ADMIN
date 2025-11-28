import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

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
function initializeFirebase() {
  try {
    const apps = getApps();
    let app;
    if (apps.length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = apps[0];
    }
    const db = getFirestore(app);
    const auth = getAuth(app);
    return { db, auth };
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, employeeId, displayName } = await request.json();

    if (!email || !password || !employeeId) {
      return NextResponse.json(
        { error: 'Email, password, and employeeId are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    console.log('🔐 Creating Firebase Auth user for employee:', { email, employeeId });

    const { db, auth } = initializeFirebase();

    // Create Firebase Auth user
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase Auth user created:', userCredential.user.uid);
    } catch (createError: any) {
      if (createError?.code === 'auth/email-already-in-use') {
        return NextResponse.json(
          { error: 'E-postadressen er allerede i bruk i Firebase Auth' },
          { status: 400 }
        );
      }
      throw createError;
    }

    const firebaseUser = userCredential.user;

    // Update user profile
    if (displayName) {
      await updateProfile(firebaseUser, {
        displayName: displayName
      });
    }

    // Update Firestore employee document with UID and password status
    const employeeRef = doc(db, 'users', employeeId);
    await updateDoc(employeeRef, {
      uid: firebaseUser.uid,
      status: 'active',
      passwordSet: true,
      passwordSetAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Employee document updated with Firebase Auth UID:', firebaseUser.uid);

    return NextResponse.json({
      success: true,
      uid: firebaseUser.uid,
      message: 'Employee created in Firebase Auth with password'
    });

  } catch (error: any) {
    console.error('❌ Error creating employee with password:', error);
    return NextResponse.json(
      { 
        error: 'Kunne ikke opprette bruker med passord',
        details: error?.message || 'Ukjent feil'
      },
      { status: 500 }
    );
  }
}

