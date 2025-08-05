const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, updateProfile } = require('firebase/auth');
const { getFirestore, doc, updateDoc, collection, getDocs } = require('firebase/firestore');

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
const auth = getAuth(app);
const db = getFirestore(app);

async function setupUserDirect() {
  try {
    console.log('🚀 Starter direkte setup for baxigshti@hotmail.de...');
    
    // Bruker info
    const userEmail = 'baxigshti@hotmail.de';
    const companyId = 'dXM97h0lQ2ru5N6k1wFw';
    const companyName = 'DriftPro AS';
    const adminName = 'Hazher';
    const password = 'HazGada89';
    
    // Finn brukeren i Firestore først
    console.log('🔍 Finner bruker i Firestore...');
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    let userDoc = null;
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.email === userEmail && userData.companyId === companyId) {
        userDoc = { id: doc.id, ...userData };
      }
    });
    
    if (!userDoc) {
      console.log('❌ Bruker ikke funnet i Firestore');
      return;
    }
    
    console.log('✅ Bruker funnet i Firestore:', userDoc.id);
    
    // Sjekk om brukeren allerede har en Firebase UID
    if (userDoc.uid) {
      console.log('⚠️ Brukeren har allerede en Firebase UID:', userDoc.uid);
      console.log('📧 Bruker kan logge inn med:');
      console.log('   Email: baxigshti@hotmail.de');
      console.log('   Passord: HazGada89');
      console.log('   Bedrift: DriftPro AS');
      return;
    }
    
    // Opprett bruker i Firebase Auth
    console.log('🔐 Oppretter bruker i Firebase Auth...');
    const userCredential = await createUserWithEmailAndPassword(auth, userEmail, password);
    const firebaseUser = userCredential.user;
    
    console.log('✅ Bruker opprettet i Firebase Auth:', firebaseUser.uid);
    
    // Oppdater display name i Firebase Auth
    await updateProfile(firebaseUser, {
      displayName: adminName
    });
    
    // Oppdater bruker i Firestore med Firebase UID
    console.log('📝 Oppdaterer bruker i Firestore...');
    const userRef = doc(db, 'users', userDoc.id);
    await updateDoc(userRef, {
      uid: firebaseUser.uid,
      status: 'active',
      passwordSetAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Bruker oppdatert i Firestore');
    console.log('🎉 Setup fullført!');
    console.log('📧 Bruker kan nå logge inn med:');
    console.log('   Email: baxigshti@hotmail.de');
    console.log('   Passord: HazGada89');
    console.log('   Bedrift: DriftPro AS');
    
  } catch (error) {
    console.error('❌ Feil:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('⚠️ Brukeren eksisterer allerede i Firebase Auth');
      console.log('📧 Prøv å logge inn direkte med:');
      console.log('   Email: baxigshti@hotmail.de');
      console.log('   Passord: HazGada89');
    }
  }
}

// Kjør scriptet
setupUserDirect(); 