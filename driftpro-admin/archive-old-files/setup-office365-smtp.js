const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
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

async function setupOffice365SMTP() {
  try {
    console.log('🏢 Setting up Office 365 SMTP...');
    console.log('');
    console.log('📋 Office 365 SMTP Configuration:');
    console.log('   Host: smtp.office365.com');
    console.log('   Port: 587 (STARTTLS)');
    console.log('   Security: TLS');
    console.log('   Authentication: Username/Password');
    console.log('');

    // Office 365 SMTP configuration
    const office365Config = {
      host: 'smtp.office365.com',
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: 'driftpro@dittbedrift.no', // ← Endre til din Office 365 e-post
        pass: 'DittOffice365Passord123!' // ← Endre til ditt Office 365 passord
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000
    };

    console.log('📧 Office 365 SMTP Config:', {
      host: office365Config.host,
      port: office365Config.port,
      secure: office365Config.secure,
      user: office365Config.auth.user
    });

    // Update Firebase email settings
    console.log('📝 Updating Firebase email settings...');
    const emailSettingsRef = doc(db, 'systemSettings', 'email');
    
    const emailSettings = {
      enabled: true,
      adminSetup: true,
      notifications: true,
      userWelcome: true,
      deviationReports: true,
      deviationResolved: true,
      warnings: true,
      systemAlerts: true,
      smtpHost: office365Config.host,
      smtpPort: office365Config.port,
      smtpUser: office365Config.auth.user,
      smtpPassword: office365Config.auth.pass,
      smtpSecure: office365Config.secure,
      fromEmail: office365Config.auth.user,
      fromName: 'DriftPro System',
      tls: office365Config.tls,
      connectionTimeout: office365Config.connectionTimeout,
      greetingTimeout: office365Config.greetingTimeout,
      socketTimeout: office365Config.socketTimeout,
      updatedAt: new Date().toISOString(),
      provider: 'office365_smtp'
    };

    await setDoc(emailSettingsRef, emailSettings);
    console.log('✅ Email settings updated in Firebase');

    // Test Office 365 SMTP connection
    console.log('🔧 Testing Office 365 SMTP connection...');
    const transporter = nodemailer.createTransporter(office365Config);

    // Verify connection
    await transporter.verify();
    console.log('✅ Office 365 SMTP connection verified successfully!');

    // Test email
    console.log('📤 Sending test email...');
    const testEmail = {
      from: `DriftPro System <${office365Config.auth.user}>`,
      to: office365Config.auth.user, // Send test email to yourself
      subject: 'DriftPro - Office 365 SMTP Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 2rem;">🎉 DriftPro</h1>
            <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">Office 365 SMTP Test</p>
          </div>
          
          <div style="padding: 2rem; background: white;">
            <h2 style="color: #333; margin-top: 0;">✅ SMTP Configuration Successful!</h2>
            <p style="color: #666; line-height: 1.6;">
              Din Office 365 SMTP-konfigurasjon er nå aktivert og fungerer perfekt!
            </p>
            
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h3 style="color: #333; margin-top: 0;">📧 Konfigurasjonsdetaljer:</h3>
              <ul style="color: #666; margin: 0;">
                <li><strong>SMTP Server:</strong> smtp.office365.com</li>
                <li><strong>Port:</strong> 587 (STARTTLS)</li>
                <li><strong>Sender Email:</strong> ${office365Config.auth.user}</li>
                <li><strong>Provider:</strong> Office 365</li>
              </ul>
            </div>
            
            <div style="background: #e8f5e8; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h3 style="color: #2d5a2d; margin-top: 0;">🚀 Neste steg:</h3>
              <ul style="color: #2d5a2d; margin: 0;">
                <li>Velkommen-e-poster vil bli sendt fra denne adressen</li>
                <li>Glemt passord-e-poster vil bli sendt fra denne adressen</li>
                <li>Systemvarsler vil bli sendt fra denne adressen</li>
                <li>Alle DriftPro-e-poster vil nå bruke Office 365</li>
              </ul>
            </div>
            
            <p style="color: #666; font-size: 0.9rem; margin-bottom: 0;">
              Dette er en automatisk test-e-post fra DriftPro-systemet.
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 1rem; text-align: center; color: #666; font-size: 0.8rem;">
            <p style="margin: 0;">© 2024 DriftPro - Alle rettigheter forbeholdt</p>
          </div>
        </div>
      `,
      text: `
        DriftPro - Office 365 SMTP Test
        
        ✅ SMTP Configuration Successful!
        
        Din Office 365 SMTP-konfigurasjon er nå aktivert og fungerer perfekt!
        
        Konfigurasjonsdetaljer:
        - SMTP Server: smtp.office365.com
        - Port: 587 (STARTTLS)
        - Sender Email: ${office365Config.auth.user}
        - Provider: Office 365
        
        Neste steg:
        - Velkommen-e-poster vil bli sendt fra denne adressen
        - Glemt passord-e-poster vil bli sendt fra denne adressen
        - Systemvarsler vil bli sendt fra denne adressen
        - Alle DriftPro-e-poster vil nå bruke Office 365
        
        Dette er en automatisk test-e-post fra DriftPro-systemet.
        
        © 2024 DriftPro - Alle rettigheter forbeholdt
      `
    };

    const info = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', info.messageId);

    console.log('');
    console.log('🎉 Office 365 SMTP setup completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   ✅ Office 365 SMTP configured');
    console.log('   ✅ Firebase settings updated');
    console.log('   ✅ Connection verified');
    console.log('   ✅ Test email sent');
    console.log('');
    console.log('📧 Email functionality now includes:');
    console.log('   • Velkommen-e-poster til nye brukere');
    console.log('   • Glemt passord-e-poster');
    console.log('   • Passord-oppsett lenker');
    console.log('   • Systemvarsler og notifikasjoner');
    console.log('   • HMS-rapporter og avvik');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('   1. Update the email credentials in this script');
    console.log('   2. Run: node setup-office365-smtp.js');
    console.log('   3. Test the email functionality in the app');
    console.log('');

  } catch (error) {
    console.error('❌ Error setting up Office 365 SMTP:', error);
    
    if (error.code === 'EAUTH') {
      console.log('');
      console.log('🔐 Authentication Error:');
      console.log('   • Check your Office 365 email and password');
      console.log('   • Make sure 2FA is disabled or use an app password');
      console.log('   • Verify the email address is correct');
    } else if (error.code === 'ECONNECTION') {
      console.log('');
      console.log('🌐 Connection Error:');
      console.log('   • Check your internet connection');
      console.log('   • Verify Office 365 SMTP settings');
      console.log('   • Check firewall settings');
    }
    
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('   1. Verify Office 365 credentials');
    console.log('   2. Check if SMTP is enabled in Office 365');
    console.log('   3. Try using an app password instead of regular password');
    console.log('   4. Contact your IT admin if using corporate Office 365');
  }
}

// Run the setup
setupOffice365SMTP();
