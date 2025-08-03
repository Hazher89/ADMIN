import { NextRequest, NextResponse } from 'next/server';
import * as nodemailer from 'nodemailer';
import { collection, addDoc, getFirestore } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  type?: 'admin_setup' | 'notification' | 'warning' | 'system' | 'welcome';
}

interface SMTPConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
}

/**
 * Get Firebase database instance with fallback
 */
function getDb() {
  if (db) {
    return db;
  }
  
  // Try to get Firestore directly if db is not available
  try {
    const { getApps, initializeApp } = require('firebase/app');
    const apps = getApps();
    
    if (apps.length === 0) {
      // Initialize Firebase if not already done
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
      };
      initializeApp(firebaseConfig);
    }
    
    return getFirestore();
  } catch (error) {
    console.error('Error getting Firestore instance:', error);
    return null; // Return null instead of throwing to allow graceful fallback
  }
}

export async function POST(request: NextRequest) {
  let emailData: EmailData | null = null;
  let smtpConfig: SMTPConfig | null = null;
  
  try {
    const requestData = await request.json();
    
    // Handle both old and new data structures
    if (requestData.emailData && requestData.config) {
      // Old structure
      emailData = {
        to: Array.isArray(requestData.emailData.to) ? requestData.emailData.to[0] : requestData.emailData.to,
        subject: requestData.emailData.subject,
        html: requestData.emailData.body
      };
      smtpConfig = requestData.config;
    } else if (requestData.smtpConfig) {
      // New structure (from email service)
      emailData = {
        to: requestData.to,
        subject: requestData.subject,
        html: requestData.html,
        text: requestData.text,
        type: requestData.type
      };
      smtpConfig = requestData.smtpConfig;
    } else {
      // Direct email data
      emailData = requestData as EmailData;
      // Use default SMTP config for noreply@driftpro.no
      smtpConfig = {
        host: 'smtp.office365.com',
        port: 587,
        user: 'noreply@driftpro.no',
        pass: process.env.DRIFTPRO_EMAIL_PASSWORD || '',
        secure: false
      };
    }

    if (!emailData || !emailData.to || !emailData.subject || !emailData.html) {
      throw new Error('Invalid email data: missing required fields');
    }

    if (!smtpConfig) {
      throw new Error('SMTP configuration is required');
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Prepare email
    const mailOptions = {
      from: `DriftPro <${smtpConfig.user}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text || emailData.html.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    
    // Log email to Firebase for tracking
    const firestoreDb = getDb();
    if (firestoreDb) {
      try {
        await addDoc(collection(firestoreDb, 'emailLogs'), {
          to: [emailData.to],
          subject: emailData.subject,
          content: emailData.html,
          type: emailData.type || 'system',
          metadata: {
            messageId: info.messageId,
            smtpHost: smtpConfig.host,
            smtpUser: smtpConfig.user
          },
          status: 'sent',
          sentAt: new Date().toISOString()
        });
      } catch (logError) {
        console.error('Error logging email to Firebase:', logError);
        // Don't fail the email sending if logging fails
      }
    }

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Log failed email to Firebase
    const firestoreDb = getDb();
    if (firestoreDb && emailData) {
      try {
        await addDoc(collection(firestoreDb, 'emailLogs'), {
          to: [emailData.to],
          subject: emailData.subject || '',
          content: emailData.html || '',
          type: emailData.type || 'system',
          metadata: {
            smtpHost: smtpConfig?.host,
            smtpUser: smtpConfig?.user
          },
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          sentAt: new Date().toISOString()
        });
      } catch (logError) {
        console.error('Error logging failed email to Firebase:', logError);
      }
    }
    
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 