import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import * as admin from 'firebase-admin';

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCyE4S4B5q2JLdtaTtr8kVVvg8y-3Zm7ZE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "driftpro-40ccd.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "driftpro-40ccd",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "driftpro-40ccd.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// Initialize Firebase helper function
function initializeFirebase() {
  try {
    const apps = getApps();
    let app;
    if (apps.length === 0) {
      app = initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized for setup-password');
    } else {
      app = apps[0];
      console.log('✅ Using existing Firebase app for setup-password');
    }
    const db = getFirestore(app);
    if (!db) {
      throw new Error('Failed to get Firestore instance');
    }
    const auth = getAuth(app);
    if (!auth) {
      throw new Error('Failed to get Auth instance');
    }
    return { app, db, auth };
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
    throw error;
  }
}

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
    // Initialize Firebase for this request
    const { db } = initializeFirebase();
    
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
    let expiresAt: Date | null = null;
    if (tokenData.expiresAt) {
      try {
        // Handle both Firestore Timestamp and ISO string
        if (tokenData.expiresAt.toDate) {
          expiresAt = tokenData.expiresAt.toDate();
        } else if (typeof tokenData.expiresAt === 'string') {
          expiresAt = new Date(tokenData.expiresAt);
        } else {
          expiresAt = new Date(tokenData.expiresAt);
        }
      } catch (e) {
        console.error('Error parsing expiresAt:', e);
      }
    }
    
    if (expiresAt && expiresAt < new Date()) {
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
    // Initialize Firebase for this request
    const { db, auth } = initializeFirebase();
    
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }
    
    if (typeof token !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Token and password must be strings' },
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
    let expiresAt: Date | null = null;
    if (tokenData.expiresAt) {
      try {
        // Handle both Firestore Timestamp and ISO string
        if (tokenData.expiresAt.toDate) {
          expiresAt = tokenData.expiresAt.toDate();
        } else if (typeof tokenData.expiresAt === 'string') {
          expiresAt = new Date(tokenData.expiresAt);
        } else {
          expiresAt = new Date(tokenData.expiresAt);
        }
      } catch (e) {
        console.error('Error parsing expiresAt:', e);
      }
    }
    
    if (expiresAt && expiresAt < new Date()) {
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
      console.error('❌ User not found in Firestore:', tokenData.email);
      return NextResponse.json(
        { 
          error: 'User not found',
          message: `No user found with email: ${tokenData.email}. Please contact administrator.`
        },
        { status: 404 }
      );
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log('✅ User found in Firestore:', {
      userId: userDoc.id,
      email: tokenData.email,
      hasUid: !!userData.uid
    });

    try {
      // Always use the provided password (user sets it themselves)
      const passwordToUse = password;
      
      // Validate password length
      if (!passwordToUse || passwordToUse.length < 6) {
        console.error('❌ Password validation failed: too short');
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long' },
          { status: 400 }
        );
      }
      
      console.log('🔐 Attempting to create Firebase Auth user...', {
        email: tokenData.email,
        passwordLength: passwordToUse.length
      });
      
      // ALWAYS try to create new user first - simpler approach
      let userCredential;
      let userCreated = false;
      
      try {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          tokenData.email,
          passwordToUse
        );
        console.log('✅ Firebase Auth user created:', userCredential.user.uid);
        userCreated = true;
      } catch (createError: any) {
        // If user already exists, we'll handle it below
        if (createError?.code === 'auth/email-already-in-use' || createError?.message?.includes('email-already-in-use')) {
          console.log('⚠️ User already exists in Firebase Auth, will update password');
          // Continue to email-already-in-use handler below
        } else {
          console.error('❌ Error creating Firebase Auth user:', {
            code: createError?.code,
            message: createError?.message,
            error: createError
          });
          throw createError;
        }
      }
      
      // If user was created successfully, update Firestore and return
      if (userCreated && userCredential) {
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

        console.log('✅ Password setup completed successfully');
        return NextResponse.json({
          success: true,
          message: 'Password set up successfully',
          userId: firebaseUser.uid,
          provider: 'firebase_client_sdk'
        });
      }
      
      // If we get here, user already exists - throw error to be caught below
      throw new Error('auth/email-already-in-use');
    } catch (authError: any) {
      console.error('❌ Firebase Auth error:', authError);
      
      if (authError instanceof Error && (authError.message.includes('email-already-in-use') || (authError as any).code === 'auth/email-already-in-use')) {
        console.log('⚠️ Firebase Auth user already exists, attempting to update password...');
        
        // CRITICAL: Try to initialize Admin SDK if not available (needed to update password)
        if (!adminAuth) {
          console.log('⚠️ Admin SDK not initialized, attempting to initialize...');
          try {
            if (admin.apps.length === 0) {
              if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
                admin.initializeApp({
                  credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID || 'driftpro-40ccd',
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                  }),
                });
                console.log('✅ Firebase Admin SDK initialized in error handler');
              } else {
                console.warn('⚠️ Firebase Admin SDK credentials not found in environment variables');
              }
            }
            if (admin.apps.length > 0) {
              adminAuth = admin.auth();
              console.log('✅ Firebase Admin SDK obtained in error handler');
            }
          } catch (initError) {
            console.error('❌ Failed to initialize Admin SDK in error handler:', initError);
          }
        }
        
        // Try to update password using Admin SDK
        if (adminAuth) {
          try {
            console.log('🔍 Looking up user in Firebase Auth:', tokenData.email);
            const existingUser = await adminAuth.getUserByEmail(tokenData.email);
            console.log('✅ Found existing Firebase Auth user:', existingUser.uid);
            
            // Update password directly - NO DELETION
            console.log('🔐 Updating password for existing Firebase Auth user...');
            await adminAuth.updateUser(existingUser.uid, {
              password: password
            });
            console.log('✅ Password updated for existing Firebase Auth user:', existingUser.uid);
            
            // Update Firestore with UID and password status
            await updateDoc(userDoc.ref, {
              uid: existingUser.uid,
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
              message: 'Password set up successfully',
              userId: existingUser.uid,
              provider: 'firebase_admin_sdk_update_password'
            });
          } catch (adminError: any) {
            console.error('❌ Error updating password with Admin SDK:', {
              code: adminError?.code,
              message: adminError?.message,
              error: adminError
            });
            
            // If Admin SDK update fails, try to send password reset email as fallback
            console.log('⚠️ Admin SDK password update failed, trying password reset email as fallback...');
            try {
              await sendPasswordResetEmail(auth, tokenData.email);
              console.log('✅ Password reset email sent as fallback');
              
              await updateDoc(userDoc.ref, {
                status: 'active',
                passwordSet: false,
                updatedAt: new Date().toISOString()
              });
              
              await updateDoc(tokenDoc.ref, {
                used: true,
                usedAt: new Date().toISOString()
              });
              
              return NextResponse.json({
                success: true,
                message: 'Password reset email sent. Please check your email to set your password.',
                provider: 'firebase_password_reset_email_fallback',
                emailSent: true,
                warning: 'Password could not be updated directly. A password reset email has been sent to your email address.'
              });
            } catch (emailError: any) {
              console.error('❌ Error sending password reset email:', emailError);
              return NextResponse.json({
                error: 'Could not set password. User exists in Firebase Auth but password could not be updated.',
                details: `Admin SDK failed: ${adminError?.message || 'Unknown error'}. Password reset email also failed. Please contact administrator or use the "Forgot Password" feature on the login page.`,
                requiresAdmin: true,
                suggestion: 'Use "Forgot Password" on the login page'
              }, { status: 500 });
            }
          }
        } else {
          // No Admin SDK available - try to get UID from Firebase Auth and update Firestore
          console.log('⚠️ Admin SDK not available, trying to get UID from Firebase Auth...');
          try {
            // Try to sign in with a temporary password to get the UID
            // Actually, we can't do this without the password. Instead, try password reset email
            // BUT FIRST: Try to get UID by attempting to look up the user
            // Since we can't use Admin SDK, we'll send password reset email
            // BUT we should still try to set the UID if we can find it
            
            // Try password reset email as fallback
            await sendPasswordResetEmail(auth, tokenData.email);
            console.log('✅ Password reset email sent');
            
            // CRITICAL: Try to get UID from Firebase Auth by attempting sign-in
            // We can't do this without the password, so we'll need to rely on the user
            // to complete the password reset and then the UID will be set during login
            // OR: We can try to create a new user with the same email (will fail if exists)
            // but that won't help us get the UID
            
            // For now, update Firestore status - UID will be set when user logs in
            // But we should try to get it if possible
            let firebaseUid: string | null = null;
            
            // Try to get UID by checking if user can sign in (but we don't have password)
            // Actually, the best approach is to ensure UID is set when user completes password reset
            // For now, we'll update status and let the login process handle UID setting
            
            await updateDoc(userDoc.ref, {
              status: 'active',
              passwordSet: false, // Will be set to true after password reset
              updatedAt: new Date().toISOString()
            });
            
            await updateDoc(tokenDoc.ref, {
              used: true,
              usedAt: new Date().toISOString()
            });
            
            return NextResponse.json({
              success: true,
              message: 'Password reset email sent. Please check your email to set your password.',
              provider: 'firebase_password_reset_email',
              emailSent: true,
              warning: 'Admin SDK is not configured. A password reset email has been sent to your email address. After setting your password, you will be able to log in.'
            });
          } catch (emailError: any) {
            console.error('❌ Error sending password reset email:', emailError);
            return NextResponse.json({
              error: 'Could not set password. User exists in Firebase Auth.',
              details: 'The user account exists in Firebase Auth but Admin SDK is not available and password reset email failed. Please use the "Forgot Password" feature on the login page to set your password.',
              requiresAdmin: false,
              suggestion: 'Use "Forgot Password" on the login page'
            }, { status: 500 });
          }
        }
      } else {
        // Other errors - rethrow
        throw authError;
      }
    }
  } catch (error: any) {
      console.error('❌ Error in setup-password API:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      const errorCode = (error as any)?.code || 'unknown';
      
      // Log full error details for debugging
      console.error('Full error details:', {
        message: errorMessage,
        code: errorCode,
        stack: errorStack,
        error: error,
        errorType: error?.constructor?.name
      });
      
      // Return more specific error messages
      let userFriendlyError = 'Internal server error';
      if (errorCode === 'auth/email-already-in-use') {
        userFriendlyError = 'E-postadressen er allerede i bruk. Vennligst kontakt administrator.';
      } else if (errorCode === 'auth/invalid-email') {
        userFriendlyError = 'Ugyldig e-postadresse.';
      } else if (errorCode === 'auth/weak-password') {
        userFriendlyError = 'Passordet er for svakt. Vennligst velg et sterkere passord.';
      } else if (errorMessage.includes('Firebase')) {
        userFriendlyError = 'Feil ved oppkobling til server. Vennligst prøv igjen.';
      } else if (errorMessage) {
        userFriendlyError = errorMessage;
      }
      
      return NextResponse.json(
        { 
          error: userFriendlyError,
          message: errorMessage,
          code: errorCode,
          details: process.env.NODE_ENV === 'development' ? errorStack : undefined,
          provider: 'microsoft_graph'
        },
        { status: 500 }
      );
    }
  } 