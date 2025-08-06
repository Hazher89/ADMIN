import { NextRequest, NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

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
    console.log('📧 Fetching email settings for Domeneshop SMTP');

    const emailSettingsRef = doc(db, 'systemSettings', 'email');
    const emailSettingsDoc = await getDoc(emailSettingsRef);
    
    if (emailSettingsDoc.exists()) {
      const data = emailSettingsDoc.data();
      console.log('✅ Email settings found:', {
        smtpHost: data.smtpHost,
        smtpUser: data.smtpUser,
        fromEmail: data.fromEmail,
        hasPassword: !!data.smtpPassword,
        provider: 'domeneshop_smtp'
      });
      
      return NextResponse.json({
        success: true,
        settings: {
          smtpHost: data.smtpHost || 'smtp.domeneshop.no',
          smtpPort: data.smtpPort || 587,
          smtpUser: data.smtpUser || 'noreplay@driftpro.no',
          smtpPassword: data.smtpPassword || '',
          smtpSecure: data.smtpSecure || false,
          fromEmail: data.fromEmail || 'noreplay@driftpro.no',
          fromName: data.fromName || 'DriftPro System',
          connectionTimeout: data.connectionTimeout || 60000,
          greetingTimeout: data.greetingTimeout || 30000,
          socketTimeout: data.socketTimeout || 60000
        },
        provider: 'domeneshop_smtp'
      });
    } else {
      console.log('📧 No email settings found, returning defaults');
      return NextResponse.json({
        success: true,
        settings: {
          smtpHost: 'smtp.domeneshop.no',
          smtpPort: 587,
          smtpUser: 'noreplay@driftpro.no',
          smtpPassword: '',
          smtpSecure: false,
          fromEmail: 'noreplay@driftpro.no',
          fromName: 'DriftPro System',
          connectionTimeout: 60000,
          greetingTimeout: 30000,
          socketTimeout: 60000
        },
        provider: 'domeneshop_smtp'
      });
    }
  } catch (error) {
    console.error('❌ Error fetching email settings:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch email settings',
        details: error instanceof Error ? error.message : 'Unknown error',
        provider: 'domeneshop_smtp'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json(
        { error: 'Email settings are required' },
        { status: 400 }
      );
    }

    console.log('📧 Saving email settings for Domeneshop SMTP:', {
      smtpHost: settings.smtpHost,
      smtpUser: settings.smtpUser,
      fromEmail: settings.fromEmail,
      hasPassword: !!settings.smtpPassword,
      provider: 'domeneshop_smtp'
    });

    // Validate required fields
    if (!settings.smtpHost || !settings.smtpUser || !settings.fromEmail) {
      return NextResponse.json(
        { error: 'SMTP Host, SMTP User, and From Email are required' },
        { status: 400 }
      );
    }

    // Save settings to Firestore
    const emailSettingsRef = doc(db, 'systemSettings', 'email');
    await setDoc(emailSettingsRef, {
      ...settings,
      updatedAt: serverTimestamp(),
      provider: 'domeneshop_smtp'
    });

    console.log('✅ Email settings saved successfully for Domeneshop SMTP');

    return NextResponse.json({
      success: true,
      message: 'Email settings saved successfully',
      provider: 'domeneshop_smtp'
    });
  } catch (error) {
    console.error('❌ Error saving email settings:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save email settings',
        details: error instanceof Error ? error.message : 'Unknown error',
        provider: 'domeneshop_smtp'
      },
      { status: 500 }
    );
  }
} 