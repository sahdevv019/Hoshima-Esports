import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type {
  Scrim,
  ScrimStatus,
  ScrimRegistration,
  CompetitiveGame,
  CompetitiveMatch,
  PlayerMatchPerformance
} from '../types/competitive';

/**
 * Format any timestamp or date representation into a human readable local date/time
 */
export function formatScrimDateTime(timeVal: any): string {
  if (!timeVal) return 'TBD';
  let date: Date;
  if (timeVal instanceof Timestamp) {
    date = timeVal.toDate();
  } else if (typeof timeVal.toDate === 'function') {
    date = timeVal.toDate();
  } else if (typeof timeVal === 'string' || typeof timeVal === 'number') {
    date = new Date(timeVal);
  } else if (timeVal instanceof Date) {
    date = timeVal;
  } else {
    return 'TBD';
  }

  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Real-time subscription to Scrims with optional game and status filtering
 */
export function subscribeToScrims(
  callback: (scrims: Scrim[]) => void,
  gameFilter?: string,
  statusFilter?: string
) {
  const scrimsRef = collection(db, 'scrims');
  let q = query(scrimsRef, orderBy('scheduledTime', 'desc'));

  if (gameFilter && gameFilter !== 'All') {
    q = query(scrimsRef, where('game', '==', gameFilter), orderBy('scheduledTime', 'desc'));
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const scrims: Scrim[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as Omit<Scrim, 'id'>;
        if (!statusFilter || statusFilter === 'all' || data.status === statusFilter) {
          scrims.push({
            ...data,
            id: d.id
          });
        }
      });
      callback(scrims);
    },
    (err) => {
      console.error('[Hoshima Scrims] Error subscribing to scrims:', err);
      callback([]);
    }
  );
}

/**
 * Fetch a single Scrim by document ID
 */
export async function getScrimById(scrimId: string): Promise<Scrim | null> {
  const scrimRef = doc(db, 'scrims', scrimId);
  const snap = await getDoc(scrimRef);
  if (!snap.exists()) return null;
  return { ...(snap.data() as Omit<Scrim, 'id'>), id: snap.id };
}

/**
 * Real-time subscription to a single Scrim by document ID
 */
export function subscribeToScrimById(
  scrimId: string,
  callback: (scrim: Scrim | null) => void
) {
  const scrimRef = doc(db, 'scrims', scrimId);
  return onSnapshot(
    scrimRef,
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback({ ...(snap.data() as Omit<Scrim, 'id'>), id: snap.id });
    },
    (err) => {
      console.error('[Hoshima Scrims] Error subscribing to scrim by ID:', err);
      callback(null);
    }
  );
}

/**
 * Create a new competitive scrim
 */
export async function createScrim(
  scrimData: Omit<Scrim, 'id' | 'currentParticipants' | 'createdAt' | 'updatedAt' | 'hasResults'>
): Promise<string> {
  const scrimsRef = collection(db, 'scrims');
  const newDocRef = doc(scrimsRef);

  const payload: Omit<Scrim, 'id'> = {
    ...scrimData,
    currentParticipants: 0,
    hasResults: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(newDocRef, payload);
  return newDocRef.id;
}

/**
 * Atomic Registration for a Scrim using Firestore Transaction to prevent overbooking
 */
export async function registerForScrim(
  scrimId: string,
  registration: {
    userId: string;
    userName: string;
    teamName: string;
    contact: string;
    game: CompetitiveGame;
    playerUids?: string[];
  }
): Promise<void> {
  const scrimRef = doc(db, 'scrims', scrimId);
  const regId = `${scrimId}_${registration.userId}`;
  const regRef = doc(db, 'scrim_registrations', regId);

  await runTransaction(db, async (tx) => {
    const scrimSnap = await tx.get(scrimRef);
    if (!scrimSnap.exists()) {
      throw new Error('Scrim session does not exist.');
    }

    const scrim = scrimSnap.data() as Scrim;

    // Check status
    if (scrim.status !== 'registration-open' && scrim.status !== 'scheduled') {
      throw new Error(`Registration is not currently open for this scrim (${scrim.status}).`);
    }

    // Check deadline
    if (scrim.registrationDeadline) {
      const deadlineDate =
        scrim.registrationDeadline instanceof Timestamp
          ? scrim.registrationDeadline.toDate()
          : new Date(scrim.registrationDeadline);

      if (new Date() > deadlineDate) {
        throw new Error('Registration deadline has passed for this scrim.');
      }
    }

    // Check capacity
    const currentCount = scrim.currentParticipants || 0;
    if (currentCount >= scrim.maxParticipants) {
      throw new Error('This scrim has reached maximum participant capacity.');
    }

    // Check existing registration
    const regSnap = await tx.get(regRef);
    if (regSnap.exists()) {
      const existingData = regSnap.data() as ScrimRegistration;
      if (existingData.status === 'registered') {
        throw new Error('Your team or account is already registered for this scrim.');
      }
    }

    const newCount = currentCount + 1;
    const shouldClose = newCount >= scrim.maxParticipants;

    // Create / Update registration record
    tx.set(regRef, {
      id: regId,
      scrimId,
      game: registration.game,
      userId: registration.userId,
      userName: registration.userName,
      teamName: registration.teamName.trim(),
      contact: registration.contact.trim(),
      playerUids: registration.playerUids || [registration.userId],
      status: 'registered',
      registeredAt: serverTimestamp()
    });

    // Update scrim counter and status
    tx.update(scrimRef, {
      currentParticipants: newCount,
      status: shouldClose ? 'registration-closed' : scrim.status,
      updatedAt: serverTimestamp()
    });
  });
}

/**
 * Atomic Withdrawal from Scrim using Firestore Transaction
 */
export async function withdrawFromScrim(scrimId: string, userId: string): Promise<void> {
  const scrimRef = doc(db, 'scrims', scrimId);
  const regId = `${scrimId}_${userId}`;
  const regRef = doc(db, 'scrim_registrations', regId);

  await runTransaction(db, async (tx) => {
    const regSnap = await tx.get(regRef);
    if (!regSnap.exists()) {
      throw new Error('No registration record found for this scrim.');
    }

    const regData = regSnap.data() as ScrimRegistration;
    if (regData.status === 'withdrawn') {
      throw new Error('Registration is already withdrawn.');
    }

    const scrimSnap = await tx.get(scrimRef);
    if (!scrimSnap.exists()) {
      throw new Error('Scrim session does not exist.');
    }

    const scrim = scrimSnap.data() as Scrim;
    const currentCount = Math.max(0, (scrim.currentParticipants || 1) - 1);

    // Reopen registration if it was closed due to capacity and deadline hasn't passed
    let newStatus = scrim.status;
    if (scrim.status === 'registration-closed') {
      let deadlinePassed = false;
      if (scrim.registrationDeadline) {
        const deadlineDate =
          scrim.registrationDeadline instanceof Timestamp
            ? scrim.registrationDeadline.toDate()
            : new Date(scrim.registrationDeadline);
        deadlinePassed = !isNaN(deadlineDate.getTime()) && new Date() >= deadlineDate;
      }
      if (!deadlinePassed) {
        newStatus = 'registration-open';
      }
    }

    // Mark registration withdrawn
    tx.update(regRef, {
      status: 'withdrawn',
      withdrawnAt: serverTimestamp()
    });

    // Decrement scrim count
    tx.update(scrimRef, {
      currentParticipants: currentCount,
      status: newStatus,
      updatedAt: serverTimestamp()
    });
  });
}

/**
 * Subscribe to all registrations for a specific scrim
 */
export function subscribeToScrimRegistrations(
  scrimId: string,
  callback: (registrations: ScrimRegistration[]) => void
) {
  const regsRef = collection(db, 'scrim_registrations');
  const q = query(
    regsRef,
    where('scrimId', '==', scrimId),
    where('status', '==', 'registered')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const regs: ScrimRegistration[] = [];
      snapshot.forEach((d) => {
        regs.push(d.data() as ScrimRegistration);
      });
      regs.sort((a, b) => {
        const tA = (a.registeredAt as any)?.toMillis?.() || 0;
        const tB = (b.registeredAt as any)?.toMillis?.() || 0;
        return tA - tB;
      });
      callback(regs);
    },
    (err) => {
      console.error('[Hoshima Scrims] Error subscribing to registrations:', err);
      callback([]);
    }
  );
}

