import { NextRequest, NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, updatePassword } from 'firebase/auth';
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
      console.log('✅ Firebase Admin SDK initialized for reset-password');
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
      // Check if user has a Firebase UID in the database
      let firebaseUid = userData.uid;
      
      // If user doesn't have UID and Admin SDK is available, try to get it from Firebase Auth
      if (!firebaseUid && adminAuth) {
        try {
          const existingUser = await adminAuth.getUserByEmail(tokenData.email);
          firebaseUid = existingUser.uid;
          console.log('✅ Found existing Firebase Auth user, UID:', firebaseUid);
        } catch (adminError) {
          console.log('⚠️ User not found in Firebase Auth, will create new account');
        }
      }
      
      // If we have a UID and Admin SDK is available, update the password using Admin SDK
      if (firebaseUid && adminAuth) {
        try {
          // Update password using Admin SDK
          await adminAuth.updateUser(firebaseUid, {
            password: password
          });
          
          console.log('✅ Password updated for existing Firebase Auth user:', firebaseUid);
          
          // Update user document
          await updateDoc(userDoc.ref, {
            uid: firebaseUid, // Ensure UID is set
            passwordUpdatedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            passwordReset: true,
            passwordSet: true
          });

          // Mark token as used
          await updateDoc(tokenDoc.ref, {
            used: true,
            usedAt: new Date().toISOString()
          });

          console.log('✅ Password reset completed successfully for existing user');
          return NextResponse.json({
            success: true,
            message: 'Password reset successfully',
            userId: firebaseUid,
            provider: 'firebase_admin_sdk'
          });
        } catch (updateError) {
          console.error('❌ Error updating password with Admin SDK:', updateError);
          throw updateError;
        }
      } else if (firebaseUid && !adminAuth) {
        // User has UID but Admin SDK not available - can't update password
        return NextResponse.json(
          { error: 'Firebase Admin SDK not available. Cannot reset password. Please contact administrator.' },
          { status: 500 }
        );
      } else {
        // No existing user, create new one
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            tokenData.email,
            password
          );

          const firebaseUser = userCredential.user;

          // Update user document with new UID
          await updateDoc(userDoc.ref, {
            uid: firebaseUser.uid,
            passwordUpdatedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            passwordReset: true,
            passwordSet: true
          });

          // Mark token as used
          await updateDoc(tokenDoc.ref, {
            used: true,
            usedAt: new Date().toISOString()
          });

          console.log('✅ Password reset completed successfully - new account created');
          return NextResponse.json({
            success: true,
            message: 'Password reset successfully - new account created',
            userId: firebaseUser.uid,
            provider: 'firebase_client_sdk'
          });
        } catch (createError: any) {
          if (createError.code === 'auth/email-already-in-use') {
            // User was created between our check and now, try to get UID and update password
            if (adminAuth) {
              try {
                const existingUser = await adminAuth.getUserByEmail(tokenData.email);
                await adminAuth.updateUser(existingUser.uid, {
                  password: password
                });
                
                await updateDoc(userDoc.ref, {
                  uid: existingUser.uid,
                  passwordUpdatedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  passwordReset: true,
                  passwordSet: true
                });
                
                await updateDoc(tokenDoc.ref, {
                  used: true,
                  usedAt: new Date().toISOString()
                });
                
                return NextResponse.json({
                  success: true,
                  message: 'Password reset successfully',
                  userId: existingUser.uid,
                  provider: 'firebase_admin_sdk_retry'
                });
              } catch (retryError) {
                return NextResponse.json(
                  { 
                    error: 'Account already exists. Please contact your administrator to reset your password.',
                    code: 'email-already-in-use'
                  },
                  { status: 400 }
                );
              }
            } else {
              return NextResponse.json(
                { 
                  error: 'Account already exists. Please contact your administrator to reset your password.',
                  code: 'email-already-in-use'
                },
                { status: 400 }
              );
            }
          } else {
            throw createError;
          }
        }
      }

    } catch (authError) {
      console.error('❌ Firebase Auth error:', authError);
      
      return NextResponse.json(
        { 
          error: 'Failed to reset password',
          details: authError instanceof Error ? authError.message : 'Unknown error',
          provider: 'firebase_client_sdk'
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
        provider: 'firebase_client_sdk'
      },
      { status: 500 }
    );
  }
} 