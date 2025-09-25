// Simple test to verify nodemailer is working
console.log('Testing nodemailer...');

try {
  const nodemailer = require('nodemailer');
  console.log('✅ Nodemailer loaded successfully');
  console.log('Available methods:', Object.keys(nodemailer));
  
  // Test creating transporter
  const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
      user: 'test@example.com',
      pass: 'testpassword'
    }
  });
  
  console.log('✅ Transporter created successfully');
  console.log('Transporter methods:', Object.keys(transporter));
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}
