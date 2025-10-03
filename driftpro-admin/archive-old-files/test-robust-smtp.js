const nodemailer = require('nodemailer');

async function testRobustSMTP() {
  console.log('🔍 Testing with robust SMTP configuration...\n');
  
  const email = 'driftpro@mavilogistikk.no';
  const password = 'HazGada1989';
  
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password: ${password.replace(/./g, '*')}\n`);
  
  // More robust configuration to handle ECONNRESET
  const configs = [
    {
      name: 'Robust SMTP (smtp-mail.outlook.com:587)',
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      auth: {
        user: email,
        pass: password
      },
      // Enhanced TLS settings
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3',
        secureProtocol: 'TLSv1_2_method'
      },
      // Extended timeouts
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
      // Retry settings
      pool: true,
      maxConnections: 1,
      maxMessages: 1,
      // Keep connection alive
      keepAlive: true,
      keepAliveInitialDelay: 10000
    },
    {
      name: 'Alternative SMTP (smtp-mail.outlook.com:25)',
      host: 'smtp-mail.outlook.com',
      port: 25,
      secure: false,
      auth: {
        user: email,
        pass: password
      },
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
      pool: true,
      maxConnections: 1,
      maxMessages: 1,
      keepAlive: true,
      keepAliveInitialDelay: 10000
    },
    {
      name: 'Exchange Online (outlook.office365.com:587)',
      host: 'outlook.office365.com',
      port: 587,
      secure: false,
      auth: {
        user: email,
        pass: password
      },
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
      pool: true,
      maxConnections: 1,
      maxMessages: 1,
      keepAlive: true,
      keepAliveInitialDelay: 10000
    }
  ];
  
  for (const config of configs) {
    console.log(`🔌 Testing ${config.name}...`);
    
    try {
      const transporter = nodemailer.createTransport(config);

      console.log('   Verifying connection...');
      
      // Try multiple verification attempts
      let verified = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`   Attempt ${attempt}/3...`);
          await transporter.verify();
          verified = true;
          break;
        } catch (verifyError) {
          console.log(`   Attempt ${attempt} failed: ${verifyError.code}`);
          if (attempt < 3) {
            console.log('   Retrying in 2 seconds...');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      if (!verified) {
        throw new Error('Connection verification failed after 3 attempts');
      }
      
      console.log(`✅ ${config.name} - Connection verified successfully!\n`);
      
      // Try to send email with retry logic
      console.log(`📤 Sending test email with ${config.name}...`);
      
      let emailSent = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`   Sending attempt ${attempt}/3...`);
          
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
                    Din ${config.name} er nå aktivert og fungerer perfekt!
                  </p>
                  
                  <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                    <h3 style="color: #333; margin-top: 0;">📧 Konfigurasjonsdetaljer:</h3>
                    <ul style="color: #666; margin: 0;">
                      <li><strong>SMTP Server:</strong> ${config.host}</li>
                      <li><strong>Port:</strong> ${config.port}</li>
                      <li><strong>E-postadresse:</strong> ${email}</li>
                      <li><strong>Sikkerhet:</strong> ${config.secure ? 'SSL' : 'STARTTLS'}</li>
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
            
              Din ${config.name} er nå aktivert og fungerer perfekt!
            
              Konfigurasjonsdetaljer:
              - SMTP Server: ${config.host}
              - Port: ${config.port}
              - E-postadresse: ${email}
              - Sikkerhet: ${config.secure ? 'SSL' : 'STARTTLS'}
            
              Neste steg:
              - Velkommen-e-poster vil bli sendt fra denne adressen
              - Glemt passord-e-poster vil bli sendt fra denne adressen
              - Systemvarsler vil bli sendt fra denne adressen
              - Alle DriftPro-e-poster vil nå fungere
            
              Dette er en automatisk test-e-post fra DriftPro-systemet.
            
              © 2024 DriftPro - Alle rettigheter forbeholdt
            `
          });
          
          console.log(`✅ Email sent successfully with ${config.name}!`);
          console.log(`📧 Message ID: ${info.messageId}\n`);
          emailSent = true;
          break;
          
        } catch (sendError) {
          console.log(`   Send attempt ${attempt} failed: ${sendError.code}`);
          if (attempt < 3) {
            console.log('   Retrying in 3 seconds...');
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
      }
      
      if (!emailSent) {
        throw new Error('Email sending failed after 3 attempts');
      }
      
      // If we get here, this config works!
      console.log(`🎉 SUCCESS! Use this configuration:`);
      console.log(`   Host: ${config.host}`);
      console.log(`   Port: ${config.port}`);
      console.log(`   Secure: ${config.secure}`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password.replace(/./g, '*')}\n`);
      
      return; // Exit on first success
      
    } catch (error) {
      console.log(`❌ ${config.name} - ${error.code || 'Error'}: ${error.message}`);
      console.log('');
    }
  }
  
  console.log('❌ All robust SMTP configurations failed');
  console.log('\n💡 ECONNRESET troubleshooting:');
  console.log('   1. Check firewall settings');
  console.log('   2. Try from different network (mobile hotspot)');
  console.log('   3. Check antivirus software');
  console.log('   4. Try converting to shared mailbox');
  console.log('   5. Contact IT administrator about network restrictions');
}

// Run the test
testRobustSMTP();





