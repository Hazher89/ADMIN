const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');
const nodemailer = require('nodemailer');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCyE4S4B5q2JLdtaTtr8kVVvg8y-3Zm7ZE",
  authDomain: "driftpro-40ccd.firebaseapp.com",
  projectId: "driftpro-40ccd",
  storageBucket: "driftpro-40ccd.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testGmailSMTP() {
  try {
    console.log('🧪 Testing Gmail SMTP...');
    
    // Gmail SMTP configuration
    const smtpConfig = {
      service: 'gmail',
      auth: {
        user: 'driftpro.system@gmail.com', // You'll need to create this Gmail account
        pass: 'your-app-password' // You'll need to generate an app password
      }
    };
    
    console.log('📧 Gmail SMTP Config:', {
      service: smtpConfig.service,
      user: smtpConfig.auth.user
    });
    
    // Create transporter
    console.log('🔧 Creating Gmail transporter...');
    const transporter = nodemailer.createTransport(smtpConfig);
    
    // Verify connection
    console.log('🔍 Verifying Gmail SMTP connection...');
    await transporter.verify();
    console.log('✅ Gmail SMTP connection verified successfully');
    
    // Test email
    const testEmail = {
      from: '"DriftPro System" <driftpro.system@gmail.com>',
      to: 'baxigshti@hotmail.de',
      subject: 'Test Email from DriftPro (Gmail)',
      html: `
        <h1>Test Email from Gmail SMTP</h1>
        <p>This is a test email from DriftPro using Gmail SMTP.</p>
        <p>Time: ${new Date().toISOString()}</p>
      `,
      text: 'This is a test email from DriftPro using Gmail SMTP.'
    };
    
    console.log('📤 Sending test email via Gmail...');
    const result = await transporter.sendMail(testEmail);
    console.log('✅ Email sent successfully via Gmail!');
    console.log('📧 Message ID:', result.messageId);
    
    // Log to Firestore
    console.log('📝 Logging to Firestore...');
    const emailLog = {
      to: [testEmail.to],
      subject: testEmail.subject,
      content: testEmail.html,
      type: 'test_gmail',
      status: 'sent',
      sentAt: serverTimestamp(),
      messageId: result.messageId,
      metadata: {
        test: true,
        smtpProvider: 'gmail',
        timestamp: new Date().toISOString()
      }
    };
    
    await addDoc(collection(db, 'emailLogs'), emailLog);
    console.log('✅ Email logged to Firestore');
    
  } catch (error) {
    console.error('❌ Gmail email test failed:', error);
    
    // Log error to Firestore
    try {
      const errorLog = {
        to: ['baxigshti@hotmail.de'],
        subject: 'Gmail Test Email Failed',
        content: 'Gmail test email failed to send',
        type: 'test_gmail',
        status: 'failed',
        sentAt: serverTimestamp(),
        error: error.message,
        metadata: {
          test: true,
          smtpProvider: 'gmail',
          timestamp: new Date().toISOString(),
          errorCode: error.code,
          errorStack: error.stack
        }
      };
      
      await addDoc(collection(db, 'emailLogs'), errorLog);
      console.log('✅ Error logged to Firestore');
    } catch (logError) {
      console.error('❌ Failed to log error to Firestore:', logError);
    }
  }
}

// Run test
testGmailSMTP(); 