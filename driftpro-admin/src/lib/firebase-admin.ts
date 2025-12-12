/**
 * Firebase Admin/Server-side initialization
 * Safe initialization that handles missing environment variables gracefully
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase config with fallbacks for build-time
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCyE4S4B5q2JLdtaTtr8kVVvg8y-3Zm7ZE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "driftpro-40ccd.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "driftpro-40ccd",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "driftpro-40ccd.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// Check if Firebase is properly configured
const isFirebaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
};

// Initialize Firebase safely
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

const initializeFirebaseAdmin = () => {
  // Skip initialization during build if not configured
  const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  
  if (isBuildTime && !isFirebaseConfigured()) {
    console.warn('Firebase: Skipping initialization during build - environment variables not set');
    return { app: undefined, auth: undefined, db: undefined };
  }

  try {
    // Check if Firebase is already initialized
    if (getApps().length > 0) {
      app = getApps()[0];
    } else {
      // Always initialize with config (has fallbacks)
      app = initializeApp(firebaseConfig);
    }

    if (app) {
      auth = getAuth(app);
      db = getFirestore(app);
    }
  } catch (error: any) {
    // During build, just log and continue - don't throw
    if (isBuildTime) {
      console.warn('Firebase: Initialization skipped during build:', error.message);
    } else {
      console.error('Firebase: Error during initialization:', error);
    }
    // Return undefined values instead of throwing
  }

  return { app, auth, db };
};

// Initialize immediately
const { app: initializedApp, auth: initializedAuth, db: initializedDb } = initializeFirebaseAdmin();

// Export getters that return undefined if not configured
export const getFirebaseApp = (): FirebaseApp | undefined => initializedApp;
export const getFirebaseAuth = (): Auth | undefined => initializedAuth;
export const getFirebaseDb = (): Firestore | undefined => initializedDb;

// Check if Firebase is available
export const isFirebaseAvailable = (): boolean => {
  return !!(initializedApp && initializedAuth && initializedDb);
};

// Export for backward compatibility
export { initializedApp as app, initializedAuth as auth, initializedDb as db };

