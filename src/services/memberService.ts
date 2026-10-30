import {
  collection,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserProfile, UserRole } from '../types/auth';

/**
 * Subscribe to all members (approved, pending, rejected) for the Admin Dashboard
 */
export function subscribeToAllUsers(callback: (users: UserProfile[]) => void) {
  const usersRef = collection(db, 'users');
  return onSnapshot(
    usersRef,
    (snapshot) => {
      const users: UserProfile[] = [];
      snapshot.forEach((d) => {
        users.push(d.data() as UserProfile);
      });
      callback(users);
    },
    (err) => {
      console.error('[Hoshima Members] Error listening to users:', err);
      callback([]);
    }
  );
}

/**
 * Assign Captain role to a member, optionally assigning a squad/game.
 * Invariant: Captain permissions can only be granted to active, approved operatives.
 */
export async function assignCaptainRole(
  targetUid: string,
  assignedSquad: string,
  _operatorUid?: string
): Promise<void> {
  const targetRef = doc(db, 'users', targetUid);
  const targetSnap = await getDoc(targetRef);

  if (!targetSnap.exists()) {
    throw new Error('User profile does not exist.');
  }

  const targetData = targetSnap.data() as UserProfile;
  if (targetData.role === 'admin') {
    throw new Error('Cannot demote or change squad of an active Admin via Captain assignment.');
  }

  if (targetData.status !== 'approved') {
    throw new Error(
      `Invalid Action: Operative status is '${targetData.status}'. Only active, approved Members can be appointed as Captain.`
    );
  }

  if (!assignedSquad || !assignedSquad.trim()) {
    throw new Error('A valid competitive game division is required for Captain assignment.');
  }

  await updateDoc(targetRef, {
    role: 'captain',
    assignedSquad: assignedSquad.trim(),
    updatedAt: serverTimestamp()
  });
}

/**
 * Revoke Captain role, resetting role back to member
 */
export async function revokeCaptainRole(targetUid: string): Promise<void> {
  const targetRef = doc(db, 'users', targetUid);
  const targetSnap = await getDoc(targetRef);

  if (!targetSnap.exists()) {
    throw new Error('User profile does not exist.');
  }

  const targetData = targetSnap.data() as UserProfile;
  if (targetData.role !== 'captain') {
    throw new Error('User is not currently a Captain.');
  }

  await updateDoc(targetRef, {
    role: 'member',
    updatedAt: serverTimestamp()
  });
}

/**
 * Change user role safely.
 * Invariant: Protects against removing or demoting the final active admin!
 * Invariant: Captaincy requires an approved account status.
 */
export async function changeUserRole(
  targetUid: string,
  newRole: UserRole,
  _operatorUid?: string
): Promise<void> {
  const targetRef = doc(db, 'users', targetUid);
  const targetSnap = await getDoc(targetRef);

  if (!targetSnap.exists()) {
    throw new Error('User profile not found.');
  }

  const targetData = targetSnap.data() as UserProfile;
  const currentRole = targetData.role;

  // If attempting to demote an admin, reject immediately: Firestore rules strictly forbid admin demotion via client writes
  if (currentRole === 'admin' && newRole !== 'admin') {
    throw new Error(
      'Action Denied: Admin demotion is locked in the client application to protect organizational access. Administrative changes require operator console access.'
    );
  }

  // Prevent assigning Captain to an unapproved user
  if (newRole === 'captain' && targetData.status !== 'approved') {
    throw new Error(
      'Invalid Action: Cannot appoint Captain role to an unapproved operative. Approve their application first.'
    );
  }

  await updateDoc(targetRef, {
    role: newRole,
    updatedAt: serverTimestamp()
  });
}
