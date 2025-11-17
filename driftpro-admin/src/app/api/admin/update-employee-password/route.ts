import { NextRequest, NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { globalEmailService } from '@/lib/global-email-service';

// Generate random token
function generateToken(): string {
  const array = new Uint8Array(32);
  if (typeof window === 'undefined' && typeof crypto !== 'undefined') {
    // Node.js environment
    const nodeCrypto = require('crypto');
    return nodeCrypto.randomBytes(32).toString('hex');
  } else {
    // Browser environment
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export async function POST(request: NextRequest) {
  try {
    const { employeeId, newPassword } = await request.json();

    if (!employeeId || !newPassword) {
      return NextResponse.json(
        { error: 'Employee ID and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Get employee document
    const employeeDoc = await getDoc(doc(db, 'users', employeeId));
    if (!employeeDoc.exists()) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    const employeeData = employeeDoc.data();
    const employeeEmail = employeeData.email;

    if (!employeeEmail) {
      return NextResponse.json(
        { error: 'Employee email not found' },
        { status: 400 }
      );
    }

    let firebaseUid = employeeData.uid;

    // If user doesn't have a Firebase UID, create a new Firebase user
    if (!firebaseUid) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          employeeEmail,
          newPassword
        );
        firebaseUid = userCredential.user.uid;

        // Update employee document with new UID
        await updateDoc(doc(db, 'users', employeeId), {
          uid: firebaseUid,
          passwordUpdatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          message: 'Password set successfully - new account created',
        });
      } catch (createError: any) {
        if (createError.code === 'auth/email-already-in-use') {
          // User exists but no UID in database - this shouldn't happen, but handle it
          return NextResponse.json(
            { error: 'User account exists but is not properly linked. Please contact administrator.' },
            { status: 400 }
          );
        }
        throw createError;
      }
    } else {
      // User has UID - create a password reset token with the new password
      // The token will be used in setup-password route to set the password
      
      // Generate a secure token
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Token valid for 24 hours

      // Store token in database with the new password
      await addDoc(collection(db, 'setupTokens'), {
        token,
        userId: employeeId,
        email: employeeEmail,
        expiresAt: expiresAt.toISOString(),
        used: false,
        createdAt: new Date().toISOString(),
        type: 'admin_password_set',
        temporaryPassword: newPassword, // Store temporarily (will be used when token is redeemed)
      });

      // Send email with setup link
      const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/setup-password?token=${token}`;
      
      try {
        await globalEmailService.sendPasswordResetEmail(
          employeeEmail,
          setupUrl,
          employeeData.displayName || 'Employee'
        );
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Continue even if email fails - token is still created
      }

      // Update employee document
      await updateDoc(doc(db, 'users', employeeId), {
        passwordUpdatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: 'Password setup link sent to employee email. They can use it to set their password.',
      });
    }
  } catch (error) {
    console.error('Error updating employee password:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

