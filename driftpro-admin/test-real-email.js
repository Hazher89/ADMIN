const nodemailer = require('nodemailer');

// Office 365 SMTP settings
const transporter = nodemailer.createTransporter({
  host: 'smtp.office365.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'driftpro@mavilogistikk.no', // Your Office 365 email
    pass: 'YourOffice365Password' // Your Office 365 password
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function sendTestEmail() {
  try {
    console.log('Testing Office 365 connection...');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ Connection verified successfully!');
    
    // Send test email
    const info = await transporter.sendMail({
      from: 'DriftPro Test <driftpro@mavilogistikk.no>',
      to: 'test@example.com', // Change this to your test email
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
                <li><strong>SMTP Server:</strong> smtp.office365.com</li>
                <li><strong>Port:</strong> 587</li>
                <li><strong>E-postadresse:</strong> driftpro@mavilogistikk.no</li>
                <li><strong>Sikkerhet:</strong> STARTTLS</li>
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
        - SMTP Server: smtp.office365.com
        - Port: 587
        - E-postadresse: driftpro@mavilogistikk.no
        - Sikkerhet: STARTTLS
        
        Neste steg:
        - Velkommen-e-poster vil bli sendt fra denne adressen
        - Glemt passord-e-poster vil bli sendt fra denne adressen
        - Systemvarsler vil bli sendt fra denne adressen
        - Alle DriftPro-e-poster vil nå fungere
        
        Dette er en automatisk test-e-post fra DriftPro-systemet.
        
        © 2024 DriftPro - Alle rettigheter forbeholdt
      `
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. Check email and password.');
    } else if (error.code === 'ECONNECTION') {
      console.error('Connection failed. Check SMTP server and port.');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('Connection timeout. Check network and firewall.');
    }
  }
}

sendTestEmail();

