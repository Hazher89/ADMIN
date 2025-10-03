const nodemailer = require('nodemailer');

async function testAuthMethods() {
  console.log('🔍 Testing different authentication methods...\n');
  
  const email = 'skanner@mavilogistikk.no';
  const password = 'HazGada89';
  
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password: ${password.replace(/./g, '*')}\n`);
  
  // Test different authentication configurations
  const configs = [
    {
      name: 'Basic Auth (standard)',
      auth: {
        user: email,
        pass: password
      }
    },
    {
      name: 'Basic Auth with full email',
      auth: {
        user: `${email}`,
        pass: password
      }
    },
    {
      name: 'Basic Auth with domain',
      auth: {
        user: `skanner@mavilogistikk.no`,
        pass: password
      }
    }
  ];
  
  for (const config of configs) {
    console.log(`🔌 Testing ${config.name}...`);
    
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: config.auth,
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      });

      await transporter.verify();
      console.log(`✅ ${config.name} - Connection verified successfully!\n`);
      
      // Try to send email
      console.log(`📤 Sending test email with ${config.name}...`);
      const info = await transporter.sendMail({
        from: `DriftPro Test <${email}>`,
        to: email,
        subject: 'DriftPro - E-posttest',
        html: `<h1>Test fra ${email}</h1><p>Dette fungerer med ${config.name}!</p>`,
        text: `Test fra ${email} - Dette fungerer med ${config.name}!`
      });
      
      console.log(`✅ Email sent successfully with ${config.name}!`);
      console.log(`📧 Message ID: ${info.messageId}\n`);
      
      // If we get here, this config works!
      console.log(`🎉 SUCCESS! Use this configuration:`);
      console.log(`   Host: smtp-mail.outlook.com`);
      console.log(`   Port: 587`);
      console.log(`   Secure: false`);
      console.log(`   Auth: ${JSON.stringify(config.auth)}\n`);
      
      return; // Exit on first success
      
    } catch (error) {
      console.log(`❌ ${config.name} - ${error.code}: ${error.message}\n`);
    }
  }
  
  console.log('❌ All authentication methods failed');
  console.log('\n💡 Possible solutions:');
  console.log('   1. The account might need App Password (if 2FA is enabled)');
  console.log('   2. The account might need SMTP AUTH enabled in Office 365');
  console.log('   3. The account might be locked by organization policy');
  console.log('   4. Try using a personal Outlook account instead');
}

// Run the test
testAuthMethods();





