import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { globalEmailService } from '@/lib/global-email-service';

// Generate random token
function generateToken(): string {
  const nodeCrypto = require('crypto');
  return nodeCrypto.randomBytes(32).toString('hex');
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

// Initialize Firebase for server-side
function getDb() {
  try {
    let apps = getApps();
    
    if (apps.length === 0) {
      console.log('Initializing Firebase...');
      try {
        initializeApp(firebaseConfig);
        console.log('Firebase initialized successfully');
      } catch (initError) {
        console.error('Error initializing Firebase:', initError);
        apps = getApps();
        if (apps.length === 0) {
          throw new Error('Failed to initialize Firebase and no existing apps found');
        }
      }
    }
    
    const firestoreDb = getFirestore();
    if (!firestoreDb) {
      throw new Error('Failed to get Firestore instance');
    }
    
    console.log('Firestore instance obtained successfully');
    return firestoreDb;
  } catch (error) {
    console.error('Error getting Firestore instance:', error);
    throw new Error('Firebase database not available. Please check Firebase configuration.');
  }
}


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

    // Initialize Firebase services
    const db = getDb();

    // Get employee document - try by ID first
    let employeeDoc = await getDoc(doc(db, 'users', employeeId));
    let employeeData;
    
    if (!employeeDoc.exists()) {
      // If not found by ID, try to find by email (in case employeeId is actually an email)
      console.log('Employee not found by ID, trying to find by email...');
      const employeesQuery = query(
        collection(db, 'users'),
        where('email', '==', employeeId)
      );
      const snapshot = await getDocs(employeesQuery);
      
      if (!snapshot.empty) {
        employeeDoc = snapshot.docs[0];
        console.log('Found employee by email:', employeeDoc.id);
      } else {
        return NextResponse.json(
          { 
            error: 'Employee not found',
            details: `No employee found with ID or email: ${employeeId}`
          },
          { status: 404 }
        );
      }
    }
    
    employeeData = employeeDoc.data();
    if (!employeeData) {
      return NextResponse.json(
        { error: 'Employee data not found' },
        { status: 404 }
      );
    }
    
    const employeeEmail = employeeData.email;
    const actualEmployeeId = employeeDoc.id; // Use the actual document ID

    if (!employeeEmail) {
      return NextResponse.json(
        { error: 'Employee email not found' },
        { status: 400 }
      );
    }

    // Since Firebase Auth client SDK doesn't work on server-side,
    // we always create a password setup token that the user can use
    // to set their password via the setup-password page
    
    // Generate a secure token
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token valid for 24 hours

    // Store token in database with the new password
    await addDoc(collection(db, 'setupTokens'), {
      token,
      userId: actualEmployeeId, // Use the actual document ID
      email: employeeEmail,
      expiresAt: expiresAt.toISOString(),
      used: false,
      createdAt: new Date().toISOString(),
      type: 'admin_password_set',
      temporaryPassword: newPassword, // Store temporarily (will be used when token is redeemed)
    });

    // Send email with setup link
    const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/setup-password?token=${token}`;
    
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
    await updateDoc(doc(db, 'users', actualEmployeeId), {
      passwordUpdatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Password setup link sent to employee email. They can use it to set their password.',
    });
  } catch (error: any) {
    console.error('Error updating employee password:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = error?.code || 'unknown';
    console.error('Error details:', { errorMessage, errorCode, stack: error?.stack });
    
    return NextResponse.json(
      { 
        error: errorMessage,
        code: errorCode,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

