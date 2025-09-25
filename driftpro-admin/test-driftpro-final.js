const nodemailer = require('nodemailer');

async function testDriftproFinal() {
  console.log('🔍 Testing driftpro@mavilogistikk.no...\n');
  
  const email = 'driftpro@mavilogistikk.no';
  const password = 'HazGada89';
  
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password: ${password.replace(/./g, '*')}\n`);
  
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        user: email,
        pass: password
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000
    });

    console.log('🔌 Testing connection...');
    await transporter.verify();
    console.log('✅ Connection verified successfully!\n');
    
    console.log('📤 Sending test email...');
    const info = await transporter.sendMail({
      from: `DriftPro Test <${email}>`,
      to: email,
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
                <li><strong>E-postadresse:</strong> ${email}</li>
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
        - E-postadresse: ${email}
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
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📬 Response: ${info.response}\n`);
    
    console.log('🎉 Office 365 connection test completed successfully!');
    console.log('💡 You can now use these credentials in the DriftPro admin panel.');
    
  } catch (error) {
    console.error('❌ Error testing Office 365 connection:');
    console.error(`   Code: ${error.code}`);
    console.error(`   Message: ${error.message}\n`);
    
    if (error.code === 'EAUTH') {
      console.error('🔐 Authentication failed!');
      console.error('   - Check your email address');
      console.error('   - Check your password');
      console.error('   - Make sure you have SMTP enabled in Office 365');
      console.error('   - Try using an App Password if 2FA is enabled\n');
    } else if (error.code === 'ECONNECTION') {
      console.error('🌐 Connection failed!');
      console.error('   - Check your internet connection');
      console.error('   - Check if smtp.office365.com is accessible');
      console.error('   - Check firewall settings\n');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('⏰ Connection timeout!');
      console.error('   - Check your internet connection');
      console.error('   - Check firewall settings');
      console.error('   - Try again in a few minutes\n');
    }
    
    console.log('💡 Troubleshooting tips:');
    console.log('   1. Make sure you have the correct Office 365 email and password');
    console.log('   2. Enable SMTP authentication in Office 365 admin center');
    console.log('   3. If you have 2FA enabled, create an App Password');
    console.log('   4. Check that your Office 365 account has mail sending permissions');
    
    process.exit(1);
  }
}

// Run the test
testDriftproFinal();
