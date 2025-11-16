import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, to, subject, html, text, cc, bcc } = body;

    if (!email || !password || !to || !subject || !html) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: email, password, to, subject, html'
      }, { status: 400 });
    }

    // Detect email provider from email address
    const emailDomain = email.split('@')[1]?.toLowerCase();
    
    let smtpConfig: any = {
      auth: {
        user: email,
        pass: password
      },
      tls: {
        rejectUnauthorized: false
      }
    };

    // Configure based on email provider
    if (emailDomain?.includes('outlook.com') || emailDomain?.includes('hotmail.com') || emailDomain?.includes('live.com')) {
      smtpConfig.host = 'smtp-mail.outlook.com';
      smtpConfig.port = 587;
      smtpConfig.secure = false; // Use STARTTLS
    } else if (emailDomain?.includes('gmail.com')) {
      smtpConfig.host = 'smtp.gmail.com';
      smtpConfig.port = 587;
      smtpConfig.secure = false; // Use STARTTLS
    } else if (emailDomain?.includes('office365.com') || emailDomain?.includes('microsoft.com')) {
      smtpConfig.host = 'smtp.office365.com';
      smtpConfig.port = 587;
      smtpConfig.secure = false; // Use STARTTLS
    } else {
      // Default to Outlook/Office365 settings
      smtpConfig.host = 'smtp-mail.outlook.com';
      smtpConfig.port = 587;
      smtpConfig.secure = false;
    }

    const transporter = nodemailer.createTransport(smtpConfig);

    // Verify connection first
    await transporter.verify();

    const recipients = Array.isArray(to) ? to : [to];
    const ccRecipients = cc ? (Array.isArray(cc) ? cc : [cc]) : undefined;
    const bccRecipients = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined;
    
    const mailOptions = {
      from: email,
      to: recipients.join(', '),
      cc: ccRecipients?.join(', '),
      bcc: bccRecipients?.join(', '),
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML if no text provided
    };

    const info = await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      messageId: info.messageId
    });
  } catch (error: any) {
    console.error('Error sending email via SMTP:', error);
    
    let errorMessage = 'Unknown error occurred';
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Please check your email and password.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection failed. Please check your SMTP settings.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

