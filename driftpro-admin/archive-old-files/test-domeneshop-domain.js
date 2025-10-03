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

async function testDomeneshopDomain() {
  try {
    console.log('🧪 Testing Domeneshop domain email...');
    
    // Test SMTP configuration
    const smtpConfig = {
      host: 'smtp.domeneshop.no',
      port: 587,
      user: 'noreplay@driftpro.no',
      pass: 'HazhaGada89!',
      secure: false,
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000
    };
    
    console.log('📧 SMTP Config:', {
      host: smtpConfig.host,
      port: smtpConfig.port,
      user: smtpConfig.user,
      secure: smtpConfig.secure
    });
    
    // Create transporter
    console.log('🔧 Creating transporter...');
    const transporter = nodemailer.createTransport(smtpConfig);
    
    // Verify connection
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    
    // Test email to Domeneshop domain
    const testEmail = {
      from: '"DriftPro System" <noreplay@driftpro.no>',
      to: 'noreplay@driftpro.no', // Send to same domain
      subject: 'Test Email from DriftPro (Domeneshop Domain)',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from DriftPro to verify Domeneshop domain SMTP.</p>
        <p>Time: ${new Date().toISOString()}</p>
      `,
      text: 'This is a test email from DriftPro to verify Domeneshop domain SMTP.'
    };
    
    console.log('📤 Sending test email to Domeneshop domain...');
    const result = await transporter.sendMail(testEmail);
    console.log('✅ Email sent successfully to Domeneshop domain!');
    console.log('📧 Message ID:', result.messageId);
    
    // Log to Firestore
    console.log('📝 Logging to Firestore...');
    const emailLog = {
      to: [testEmail.to],
      subject: testEmail.subject,
      content: testEmail.html,
      type: 'test_domeneshop_domain',
      status: 'sent',
      sentAt: serverTimestamp(),
      messageId: result.messageId,
      metadata: {
        test: true,
        smtpProvider: 'domeneshop_domain',
        timestamp: new Date().toISOString()
      }
    };
    
    await addDoc(collection(db, 'emailLogs'), emailLog);
    console.log('✅ Email logged to Firestore');
    
  } catch (error) {
    console.error('❌ Domeneshop domain email test failed:', error);
    
    // Log error to Firestore
    try {
      const errorLog = {
        to: ['noreplay@driftpro.no'],
        subject: 'Domeneshop Domain Test Email Failed',
        content: 'Domeneshop domain test email failed to send',
        type: 'test_domeneshop_domain',
        status: 'failed',
        sentAt: serverTimestamp(),
        error: error.message,
        metadata: {
          test: true,
          smtpProvider: 'domeneshop_domain',
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
testDomeneshopDomain(); 