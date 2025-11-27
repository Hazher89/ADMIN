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

    } catch (authError) {
      console.error('❌ Firebase Auth error:', authError);
      
      if (authError instanceof Error && (authError.message.includes('email-already-in-use') || (authError as any).code === 'auth/email-already-in-use')) {
        console.log('⚠️ Firebase Auth user already exists, updating password and user document');
        
        // Try to initialize Admin SDK if not available
        if (!adminAuth) {
          console.log('⚠️ Admin SDK not initialized, attempting to initialize...');
          try {
            if (admin.apps.length === 0) {
              admin.initializeApp({
                credential: admin.credential.cert({
                  projectId: process.env.FIREBASE_PROJECT_ID || 'driftpro-40ccd',
                  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                }),
              });
              console.log('✅ Firebase Admin SDK initialized in error handler');
            }
            if (admin.apps.length > 0) {
              adminAuth = admin.auth();
              console.log('✅ Firebase Admin SDK obtained in error handler');
            }
          } catch (initError) {
            console.error('❌ Failed to initialize Admin SDK in error handler:', initError);
          }
        }
        
        // Check if Admin SDK credentials are available
        if (!process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL || !adminAuth) {
            console.warn('⚠️ Firebase Admin SDK credentials not configured');
            
            // If user has UID, use forgot-password API instead (better error handling)
            if (userData.uid) {
              console.log('📧 Admin SDK not available, using forgot-password API instead');
              
              try {
                // Use the forgot-password API which has better email handling
                const forgotPasswordResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/forgot-password`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    email: tokenData.email
                  })
                });
                
                if (forgotPasswordResponse.ok) {
                  const forgotPasswordData = await forgotPasswordResponse.json();
                  console.log('✅ Password reset email sent via forgot-password API');
                  
                  // Update Firestore status
                  await updateDoc(userDoc.ref, {
                    status: 'active',
                    passwordSet: false, // Not set yet, user needs to use reset link
                    updatedAt: new Date().toISOString()
                  });
                  
                  await updateDoc(tokenDoc.ref, {
                    used: true,
                    usedAt: new Date().toISOString()
                  });
                  
                  return NextResponse.json({
                    success: true,
                    message: 'Password reset email sent. Please check your email to set your password.',
                    userId: userData.uid,
                    provider: 'forgot_password_api',
                    emailSent: true
                  });
                } else {
                  const errorData = await forgotPasswordResponse.json().catch(() => ({}));
                  console.error('❌ Forgot-password API error:', errorData);
                  throw new Error(errorData.error || 'Failed to send password reset email');
                }
              } catch (resetEmailError: any) {
                console.error('❌ Error sending password reset email via API:', resetEmailError);
                
                // Try direct Firebase sendPasswordResetEmail as fallback
                // Note: This will fail if user doesn't exist in Firebase Auth yet
                try {
                  await sendPasswordResetEmail(auth, tokenData.email, {
                    url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/reset-password`,
                    handleCodeInApp: false
                  });
                  
                  console.log('✅ Password reset email sent successfully (direct Firebase)');
                  
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
                    userId: userData.uid,
                    provider: 'firebase_password_reset_email',
                    emailSent: true
                  });
                } catch (directEmailError: any) {
                  console.error('❌ Error sending password reset email directly:', {
                    code: directEmailError?.code,
                    message: directEmailError?.message,
                    error: directEmailError
                  });
                  
                  // If user doesn't exist in Firebase Auth, we need to create them first
                  if (directEmailError?.code === 'auth/user-not-found') {
                    console.log('⚠️ User not found in Firebase Auth, attempting to create account with temporary password');
                    
                    // Generate a temporary password
                    const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + 'A1!';
                    
                    try {
                      // Create user in Firebase Auth with temporary password
                      const newUserCredential = await createUserWithEmailAndPassword(auth, tokenData.email, tempPassword);
                      console.log('✅ Created Firebase Auth user with temporary password:', newUserCredential.user.uid);
                      
                      // Now send password reset email
                      await sendPasswordResetEmail(auth, tokenData.email, {
                        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/reset-password`,
                        handleCodeInApp: false
                      });
                      
                      console.log('✅ Password reset email sent after creating Auth user');
                      
                      // Update Firestore with UID
                      await updateDoc(userDoc.ref, {
                        uid: newUserCredential.user.uid,
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
                        userId: newUserCredential.user.uid,
                        provider: 'firebase_password_reset_email_after_creation',
                        emailSent: true
                      });
                    } catch (createError: any) {
                      console.error('❌ Error creating Firebase Auth user:', createError);
                      // Fall through to update status anyway
                    }
                  }
                  // Fall through to update status anyway
                }
              }
              
              // Update status even if email failed
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
                message: 'Setup link processed. Please use "Forgot Password" on the login page to set your password.',
                userId: userData.uid,
                provider: 'firebase_admin_sdk_fallback',
                warning: 'Password reset email could not be sent. Please use the "Forgot Password" feature on the login page.',
                requiresForgotPassword: true
              });
            }
            
            // No UID, try to use forgot-password API
            console.log('📧 User has no UID, using forgot-password API');
            try {
              // Use the forgot-password API which has better email handling
              const forgotPasswordResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/forgot-password`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: tokenData.email
                })
              });
              
              if (forgotPasswordResponse.ok) {
                console.log('✅ Password reset email sent via forgot-password API (no UID)');
                
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
                  provider: 'forgot_password_api',
                  emailSent: true
                });
              } else {
                const errorData = await forgotPasswordResponse.json().catch(() => ({}));
                console.error('❌ Forgot-password API error (no UID):', errorData);
                throw new Error(errorData.error || 'Failed to send password reset email');
              }
            } catch (resetEmailError: any) {
              console.error('❌ Error sending password reset email via API (no UID):', resetEmailError);
              
              // Try direct Firebase sendPasswordResetEmail as fallback
              try {
                await sendPasswordResetEmail(auth, tokenData.email, {
                  url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/reset-password`,
                  handleCodeInApp: false
                });
                
                console.log('✅ Password reset email sent successfully (direct Firebase, no UID)');
                
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
                  provider: 'firebase_password_reset_email',
                  emailSent: true
                });
              } catch (directEmailError: any) {
                console.error('❌ Error sending password reset email directly (no UID):', directEmailError);
                
                // Update status anyway
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
                  message: 'Setup link processed. Please use "Forgot Password" on the login page to set your password.',
                  provider: 'firebase_admin_sdk_fallback',
                  warning: 'Password reset email could not be sent. Please use the "Forgot Password" feature on the login page to set your password.',
                  requiresForgotPassword: true
                });
              }
            }
          }
          
          // If we get here, Admin SDK credentials are available, proceed with Admin SDK
          if (!adminAuth) {
            // Try to get adminAuth again
            if (admin.apps.length > 0) {
              adminAuth = admin.auth();
            }
          }
          
          if (!adminAuth) {
            // Last resort: send password reset email
            console.log('📧 Admin SDK still not available, sending password reset email as last resort');
            try {
              await sendPasswordResetEmail(auth, tokenData.email, {
                url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/reset-password`,
                handleCodeInApp: false
              });
              
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
                provider: 'firebase_password_reset_email',
                emailSent: true
              });
            } catch (emailError) {
              console.error('❌ Error sending password reset email:', emailError);
            }
            
            // If email also failed, return with instructions
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
              message: 'Setup link processed. Please use "Forgot Password" on the login page to set your password.',
              provider: 'firebase_admin_sdk_fallback',
              warning: 'Please use the "Forgot Password" feature on the login page to set your password.',
              requiresForgotPassword: true
            });
          }
          
          // Get the existing user from Firebase Auth using Admin SDK
          try {
            console.log('🔍 Looking up user in Firebase Auth:', tokenData.email);
            let existingUser;
            try {
              existingUser = await adminAuth.getUserByEmail(tokenData.email);
              console.log('✅ Found existing Firebase Auth user:', existingUser.uid);
            } catch (getUserError: any) {
            console.error('❌ Error getting user from Firebase Auth:', getUserError);
            // If user doesn't exist in Auth but exists in Firestore, create new Auth user
            if (getUserError?.code === 'auth/user-not-found') {
              console.log('⚠️ User not found in Firebase Auth, will create new account');
              // Try to create new user with client SDK
              try {
                const newUserCredential = await createUserWithEmailAndPassword(auth, tokenData.email, password);
                await updateDoc(userDoc.ref, {
                  uid: newUserCredential.user.uid,
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
                  message: 'Password setup completed (new Firebase Auth user created)',
                  userId: newUserCredential.user.uid,
                  provider: 'firebase_client_sdk'
                });
              } catch (createError: any) {
                console.error('❌ Error creating new Auth user:', createError);
                throw new Error(`Failed to create or update user: ${createError.message}`);
              }
            }
            throw getUserError;
          }
          
          // Update the password using Admin SDK - use the password from request body
          console.log('🔐 Updating password for user:', existingUser.uid);
          let passwordUpdated = false;
          try {
            await adminAuth.updateUser(existingUser.uid, {
              password: password
            });
            console.log('✅ Password updated for existing Firebase Auth user:', existingUser.uid);
            passwordUpdated = true;
          } catch (updateError: any) {
            console.error('❌ Error updating password with Admin SDK:', {
              code: updateError?.code,
              message: updateError?.message,
              error: updateError
            });
            
            // Even if password update fails, update Firestore status so user can use forgot password
            await updateDoc(userDoc.ref, {
              uid: existingUser.uid, // Ensure UID is set
              status: 'active',
              passwordSet: false, // Mark as not set since update failed
              updatedAt: new Date().toISOString()
            });
            
            await updateDoc(tokenDoc.ref, {
              used: true,
              usedAt: new Date().toISOString()
            });
            
              // Return success but with warning - user can use forgot password
              return NextResponse.json({
                success: true,
                message: 'Password setup link processed. Please use "Forgot Password" to set your password.',
                userId: existingUser.uid,
                provider: 'firebase_admin_sdk_fallback',
                warning: `Password update failed: ${updateError?.message || 'Unknown error'}. Please use the "Forgot Password" feature to set your password.`,
                requiresForgotPassword: true
              });
            }
            
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
          } catch (adminError: any) {
          console.error('❌ Error updating existing user with Admin SDK:', {
            error: adminError,
            code: adminError?.code,
            message: adminError?.message,
            stack: adminError?.stack
          });
          
          // Fallback: try to get UID from Firestore if it exists
          if (userData.uid) {
            console.log('⚠️ Using fallback: User has UID in Firestore, updating password status');
            // User document already has UID, just update password status
            await updateDoc(userDoc.ref, {
              status: 'active',
              passwordSet: false, // Mark as not set since we couldn't update
              updatedAt: new Date().toISOString()
            });
            
            await updateDoc(tokenDoc.ref, {
              used: true,
              usedAt: new Date().toISOString()
            });
            
            return NextResponse.json({
              success: true,
              message: 'Password setup link processed. Please use "Forgot Password" to set your password.',
              userId: userData.uid,
              provider: 'firebase_admin_sdk_fallback',
              warning: 'Password could not be updated automatically. Please use the "Forgot Password" feature to set your password.',
              requiresForgotPassword: true
            });
          }
          
          // Last resort: Update Firestore status even without UID
          await updateDoc(userDoc.ref, {
            status: 'active',
            passwordSet: false,
            updatedAt: new Date().toISOString()
          });
          
          await updateDoc(tokenDoc.ref, {
            used: true,
            usedAt: new Date().toISOString()
          });
          
          // Provide helpful error message
          const errorDetails = adminError?.code || adminError?.message || 'Unknown error';
          console.error('❌ Complete Admin SDK error details:', {
            code: adminError?.code,
            message: adminError?.message,
            error: adminError
          });
          
          return NextResponse.json({
            success: true,
            message: 'Password setup link processed. Please use "Forgot Password" to set your password.',
            provider: 'firebase_admin_sdk_fallback',
            warning: `Password could not be updated automatically (${errorDetails}). Please use the "Forgot Password" feature on the login page to set your password.`,
            requiresForgotPassword: true
          });
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