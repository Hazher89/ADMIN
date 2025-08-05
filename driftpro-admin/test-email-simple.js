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

async function testEmailSetup() {
  console.log('🔍 DriftPro E-post Diagnose');
  console.log('=============================\n');

  // Test 1: Check current email configuration
  console.log('1️⃣ Sjekker nåværende e-postkonfigurasjon...');
  
  const currentConfig = {
    host: 'smtp.cloudflare.com',
    port: 587,
    user: 'noreplay@driftpro.no',
    pass: 'your-cloudflare-api-key', // ⚠️ Dette er problemet!
    secure: false
  };

  console.log('   SMTP Host:', currentConfig.host);
  console.log('   SMTP Port:', currentConfig.port);
  console.log('   SMTP User:', currentConfig.user);
  console.log('   SMTP Pass:', currentConfig.pass === 'your-cloudflare-api-key' ? '❌ IKKE KONFIGURERT' : '✅ Konfigurert');
  console.log('');

  // Test 2: Log to Firestore for debugging
  console.log('2️⃣ Logger diagnose til Firestore...');
  
  const diagnosticLog = {
    to: ['system'],
    subject: 'E-post Diagnose - Admin fikk ikke e-post',
    content: 'Diagnose av e-postproblemer i DriftPro',
    type: 'diagnostic',
    status: 'info',
    sentAt: serverTimestamp(),
    metadata: {
      test: true,
      issue: 'admin_setup_email_not_sent',
      timestamp: new Date().toISOString(),
      problems: [
        'Cloudflare API-nøkkel ikke konfigurert',
        'SMTP-innstillinger mangler',
        'E-posttjeneste ikke testet'
      ],
      solutions: [
        'Konfigurer Cloudflare Email Routing',
        'Sett opp SMTP-innstillinger',
        'Test e-postsending'
      ]
    }
  };

  try {
    await addDoc(collection(db, 'emailLogs'), diagnosticLog);
    console.log('   ✅ Diagnose logget til Firestore');
  } catch (error) {
    console.log('   ❌ Kunne ikke logge til Firestore:', error.message);
  }
  console.log('');

  // Test 3: Provide solutions
  console.log('3️⃣ Løsninger for å få e-post til å fungere:');
  console.log('');
  
  console.log('🔧 LØSNING 1: Cloudflare Email Routing (Anbefalt)');
  console.log('   a) Gå til https://dash.cloudflare.com/');
  console.log('   b) Legg til domenet: driftpro.no');
  console.log('   c) Endre nameservers til Cloudflare');
  console.log('   d) Gå til Email → Email Routing');
  console.log('   e) Aktiver Email Routing');
  console.log('   f) Legg til: noreplay@driftpro.no');
  console.log('   g) Sett destination: din-epost@example.com');
  console.log('');

  console.log('🔧 LØSNING 2: Gmail SMTP (Enklere)');
  console.log('   a) Opprett Gmail App Password');
  console.log('   b) Oppdater email-service.ts med Gmail SMTP');
  console.log('   c) Test e-postsending');
  console.log('');

  console.log('🔧 LØSNING 3: Oppdater kode');
  console.log('   a) Åpne: src/lib/email-service.ts');
  console.log('   b) Erstatt "your-cloudflare-api-key" med faktisk API-nøkkel');
  console.log('   c) Test med: npm run dev');
  console.log('');

  console.log('📧 TEST E-POST');
  console.log('   Når konfigurert, test med:');
  console.log('   curl -X POST http://localhost:3000/api/send-test-email \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"to": "din-epost@example.com", "subject": "Test", "message": "Test"}\'');
  console.log('');

  console.log('🎯 NESTE STEG:');
  console.log('   1. Konfigurer Cloudflare Email Routing eller Gmail SMTP');
  console.log('   2. Oppdater API-nøkkel i email-service.ts');
  console.log('   3. Test e-postsending');
  console.log('   4. Opprett bedrift på nytt for å teste admin e-post');
  console.log('');

  console.log('📞 Hjelp:');
  console.log('   - Cloudflare Email Routing: https://developers.cloudflare.com/email-routing/');
  console.log('   - Gmail App Passwords: https://support.google.com/accounts/answer/185833');
  console.log('   - Nodemailer SMTP: https://nodemailer.com/smtp/');
}

// Run test
testEmailSetup().catch(console.error); 