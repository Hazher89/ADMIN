import { NextRequest, NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, orderBy, limit, query } from 'firebase/firestore';

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

export async function GET(request: NextRequest) {
  try {
    console.log('📧 Fetching email logs for Cloudflare Email Routing');

    // Get email logs from Firestore
    const emailLogsQuery = query(
      collection(db, 'emailLogs'),
      orderBy('sentAt', 'desc'),
      limit(100)
    );

    const emailLogsSnapshot = await getDocs(emailLogsQuery);
    const emailLogs = emailLogsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      sentAt: doc.data().sentAt?.toDate?.()?.toISOString() || doc.data().sentAt || new Date().toISOString()
    }));

    console.log(`✅ Retrieved ${emailLogs.length} email logs for Cloudflare Email Routing`);

    return NextResponse.json(emailLogs);
  } catch (error) {
    console.error('❌ Error fetching email logs:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch email logs',
        details: error instanceof Error ? error.message : 'Unknown error',
        provider: 'cloudflare_email_routing'
      },
      { status: 500 }
    );
  }
} 