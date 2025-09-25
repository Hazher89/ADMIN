import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, text, credentials } = await request.json();

    if (!to || !subject) {
      return NextResponse.json({
        success: false,
        error: 'Mangler påkrevde e-postdata'
      }, { status: 400 });
    }

    // Try to use nodemailer with proper error handling
    try {
      // Dynamic import to avoid Turbopack issues
      const nodemailerModule = await import('nodemailer');
      const nodemailer = nodemailerModule.default || nodemailerModule;
      
      // Use Outlook SMTP settings from credentials
      const transporter = nodemailer.createTransport({
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: credentials?.email || 'driftpro@mavilogistikk.no',
          pass: credentials?.password || 'YourOffice365Password'
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000
      });

      const mailOptions = {
        from: `DriftPro System <${credentials?.email || 'driftpro@mavilogistikk.no'}>`,
        to: to,
        subject: subject,
        html: html,
        text: text
      };

      const info = await transporter.sendMail(mailOptions);

      return NextResponse.json({
        success: true,
        message: 'E-post sendt',
        messageId: info.messageId
      });

    } catch (nodemailerError: any) {
      console.error('Nodemailer error:', nodemailerError);
      
      // Return actual error instead of simulation
      let errorMessage = 'Ukjent feil ved e-postsending';
      
      if (nodemailerError.code === 'EAUTH') {
        errorMessage = 'Autentisering feilet. Sjekk e-postadresse og passord.';
      } else if (nodemailerError.code === 'ECONNECTION') {
        errorMessage = 'Tilkobling feilet. Sjekk SMTP-server og port.';
      } else if (nodemailerError.code === 'ETIMEDOUT') {
        errorMessage = 'Tilkobling timeout. Sjekk nettverk og firewall.';
      } else if (nodemailerError.message) {
        errorMessage = nodemailerError.message;
      }
      
      return NextResponse.json({
        success: false,
        error: errorMessage
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Email send error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Ukjent feil ved e-postsending'
    }, { status: 500 });
  }
}
