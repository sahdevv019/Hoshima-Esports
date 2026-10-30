import {
  doc,
  getDoc,
  runTransaction,
  updateDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserProfile } from '../types/auth';

const AVATAR_COLORS = [
  '#00e5ff', '#e040fb', '#ff4655', '#ffd600',
  '#4fc3f7', '#4ade80', '#ff9800', '#ce93d8', '#f87171', '#a3e635'
];

export function getRandomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

/**
 * Fetch a user profile by UID
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    return null;
  }
  return snap.data() as UserProfile;
}

/**
 * Subscribe to real-time updates for a user's profile
 */
export function subscribeToUserProfile(uid: string, callback: (profile: UserProfile | null) => void) {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(
    userRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as UserProfile);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.warn('[Hoshima Profile] Profile listener warning/error:', error);
      callback(null);
    }
  );
}

/**
 * Race-safe profile initialization using a Firestore transaction.
 * Ensures a pending profile is created only if no profile already exists.
 * If a profile exists (even pending/rejected/approved), leaves it intact.
 */
export async function ensureUserProfile(
  uid: string,
  email: string | null,
  displayName: string | null
): Promise<UserProfile> {
  const userRef = doc(db, 'users', uid);

  return await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userRef);

    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }

    // Create a new pending profile
    const newProfile: UserProfile = {
      uid,
      email: email || null,
      displayName: displayName || 'Operative',
      gamingUsername: (displayName || 'AGENT').replace(/\s+/g, '_').toUpperCase(),
      preferredGame: 'Free Fire Max',
      bio: '',
      color: getRandomAvatarColor(),
      role: 'pending',
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    transaction.set(userRef, newProfile);
    return newProfile;
  });
}

/**
 * Update safe, non-privileged fields on the user profile.
 * Protected fields (role, status, email, uid) are strictly omitted.
 */
export async function updateSafeProfileFields(
  uid: string,
  fields: {
    displayName?: string;
    gamingUsername?: string;
    preferredGame?: string;
    inGameId?: string;
    preferredRole?: string;
    bio?: string;
    color?: string;
  }
): Promise<void> {
  // Validate limits
  if (fields.displayName && fields.displayName.length > 50) {
    throw new Error('Display name must be 50 characters or less.');
  }
  if (fields.gamingUsername && fields.gamingUsername.length > 30) {
    throw new Error('Gaming username must be 30 characters or less.');
  }
  if (fields.bio && fields.bio.length > 300) {
    throw new Error('Bio must be 300 characters or less.');
  }

  const userRef = doc(db, 'users', uid);
  const payload: Record<string, any> = {
    updatedAt: serverTimestamp()
  };

  if (fields.displayName !== undefined) payload.displayName = fields.displayName.trim();
  if (fields.gamingUsername !== undefined) payload.gamingUsername = fields.gamingUsername.trim().toUpperCase();
  if (fields.preferredGame !== undefined) payload.preferredGame = fields.preferredGame;
  if (fields.inGameId !== undefined) payload.inGameId = fields.inGameId.trim();
  if (fields.preferredRole !== undefined) payload.preferredRole = fields.preferredRole.trim();
  if (fields.bio !== undefined) payload.bio = fields.bio.trim();
  if (fields.color !== undefined) payload.color = fields.color;

  await updateDoc(userRef, payload);
}
