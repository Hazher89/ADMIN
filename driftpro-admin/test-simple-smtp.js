const nodemailer = require('nodemailer');

async function testSimpleSMTP() {
  console.log('🔍 Testing with simple SMTP configuration...\n');
  
  const email = 'driftpro@mavilogistikk.no';
  const password = 'HazGada1989';
  
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password: ${password.replace(/./g, '*')}\n`);
  
  // Simple, basic configuration
  const transporter = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false, // STARTTLS
    auth: {
      user: email,
      pass: password
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Testing basic connection...');
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
                <li><strong>SMTP Server:</strong> smtp-mail.outlook.com</li>
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
        - SMTP Server: smtp-mail.outlook.com
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
    console.log(`📧 Message ID: ${info.messageId}\n`);
    
    console.log('🎉 SUCCESS! SMTP configuration works!');
    console.log('🚀 You can now use this in DriftPro:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password.replace(/./g, '*')}`);
    console.log('   Host: smtp-mail.outlook.com');
    console.log('   Port: 587\n');
    
  } catch (error) {
    console.log(`❌ Error: ${error.code || 'Unknown'}`);
    console.log(`   Message: ${error.message}\n`);
    
    if (error.code === 'EAUTH') {
      console.log('🔐 Authentication failed:');
      console.log('   - Check email address');
      console.log('   - Check password');
      console.log('   - Make sure SMTP AUTH is enabled');
    } else if (error.code === 'ECONNECTION') {
      console.log('🌐 Connection failed:');
      console.log('   - Check network connection');
      console.log('   - Check firewall settings');
      console.log('   - Try different network (mobile hotspot)');
    } else if (error.code === 'ESOCKET') {
      console.log('🔌 Socket error:');
      console.log('   - Network interruption');
      console.log('   - Firewall blocking');
      console.log('   - Try different network');
    } else if (error.code === 'EPROTOCOL') {
      console.log('📡 Protocol error:');
      console.log('   - SMTP protocol mismatch');
      console.log('   - Try different port or host');
      console.log('   - Check TLS settings');
    }
    
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Try from different network (mobile hotspot)');
    console.log('   2. Check firewall/antivirus settings');
    console.log('   3. Convert to shared mailbox');
    console.log('   4. Contact IT administrator');
  }
}

// Run the test
testSimpleSMTP();
