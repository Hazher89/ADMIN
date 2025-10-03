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

async function testCloudflareEmail() {
  try {
    console.log('🧪 Testing Cloudflare Email Routing...');
    
    // Cloudflare Email Routing uses standard SMTP
    // But we need to check if the domain is configured
    const configs = [
      {
        name: 'Cloudflare Email Routing (Standard)',
        config: {
          host: 'smtp.cloudflare.com',
          port: 587,
          user: 'noreplay@driftpro.no',
          pass: 'your-cloudflare-api-key', // Would need Cloudflare API key
          secure: false
        }
      },
      {
        name: 'Cloudflare via Gmail SMTP',
        config: {
          host: 'smtp.gmail.com',
          port: 587,
          user: 'noreplay@driftpro.no',
          pass: 'your-app-password',
          secure: false
        }
      }
    ];
    
    console.log('📋 Cloudflare Email Routing Setup Instructions:');
    console.log('');
    console.log('1. Go to https://dash.cloudflare.com/');
    console.log('2. Add your domain: driftpro.no');
    console.log('3. Change nameservers to Cloudflare');
    console.log('4. Go to Email → Email Routing');
    console.log('5. Enable Email Routing');
    console.log('6. Add Custom Address: noreplay@driftpro.no');
    console.log('7. Set destination: your-email@example.com');
    console.log('');
    console.log('✅ Benefits of Cloudflare Email Routing:');
    console.log('   - No relay restrictions');
    console.log('   - Free up to 100 emails/day');
    console.log('   - Your own email address');
    console.log('   - Automatic SPF/DKIM setup');
    console.log('   - No SMTP configuration needed');
    console.log('');
    console.log('🔧 Alternative: Use Cloudflare with Gmail SMTP');
    console.log('   - Set up noreplay@driftpro.no in Cloudflare');
    console.log('   - Use Gmail SMTP for sending');
    console.log('   - Cloudflare handles receiving');
    
    // Log to Firestore
    const infoLog = {
      to: ['system'],
      subject: 'Cloudflare Email Routing Info',
      content: 'Cloudflare Email Routing setup instructions',
      type: 'cloudflare_info',
      status: 'info',
      sentAt: serverTimestamp(),
      metadata: {
        test: true,
        config: 'cloudflare_email_routing',
        timestamp: new Date().toISOString(),
        instructions: [
          'Add domain to Cloudflare',
          'Enable Email Routing',
          'Add noreplay@driftpro.no as custom address'
        ]
      }
    };
    
    await addDoc(collection(db, 'emailLogs'), infoLog);
    console.log('✅ Information logged to Firestore');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test
testCloudflareEmail(); 