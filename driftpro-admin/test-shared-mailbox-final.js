const nodemailer = require('nodemailer');

async function testSharedMailboxFinal() {
  console.log('🔍 Testing Shared Mailbox configuration...\n');
  
  const email = 'driftpro@mavilogistikk.no';
  const password = 'HazGada1989';
  
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password: ${password.replace(/./g, '*')}\n`);
  
  // Simple configuration optimized for shared mailboxes
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
    },
    // Shared mailbox specific settings
    connectionTimeout: 30000,
    greetingTimeout: 20000,
    socketTimeout: 30000
  });

  try {
    console.log('🔌 Testing Shared Mailbox connection...');
    await transporter.verify();
    console.log('✅ Shared Mailbox connection verified successfully!\n');
    
    console.log('📤 Sending test email...');
    const info = await transporter.sendMail({
      from: `DriftPro System <${email}>`,
      to: email,
      subject: 'DriftPro - Shared Mailbox Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 2rem;">🎉 DriftPro</h1>
            <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">Shared Mailbox Test Vellykket!</p>
          </div>
          
          <div style="padding: 2rem; background: white;">
            <h2 style="color: #333; margin-top: 0;">✅ Shared Mailbox fungerer!</h2>
            <p style="color: #666; line-height: 1.6;">
              Din Shared Mailbox er nå aktivert og fungerer perfekt med DriftPro!
            </p>
            
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h3 style="color: #333; margin-top: 0;">📧 Konfigurasjonsdetaljer:</h3>
              <ul style="color: #666; margin: 0;">
                <li><strong>Type:</strong> Shared Mailbox</li>
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
            
            <div style="background: #fff3cd; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h3 style="color: #856404; margin-top: 0;">💡 Shared Mailbox Fordeler:</h3>
              <ul style="color: #856404; margin: 0;">
                <li>Færre sikkerhetspolicyer</li>
                <li>SMTP AUTH aktivert automatisk</li>
                <li>Bypasser Security defaults</li>
                <li>Mer stabil e-postfunksjonalitet</li>
              </ul>
            </div>
            
            <p style="color: #666; font-size: 0.9rem; margin-bottom: 0;">
              Dette er en automatisk test-e-post fra DriftPro Shared Mailbox-systemet.
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 1rem; text-align: center; color: #666; font-size: 0.8rem;">
            <p style="margin: 0;">© 2024 DriftPro - Alle rettigheter forbeholdt</p>
          </div>
        </div>
      `,
      text: `
        DriftPro - Shared Mailbox Test
        
        ✅ Shared Mailbox fungerer!
        
        Din Shared Mailbox er nå aktivert og fungerer perfekt med DriftPro!
        
        Konfigurasjonsdetaljer:
        - Type: Shared Mailbox
        - SMTP Server: smtp-mail.outlook.com
        - Port: 587
        - E-postadresse: ${email}
        - Sikkerhet: STARTTLS
        
        Neste steg:
        - Velkommen-e-poster vil bli sendt fra denne adressen
        - Glemt passord-e-poster vil bli sendt fra denne adressen
        - Systemvarsler vil bli sendt fra denne adressen
        - Alle DriftPro-e-poster vil nå fungere
        
        Shared Mailbox Fordeler:
        - Færre sikkerhetspolicyer
        - SMTP AUTH aktivert automatisk
        - Bypasser Security defaults
        - Mer stabil e-postfunksjonalitet
        
        Dette er en automatisk test-e-post fra DriftPro Shared Mailbox-systemet.
        
        © 2024 DriftPro - Alle rettigheter forbeholdt
      `
    });
    
    console.log('✅ Email sent successfully!');
    console.log(`📧 Message ID: ${info.messageId}\n`);
    
    console.log('🎉 SUCCESS! Shared Mailbox configuration works!');
    console.log('🚀 You can now use this in DriftPro:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password.replace(/./g, '*')}`);
    console.log('   Host: smtp-mail.outlook.com');
    console.log('   Port: 587');
    console.log('   Type: Shared Mailbox\n');
    
  } catch (error) {
    console.log(`❌ Error: ${error.code || 'Unknown'}`);
    console.log(`   Message: ${error.message}\n`);
    
    if (error.code === 'EAUTH') {
      console.log('🔐 Authentication failed:');
      console.log('   - Check email address');
      console.log('   - Check password');
      console.log('   - Make sure Shared Mailbox is properly configured');
      console.log('   - Check that SMTP AUTH is enabled for Shared Mailbox');
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
    }
    
    console.log('\n💡 Shared Mailbox troubleshooting:');
    console.log('   1. Verify Shared Mailbox conversion is complete');
    console.log('   2. Check SMTP AUTH is enabled for Shared Mailbox');
    console.log('   3. Try from different network (mobile hotspot)');
    console.log('   4. Check firewall/antivirus settings');
    console.log('   5. Contact IT administrator about Shared Mailbox settings');
  }
}

// Run the test
testSharedMailboxFinal();
