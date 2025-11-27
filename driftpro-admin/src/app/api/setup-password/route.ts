import { NextRequest, NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import * as admin from 'firebase-admin';

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

// Initialize Firebase Admin SDK if not already initialized
let adminAuth: admin.auth.Auth | null = null;
try {
  if (admin.apps.length === 0) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID || 'driftpro-40ccd',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
      console.log('✅ Firebase Admin SDK initialized for setup-password');
    } catch (adminError) {
      console.log('⚠️ Firebase Admin SDK initialization failed (may need service account key):', adminError);
    }
  }
  if (admin.apps.length > 0) {
    adminAuth = admin.auth();
  }
} catch (error) {
  console.log('⚠️ Firebase Admin SDK not available:', error);
}

// GET /api/setup-password - Validate token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Validating setup token:', {
      token: token.substring(0, 10) + '...',
      provider: 'microsoft_graph'
    });

    // Find the setup token
    const tokensQuery = query(collection(db, 'setupTokens'), where('token', '==', token));
    const tokensSnapshot = await getDocs(tokensQuery);

    if (tokensSnapshot.empty) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired token' },
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
        { valid: false, error: 'Token has expired' },
        { status: 400 }
      );
    }

    // Check if token is already used
    if (tokenData.used) {
      return NextResponse.json(
        { valid: false, error: 'Token has already been used' },
        { status: 400 }
      );
    }

    console.log('✅ Setup token is valid:', {
      email: tokenData.email,
      type: tokenData.type,
      provider: 'microsoft_graph'
    });

    return NextResponse.json({
      valid: true,
      email: tokenData.email,
      adminName: tokenData.adminName || 'Administrator',
      companyName: tokenData.companyName || 'Bedriften',
      type: tokenData.type || 'employee_welcome'
    });

  } catch (error) {
    console.error('❌ Error validating setup token:', error);
    return NextResponse.json(
      { 
        valid: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        provider: 'microsoft_graph'
      },
      { status: 500 }
    );
  }
}

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

    console.log('🔐 Processing password setup via Microsoft Graph:', {
      token: token.substring(0, 10) + '...',
      provider: 'microsoft_graph'
    });

    // Find the setup token
    const tokensQuery = query(collection(db, 'setupTokens'), where('token', '==', token));
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
      // If token has temporaryPassword (set by admin), use it if no password provided
      // Otherwise use the provided password
      const passwordToUse = tokenData.temporaryPassword || password;
      
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        tokenData.email,
        passwordToUse
      );

      const firebaseUser = userCredential.user;

      // Update user profile
      await updateProfile(firebaseUser, {
        displayName: userData.displayName || userData.name || 'Ny bruker'
      });

      // Update user document with password setup status and UID
      await updateDoc(userDoc.ref, {
        uid: firebaseUser.uid,
        status: 'active',
        passwordSet: true,
        passwordSetAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Mark token as used
      await updateDoc(tokenDoc.ref, {
        used: true,
        usedAt: new Date().toISOString()
      });

      console.log('✅ Password setup completed successfully via Microsoft Graph');

      return NextResponse.json({
        success: true,
        message: 'Password set up successfully via Microsoft Graph',
        userId: firebaseUser.uid,
        provider: 'microsoft_graph'
      });

    } catch (authError) {
      console.error('❌ Firebase Auth error:', authError);
      
      if (authError instanceof Error && authError.message.includes('email-already-in-use')) {
        console.log('⚠️ Firebase Auth user already exists, updating password and user document');
        
        if (!adminAuth) {
          return NextResponse.json(
            { error: 'Firebase Admin SDK not available. Cannot update existing user password. Please contact administrator.' },
            { status: 500 }
          );
        }
        
        try {
          // Get the existing user from Firebase Auth using Admin SDK
          const existingUser = await adminAuth.getUserByEmail(tokenData.email);
          
          // Update the password using Admin SDK
          await adminAuth.updateUser(existingUser.uid, {
            password: passwordToUse
          });
          
          console.log('✅ Password updated for existing Firebase Auth user:', existingUser.uid);
          
          // Update user document with UID and password setup status
          await updateDoc(userDoc.ref, {
            uid: existingUser.uid, // CRITICAL: Set the UID so user can log in
            status: 'active',
            passwordSet: true,
            passwordSetAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          // Mark token as used
          await updateDoc(tokenDoc.ref, {
            used: true,
            usedAt: new Date().toISOString()
          });

          console.log('✅ Password setup completed for existing Firebase Auth user, UID set in Firestore');
          return NextResponse.json({
            success: true,
            message: 'Password setup completed for existing user',
            userId: existingUser.uid,
            provider: 'firebase_admin_sdk'
          });
        } catch (adminError) {
          console.error('❌ Error updating existing user with Admin SDK:', adminError);
          // Fallback: try to get UID from Firestore if it exists
          if (userData.uid) {
            // User document already has UID, just update password status
            await updateDoc(userDoc.ref, {
              status: 'active',
              passwordSet: true,
              passwordSetAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            
            await updateDoc(tokenDoc.ref, {
              used: true,
              usedAt: new Date().toISOString()
            });
            
            return NextResponse.json({
              success: true,
              message: 'Password setup completed (user already had UID)',
              userId: userData.uid,
              provider: 'firebase_admin_sdk_fallback'
            });
          }
          
          throw new Error('Failed to update existing user. Please contact administrator.');
        }
      }

      return NextResponse.json(
        { 
          error: 'Failed to create user account',
          details: authError instanceof Error ? authError.message : 'Unknown error',
          provider: 'microsoft_graph'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error in setup-password API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        provider: 'microsoft_graph'
      },
      { status: 500 }
    );
  }
} 