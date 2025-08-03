import { NextResponse } from 'next/server';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * Get Firebase database instance with fallback
 */
function getDb() {
  try {
    const { getFirestore } = require('firebase/firestore');
    const { getApps, initializeApp } = require('firebase/app');
    
    const apps = getApps();
    if (apps.length === 0) {
      // Initialize Firebase if not already done
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCyE4S4B5q2JLdtaTtr8kVVvg8y-3Zm7ZE",
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "driftpro-40ccd.firebaseapp.com",
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "driftpro-40ccd",
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "driftpro-40ccd.appspot.com",
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
      };
      initializeApp(firebaseConfig);
    }
    
    return getFirestore();
  } catch (error) {
    console.error('Error getting Firestore instance:', error);
    return null;
  }
}

export async function GET() {
  try {
    const firestoreDb = getDb();
    if (!firestoreDb) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const logsQuery = query(
      collection(firestoreDb, 'emailLogs'),
      orderBy('sentAt', 'desc'),
      limit(100)
    );

    const logsSnapshot = await getDocs(logsQuery);
    const logs = logsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error getting email logs:', error);
    return NextResponse.json({ error: 'Failed to get email logs' }, { status: 500 });
  }
} 