/**
 * Fetch registrations by user
 */
export async function getUserScrimRegistrations(userId: string): Promise<ScrimRegistration[]> {
  const regsRef = collection(db, 'scrim_registrations');
  const q = query(regsRef, where('userId', '==', userId), where('status', '==', 'registered'));
  const snap = await getDocs(q);
  const results: ScrimRegistration[] = [];
  snap.forEach((d) => results.push(d.data() as ScrimRegistration));
  return results;
}

/**
 * Update Scrim Status (e.g., live, completed, cancelled)
 */
export async function updateScrimStatus(scrimId: string, status: ScrimStatus): Promise<void> {
  const scrimRef = doc(db, 'scrims', scrimId);
  await updateDoc(scrimRef, {
    status,
    updatedAt: serverTimestamp()
  });
}

/**
 * Record and Confirm Scrim Match Results
 * Only confirmed matches are included in official player & team statistics.
 */
export async function recordScrimResult(
  scrimId: string,
  resultData: {
    game: CompetitiveGame;
    teamA: { id: string; name: string; score?: number };
    teamB: { id: string; name: string; score?: number };
    winnerId?: string;
    winnerName?: string;
    confirmedBy: string;
    playerStats?: PlayerMatchPerformance[];
    map?: string;
  }
): Promise<string> {
  const matchesRef = collection(db, 'matches');
  const newMatchRef = doc(matchesRef);

  const matchPayload: Omit<CompetitiveMatch, 'id'> = {
    competitionType: 'scrim',
    competitionId: scrimId,
    game: resultData.game,
    teamA: resultData.teamA,
    teamB: resultData.teamB,
    status: 'completed',
    winnerId: resultData.winnerId,
    winnerName: resultData.winnerName,
    scheduledTime: serverTimestamp(),
    completedAt: serverTimestamp(),
    confirmedBy: resultData.confirmedBy,
    isConfirmed: true, // Confirmed by organizer/admin
    playerStats: resultData.playerStats || [],
    map: resultData.map || 'Bermuda',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(newMatchRef, matchPayload);

  // Update scrim document to mark completed with official results
  const scrimRef = doc(db, 'scrims', scrimId);
  await updateDoc(scrimRef, {
    status: 'completed',
    hasResults: true,
    updatedAt: serverTimestamp()
  });

  return newMatchRef.id;
}

/**
 * Fetch matches for a specific scrim
 */
export async function getMatchesForScrim(scrimId: string): Promise<CompetitiveMatch[]> {
  const matchesRef = collection(db, 'matches');
  const q = query(
    matchesRef,
    where('competitionType', '==', 'scrim'),
    where('competitionId', '==', scrimId)
  );
  const snap = await getDocs(q);
  const matches: CompetitiveMatch[] = [];
  snap.forEach((d) => matches.push({ ...(d.data() as Omit<CompetitiveMatch, 'id'>), id: d.id }));
  return matches;
}
