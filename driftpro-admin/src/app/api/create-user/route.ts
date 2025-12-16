import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, doc, setDoc, getDoc, updateDoc, serverTimestamp, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getFirebaseDb, isFirebaseAvailable } from '@/lib/firebase-admin';
import { initializeApp, getApps } from 'firebase/app';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get Firebase Auth instance (client SDK for server-side use)
 */
function getAuthInstance() {
  try {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCyE4S4B5q2JLdtaTtr8kVVvg8y-3Zm7ZE",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "driftpro-40ccd.firebaseapp.com",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "driftpro-40ccd",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "driftpro-40ccd.appspot.com",
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
    };

    let app;
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    return getAuth(app);
  } catch (error) {
    console.error('Error getting Firebase Auth instance:', error);
    return null;
  }
}

/**
 * Get all permissions set to true for admin users
 */
function getAllAdminPermissions() {
  return {
    dashboard: true,
    employees: true,
    departments: true,
    projects: true,
    tasks: true,
    inventory: true,
    suppliers: true,
    finance: true,
    invoicing: true,
    payments: true,
    hr: true,
    crm: true,
    delivery: true,
    settings: true,
    mail: true,
    reports: true,
    analytics: true,
    notifications: true,
    calendar: true,
    documents: true,
    training: true,
    compliance: true,
    maintenance: true,
    quality: true,
    safety: true,
    procurement: true,
    logistics: true,
    production: true,
    sales: true,
    marketing: true,
    customerService: true,
    it: true,
    legal: true,
    audit: true,
    internkontrollOgSamsvar: true,
    internrevisjon: true,
    avvik: true,
    risikovurdering: true,
    oppfølgingstiltak: true,
    kontrollpunkter: true,
    internkontrollRapporter: true,
    chat: true,
    emailSystem: true,
    smsLogs: true,
    partners: true,
    logistikkBudPriser: true,
    logistikkLevering: true,
    logistikkPlanlegging: true,
    logistikkKunder: true,
    logistikkLeverandorer: true,
    logistikkProdukter: true,
    logistikkLager: true,
    logistikkFakturering: true,
    logistikkFinans: true,
    hrAnsatte: true,
    hrVakter: true,
    hrFravær: true,
    hrFerie: true,
    hrAvdelinger: true
  };
}

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
    const auth = getAuthInstance();
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
    
    console.log('🔐 Creating Firebase Auth user for:', email);
    
    // Create user in Firebase Auth with temporary password
    let user;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
      user = userCredential.user;
      console.log('✅ Firebase Auth user created successfully:', user.uid);
    } catch (authError: any) {
      console.error('❌ Error creating Firebase Auth user:', authError);
      if (authError.code === 'auth/email-already-in-use') {
        // User already exists - find their UID
        const usersQuery = query(collection(db, 'users'), where('email', '==', email));
        const usersSnapshot = await getDocs(usersQuery);
        if (!usersSnapshot.empty) {
          const existingUserDoc = usersSnapshot.docs[0];
          const existingData = existingUserDoc.data();
          const existingUid = existingData.uid || existingUserDoc.id;
          
          // Return existing user info and send email
          const setupToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 72);
          
          await addDoc(collection(db, 'setupTokens'), {
            token: setupToken,
            userId: existingUid,
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
          
          // Send welcome email
          try {
            const response = await fetch(`${appUrl}/api/send-welcome-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
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
                console.log('✅ Welcome email sent to existing user');
              }
            }
          } catch (emailError) {
            console.error('⚠️ Error sending welcome email:', emailError);
          }
          
          return NextResponse.json({
            success: true,
            userId: existingUid,
            setupPasswordUrl: setupPasswordUrl,
            message: 'User already exists. Welcome email sent.',
            alreadyExists: true
          });
        }
      }
      throw authError;
    }

    // Set permissions based on role - Admin gets ALL permissions
    const permissions = (role === 'admin' || role === 'super_admin') 
      ? getAllAdminPermissions() 
      : undefined; // Other roles get permissions from employee creation flow

    // Create user profile in Firestore - ALWAYS include uid
    const userProfile: any = {
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

    // Add permissions if role is admin
    if (permissions) {
      userProfile.permissions = permissions;
    }

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
        const firebaseAuth = getAuthInstance();
        
        if (!firestoreDb || !firebaseAuth) {
          return NextResponse.json(
            { error: 'Database not available' },
            { status: 500 }
          );
        }
        
        // Try to find user by email in Firestore
        const usersRef = collection(firestoreDb, 'users');
        const emailQuery = query(usersRef, where('email', '==', email));
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
