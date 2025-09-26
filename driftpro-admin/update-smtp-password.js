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

async function updateSMTPPassword() {
  try {
    console.log('🔧 Updating SMTP password in Firebase...');
    
    // Using the new SMTP password
    const newSMTPPassword = 'HazGada1989';
    
    const emailSettingsRef = doc(db, 'systemSettings', 'email');
    
    const updateData = {
      smtpPassword: newSMTPPassword,
      updatedAt: new Date().toISOString(),
      provider: 'office365_smtp'
    };
    
    await updateDoc(emailSettingsRef, updateData);
    console.log('✅ SMTP password updated successfully in Firebase!');
    console.log('📧 New password:', newSMTPPassword.replace(/./g, '*'));
    
  } catch (error) {
    console.error('❌ Error updating SMTP password:', error);
  }
}

// Run the update
updateSMTPPassword();
