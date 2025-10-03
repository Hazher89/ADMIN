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

async function testDomeneshopMX() {
  try {
    console.log('🧪 Testing Domeneshop with MX host configuration...');
    
    // Try different SMTP configurations
    const configs = [
      {
        name: 'Domeneshop SMTP (Port 587)',
        config: {
          host: 'smtp.domeneshop.no',
          port: 587,
          user: 'driftpro2',
          pass: 'HazhaGada89!',
          secure: false
        }
      },
      {
        name: 'Domeneshop SMTP (Port 465)',
        config: {
          host: 'smtp.domeneshop.no',
          port: 465,
          user: 'driftpro2',
          pass: 'HazhaGada89!',
          secure: true
        }
      },
      {
        name: 'Domeneshop SMTP (Port 25)',
        config: {
          host: 'smtp.domeneshop.no',
          port: 25,
          user: 'driftpro2',
          pass: 'HazhaGada89!',
          secure: false
        }
      }
    ];
    
    for (const { name, config } of configs) {
      console.log(`\n🔧 Testing: ${name}`);
      console.log('📧 Config:', {
        host: config.host,
        port: config.port,
        user: config.user,
        secure: config.secure
      });
      
      try {
        // Create transporter
        const transporter = nodemailer.createTransport(config);
        
        // Verify connection
        console.log('🔍 Verifying SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP connection verified successfully');
        
        // Test email
        const testEmail = {
          from: '"DriftPro System" <noreplay@driftpro.no>',
          to: 'baxigshti@hotmail.de',
          subject: `Test Email - ${name}`,
          html: `
            <h1>Test Email</h1>
            <p>Testing ${name} configuration.</p>
            <p>Time: ${new Date().toISOString()}</p>
          `,
          text: `Testing ${name} configuration.`
        };
        
        console.log('📤 Sending test email...');
        const result = await transporter.sendMail(testEmail);
        console.log('✅ Email sent successfully!');
        console.log('📧 Message ID:', result.messageId);
        
        // Log success to Firestore
        const emailLog = {
          to: [testEmail.to],
          subject: testEmail.subject,
          content: testEmail.html,
          type: 'test_domeneshop_mx',
          status: 'sent',
          sentAt: serverTimestamp(),
          messageId: result.messageId,
          metadata: {
            test: true,
            config: name,
            timestamp: new Date().toISOString()
          }
        };
        
        await addDoc(collection(db, 'emailLogs'), emailLog);
        console.log('✅ Email logged to Firestore');
        console.log(`🎉 ${name} WORKS!`);
        
        return; // Stop testing if one works
        
      } catch (error) {
        console.log(`❌ ${name} failed:`, error.message);
        
        // Log error to Firestore
        const errorLog = {
          to: ['baxigshti@hotmail.de'],
          subject: `${name} Test Failed`,
          content: `${name} test failed`,
          type: 'test_domeneshop_mx',
          status: 'failed',
          sentAt: serverTimestamp(),
          error: error.message,
          metadata: {
            test: true,
            config: name,
            timestamp: new Date().toISOString(),
            errorCode: error.code
          }
        };
        
        await addDoc(collection(db, 'emailLogs'), errorLog);
      }
    }
    
    console.log('\n❌ All Domeneshop configurations failed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test
testDomeneshopMX(); 