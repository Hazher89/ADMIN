import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCyE4S4B5q2JLdtaTtr8kVVvg8y-3Zm7ZE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "driftpro-40ccd.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "driftpro-40ccd",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "driftpro-40ccd.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// Initialize Firebase only on client side
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

// Safe initialization function
const initializeFirebase = () => {
  if (typeof window === 'undefined') {
    console.log('Firebase: Server-side rendering, skipping initialization');
    return;
  }

  try {
    // Check if Firebase is already initialized
    if (getApps().length > 0) {
      app = getApps()[0];
      console.log('Firebase: Already initialized');
    } else {
      // Initialize new Firebase app
      app = initializeApp(firebaseConfig);
      console.log('Firebase: Initialized successfully');
    }
    
    // Initialize services
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    console.log('Firebase: Services initialized successfully', {
      auth: !!auth,
      db: !!db,
      storage: !!storage
    });
  } catch (error) {
    console.error('Firebase: Error during initialization:', error);
    // Don't throw error, just log it and continue
  }
};

// Initialize Firebase when this module is imported
initializeFirebase();

// Export services with fallbacks
export { auth, db, storage };
export default app; 