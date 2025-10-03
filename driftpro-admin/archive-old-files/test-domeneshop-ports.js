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

async function testDomeneshopPorts() {
  const configs = [
    {
      name: 'Port 587 (TLS)',
      config: {
        host: 'smtp.domeneshop.no',
        port: 587,
        user: 'noreplay@driftpro.no',
        pass: 'HazhaGada89!',
        secure: false,
        tls: { rejectUnauthorized: false }
      }
    },
    {
      name: 'Port 465 (SSL)',
      config: {
        host: 'smtp.domeneshop.no',
        port: 465,
        user: 'noreplay@driftpro.no',
        pass: 'HazhaGada89!',
        secure: true,
        tls: { rejectUnauthorized: false }
      }
    },
    {
      name: 'Port 25 (Standard)',
      config: {
        host: 'smtp.domeneshop.no',
        port: 25,
        user: 'noreplay@driftpro.no',
        pass: 'HazhaGada89!',
        secure: false,
        tls: { rejectUnauthorized: false }
      }
    },
    {
      name: 'Port 587 (No TLS)',
      config: {
        host: 'smtp.domeneshop.no',
        port: 587,
        user: 'noreplay@driftpro.no',
        pass: 'HazhaGada89!',
        secure: false,
        tls: false
      }
    }
  ];

  for (const testConfig of configs) {
    try {
      console.log(`\n🧪 Testing: ${testConfig.name}`);
      console.log('📧 Config:', {
        host: testConfig.config.host,
        port: testConfig.config.port,
        user: testConfig.config.user,
        secure: testConfig.config.secure
      });
      
      // Create transporter
      const transporter = nodemailer.createTransport(testConfig.config);
      
      // Verify connection
      console.log('🔍 Verifying connection...');
      await transporter.verify();
      console.log('✅ Connection verified successfully');
      
      // Test email
      const testEmail = {
        from: '"DriftPro System" <noreplay@driftpro.no>',
        to: 'baxigshti@hotmail.de',
        subject: `Test Email - ${testConfig.name}`,
        html: `
          <h1>Test Email</h1>
          <p>Testing ${testConfig.name} configuration.</p>
          <p>Time: ${new Date().toISOString()}</p>
        `,
        text: `Testing ${testConfig.name} configuration.`
      };
      
      console.log('📤 Sending test email...');
      const result = await transporter.sendMail(testEmail);
      console.log('✅ Email sent successfully!');
      console.log('📧 Message ID:', result.messageId);
      
      // Log success
      await addDoc(collection(db, 'emailLogs'), {
        to: [testEmail.to],
        subject: testEmail.subject,
        content: testEmail.html,
        type: 'test_domeneshop_port',
        status: 'sent',
        sentAt: serverTimestamp(),
        messageId: result.messageId,
        metadata: {
          test: true,
          config: testConfig.name,
          timestamp: new Date().toISOString()
        }
      });
      
      console.log('🎉 SUCCESS! This configuration works!');
      return testConfig.config; // Return working config
      
    } catch (error) {
      console.log('❌ Failed:', error.message);
      
      // Log error
      await addDoc(collection(db, 'emailLogs'), {
        to: ['baxigshti@hotmail.de'],
        subject: `Test Failed - ${testConfig.name}`,
        content: 'Test failed',
        type: 'test_domeneshop_port',
        status: 'failed',
        sentAt: serverTimestamp(),
        error: error.message,
        metadata: {
          test: true,
          config: testConfig.name,
          timestamp: new Date().toISOString(),
          errorCode: error.code
        }
      });
    }
  }
  
  console.log('\n❌ All Domeneshop configurations failed');
  return null;
}

// Run tests
testDomeneshopPorts(); 