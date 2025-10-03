import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCyE4S4B5q2JLdtaTtr8kVVvg8y-3Zm7ZE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "driftpro-40ccd.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "driftpro-40ccd",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "driftpro-40ccd.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const db = getFirestore(app);

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json();

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, displayName' },
        { status: 400 }
      );
    }

    // Check if user already exists in Firestore
    const userQuery = await getDocs(
      query(collection(db, 'users'), where('email', '==', email))
    );

    if (!userQuery.empty) {
      return NextResponse.json(
        { error: 'Brukeren eksisterer allerede i systemet' },
        { status: 400 }
      );
    }

    // Create Firebase Authentication user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create DriftPro main company if it doesn't exist
    const companyId = 'driftpro_main';
    const companyRef = doc(db, 'companies', companyId);
    const companyDoc = await getDoc(companyRef);

    if (!companyDoc.exists()) {
      await setDoc(companyRef, {
        id: companyId,
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
        adminUserId: user.uid,
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
          name: displayName,
          email: email,
          phone: '+47 12345678',
          position: 'Super Administrator'
        }
      });
    }

    // Create user document in Firestore
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      id: user.uid,
      displayName: displayName,
      email: email,
      role: 'super_admin',
      companyId: companyId,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hireDate: new Date().toISOString(),
      position: 'Super Administrator',
      departmentId: 'admin',
      bio: 'Super Administrator for DriftPro systemet',
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
      skills: ['Administration', 'System Management', 'User Management'],
      certifications: ['Super Admin Certification'],
      education: 'System Administration',
      workExperience: 'DriftPro Super Administrator'
    });

    return NextResponse.json({
      success: true,
      uid: user.uid,
      email: user.email,
      companyId: companyId,
      message: 'Super Admin bruker opprettet successfully'
    });

  } catch (error: any) {
    console.error('Error creating super admin user:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      return NextResponse.json(
        { error: 'E-postadressen er allerede i bruk i Firebase Auth' },
        { status: 400 }
      );
    }
    
    if (error.code === 'auth/weak-password') {
      return NextResponse.json(
        { error: 'Passordet er for svakt. Velg et sterkere passord.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Kunne ikke opprette super admin bruker: ' + error.message },
      { status: 500 }
    );
  }
}
