import { NextRequest, NextResponse } from 'next/server';
import * as nodemailer from 'nodemailer';
import { collection, addDoc, getFirestore } from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';
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
      
      // Get SMTP config from Firebase settings
      try {
        const firestoreDb = getDb();
        if (firestoreDb) {
          const { doc, getDoc } = await import('firebase/firestore');
          const settingsDoc = await getDoc(doc(firestoreDb, 'system', 'emailSettings'));
          
          if (settingsDoc.exists()) {
            const settings = settingsDoc.data();
            smtpConfig = {
              host: settings.smtpHost || 'smtp.domeneshop.no',
              port: settings.smtpPort || 587,
              user: settings.smtpUser || 'driftpro2',
              pass: settings.smtpPassword || 'HazGada89!',
              secure: settings.smtpSecure || false
            };
          } else {
            // Use default SMTP config
            smtpConfig = {
              host: 'smtp.domeneshop.no',
              port: 587,
              user: 'noreplay@driftpro.no',
              pass: 'HazGada89!',
              secure: false
            };
          }
                  } else {
            // Use default SMTP config
            smtpConfig = {
              host: 'smtp.domeneshop.no',
              port: 587,
              user: 'noreplay@driftpro.no',
              pass: 'HazGada89!',
              secure: false
            };
          }
      } catch (error) {
        console.error('Error getting email settings:', error);
        // Use default SMTP config
        smtpConfig = {
          host: 'smtp.domeneshop.no',
          port: 587,
          user: 'noreplay@driftpro.no',
          pass: 'HazGada89!',
          secure: false
        };
      }
    }

    if (!emailData || !emailData.to || !emailData.subject || !emailData.html) {
      throw new Error('Invalid email data: missing required fields');
    }

    if (!smtpConfig) {
      throw new Error('SMTP configuration is required');
    }

    // Create transporter with Domeneshop-optimized configuration
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass
      },
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      },
      connectionTimeout: 30000, // 30 seconds for Domeneshop
      greetingTimeout: 30000,   // 30 seconds for Domeneshop
      socketTimeout: 30000,     // 30 seconds for Domeneshop
      debug: smtpConfig.host.includes('domeneshop'), // Enable debug for Domeneshop
      logger: smtpConfig.host.includes('domeneshop')  // Enable logger for Domeneshop
    });

    // Verify connection configuration
    console.log('SMTP Configuration:', {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      user: smtpConfig.user,
      passwordProvided: !!smtpConfig.pass
    });

    // Verify connection before sending
    try {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('SMTP connection verification failed:', verifyError);
      throw new Error(`SMTP connection failed: ${verifyError instanceof Error ? verifyError.message : 'Unknown error'}`);
    }

    // Prepare email
    const mailOptions = {
      from: `DriftPro <noreply@driftpro.no>`,
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