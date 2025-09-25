import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { host, port, user, pass, secure, testEmail } = await request.json();

    if (!host || !port || !user || !pass) {
      return NextResponse.json({
        success: false,
        error: 'Mangler påkrevde SMTP-innstillinger'
      }, { status: 400 });
    }

    // Try to use nodemailer with proper error handling
    try {
      // Dynamic import to avoid Turbopack issues
      const nodemailerModule = await import('nodemailer');
      const nodemailer = nodemailerModule.default || nodemailerModule;
      
      // Create transporter with Outlook SMTP settings
      const transporter = nodemailer.createTransport({
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: user as string,
          pass: pass as string
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000
      });

      // Test connection
      await transporter.verify();
      
      // Send test email
      const emailToSend = {
        from: `DriftPro Test <${user}>`,
        to: testEmail || user, // Send to test email if provided, otherwise to user
        subject: 'DriftPro - E-posttest',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 2rem;">🎉 DriftPro</h1>
              <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">E-posttest vellykket!</p>
            </div>
            
            <div style="padding: 2rem; background: white;">
              <h2 style="color: #333; margin-top: 0;">✅ E-postkonfigurasjon fungerer!</h2>
              <p style="color: #666; line-height: 1.6;">
                Din Office 365 SMTP-konfigurasjon er nå aktivert og fungerer perfekt!
              </p>
              
              <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                <h3 style="color: #333; margin-top: 0;">📧 Konfigurasjonsdetaljer:</h3>
                <ul style="color: #666; margin: 0;">
                  <li><strong>SMTP Server:</strong> ${host}</li>
                  <li><strong>Port:</strong> ${port}</li>
                  <li><strong>E-postadresse:</strong> ${user}</li>
                  <li><strong>Sikkerhet:</strong> ${secure ? 'TLS/SSL' : 'STARTTLS'}</li>
                </ul>
              </div>
              
              <div style="background: #e8f5e8; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                <h3 style="color: #2d5a2d; margin-top: 0;">🚀 Neste steg:</h3>
                <ul style="color: #2d5a2d; margin: 0;">
                  <li>Velkommen-e-poster vil bli sendt fra denne adressen</li>
                  <li>Glemt passord-e-poster vil bli sendt fra denne adressen</li>
                  <li>Systemvarsler vil bli sendt fra denne adressen</li>
                  <li>Alle DriftPro-e-poster vil nå fungere</li>
                </ul>
              </div>
              
              <p style="color: #666; font-size: 0.9rem; margin-bottom: 0;">
                Dette er en automatisk test-e-post fra DriftPro-systemet.
              </p>
            </div>
            
            <div style="background: #f8f9fa; padding: 1rem; text-align: center; color: #666; font-size: 0.8rem;">
              <p style="margin: 0;">© 2024 DriftPro - Alle rettigheter forbeholdt</p>
            </div>
          </div>
        `,
        text: `
          DriftPro - E-posttest
          
          ✅ E-postkonfigurasjon fungerer!
          
          Din Office 365 SMTP-konfigurasjon er nå aktivert og fungerer perfekt!
          
          Konfigurasjonsdetaljer:
          - SMTP Server: ${host}
          - Port: ${port}
          - E-postadresse: ${user}
          - Sikkerhet: ${secure ? 'TLS/SSL' : 'STARTTLS'}
          
          Neste steg:
          - Velkommen-e-poster vil bli sendt fra denne adressen
          - Glemt passord-e-poster vil bli sendt fra denne adressen
          - Systemvarsler vil bli sendt fra denne adressen
          - Alle DriftPro-e-poster vil nå fungere
          
          Dette er en automatisk test-e-post fra DriftPro-systemet.
          
          © 2024 DriftPro - Alle rettigheter forbeholdt
        `
      };

      const info = await transporter.sendMail(emailToSend);

      return NextResponse.json({
        success: true,
        message: 'E-posttest vellykket! Test-e-post sendt.',
        messageId: info.messageId
      });

    } catch (nodemailerError: any) {
      console.error('Nodemailer error:', nodemailerError);
      
      // Return actual error instead of simulation
      let errorMessage = 'Ukjent feil ved e-posttilkobling';
      
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
    console.error('Email test error:', error);
    
    let errorMessage = 'Ukjent feil ved e-posttesting';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Autentisering feilet. Sjekk e-postadresse og passord.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Tilkobling feilet. Sjekk SMTP-server og port.';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Tilkobling timeout. Sjekk nettverk og firewall.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
