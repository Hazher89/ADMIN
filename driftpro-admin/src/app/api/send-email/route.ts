import { NextRequest, NextResponse } from 'next/server';
import * as nodemailer from 'nodemailer';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface EmailData {
  to: string | string[];
  subject: string;
  body: string;
  metadata?: Record<string, unknown>;
}

interface EmailConfig {
  senderName: string;
  senderEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
}

export async function POST(request: NextRequest) {
  let emailData: EmailData | null = null;
  
  try {
    const requestData = await request.json();
    emailData = requestData.emailData as EmailData;
    const config = requestData.config as EmailConfig;

    if (!emailData) {
      throw new Error('emailData is null');
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: false, // Use TLS
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Prepare email
    const mailOptions = {
      from: `${config.senderName} <${config.senderEmail}>`,
      to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
      subject: emailData.subject,
      html: emailData.body
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    
    // Log email to Firebase for tracking
    if (db) {
      await addDoc(collection(db, 'emailLogs'), {
        to: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
        subject: emailData.subject,
        content: emailData.body,
        eventType: emailData.metadata?.eventType || 'system_maintenance',
        metadata: emailData.metadata || {},
        status: 'sent',
        sentAt: new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Log failed email to Firebase
    try {
      if (db && emailData) {
        await addDoc(collection(db, 'emailLogs'), {
          to: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
          subject: emailData.subject || '',
          content: emailData.body || '',
          eventType: emailData.metadata?.eventType || 'system_maintenance',
          metadata: emailData.metadata || {},
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          sentAt: new Date().toISOString()
        });
      }
    } catch (logError) {
      console.error('Error logging failed email:', logError);
    }
    
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 