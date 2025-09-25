const nodemailer = require('nodemailer');

async function testOffice365Email() {
  try {
    console.log('🧪 Testing Office 365 Email...');
    console.log('');

    // Office 365 SMTP configuration
    const office365Config = {
      host: 'smtp.office365.com',
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: 'your-email@yourdomain.com', // Replace with your Office 365 email
        pass: 'your-office365-password' // Replace with your Office 365 password
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000
    };

    console.log('📧 Office 365 Configuration:');
    console.log('   Host:', office365Config.host);
    console.log('   Port:', office365Config.port);
    console.log('   User:', office365Config.auth.user);
    console.log('   Secure:', office365Config.secure);
    console.log('');

    // Create transporter
    console.log('🔧 Creating Office 365 transporter...');
    const transporter = nodemailer.createTransporter(office365Config);

    // Verify connection
    console.log('🔍 Verifying connection...');
    await transporter.verify();
    console.log('✅ Connection verified successfully!');
    console.log('');

    // Test different email types
    const testEmails = [
      {
        type: 'Welcome Email',
        subject: 'Velkommen til DriftPro!',
        template: 'welcome'
      },
      {
        type: 'Password Reset',
        subject: 'Tilbakestill passord for DriftPro',
        template: 'password-reset'
      },
      {
        type: 'User Created',
        subject: 'Din DriftPro-bruker er opprettet',
        template: 'user-created'
      }
    ];

    for (const emailTest of testEmails) {
      console.log(`📤 Testing ${emailTest.type}...`);
      
      const emailContent = generateEmailTemplate(emailTest.template, {
        userName: 'Test Bruker',
        userEmail: office365Config.auth.user,
        resetLink: 'https://driftpro-admin.netlify.app/reset-password?token=test-token-123',
        setupLink: 'https://driftpro-admin.netlify.app/setup-password?token=test-token-456',
        companyName: 'Test Bedrift AS'
      });

      const mailOptions = {
        from: `DriftPro System <${office365Config.auth.user}>`,
        to: office365Config.auth.user, // Send to yourself for testing
        subject: emailTest.subject,
        html: emailContent.html,
        text: emailContent.text
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`   ✅ ${emailTest.type} sent successfully!`);
      console.log(`   📧 Message ID: ${info.messageId}`);
      console.log('');
    }

    console.log('🎉 All Office 365 email tests completed successfully!');
    console.log('');
    console.log('📋 Test Summary:');
    console.log('   ✅ Connection verified');
    console.log('   ✅ Welcome email sent');
    console.log('   ✅ Password reset email sent');
    console.log('   ✅ User created email sent');
    console.log('');
    console.log('📧 Your Office 365 email is ready for:');
    console.log('   • Velkommen-e-poster til nye brukere');
    console.log('   • Glemt passord-e-poster');
    console.log('   • Bruker-opprettelse lenker');
    console.log('   • Systemvarsler og notifikasjoner');
    console.log('   • HMS-rapporter og avvik');
    console.log('');

  } catch (error) {
    console.error('❌ Error testing Office 365 email:', error);
    
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
    console.log('   1. Update email credentials in this script');
    console.log('   2. Verify Office 365 SMTP is enabled');
    console.log('   3. Try using an app password');
    console.log('   4. Check with your IT admin if using corporate Office 365');
  }
}

