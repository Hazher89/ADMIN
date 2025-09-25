const nodemailer = require('nodemailer');

async function testDriftproAccount() {
  console.log('🔍 Testing driftpro@mavilogistikk.no...\n');
  
  const email = 'driftpro@mavilogistikk.no';
  const password = 'HazGada89'; // Same password
  
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
      html: `<h1>Test fra ${email}</h1><p>Dette fungerer!</p>`,
      text: `Test fra ${email} - Dette fungerer!`
    });
    
    console.log('✅ Email sent successfully!');
    console.log(`📧 Message ID: ${info.messageId}`);
    
  } catch (error) {
    console.error('❌ Error:', error.code, error.message);
  }
}

testDriftproAccount();
