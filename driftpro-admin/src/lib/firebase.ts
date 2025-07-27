import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCyE4S4B5q2JLdtaTtr8kVVvg8y-3Zm7ZE",
  authDomain: "driftpro-40ccd.firebaseapp.com",
  projectId: "driftpro-40ccd",
  storageBucket: "driftpro-40ccd.appspot.com",
  messagingSenderId: "123456789", // This needs to be updated with real sender ID from Firebase console
  appId: "1:123456789:web:abcdef123456" // This needs to be updated with real app ID from Firebase console
};

// Initialize Firebase only on client side
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

if (typeof window !== 'undefined') {
  try {
    // Only initialize Firebase on client side
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log('Firebase initialized successfully');
    } else {
      app = getApps()[0];
      console.log('Firebase already initialized');
    }
    
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    console.log('Firebase services initialized:', {
      auth: !!auth,
      db: !!db,
      storage: !!storage
    });
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

export { auth, db, storage };
export default app; 