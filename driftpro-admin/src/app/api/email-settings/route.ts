import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';

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

    const settingsDoc = await getDoc(doc(firestoreDb, 'system', 'emailSettings'));
    
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      // Don't return sensitive data like SMTP password
      const { smtpPassword, ...safeData } = data;
      return NextResponse.json(safeData);
    } else {
      // Return default settings
      return NextResponse.json({
        enabled: true,
        fromEmail: 'noreply@driftpro.no',
        fromName: 'DriftPro System',
        adminSetup: true,
        deviationReports: true,
        deviationResolved: true,
        userWelcome: true,
        notifications: true,
        warnings: true,
        systemAlerts: true,
        smtpHost: 'smtp.office365.com',
        smtpPort: 587,
        smtpUser: 'noreply@driftpro.no',
        smtpSecure: false,
        retryAttempts: 3,
        retryDelay: 5000,
        maxEmailsPerHour: 100,
        logAllEmails: true
      });
    }
  } catch (error) {
    console.error('Error getting email settings:', error);
    return NextResponse.json({ error: 'Failed to get email settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const firestoreDb = getDb();
    if (!firestoreDb) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const body = await request.json();
    const { smtpPassword, ...settings } = body;

    // Validate required fields
    if (!settings.fromEmail || !settings.fromName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Prepare data for storage
    const settingsData = {
      ...settings,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system' // In a real app, you'd get this from auth
    };

    // If SMTP password is provided, store it separately or encrypted
    if (smtpPassword) {
      settingsData.smtpPassword = smtpPassword; // In production, encrypt this
    }

    await setDoc(doc(firestoreDb, 'system', 'emailSettings'), settingsData);

    return NextResponse.json({ success: true, message: 'Email settings saved successfully' });
  } catch (error) {
    console.error('Error saving email settings:', error);
    return NextResponse.json({ error: 'Failed to save email settings' }, { status: 500 });
  }
} 