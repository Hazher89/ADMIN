import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCyE4S4B5q2JLdtaTtr8kVVvg8y-3Zm7ZE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "driftpro-40ccd.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "driftpro-40ccd",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "driftpro-40ccd.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// Initialize Firebase Admin SDK
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName, companyId } = await request.json();

    if (!email || !password || !displayName || !companyId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Firebase Authentication user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    return NextResponse.json({
      success: true,
      uid: user.uid,
      email: user.email,
      message: 'Admin user created successfully'
    });

  } catch (error: any) {
    console.error('Error creating admin user:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      return NextResponse.json(
        { error: 'E-postadressen er allerede i bruk' },
        { status: 400 }
      );
    }
    
    if (error.code === 'auth/weak-password') {
      return NextResponse.json(
        { error: 'Passordet er for svakt. Velg et sterkere passord.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Kunne ikke opprette bruker. Prøv igjen senere.' },
      { status: 500 }
    );
  }
}
