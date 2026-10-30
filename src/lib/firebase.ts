import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDUMMYKEYFORDEVELOPMENTANDTESTING000',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'hoshima-esports-dev.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'hoshima-esports-dev',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'hoshima-esports-dev.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abcdef1234567890'
};

// Check if Firebase has already been initialized to avoid duplicate initialization
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Connect to emulators if specified or if running in local testing environment
const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

if (useEmulator && typeof window !== 'undefined') {
  const authEmulatorHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST || 'http://127.0.0.1:9099';
  const firestoreHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST || '127.0.0.1';
  const firestorePort = Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT) || 8080;

  try {
    // Only connect once per session
    // @ts-ignore emulator flag check
    if (!window.__FIREBASE_EMULATORS_CONNECTED__) {
      connectAuthEmulator(auth, authEmulatorHost, { disableWarnings: true });
      connectFirestoreEmulator(db, firestoreHost, firestorePort);
      // @ts-ignore
      window.__FIREBASE_EMULATORS_CONNECTED__ = true;
      console.log(`[Hoshima Firebase] Connected to emulators at Auth: ${authEmulatorHost}, Firestore: ${firestoreHost}:${firestorePort}`);
    }
  } catch (err) {
    console.warn('[Hoshima Firebase] Emulators connection warning:', err);
  }
}

export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY && 
  import.meta.env.VITE_FIREBASE_PROJECT_ID && 
  !import.meta.env.VITE_FIREBASE_API_KEY.includes('your-api-key') &&
  !import.meta.env.VITE_FIREBASE_API_KEY.includes('DUMMYKEY') &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID !== 'hoshima-esports-dev'
);
