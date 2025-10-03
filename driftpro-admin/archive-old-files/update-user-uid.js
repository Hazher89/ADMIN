const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, updatePassword } = require('firebase/auth');
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

async function updateUserUID() {
  try {
    console.log('🚀 Oppdaterer bruker UID for baxigshti@hotmail.de...');
    
    // Bruker info
    const userEmail = 'baxigshti@hotmail.de';
    const companyId = 'dXM97h0lQ2ru5N6k1wFw';
    const password = 'HazGada89';
    
    // Logg inn for å få tilgang til brukeren
    console.log('🔐 Logger inn for å få tilgang til brukeren...');
    const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
    const firebaseUser = userCredential.user;
    
    console.log('✅ Innlogget som:', firebaseUser.email);
    console.log('🔑 Firebase UID:', firebaseUser.uid);
    
    // Finn brukeren i Firestore
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
    console.log('📊 Nåværende UID i Firestore:', userDoc.uid || 'INGEN');
    
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
    
    if (error.code === 'auth/user-not-found') {
      console.log('❌ Brukeren finnes ikke i Firebase Auth');
    } else if (error.code === 'auth/wrong-password') {
      console.log('❌ Feil passord');
    } else if (error.code === 'auth/invalid-credential') {
      console.log('❌ Ugyldige påloggingsdetaljer');
    }
  }
}

// Kjør scriptet
updateUserUID(); 