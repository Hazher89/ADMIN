const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

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

async function setupGmailTemp() {
  try {
    console.log('🧪 Setting up Gmail SMTP as temporary solution...');
    
    // Gmail SMTP configuration
    const gmailConfig = {
      host: 'smtp.gmail.com',
      port: 587,
      user: 'baxigshti@gmail.com', // Use your Gmail address
      pass: 'your-app-password', // Gmail App Password
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
    };
    
    console.log('📧 Gmail SMTP Config:', {
      host: gmailConfig.host,
      port: gmailConfig.port,
      user: gmailConfig.user,
      secure: gmailConfig.secure
    });
    
    // Create/Update Firebase email settings
    console.log('📝 Creating Firebase email settings...');
    const emailSettingsRef = doc(db, 'systemSettings', 'email');
    
    const emailSettings = {
      smtpHost: gmailConfig.host,
      smtpPort: gmailConfig.port,
      smtpUser: gmailConfig.user,
      smtpPassword: gmailConfig.pass,
      smtpSecure: gmailConfig.secure,
      fromEmail: 'baxigshti@gmail.com', // Use your Gmail as sender
      fromName: 'DriftPro System',
      tls: gmailConfig.tls,
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
      updatedAt: new Date().toISOString(),
      provider: 'gmail_smtp_temporary'
    };
    
    await setDoc(emailSettingsRef, emailSettings);
    console.log('✅ Email settings created in Firebase');
    
    console.log('🎉 Gmail SMTP setup completed!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Go to your Gmail account');
    console.log('2. Enable 2-Factor Authentication');
    console.log('3. Generate App Password:');
    console.log('   - Google Account Settings');
    console.log('   - Security → 2-Step Verification → App passwords');
    console.log('   - Generate password for "Mail"');
    console.log('4. Replace "your-app-password" with the generated password');
    console.log('5. Test email functionality');
    console.log('');
    console.log('✅ Benefits:');
    console.log('   - Works immediately');
    console.log('   - No relay restrictions');
    console.log('   - Reliable and fast');
    console.log('   - Temporary until Cloudflare is ready');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run setup
setupGmailTemp(); 