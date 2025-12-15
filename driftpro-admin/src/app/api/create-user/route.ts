import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, doc, setDoc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getFirebaseAuth, getFirebaseDb, isFirebaseAvailable } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  // Extract request data first so it's available in catch block
  let email: string = '';
  let displayName: string = '';
  let companyName: string = '';
  let role: string = 'employee';
  
  try {
    const requestData = await request.json();
    email = requestData.email || '';
    displayName = requestData.displayName || '';
    companyName = requestData.companyName || '';
    role = requestData.role || 'employee';
    
    // Check if Firebase is available
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    
    if (!isFirebaseAvailable() || !auth || !db) {
      return NextResponse.json(
        { error: 'Firebase is not configured. Please set Firebase environment variables.' },
        { status: 500 }
      );
    }

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

    // Create user profile in Firestore - ALWAYS include uid
    const userProfile = {
      id: user.uid,
      uid: user.uid, // CRITICAL: Always set uid field explicitly
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

    // Generate a password setup token for direct password setup
    const setupToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72); // Token valid for 72 hours

    // Store setup token in Firestore (use Timestamp for expiresAt to match setup-password expectations)
    await addDoc(collection(db, 'setupTokens'), {
      token: setupToken,
      userId: user.uid,
      email: email,
      expiresAt: Timestamp.fromDate(expiresAt),
      used: false,
      createdAt: serverTimestamp(),
      type: 'employee_welcome',
      companyName: companyName || 'Mavi Logistikk',
      adminName: 'System Administrator'
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://admin.driftpro.no';
    const setupPasswordUrl = `${appUrl}/setup-password?token=${setupToken}`;

    // Send welcome email with direct password setup link via Microsoft Graph
    try {
      const response = await fetch(`${appUrl}/api/send-welcome-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          displayName: displayName,
          adminName: 'System Administrator',
          companyName: companyName || 'Mavi Logistikk',
          resetLink: setupPasswordUrl
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('✅ Welcome email sent successfully with password setup link');
        } else {
          console.error('⚠️ Failed to send welcome email:', result.error);
        }
      } else {
        console.error('⚠️ Failed to send welcome email:', response.status);
      }
    } catch (welcomeEmailError) {
      console.error('⚠️ Error sending welcome email:', welcomeEmailError);
    }

    // Also send password reset email from Firebase Auth as backup
    try {
      const actionCodeSettings = {
        url: `${appUrl}/login`,
        handleCodeInApp: true
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      console.log('✅ Password reset email sent from Firebase Auth (backup)');
    } catch (emailError) {
      console.error('⚠️ Failed to send password reset email from Firebase Auth:', emailError);
    }

    return NextResponse.json({
      success: true,
      userId: user.uid,
      setupPasswordUrl: setupPasswordUrl,
      message: 'User created successfully and welcome email sent'
    });

  } catch (error: any) {
    console.error('Error creating user:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      // If user exists, try to find their UID in Firestore
      try {
        // Ensure db and auth are available
        const firestoreDb = getFirebaseDb();
        const firebaseAuth = getFirebaseAuth();
        
        if (!firestoreDb || !firebaseAuth) {
          return NextResponse.json(
            { error: 'Database not available' },
            { status: 500 }
          );
        }
        
        // Try to find user by email in Firestore
        const usersRef = collection(firestoreDb, 'users');
        const { query: firestoreQuery, where: firestoreWhere, getDocs } = await import('firebase/firestore');
        const emailQuery = firestoreQuery(usersRef, firestoreWhere('email', '==', email));
        const emailSnapshot = await getDocs(emailQuery);
        
        let existingUserId: string | null = null;
        if (!emailSnapshot.empty) {
          const existingUserDoc = emailSnapshot.docs[0];
          const existingData = existingUserDoc.data();
          existingUserId = existingData.uid || existingUserDoc.id;
          
          // AUTO-FIX: If uid is missing, try to find Firebase Auth user and set it
          if (!existingData.uid && existingUserId) {
            console.warn('⚠️ Existing user missing uid, attempting auto-fix...');
            try {
              // Try to get Firebase Auth user by email
              // We can't directly look up by email, but we can try to sign in if we have a password
              // For now, just set uid to match document ID as fallback
              await updateDoc(existingUserDoc.ref, {
                uid: existingUserId,
                id: existingUserId,
                updatedAt: new Date().toISOString()
              });
              console.log('✅ Auto-fixed missing uid for existing user:', email);
            } catch (fixError) {
              console.error('❌ Could not auto-fix missing uid for existing user:', fixError);
            }
          }
        }
        
        // Send password reset email
        try {
          await sendPasswordResetEmail(firebaseAuth, email);
          console.log('✅ Password reset email sent from Firebase Auth');
        } catch (resetEmailError) {
          console.error('⚠️ Failed to send password reset email from Firebase Auth:', resetEmailError);
        }

        // Generate a password setup token for existing user
        const setupToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 72); // Token valid for 72 hours

        // Store setup token in Firestore (use Timestamp for expiresAt to match setup-password expectations)
        if (existingUserId) {
          await addDoc(collection(firestoreDb, 'setupTokens'), {
            token: setupToken,
            userId: existingUserId,
            email: email,
            expiresAt: Timestamp.fromDate(expiresAt),
            used: false,
            createdAt: serverTimestamp(),
            type: 'employee_welcome',
            companyName: companyName || 'Mavi Logistikk',
            adminName: 'System Administrator'
          });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://admin.driftpro.no';
        const setupPasswordUrl = `${appUrl}/setup-password?token=${setupToken}`;

        // Send welcome email with direct password setup link
        try {
          const response = await fetch(`${appUrl}/api/send-welcome-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: email,
              displayName: displayName,
              adminName: 'System Administrator',
              companyName: companyName || 'Mavi Logistikk',
              resetLink: setupPasswordUrl
            })
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              console.log('✅ Welcome email sent successfully with password setup link');
            } else {
              console.error('⚠️ Failed to send welcome email:', result.error);
            }
          } else {
            console.error('⚠️ Failed to send welcome email:', response.status);
          }
        } catch (welcomeEmailError) {
          console.error('⚠️ Error sending welcome email:', welcomeEmailError);
        }
        
        return NextResponse.json(
          { 
            success: true,
            userId: existingUserId,
            setupPasswordUrl: setupPasswordUrl,
            message: 'User already exists. Password reset email and welcome email sent.',
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
