import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getFirebaseAuth, getFirebaseDb, isFirebaseAvailable } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase is available
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    
    if (!isFirebaseAvailable() || !auth || !db) {
      return NextResponse.json(
        { error: 'Firebase is not configured. Please set Firebase environment variables.' },
        { status: 500 }
      );
    }

    const { email, displayName, role = 'employee', companyName } = await request.json();

    if (!email || !displayName) {
      return NextResponse.json(
        { error: 'Missing required fields: email, displayName' },
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
      companyName: companyName || 'Mavi Logistikk',
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
      // If user exists, try to find their UID in Firestore
      try {
        // Try to find user by email in Firestore
        const usersRef = collection(db, 'users');
        const { query: firestoreQuery, where: firestoreWhere, getDocs } = await import('firebase/firestore');
        const emailQuery = firestoreQuery(usersRef, firestoreWhere('email', '==', email));
        const emailSnapshot = await getDocs(emailQuery);
        
        let existingUserId: string | null = null;
        if (!emailSnapshot.empty) {
          const existingUserDoc = emailSnapshot.docs[0];
          const existingData = existingUserDoc.data();
          existingUserId = existingData.uid || existingUserDoc.id;
        }
        
        // Send password reset email
        await sendPasswordResetEmail(auth, email);
        
        return NextResponse.json(
          { 
            success: true,
            userId: existingUserId,
            message: 'User already exists. Password reset email sent.',
            alreadyExists: true
          },
          { status: 200 }
        );
      } catch (resetError) {
        console.error('Error sending password reset email:', resetError);
        return NextResponse.json(
          { 
            error: 'User already exists. Failed to send password reset email.',
            message: resetError instanceof Error ? resetError.message : 'Unknown error'
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
