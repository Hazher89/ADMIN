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

async function setupCloudflareEmail() {
  try {
    console.log('🧪 Setting up Cloudflare Email Routing...');
    
    // Cloudflare Email Routing configuration
    const cloudflareConfig = {
      host: 'smtp.cloudflare.com',
      port: 587,
      user: 'noreplay@driftpro.no',
      pass: 'your-cloudflare-api-key', // Will need Cloudflare API key
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
    };
    
    console.log('📧 Cloudflare Email Routing Config:', {
      host: cloudflareConfig.host,
      port: cloudflareConfig.port,
      user: cloudflareConfig.user,
      secure: cloudflareConfig.secure
    });
    
    // Update Firebase email settings
    console.log('📝 Updating Firebase email settings...');
    const emailSettingsRef = doc(db, 'systemSettings', 'email');
    
    const emailSettings = {
      smtpHost: cloudflareConfig.host,
      smtpPort: cloudflareConfig.port,
      smtpUser: cloudflareConfig.user,
      smtpPassword: cloudflareConfig.pass,
      smtpSecure: cloudflareConfig.secure,
      fromEmail: 'noreplay@driftpro.no',
      fromName: 'DriftPro System',
      tls: cloudflareConfig.tls,
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
      updatedAt: new Date().toISOString(),
      provider: 'cloudflare_email_routing'
    };
    
    await updateDoc(emailSettingsRef, emailSettings);
    console.log('✅ Email settings updated in Firebase');
    
    console.log('🎉 Cloudflare Email Routing setup completed!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Click "Add records and enable" in Cloudflare');
    console.log('2. Wait 5-10 minutes for DNS propagation');
    console.log('3. Add Custom Address: noreplay@driftpro.no');
    console.log('4. Get Cloudflare API key for SMTP sending');
    console.log('5. Test email functionality');
    console.log('');
    console.log('✅ Benefits:');
    console.log('   - No relay restrictions');
    console.log('   - Free up to 100 emails/day');
    console.log('   - Your own email address');
    console.log('   - Automatic SPF/DKIM setup');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run setup
setupCloudflareEmail(); 