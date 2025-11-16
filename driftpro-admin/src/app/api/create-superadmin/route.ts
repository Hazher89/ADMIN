import { NextRequest, NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

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
const db = getFirestore(app);
const auth = getAuth(app);

// POST /api/create-superadmin - Create superadmin user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, secretKey } = body;

    // Security: Require a secret key to prevent unauthorized access
    const requiredSecretKey = process.env.SUPERADMIN_SECRET_KEY || 'DRIFTPRO_SUPERADMIN_2024_SECURE';
    
    if (secretKey !== requiredSecretKey) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid secret key' },
        { status: 401 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('🔐 Creating superadmin user:', email);

    // Check if user already exists in Firestore
    const usersQuery = query(collection(db, 'users'), where('email', '==', email));
    const userSnapshot = await getDocs(usersQuery);
    
    let firebaseUser;
    let userId;

    if (userSnapshot.empty) {
    // Create Firebase Authentication user
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUser = userCredential.user;
        userId = firebaseUser.uid;
        
        // Update display name
        await updateProfile(firebaseUser, {
          displayName: 'Super Administrator'
        });
        
        console.log('✅ Firebase Authentication user created:', userId);
      } catch (authError: any) {
        // If user already exists in Auth, try to find it
        if (authError.code === 'auth/email-already-in-use') {
          console.log('⚠️ User already exists in Firebase Auth, continuing...');
          // We'll need to handle this case - for now, we'll create the Firestore doc
          // In production, you might want to fetch the existing user
          throw new Error('User already exists in Firebase Authentication. Please use a different email or reset the password.');
        }
        throw authError;
      }
    } else {
      // User exists in Firestore, update it
      const existingUser = userSnapshot.docs[0];
      userId = existingUser.id;
      const existingData = existingUser.data();
      
      if (existingData.uid) {
        // User has Firebase Auth account, we can't recreate it
        console.log('⚠️ User already exists with Firebase Auth UID:', existingData.uid);
        
        // Update to ensure super_admin role and protected status
        await setDoc(doc(db, 'users', userId), {
          ...existingData,
          role: 'super_admin',
          email: email,
          displayName: 'Super Administrator',
          companyId: 'driftpro_main',
          status: 'active',
          isProtected: true,
          cannotBeDeleted: true,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        
        return NextResponse.json({
          success: true,
          message: 'Superadmin user already exists and has been updated',
          userId: userId,
          email: email
        });
      }
      
      // Create Firebase Auth user for existing Firestore user
      try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUser = userCredential.user;

        await updateProfile(firebaseUser, {
          displayName: 'Super Administrator'
        });
        
        // Update Firestore with UID
        await setDoc(doc(db, 'users', userId), {
          ...existingData,
          uid: firebaseUser.uid,
          role: 'super_admin',
          email: email,
          displayName: 'Super Administrator',
          companyId: 'driftpro_main',
          status: 'active',
          isProtected: true,
          cannotBeDeleted: true,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        
        return NextResponse.json({
          success: true,
          message: 'Superadmin user updated with Firebase Auth',
          userId: userId,
          email: email
        });
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          throw new Error('User already exists in Firebase Authentication. Please reset the password through Firebase Console.');
        }
        throw authError;
      }
    }

    // Ensure driftpro_main company exists
    const companyRef = doc(db, 'companies', 'driftpro_main');
    const companyDoc = await getDoc(companyRef);

    if (!companyDoc.exists()) {
      await setDoc(companyRef, {
        id: 'driftpro_main',
        name: 'DriftPro Administrasjon',
        industry: 'Software',
        employees: 1,
        location: 'Norge',
        phone: '+47 12345678',
        email: 'admin@driftpro.no',
        website: 'https://admin.driftpro.no',
        status: 'active',
        joinedDate: new Date().toISOString(),
        revenue: 'N/A',
        description: 'Hovedadministrasjon for DriftPro systemet',
        adminUserId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        orgNumber: '123456789',
        address: {
          street: 'DriftPro Gate 1',
          city: 'Oslo',
          postalCode: '0001',
          country: 'Norge'
        },
        contactPerson: {
          name: 'Super Administrator',
          email: email,
          phone: '+47 12345678',
          position: 'Super Administrator'
        }
      });
      console.log('✅ Created driftpro_main company');
    }

    // Create or update superadmin user profile in Firestore
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      id: userId,
      uid: userId,
      displayName: 'Super Administrator',
      email: email,
      role: 'super_admin',
      companyId: 'driftpro_main',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hireDate: new Date().toISOString(),
      position: 'Super Administrator',
      departmentId: 'admin',
      bio: 'Super Administrator for DriftPro systemet - Full tilgang til alle funksjoner',
      avatar: '',
      phone: '',
      address: '',
      emergencyContact: '',
      birthDate: '',
      salary: 0,
      managerId: '',
      employeeNumber: 'SA001',
      taxId: '',
      bankAccount: '',
      insuranceNumber: '',
      skills: ['Administration', 'System Management', 'User Management', 'Full System Access'],
      certifications: ['Super Admin Certification'],
      education: 'System Administration',
      workExperience: 'DriftPro Super Administrator',
      // Protection flags
      isProtected: true,
      cannotBeDeleted: true,
      isSuperAdmin: true,
      hasFullAccess: true
    }, { merge: true });

    console.log('✅ Superadmin user profile created/updated in Firestore');

    return NextResponse.json({
      success: true,
      message: 'Superadmin user created successfully',
      userId: userId,
      email: email,
      role: 'super_admin',
      companyId: 'driftpro_main',
      isProtected: true,
      cannotBeDeleted: true
    });

  } catch (error: any) {
    console.error('❌ Error creating superadmin:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create superadmin user',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
