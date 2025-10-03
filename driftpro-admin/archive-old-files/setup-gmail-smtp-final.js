const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc } = require('firebase/firestore');

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

async function setupGmailSMTP() {
  try {
    console.log('🧪 Setting up Gmail SMTP...');
    
    // Gmail SMTP configuration
    const gmailConfig = {
      host: 'smtp.gmail.com',
      port: 587,
      user: 'noreplay@driftpro.no', // or your Gmail address
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
    
    // Update Firebase email settings
    console.log('📝 Updating Firebase email settings...');
    const emailSettingsRef = doc(db, 'systemSettings', 'email');
    
    const emailSettings = {
      smtpHost: gmailConfig.host,
      smtpPort: gmailConfig.port,
      smtpUser: gmailConfig.user,
      smtpPassword: gmailConfig.pass,
      smtpSecure: gmailConfig.secure,
      fromEmail: 'noreplay@driftpro.no',
      fromName: 'DriftPro System',
      tls: gmailConfig.tls,
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
      updatedAt: new Date().toISOString(),
      provider: 'gmail_smtp'
    };
    
    await updateDoc(emailSettingsRef, emailSettings);
    console.log('✅ Email settings updated in Firebase');
    
    console.log('🎉 Gmail SMTP setup completed!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Create Gmail account: noreplay@driftpro.no (if available)');
    console.log('2. Or use your existing Gmail address');
    console.log('3. Enable 2-Factor Authentication');
    console.log('4. Generate App Password:');
    console.log('   - Go to Google Account Settings');
    console.log('   - Security → 2-Step Verification → App passwords');
    console.log('   - Generate password for "Mail"');
    console.log('5. Replace "your-app-password" with the generated password');
    console.log('6. Test email functionality');
    console.log('');
    console.log('✅ Benefits:');
    console.log('   - No relay restrictions');
    console.log('   - Reliable and fast');
    console.log('   - No nameserver changes needed');
    console.log('   - Works immediately');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run setup
setupGmailSMTP(); 