import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { v4 as uuidv4 } from 'uuid';

// Initialize Firebase if not already initialized
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Validate Firebase config before initializing
const isFirebaseConfigured = firebaseConfig.apiKey && 
  firebaseConfig.authDomain && 
  firebaseConfig.projectId;

// Initialize Firebase only if configured
let app;
let db;
let auth;

if (isFirebaseConfigured) {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  db = getFirestore(app);
  auth = getAuth(app);
}

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase is configured
    if (!isFirebaseConfigured || !auth || !db) {
      return NextResponse.json(
        { error: 'Firebase is not configured. Please set Firebase environment variables.' },
        { status: 500 }
      );
    }

    const { email, displayName, role = 'employee', companyId, companyName } = await request.json();

    if (!email || !displayName || !companyId) {
      return NextResponse.json(
        { error: 'Missing required fields: email, displayName, companyId' },
        { status: 400 }
      );
    }

    // Generate a random password
    const tempPassword = uuidv4();
    
    // Create user in Firebase Auth with temporary password
    const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
    const user = userCredential.user;

    // Create user profile in Firestore
    const userProfile = {
      id: user.uid,
      email: user.email,
      displayName,
      role,
      companyId,
      companyName: companyName || 'Selskapet',
      status: 'pending',
      passwordSet: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);

    // Generate password reset link
    const actionCodeSettings = {
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`,
      handleCodeInApp: true
    };

    // Send password reset email (this will be the welcome email)
    await sendPasswordResetEmail(auth, email, actionCodeSettings);

    return NextResponse.json({
      success: true,
      userId: user.uid,
      message: 'User created successfully and welcome email sent'
    });

  } catch (error: any) {
    console.error('Error creating user:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      // If user exists, send them a password reset email instead
      try {
        await sendPasswordResetEmail(auth, email);
        return NextResponse.json(
          { 
            success: true,
            message: 'User already exists. Password reset email sent.' 
          },
          { status: 200 }
        );
      } catch (resetError) {
        console.error('Error sending password reset email:', resetError);
        return NextResponse.json(
          { 
            error: 'User already exists. Failed to send password reset email.' 
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to create user',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