function generateEmailTemplate(template, data) {
  const templates = {
    welcome: {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 2rem;">🎉 Velkommen til DriftPro!</h1>
            <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">Din digitale arbeidsplass</p>
          </div>
          
          <div style="padding: 2rem; background: white;">
            <h2 style="color: #333; margin-top: 0;">Hei ${data.userName}! 👋</h2>
            <p style="color: #666; line-height: 1.6;">
              Velkommen til DriftPro! Din brukerkonto er nå aktivert og klar til bruk.
            </p>
            
            <div style="background: #e8f5e8; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0; text-align: center;">
              <h3 style="color: #2d5a2d; margin-top: 0;">🚀 Kom i gang nå!</h3>
              <a href="https://driftpro-admin.netlify.app/login" 
                 style="display: inline-block; background: #667eea; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 1rem;">
                Logg inn på DriftPro
              </a>
            </div>
            
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h3 style="color: #333; margin-top: 0;">📧 Din brukerinformasjon:</h3>
              <ul style="color: #666; margin: 0;">
                <li><strong>E-post:</strong> ${data.userEmail}</li>
                <li><strong>Bedrift:</strong> ${data.companyName}</li>
                <li><strong>Status:</strong> Aktiv</li>
              </ul>
            </div>
            
            <p style="color: #666; font-size: 0.9rem; margin-bottom: 0;">
              Dette er en automatisk velkommen-e-post fra DriftPro-systemet.
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 1rem; text-align: center; color: #666; font-size: 0.8rem;">
            <p style="margin: 0;">© 2024 DriftPro - Alle rettigheter forbeholdt</p>
          </div>
        </div>
      `,
      text: `
        Velkommen til DriftPro!
        
        Hei ${data.userName}!
        
        Velkommen til DriftPro! Din brukerkonto er nå aktivert og klar til bruk.
        
        Kom i gang nå!
        Logg inn på: https://driftpro-admin.netlify.app/login
        
        Din brukerinformasjon:
        - E-post: ${data.userEmail}
        - Bedrift: ${data.companyName}
        - Status: Aktiv
        
        Dette er en automatisk velkommen-e-post fra DriftPro-systemet.
        
        © 2024 DriftPro - Alle rettigheter forbeholdt
      `
    },
    
    'password-reset': {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 2rem;">🔐 Tilbakestill passord</h1>
            <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">DriftPro sikkerhet</p>
          </div>
          
          <div style="padding: 2rem; background: white;">
            <h2 style="color: #333; margin-top: 0;">Hei ${data.userName}! 👋</h2>
            <p style="color: #666; line-height: 1.6;">
              Du har bedt om å tilbakestille passordet ditt for DriftPro-kontoen din.
            </p>
            
            <div style="background: #fff3cd; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0; border-left: 4px solid #ffc107;">
              <h3 style="color: #856404; margin-top: 0;">⚠️ Viktig sikkerhetsinformasjon</h3>
              <p style="color: #856404; margin: 0;">
                Hvis du ikke ba om denne e-posten, kan du trygt ignorere den. 
                Passordet ditt vil ikke bli endret.
              </p>
            </div>
            
            <div style="background: #e8f5e8; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0; text-align: center;">
              <h3 style="color: #2d5a2d; margin-top: 0;">🔗 Tilbakestill passordet ditt</h3>
              <p style="color: #2d5a2d; margin-bottom: 1rem;">
                Klikk på knappen under for å tilbakestille passordet ditt:
              </p>
              <a href="${data.resetLink}" 
                 style="display: inline-block; background: #28a745; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Tilbakestill passord
              </a>
            </div>
            
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h3 style="color: #333; margin-top: 0;">⏰ Linken utløper om:</h3>
              <p style="color: #666; margin: 0;">
                Denne linken er gyldig i 24 timer fra nå. 
                Etter det må du be om en ny tilbakestillingslink.
              </p>
            </div>
            
            <p style="color: #666; font-size: 0.9rem; margin-bottom: 0;">
              Dette er en automatisk sikkerhets-e-post fra DriftPro-systemet.
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 1rem; text-align: center; color: #666; font-size: 0.8rem;">
            <p style="margin: 0;">© 2024 DriftPro - Alle rettigheter forbeholdt</p>
          </div>
        </div>
      `,
      text: `
        Tilbakestill passord - DriftPro
        
        Hei ${data.userName}!
        
        Du har bedt om å tilbakestille passordet ditt for DriftPro-kontoen din.
        
        Viktig sikkerhetsinformasjon:
        Hvis du ikke ba om denne e-posten, kan du trygt ignorere den. 
        Passordet ditt vil ikke bli endret.
        
        Tilbakestill passordet ditt:
        ${data.resetLink}
        
        Linken utløper om:
        Denne linken er gyldig i 24 timer fra nå. 
        Etter det må du be om en ny tilbakestillingslink.
        
        Dette er en automatisk sikkerhets-e-post fra DriftPro-systemet.
        
        © 2024 DriftPro - Alle rettigheter forbeholdt
      `
    },
    
    'user-created': {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 2rem;">👤 Bruker opprettet</h1>
            <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">DriftPro administrasjon</p>
          </div>
          
          <div style="padding: 2rem; background: white;">
            <h2 style="color: #333; margin-top: 0;">Hei ${data.userName}! 👋</h2>
            <p style="color: #666; line-height: 1.6;">
              Din DriftPro-brukerkonto er nå opprettet og klar til bruk. 
              Du må sette opp et passord før du kan logge inn.
            </p>
            
            <div style="background: #e8f5e8; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0; text-align: center;">
              <h3 style="color: #2d5a2d; margin-top: 0;">🔑 Sett opp passordet ditt</h3>
              <p style="color: #2d5a2d; margin-bottom: 1rem;">
                Klikk på knappen under for å sette opp passordet ditt:
              </p>
              <a href="${data.setupLink}" 
                 style="display: inline-block; background: #667eea; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Sett opp passord
              </a>
            </div>
            
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h3 style="color: #333; margin-top: 0;">📧 Din brukerinformasjon:</h3>
              <ul style="color: #666; margin: 0;">
                <li><strong>E-post:</strong> ${data.userEmail}</li>
                <li><strong>Bedrift:</strong> ${data.companyName}</li>
                <li><strong>Status:</strong> Ventende passord-oppsett</li>
              </ul>
            </div>
            
            <div style="background: #fff3cd; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #ffc107;">
              <h3 style="color: #856404; margin-top: 0;">⏰ Viktig!</h3>
              <p style="color: #856404; margin: 0;">
                Denne linken er gyldig i 7 dager. 
                Etter det må du kontakte administrator for å få en ny link.
              </p>
            </div>
            
            <p style="color: #666; font-size: 0.9rem; margin-bottom: 0;">
              Dette er en automatisk bruker-opprettelse e-post fra DriftPro-systemet.
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 1rem; text-align: center; color: #666; font-size: 0.8rem;">
            <p style="margin: 0;">© 2024 DriftPro - Alle rettigheter forbeholdt</p>
          </div>
        </div>
      `,
      text: `
        Bruker opprettet - DriftPro
        
        Hei ${data.userName}!
        
        Din DriftPro-brukerkonto er nå opprettet og klar til bruk. 
        Du må sette opp et passord før du kan logge inn.
        
        Sett opp passordet ditt:
        ${data.setupLink}
        
        Din brukerinformasjon:
        - E-post: ${data.userEmail}
        - Bedrift: ${data.companyName}
        - Status: Ventende passord-oppsett
        
        Viktig!
        Denne linken er gyldig i 7 dager. 
        Etter det må du kontakte administrator for å få en ny link.
        
        Dette er en automatisk bruker-opprettelse e-post fra DriftPro-systemet.
        
        © 2024 DriftPro - Alle rettigheter forbeholdt
      `
    }
  };

  return templates[template] || templates.welcome;
}

// Run the test
testOffice365Email();

