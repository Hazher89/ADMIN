import { NextRequest, NextResponse } from 'next/server';
import * as nodemailer from 'nodemailer';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function POST(request: NextRequest) {
  let emailData: EmailData | null = null;
  
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
    } else {
      // New structure (from admin-email-service)
      emailData = requestData as EmailData;
    }

    if (!emailData || !emailData.to || !emailData.subject || !emailData.html) {
      throw new Error('Invalid email data: missing required fields');
    }

    // Email configuration - you should move these to environment variables
    const emailConfig = {
      senderName: 'DriftPro',
      senderEmail: 'noreply@driftpro.no',
      smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
      smtpPort: parseInt(process.env.SMTP_PORT || '587'),
      smtpUser: process.env.SMTP_USER || 'noreply@driftpro.no',
      smtpPass: process.env.SMTP_PASS || ''
    };

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: emailConfig.smtpPort,
      secure: false, // Use TLS
      auth: {
        user: emailConfig.smtpUser,
        pass: emailConfig.smtpPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Prepare email
    const mailOptions = {
      from: `${emailConfig.senderName} <${emailConfig.senderEmail}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text || emailData.html.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    
    // Log email to Firebase for tracking
    if (db) {
      await addDoc(collection(db, 'emailLogs'), {
        to: [emailData.to],
        subject: emailData.subject,
        content: emailData.html,
        eventType: 'admin_setup',
        metadata: {
          messageId: info.messageId,
          adminSetup: true
        },
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
          to: [emailData.to],
          subject: emailData.subject || '',
          content: emailData.html || '',
          eventType: 'admin_setup',
          metadata: {
            adminSetup: true
          },
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