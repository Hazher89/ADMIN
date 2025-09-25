const nodemailer = require('nodemailer');

async function testOutlookWeb() {
  console.log('🔍 Testing with Outlook web settings...\n');
  
  const email = 'skanner@mavilogistikk.no';
  const password = 'HazGada1989!';
  
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password: ${password.replace(/./g, '*')}\n`);
  
  // Test different Outlook configurations that work for web
  const configs = [
    {
      name: 'Outlook Web (smtp-mail.outlook.com:587)',
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      auth: {
        user: email,
        pass: password
      }
    },
    {
      name: 'Outlook Web (smtp-mail.outlook.com:25)',
      host: 'smtp-mail.outlook.com',
      port: 25,
      secure: false,
      auth: {
        user: email,
        pass: password
      }
    },
    {
      name: 'Outlook Web (smtp-mail.outlook.com:2525)',
      host: 'smtp-mail.outlook.com',
      port: 2525,
      secure: false,
      auth: {
        user: email,
        pass: password
      }
    },
    {
      name: 'Outlook Web (smtp-mail.outlook.com:465)',
      host: 'smtp-mail.outlook.com',
      port: 465,
      secure: true,
      auth: {
        user: email,
        pass: password
      }
    }
  ];
  
  for (const config of configs) {
    console.log(`🔌 Testing ${config.name}...`);
    
    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        debug: true, // Enable debug to see what's happening
        logger: true
      });

      console.log('   Verifying connection...');
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
      console.log(`   Host: ${config.host}`);
      console.log(`   Port: ${config.port}`);
      console.log(`   Secure: ${config.secure}`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password.replace(/./g, '*')}\n`);
      
      return; // Exit on first success
      
    } catch (error) {
      console.log(`❌ ${config.name} - ${error.code}: ${error.message}`);
      if (error.response) {
        console.log(`   Response: ${error.response}`);
      }
      console.log('');
    }
  }
  
  console.log('❌ All Outlook web configurations failed');
  console.log('\n💡 Possible solutions:');
  console.log('   1. The account might need App Password (if 2FA is enabled)');
  console.log('   2. The account might need SMTP AUTH enabled in Office 365');
  console.log('   3. The account might be locked by organization policy');
  console.log('   4. Try using a personal Outlook account instead');
  console.log('   5. The account might need OAuth2 authentication instead of basic auth');
}

// Run the test
testOutlookWeb();
