const nodemailer = require('nodemailer');

async function testOAuth2() {
  console.log('🔍 Testing with OAuth2 authentication...\n');
  
  const email = 'skanner@mavilogistikk.no';
  const password = 'HazGada1989!';
  
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password: ${password.replace(/./g, '*')}\n`);
  
  try {
    // Try OAuth2 authentication
    const transporter = nodemailer.createTransport({
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      auth: {
        type: 'OAuth2',
        user: email,
        clientId: 'your-client-id', // This would need to be configured
        clientSecret: 'your-client-secret', // This would need to be configured
        refreshToken: 'your-refresh-token', // This would need to be configured
        accessToken: 'your-access-token' // This would need to be configured
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000
    });

    console.log('🔌 Testing OAuth2 connection...');
    await transporter.verify();
    console.log('✅ OAuth2 connection verified successfully!\n');
    
  } catch (error) {
    console.log('❌ OAuth2 failed:', error.message);
    console.log('\n💡 OAuth2 requires app registration in Azure AD');
    console.log('   This is complex to set up for testing\n');
  }
  
  // Try with different authentication methods
  console.log('🔌 Testing with different auth methods...\n');
  
  const authMethods = [
    {
      name: 'Basic Auth (current)',
      auth: {
        user: email,
        pass: password
      }
    },
    {
      name: 'Basic Auth with domain',
      auth: {
        user: `mavilogistikk\\skanner`, // Windows domain format
        pass: password
      }
    },
    {
      name: 'Basic Auth with full domain',
      auth: {
        user: `skanner@mavilogistikk.no`,
        pass: password
      }
    }
  ];
  
  for (const method of authMethods) {
    console.log(`🔌 Testing ${method.name}...`);
    
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: method.auth,
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000
      });

      await transporter.verify();
      console.log(`✅ ${method.name} - Connection verified successfully!\n`);
      
      // Try to send email
      console.log(`📤 Sending test email with ${method.name}...`);
      const info = await transporter.sendMail({
        from: `DriftPro Test <${email}>`,
        to: email,
        subject: 'DriftPro - E-posttest',
        html: `<h1>Test fra ${email}</h1><p>Dette fungerer med ${method.name}!</p>`,
        text: `Test fra ${email} - Dette fungerer med ${method.name}!`
      });
      
      console.log(`✅ Email sent successfully with ${method.name}!`);
      console.log(`📧 Message ID: ${info.messageId}\n`);
      
      return; // Exit on first success
      
    } catch (error) {
      console.log(`❌ ${method.name} - ${error.code}: ${error.message}\n`);
    }
  }
  
  console.log('❌ All authentication methods failed');
  console.log('\n💡 The issue is likely:');
  console.log('   1. The account needs SMTP AUTH enabled in Office 365 admin center');
  console.log('   2. The account is locked by organization security policy');
  console.log('   3. The account needs App Password (if 2FA is enabled)');
  console.log('   4. Try using a personal Outlook account instead');
}

// Run the test
testOAuth2();

