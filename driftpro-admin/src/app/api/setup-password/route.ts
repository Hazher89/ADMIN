import { NextRequest, NextResponse } from 'next/server';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';

// Initialize Firebase if not already initialized
function initializeFirebase() {
  if (getApps().length === 0) {
    initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
  }
}

// Get Firestore instance
function getDb() {
  try {
    initializeFirebase();
    return getFirestore();
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return null;
  }
}

// Validate setup token
async function validateSetupToken(token: string) {
  const firestoreDb = getDb();
  if (!firestoreDb) {
    throw new Error('Firebase database not available');
  }

  const setupTokensRef = collection(firestoreDb, 'setupTokens');
  const tokenDocs = await getDocs(setupTokensRef);
  
  const tokenDoc = tokenDocs.docs.find(doc => doc.data().token === token);
  
  if (!tokenDoc) {
    return null;
  }

  const tokenData = tokenDoc.data();
  
  // Check if token is expired (24 hours)
  const createdAt = new Date(tokenData.createdAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  
  if (hoursDiff > 24) {
    return null;
  }

  // Check if token is already used
  if (tokenData.used) {
    return null;
  }

  return {
    id: tokenDoc.id,
    email: tokenData.email,
    adminName: tokenData.adminName,
    companyName: tokenData.companyName,
    companyId: tokenData.companyId,
    createdAt: tokenData.createdAt
  };
}

// Mark token as used
async function markTokenAsUsed(tokenId: string) {
  const firestoreDb = getDb();
  if (!firestoreDb) {
    throw new Error('Firebase database not available');
  }

  await updateDoc(doc(firestoreDb, 'setupTokens', tokenId), {
    used: true,
    usedAt: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token og passord er påkrevd' },
        { status: 400 }
      );
    }

    console.log('🔧 SETUP PASSWORD: Processing token:', token);

    // Validate token
    const tokenData = await validateSetupToken(token);
    if (!tokenData) {
      console.log('❌ SETUP PASSWORD: Invalid or expired token');
      return NextResponse.json(
        { error: 'Ugyldig eller utløpt token' },
        { status: 400 }
      );
    }

    console.log('✅ SETUP PASSWORD: Token validated for:', tokenData.email);

    const firestoreDb = getDb();
    if (!firestoreDb) {
      return NextResponse.json(
        { error: 'Database ikke tilgjengelig' },
        { status: 500 }
      );
    }

    // Get Firebase Auth instance
    const auth = getAuth();
    if (!auth) {
      return NextResponse.json(
        { error: 'Firebase Auth ikke tilgjengelig' },
        { status: 500 }
      );
    }

    // Find existing user in Firestore
    const usersQuery = collection(firestoreDb, 'users');
    const userDocs = await getDocs(usersQuery);
    const userDoc = userDocs.docs.find(doc => 
      doc.data().email === tokenData.email && 
      doc.data().companyId === tokenData.companyId
    );

    if (!userDoc) {
      console.error('❌ SETUP PASSWORD: User not found:', {
        email: tokenData.email,
        companyId: tokenData.companyId
      });
      return NextResponse.json(
        { error: 'Bruker ikke funnet' },
        { status: 404 }
      );
    }

    console.log('✅ SETUP PASSWORD: Found user:', userDoc.id);

    // Create user in Firebase Authentication
    console.log('🔧 SETUP PASSWORD: Creating user in Firebase Auth');
    const userCredential = await createUserWithEmailAndPassword(auth, tokenData.email, password);
    const firebaseUser = userCredential.user;

    // Update display name in Firebase Auth
    await updateProfile(firebaseUser, {
      displayName: tokenData.adminName
    });

    // Update user in Firestore with Firebase UID and mark as active
    const updateData = {
      id: firebaseUser.uid,
      companyId: tokenData.companyId,
      status: 'active',
      passwordSetAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('🔧 SETUP PASSWORD: Updating user with:', updateData);
    
    await updateDoc(doc(firestoreDb, 'users', userDoc.id), updateData);

    // Mark token as used
    await markTokenAsUsed(tokenData.id);

    console.log('✅ SETUP PASSWORD: Admin setup completed successfully for:', tokenData.email);
    
    return NextResponse.json({ 
      success: true,
      message: 'Passord satt opp successfully'
    });

  } catch (error) {
    console.error('❌ SETUP PASSWORD: Error:', error);
    
    // Check if it's a Firebase Auth error
    if (error instanceof Error && error.message.includes('auth/email-already-in-use')) {
      return NextResponse.json(
        { error: 'Brukeren eksisterer allerede i systemet. Prøv å logge inn i stedet.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: `Feil ved oppsett av passord: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 