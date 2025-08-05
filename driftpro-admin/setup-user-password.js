const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Firebase config - bruk samme config som i appen
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

async function setupUserPassword() {
  try {
    console.log('🚀 Starter setup for baxigshti@hotmail.de...');
    
    // Bruker info
    const userEmail = 'baxigshti@hotmail.de';
    const companyId = 'dXM97h0lQ2ru5N6k1wFw';
    const companyName = 'DriftPro AS';
    const adminName = 'Hazher';
    const password = 'HazGada89';
    
    // Generer unik token
    const token = `setup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Opprett setup token i Firestore
    console.log('📝 Oppretter setup token i Firestore...');
    
    const setupTokenData = {
      adminName: adminName,
      companyId: companyId,
      companyName: companyName,
      createdAt: serverTimestamp(),
      email: userEmail,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 timer fra nå
      token: token,
      used: false
    };
    
    const tokenDocRef = doc(db, 'setupTokens', `${userEmail}_${companyId}`);
    await setDoc(tokenDocRef, setupTokenData);
    
    console.log('✅ Setup token opprettet i Firestore');
    console.log('🔑 Token:', token);
    
    // Kall API for å sette passord
    console.log('🔐 Kaller API for å sette passord...');
    
    const response = await fetch('http://localhost:3000/api/setup-password/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        password: password
      })
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📊 Response body:', responseText);
    
    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        if (result.success) {
          console.log('✅ Passord satt vellykket!');
          console.log('📧 Bruker kan nå logge inn med:');
          console.log('   Email: baxigshti@hotmail.de');
          console.log('   Passord: HazGada89');
          console.log('   Bedrift: DriftPro AS');
        } else {
          console.log('❌ Feil ved setting av passord:', result.error);
        }
      } catch (parseError) {
        console.log('❌ Feil ved parsing av JSON:', parseError);
        console.log('📊 Raw response:', responseText);
      }
    } else {
      console.log('❌ HTTP Error:', response.status, responseText);
    }
    
  } catch (error) {
    console.error('❌ Feil:', error);
  }
}

// Kjør scriptet
setupUserPassword(); 