import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { RegistrationApplication } from '../types/auth';

/**
 * Submit or update recruitment application for current authenticated user
 */
export async function submitRegistrationApplication(
  uid: string,
  email: string | null,
  data: {
    displayName: string;
    gamingUsername: string;
    preferredGame: string;
    inGameId: string;
    preferredRole: string;
    bio: string;
  }
): Promise<void> {
  // Field validation and length limits
  const cleanName = data.displayName?.trim();
  const cleanUsername = data.gamingUsername?.trim().toUpperCase();
  const cleanGame = data.preferredGame?.trim();
  const cleanInGameId = data.inGameId?.trim();
  const cleanRole = data.preferredRole?.trim();
  const cleanBio = data.bio?.trim();

  if (!cleanName || cleanName.length < 2 || cleanName.length > 50) {
    throw new Error('Display Name must be between 2 and 50 characters.');
  }
  if (!cleanUsername || cleanUsername.length < 2 || cleanUsername.length > 30) {
    throw new Error('Gaming Username must be between 2 and 30 characters.');
  }
  if (!cleanGame) {
    throw new Error('Preferred game is required.');
  }
  if (!cleanInGameId || cleanInGameId.length > 40) {
    throw new Error('Valid In-Game ID is required (max 40 characters).');
  }
  if (!cleanRole || cleanRole.length > 40) {
    throw new Error('Preferred Role is required (max 40 characters).');
  }
  if (!cleanBio || cleanBio.length < 10 || cleanBio.length > 300) {
    throw new Error('Introduction must be between 10 and 300 characters.');
  }

  const appRef = doc(db, 'applications', uid);
  const userRef = doc(db, 'users', uid);

  // Check existing application to preserve status if already decided
  const existingSnap = await getDoc(appRef);
  if (existingSnap.exists()) {
    const existing = existingSnap.data();
    if (existing.status === 'approved') {
      throw new Error('Your application has already been approved.');
    }
  }

  const applicationData: RegistrationApplication = {
    id: uid,
    uid,
    email: email || null,
    displayName: cleanName,
    gamingUsername: cleanUsername,
    preferredGame: cleanGame,
    inGameId: cleanInGameId,
    preferredRole: cleanRole,
    bio: cleanBio,
    status: 'pending',
    submittedAt: serverTimestamp()
  };

  // Save application and sync safe preview fields to user profile
  await setDoc(appRef, applicationData, { merge: true });
  await updateDoc(userRef, {
    displayName: cleanName,
    gamingUsername: cleanUsername,
    preferredGame: cleanGame,
    inGameId: cleanInGameId,
    preferredRole: cleanRole,
    bio: cleanBio,
    updatedAt: serverTimestamp()
  });
}

/**
 * Fetch application by UID
 */
export async function getApplicationByUid(uid: string): Promise<RegistrationApplication | null> {
  const appRef = doc(db, 'applications', uid);
  const snap = await getDoc(appRef);
  return snap.exists() ? (snap.data() as RegistrationApplication) : null;
}

/**
 * Real-time listener for current user's application
 */
export function subscribeToApplication(uid: string, callback: (app: RegistrationApplication | null) => void) {
  const appRef = doc(db, 'applications', uid);
  return onSnapshot(
    appRef,
    (snap) => {
      callback(snap.exists() ? (snap.data() as RegistrationApplication) : null);
    },
    (err) => {
      console.warn('[Hoshima App] Application listener warning:', err);
      callback(null);
    }
  );
}

/**
 * Admin: Listen to all pending applications
 */
export function subscribeToPendingApplications(callback: (apps: RegistrationApplication[]) => void) {
  const q = query(collection(db, 'applications'), where('status', '==', 'pending'));
  return onSnapshot(
    q,
    (snap) => {
      const apps: RegistrationApplication[] = [];
      snap.forEach((d) => apps.push(d.data() as RegistrationApplication));
      callback(apps);
    },
    (err) => {
      console.error('[Hoshima App] Failed to subscribe to applications:', err);
      callback([]);
    }
  );
}

/**
 * Admin: Approve an application atomically.
 * Updates the application status and elevates the user's role to 'member' and status to 'approved'.
 */
export async function approveApplication(targetUid: string, reviewerUid: string): Promise<void> {
  const batch = writeBatch(db);

  const appRef = doc(db, 'applications', targetUid);
  const userRef = doc(db, 'users', targetUid);

  batch.update(appRef, {
    status: 'approved',
    reviewedBy: reviewerUid,
    reviewedAt: serverTimestamp()
  });

  batch.update(userRef, {
    role: 'member',
    status: 'approved',
    approvedBy: reviewerUid,
    approvedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  await batch.commit();
}

/**
 * Admin: Reject an application atomically.
 * Updates application to 'rejected' and user status to 'rejected'.
 */
export async function rejectApplication(
  targetUid: string,
  reviewerUid: string,
  reason: string = 'Application declined'
): Promise<void> {
  const batch = writeBatch(db);

  const appRef = doc(db, 'applications', targetUid);
  const userRef = doc(db, 'users', targetUid);

  batch.update(appRef, {
    status: 'rejected',
    reviewedBy: reviewerUid,
    reviewedAt: serverTimestamp(),
    rejectionReason: reason
  });

  batch.update(userRef, {
    status: 'rejected',
    updatedAt: serverTimestamp()
  });

  await batch.commit();
}
