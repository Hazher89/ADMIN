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

async function testDomeneshopOld() {
  try {
    console.log('🧪 Testing OLD Domeneshop configuration...');
    
    // Old Domeneshop SMTP configuration (that worked before)
    const smtpConfig = {
      host: 'smtp.domeneshop.no',
      port: 587,
      user: 'driftpro2',
      pass: 'HazhaGada89!',
      secure: false
    };
    
    console.log('📧 Old SMTP Config:', {
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
    
    // Test email
    const testEmail = {
      from: '"DriftPro System" <driftpro2@domeneshop.no>',
      to: 'baxigshti@hotmail.de',
      subject: 'Test Email - Old Domeneshop Config',
      html: `
        <h1>Test Email</h1>
        <p>Testing if old Domeneshop configuration still works.</p>
        <p>Time: ${new Date().toISOString()}</p>
      `,
      text: 'Testing if old Domeneshop configuration still works.'
    };
    
    console.log('📤 Sending test email...');
    const result = await transporter.sendMail(testEmail);
    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', result.messageId);
    
    // Log to Firestore
    console.log('📝 Logging to Firestore...');
    const emailLog = {
      to: [testEmail.to],
      subject: testEmail.subject,
      content: testEmail.html,
      type: 'test_domeneshop_old',
      status: 'sent',
      sentAt: serverTimestamp(),
      messageId: result.messageId,
      metadata: {
        test: true,
        config: 'old_domeneshop',
        timestamp: new Date().toISOString()
      }
    };
    
    await addDoc(collection(db, 'emailLogs'), emailLog);
    console.log('✅ Email logged to Firestore');
    console.log('🎉 OLD Domeneshop configuration still works!');
    
  } catch (error) {
    console.error('❌ Old Domeneshop test failed:', error);
    
    // Log error to Firestore
    try {
      const errorLog = {
        to: ['baxigshti@hotmail.de'],
        subject: 'Old Domeneshop Test Failed',
        content: 'Old Domeneshop test failed',
        type: 'test_domeneshop_old',
        status: 'failed',
        sentAt: serverTimestamp(),
        error: error.message,
        metadata: {
          test: true,
          config: 'old_domeneshop',
          timestamp: new Date().toISOString(),
          errorCode: error.code
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
testDomeneshopOld(); 