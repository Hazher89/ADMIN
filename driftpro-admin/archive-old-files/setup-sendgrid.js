const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp, doc, setDoc } = require('firebase/firestore');
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

async function setupSendGrid() {
  try {
    console.log('🧪 Setting up SendGrid SMTP...');
    
    // SendGrid SMTP configuration (free tier)
    const smtpConfig = {
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey', // SendGrid uses 'apikey' as username
        pass: 'SG.your-sendgrid-api-key' // You need to get this from SendGrid
      },
      tls: {
        rejectUnauthorized: false
      }
    };
    
    console.log('📧 SendGrid SMTP Config:', {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure
    });
    
    // Update Firebase email settings
    console.log('📝 Updating Firebase email settings...');
    const emailSettings = {
      enabled: true,
      adminSetup: true,
      notifications: true,
      userWelcome: true,
      deviationReports: true,
      deviationResolved: true,
      warnings: true,
      systemAlerts: true,
      smtpHost: 'smtp.sendgrid.net',
      smtpPort: 587,
      smtpUser: 'apikey',
      smtpSecure: false,
      smtpPassword: 'SG.your-sendgrid-api-key',
      smtpTlsRejectUnauthorized: false,
      smtpConnectionTimeout: 60000,
      smtpGreetingTimeout: 30000,
      smtpSocketTimeout: 60000,
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'system', 'emailSettings'), emailSettings);
    console.log('✅ Email settings updated in Firebase');
    
    console.log('🎉 SendGrid setup completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Go to https://sendgrid.com/');
    console.log('2. Create a free account');
    console.log('3. Get your API key from Settings > API Keys');
    console.log('4. Replace "SG.your-sendgrid-api-key" with your actual API key');
    console.log('5. Run this script again with the real API key');
    
  } catch (error) {
    console.error('❌ SendGrid setup failed:', error);
  }
}

// Run setup
setupSendGrid(); 