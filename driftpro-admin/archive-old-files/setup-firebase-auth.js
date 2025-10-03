// Setup Firebase Authentication Script
// This script creates a Firebase Auth user for DriftPro - 100% REAL

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, updateProfile } = require('firebase/auth');
const { getFirestore, doc, updateDoc } = require('firebase/firestore');

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

async function setupFirebaseAuth() {
  try {
    console.log('🔐 Setting up Firebase Authentication for DriftPro...');

    // Create admin user with email and password - 100% REAL
    const email = 'admin@driftpro.no';
    const password = 'DriftPro2024!';
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update display name
    await updateProfile(user, {
      displayName: 'DriftPro Administrator'
    });

    // Update the user document in Firestore with Firebase UID
    await updateDoc(doc(db, 'users', 'driftpro_admin'), {
      uid: user.uid,
      email: email,
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Firebase Auth user created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('🆔 Firebase UID:', user.uid);
    console.log('');
    console.log('🚀 You can now log in to DriftPro with these credentials!');

  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️  User already exists, updating profile...');
      
      // Try to update existing user profile
      try {
        const user = auth.currentUser;
        if (user) {
          await updateProfile(user, {
            displayName: 'DriftPro Administrator'
          });
          
          // Update the user document in Firestore
          await updateDoc(doc(db, 'users', 'driftpro_admin'), {
            uid: user.uid,
            updatedAt: new Date().toISOString()
          });
          
          console.log('✅ Existing user profile updated!');
        } else {
          console.log('⚠️  No current user, please log in first');
        }
      } catch (updateError) {
        console.error('❌ Error updating profile:', updateError);
      }
    } else {
      console.error('❌ Error creating Firebase Auth user:', error);
    }
  }
}

// Run the setup
setupFirebaseAuth();
