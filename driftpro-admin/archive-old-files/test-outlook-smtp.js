const nodemailer = require('nodemailer');

async function testOutlookSMTP() {
  console.log('🔍 Testing with Outlook SMTP settings...\n');
  
  const email = 'driftpro@mavilogistikk.no';
  const password = 'HazGada89';
  
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password: ${password.replace(/./g, '*')}\n`);
  
  // Test different SMTP configurations
  const configs = [
    {
      name: 'Office 365 (smtp.office365.com:587)',
      host: 'smtp.office365.com',
      port: 587,
      secure: false
    },
    {
      name: 'Office 365 (smtp.office365.com:465)',
      host: 'smtp.office365.com',
      port: 465,
      secure: true
    },
    {
      name: 'Outlook (smtp-mail.outlook.com:587)',
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false
    },
    {
      name: 'Outlook (smtp-mail.outlook.com:465)',
      host: 'smtp-mail.outlook.com',
      port: 465,
      secure: true
    }
  ];
  
  for (const config of configs) {
    console.log(`🔌 Testing ${config.name}...`);
    
    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
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
      console.log(`❌ ${config.name} - ${error.code}: ${error.message}\n`);
    }
  }
  
  console.log('❌ All SMTP configurations failed');
}

// Run the test
testOutlookSMTP();





