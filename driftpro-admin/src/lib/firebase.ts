import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCyE4S4B5q2JLdtaTtr8kVVvg8y-3Zm7ZE',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'driftpro-40ccd.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'driftpro-40ccd',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'driftpro-40ccd.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '137181225938',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:137181225938:ios:945515ac1dbb4bdbf4de0b',
};

// Initialize Firebase only if config is valid and not already initialized
let app;
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
} else {
  console.error('Firebase config is missing required fields:', {
    apiKey: !!firebaseConfig.apiKey,
    projectId: !!firebaseConfig.projectId
  });
  app = null;
}

// Initialize Firebase services only if app exists
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;

// Debug logging
console.log('Firebase initialization:', {
  hasApp: !!app,
  hasAuth: !!auth,
  hasDb: !!db,
  hasStorage: !!storage,
  config: {
    apiKey: firebaseConfig.apiKey ? 'SET' : 'MISSING',
    projectId: firebaseConfig.projectId ? 'SET' : 'MISSING'
  }
});

export default app; 