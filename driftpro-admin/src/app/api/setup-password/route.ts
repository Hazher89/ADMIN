import { NextRequest, NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';

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
      // Check if Firebase Auth user already exists (created by /api/create-user)
      // If user document has a uid, try to sign in with temporary password first
      let firebaseUser;
      let userCredential;
      
      if (userData.uid) {
        // User already exists in Firebase Auth, try to sign in and update password
        console.log('⚠️ Firebase Auth user already exists, updating password instead');
        
        try {
          // Try to sign in with temporary password (from /api/create-user)
          // If that fails, try with the new password (in case temp password was already changed)
          const tempPassword = tokenData.temporaryPassword;
          if (tempPassword) {
            try {
              userCredential = await signInWithEmailAndPassword(auth, tokenData.email, tempPassword);
              firebaseUser = userCredential.user;
              
              // Update to new password
              await updatePassword(firebaseUser, password);
              console.log('✅ Password updated successfully');
            } catch (signInError) {
              // Temp password might already be changed, try with new password
              userCredential = await signInWithEmailAndPassword(auth, tokenData.email, password);
              firebaseUser = userCredential.user;
            }
          } else {
            // No temp password, try direct sign in (user might have been created elsewhere)
            userCredential = await signInWithEmailAndPassword(auth, tokenData.email, password);
            firebaseUser = userCredential.user;
          }
        } catch (signInError) {
          // Can't sign in - user might need to reset password via forgot password flow
          throw new Error('Could not sign in with existing credentials. Please use forgot password.');
        }
      } else {
        // User doesn't exist in Firebase Auth yet, create it
        const passwordToUse = tokenData.temporaryPassword || password;
        userCredential = await createUserWithEmailAndPassword(
          auth,
          tokenData.email,
          passwordToUse
        );
        firebaseUser = userCredential.user;

        // If a temporary password was used and a new password was provided, update it
        if (tokenData.temporaryPassword && password && password !== tokenData.temporaryPassword) {
          await updatePassword(firebaseUser, password);
        }
      }

      // Update user profile
      await updateProfile(firebaseUser, {
        displayName: userData.displayName || userData.name || 'Ny bruker'
      });

      // CRITICAL: Update user document with password setup status and UID
      // Always ensure both uid and id are set and match Firebase Auth UID
      await updateDoc(userDoc.ref, {
        uid: firebaseUser.uid,
        id: firebaseUser.uid, // Ensure id field always matches uid
        status: 'active',
        passwordSet: true,
        passwordSetAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // FINAL SAFETY CHECK: Verify uid was set correctly
      const verifyDoc = await getDoc(userDoc.ref);
      if (verifyDoc.exists()) {
        const verifyData = verifyDoc.data();
        if (!verifyData.uid || verifyData.uid !== firebaseUser.uid) {
          console.warn('⚠️ uid verification failed, attempting second update...');
          await updateDoc(userDoc.ref, {
            uid: firebaseUser.uid,
            id: firebaseUser.uid,
            updatedAt: new Date().toISOString()
          });
          console.log('✅ Second update completed for uid field');
        }
      }

      // Mark token as used
      await updateDoc(tokenDoc.ref, {
        used: true,
        usedAt: new Date().toISOString()
      });

      console.log('✅ Password setup completed successfully, UID:', firebaseUser.uid);

      return NextResponse.json({
        success: true,
        message: 'Password set up successfully',
        userId: firebaseUser.uid,
        provider: 'microsoft_graph'
      });

    } catch (authError) {
      console.error('❌ Firebase Auth error:', authError);
      
      if (authError instanceof Error && authError.message.includes('email-already-in-use')) {
        console.log('⚠️ Firebase Auth user already exists but we could not sign in');
        
        // This is a problem - user exists but we can't access them
        // Try to find the user by email and get their UID from Firestore
        // But first, let's try to update the Firestore document with what we know
        const firestoreUserQuery = query(collection(db, 'users'), where('email', '==', tokenData.email));
        const firestoreUserSnapshot = await getDocs(firestoreUserQuery);
        
        if (!firestoreUserSnapshot.empty) {
          const firestoreUserDoc = firestoreUserSnapshot.docs[0];
          const firestoreUserData = firestoreUserDoc.data();
          
          if (firestoreUserData.uid) {
            // We have a UID, update the document and mark token as used
            await updateDoc(firestoreUserDoc.ref, {
              status: 'active',
              passwordSet: true,
              passwordSetAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });

            await updateDoc(tokenDoc.ref, {
              used: true,
              usedAt: new Date().toISOString()
            });

            console.log('✅ Updated Firestore document for existing user');
            return NextResponse.json({
              success: true,
              message: 'User already exists. Please use forgot password to reset your password.',
              userId: firestoreUserData.uid,
              provider: 'microsoft_graph'
            });
          }
        }
      }

      return NextResponse.json(
        { 
          error: 'Failed to set up password',
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