/**
 * Firebase Admin/Server-side initialization
 * Safe initialization that handles missing environment variables gracefully
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
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
let db: Firestore | undefined;

const initializeFirebaseAdmin = () => {
  // Skip initialization ONLY during Next.js production build phase (not during runtime on Netlify/Vercel)
  // Netlify functions often run with NODE_ENV=production, so NODE_ENV is NOT a safe build-time detector.
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
  
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

  return { app, db };
};

// Initialize immediately
const { app: initializedApp, db: initializedDb } = initializeFirebaseAdmin() as any;

// Export getters that return undefined if not configured
export const getFirebaseApp = (): FirebaseApp | undefined => initializedApp;
// Backward compatibility: some legacy API routes import this.
// We intentionally do NOT initialize firebase/auth here (browser-oriented).
export const getFirebaseAuth = (): undefined => undefined;
export const getFirebaseDb = (): Firestore | undefined => initializedDb;

// Check if Firebase is available
export const isFirebaseAvailable = (): boolean => {
  // In serverless/API routes we only require Firestore.
  return !!(initializedApp && initializedDb);
};

// Export for backward compatibility
// auth is intentionally not initialized here (firebase/auth is browser-oriented and can break on serverless runtimes)
export const auth = undefined;
export { initializedApp as app, initializedDb as db };

