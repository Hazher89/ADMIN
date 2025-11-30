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
        console.log('⚠️ Firebase Auth user already exists - will update password (NO DELETION)');
        
        // User already exists in Firebase Auth - we need Admin SDK to update password
        // NO DELETION - just update the password directly
        console.log('🔐 User exists in Firebase Auth - updating password with Admin SDK (no deletion)...');
        
        // Try to initialize Admin SDK if not available
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
        
        // Try to update password using Admin SDK (NO DELETION - just update)
        console.log('🔐 Attempting to update password for existing user with Admin SDK (no deletion)...');
        
        // Try to update password using Admin SDK
        if (adminAuth) {
          try {
            console.log('🔍 Looking up user in Firebase Auth:', tokenData.email);
            const existingUser = await adminAuth.getUserByEmail(tokenData.email);
            console.log('✅ Found existing Firebase Auth user:', existingUser.uid);
            
            // Update password directly
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
            // Fallback: Send passord-reset e-post via Firebase Client SDK slik at bruker kan sette nytt passord
            let resetEmailSent = false;
            try {
              console.log('📧 Fallback: Sender passord-reset e-post via Firebase Client SDK...');
              await sendPasswordResetEmail(auth, tokenData.email);
              resetEmailSent = true;
              console.log('✅ Passord-reset e-post sendt til:', tokenData.email);
            } catch (resetError) {
              console.error('❌ Kunne ikke sende passord-reset e-post:', resetError);
            }

            return NextResponse.json({
              error: 'Kunne ikke sette passord. Admin SDK feilet.',
              details: `Admin SDK feil: ${adminError?.message || 'Ukjent feil'}.` + (resetEmailSent ? ' Vi har sendt deg en e-post for å sette nytt passord.' : ' Vennligst kontakt administrator eller bruk "Glemt passord" på innloggingssiden.'),
              requiresAdmin: !resetEmailSent,
              suggestion: resetEmailSent ? 'Sjekk e-posten din og følg lenken for å sette nytt passord.' : 'Bruk "Glemt passord" på innloggingssiden for å sette et nytt passord.',
              adminError: adminError?.code || 'unknown',
              resetEmailSent,
              provider: resetEmailSent ? 'firebase_client_sdk_reset' : 'firebase_admin_sdk_error'
            }, { status: 500 });
          }
        } else {
          // No Admin SDK available - cannot update password for existing users
          console.error('❌ Admin SDK not available - cannot update password for existing user');
          // Fallback: Send passord-reset e-post via Firebase Client SDK slik at bruker kan sette nytt passord
          let resetEmailSent = false;
          try {
            console.log('📧 Fallback: Sender passord-reset e-post via Firebase Client SDK...');
            await sendPasswordResetEmail(auth, tokenData.email);
            resetEmailSent = true;
            console.log('✅ Passord-reset e-post sendt til:', tokenData.email);
          } catch (resetError) {
            console.error('❌ Kunne ikke sende passord-reset e-post:', resetError);
          }

          return NextResponse.json({
            error: 'Kunne ikke sette passord. Admin SDK er ikke tilgjengelig.',
            details: resetEmailSent
              ? 'Admin SDK er ikke konfigurert for passordoppdatering, men vi har sendt deg en e-post for å sette nytt passord.'
              : 'Brukeren eksisterer allerede i Firebase Auth, men Admin SDK er ikke konfigurert. Passordet kan ikke oppdateres uten Admin SDK. Vennligst kontakt administrator eller bruk "Glemt passord" på innloggingssiden.',
            requiresAdmin: !resetEmailSent,
            suggestion: resetEmailSent ? 'Sjekk e-posten din og følg lenken for å sette nytt passord.' : 'Bruk "Glemt passord" på innloggingssiden for å sette et nytt passord.',
            requiresForgotPassword: !resetEmailSent,
            resetEmailSent,
            provider: resetEmailSent ? 'firebase_client_sdk_reset' : 'firebase_admin_sdk_unavailable'
          }, { status: 500 });
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