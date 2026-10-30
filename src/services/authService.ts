import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  type User,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';
import { auth } from '../lib/firebase';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Configure local persistence
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('[Hoshima Auth] Persistence error:', err);
  });
}

/**
 * Perform Google Sign-In with popup, falling back to redirect if popup is blocked
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    // If popup was blocked or unsupported on mobile, attempt redirect flow
    if (
      error.code === 'auth/popup-blocked' ||
      error.code === 'auth/popup-closed-by-user' ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    ) {
      console.warn('[Hoshima Auth] Popup blocked or mobile device detected, switching to redirect flow...');
      await signInWithRedirect(auth, googleProvider);
      // The page will redirect; caller should check handleRedirectResult on mount
      throw new Error('Redirecting to Google Sign-In...');
    }
    throw error;
  }
}

/**
 * Handle incoming redirect result when page reloads after redirect sign-in
 */
export async function handleRedirectResult(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    return result ? result.user : null;
  } catch (error) {
    console.error('[Hoshima Auth] Redirect sign-in error:', error);
    throw error;
  }
}

/**
 * Sign out current authenticated user
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Listen for Firebase Auth state changes
 */
export function subscribeToAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
