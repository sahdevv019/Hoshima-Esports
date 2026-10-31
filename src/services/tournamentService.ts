import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
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
  Tournament,
  TournamentRegistration,
  TournamentTeamMember,
  CompetitiveGame,
  CompetitiveMatch,
  PlayerMatchPerformance
} from '../types/competitive';

/**
 * Format any timestamp or date into human readable local date/time
 */
export function formatTournamentDateTime(timeVal: any): string {
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
 * Subscribe to Tournaments in real time with optional game and status filter
 */
export function subscribeToTournaments(
  callback: (tournaments: Tournament[]) => void,
  gameFilter?: string,
  statusFilter?: string
) {
  const tournRef = collection(db, 'tournaments');
  let q = query(tournRef, orderBy('startDate', 'asc'));

  if (gameFilter && gameFilter !== 'All') {
    q = query(tournRef, where('game', '==', gameFilter), orderBy('startDate', 'asc'));
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const tournaments: Tournament[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as Omit<Tournament, 'id'>;
        if (!statusFilter || statusFilter === 'all' || data.status === statusFilter) {
          tournaments.push({
            ...data,
            id: d.id
          });
        }
      });
      callback(tournaments);
    },
    (err) => {
      console.error('[Hoshima Tournaments] Error subscribing:', err);
      callback([]);
    }
  );
}

/**
 * Fetch a single tournament by ID
 */
export async function getTournamentById(tournamentId: string): Promise<Tournament | null> {
  const docRef = doc(db, 'tournaments', tournamentId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { ...(snap.data() as Omit<Tournament, 'id'>), id: snap.id };
}

/**
 * Real-time subscription to a single tournament by ID
 */
export function subscribeToTournamentById(
  tournamentId: string,
  callback: (tournament: Tournament | null) => void
) {
  const docRef = doc(db, 'tournaments', tournamentId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback({ ...(snap.data() as Omit<Tournament, 'id'>), id: snap.id });
    },
    (err) => {
      console.error('[Hoshima Tournaments] Error subscribing to tournament by ID:', err);
      callback(null);
    }
  );
}

/**
 * Create a new Tournament (Admin only)
 */
export async function createTournament(
  data: Omit<Tournament, 'id' | 'currentTeams' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const tournRef = collection(db, 'tournaments');
  const newDocRef = doc(tournRef);

  const payload: Omit<Tournament, 'id'> = {
    ...data,
    currentTeams: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(newDocRef, payload);
  return newDocRef.id;
}

/**
 * Register a team for a tournament using a Firestore Transaction
 */
export async function registerTeamForTournament(
  tournamentId: string,
  registration: {
    game: CompetitiveGame;
    captainUid: string;
    captainName: string;
    teamName: string;
    contact: string;
    roster: TournamentTeamMember[];
  }
): Promise<void> {
  const tournRef = doc(db, 'tournaments', tournamentId);
  const regId = `${tournamentId}_${registration.captainUid}`;
  const regRef = doc(db, 'tournament_registrations', regId);

  await runTransaction(db, async (tx) => {
    const tournSnap = await tx.get(tournRef);
    if (!tournSnap.exists()) {
      throw new Error('Tournament does not exist.');
    }

    const tournament = tournSnap.data() as Tournament;

    if (tournament.status !== 'registration-open' && tournament.status !== 'upcoming') {
      throw new Error(`Registration is not currently open (${tournament.status}).`);
    }

    if (tournament.registrationDeadline) {
      const deadline =
        tournament.registrationDeadline instanceof Timestamp
          ? tournament.registrationDeadline.toDate()
          : new Date(tournament.registrationDeadline);
      if (new Date() > deadline) {
        throw new Error('Tournament registration deadline has passed.');
      }
    }

    const currentCount = tournament.currentTeams || 0;
    if (currentCount >= tournament.maxTeams) {
      throw new Error('Tournament team bracket is completely full.');
    }

    const regSnap = await tx.get(regRef);
    if (regSnap.exists()) {
      const existing = regSnap.data() as TournamentRegistration;
      if (existing.status === 'registered' || existing.status === 'approved') {
        throw new Error('Your squad is already registered for this tournament.');
      }
    }

    const newCount = currentCount + 1;
    const shouldClose = newCount >= tournament.maxTeams;

    tx.set(regRef, {
      id: regId,
      tournamentId,
      game: registration.game,
      captainUid: registration.captainUid,
      captainName: registration.captainName,
      teamName: registration.teamName.trim(),
      contact: registration.contact.trim(),
      roster: registration.roster,
      status: 'registered',
      registeredAt: serverTimestamp()
    });

    tx.update(tournRef, {
      currentTeams: newCount,
      status: shouldClose ? 'registration-closed' : tournament.status,
      updatedAt: serverTimestamp()
    });
  });
}

/**
 * Withdraw a team from tournament
 */
export async function withdrawTeamFromTournament(tournamentId: string, captainUid: string): Promise<void> {
  const tournRef = doc(db, 'tournaments', tournamentId);
  const regId = `${tournamentId}_${captainUid}`;
  const regRef = doc(db, 'tournament_registrations', regId);

  await runTransaction(db, async (tx) => {
    const regSnap = await tx.get(regRef);
    if (!regSnap.exists()) {
      throw new Error('No tournament registration found for your squad.');
    }

    const regData = regSnap.data() as TournamentRegistration;
    if (regData.status === 'withdrawn') {
      throw new Error('Registration is already withdrawn.');
    }

    const tournSnap = await tx.get(tournRef);
    if (!tournSnap.exists()) {
      throw new Error('Tournament does not exist.');
    }

    const tournament = tournSnap.data() as Tournament;
    const currentCount = Math.max(0, (tournament.currentTeams || 1) - 1);

    let newStatus = tournament.status;
    if (tournament.status === 'registration-closed') {
      let deadlinePassed = false;
      if (tournament.registrationDeadline) {
        const deadline =
          tournament.registrationDeadline instanceof Timestamp
            ? tournament.registrationDeadline.toDate()
            : new Date(tournament.registrationDeadline);
        deadlinePassed = !isNaN(deadline.getTime()) && new Date() >= deadline;
      }
      if (!deadlinePassed) {
        newStatus = 'registration-open';
      }
    }

    tx.update(regRef, {
      status: 'withdrawn',
      updatedAt: serverTimestamp()
    });

    tx.update(tournRef, {
      currentTeams: currentCount,
      status: newStatus,
      updatedAt: serverTimestamp()
    });
  });
}

/**
 * Subscribe to registrations for a tournament
 */
export function subscribeToTournamentRegistrations(
  tournamentId: string,
  callback: (registrations: TournamentRegistration[]) => void
) {
  const regsRef = collection(db, 'tournament_registrations');
  const q = query(
    regsRef,
    where('tournamentId', '==', tournamentId),
    where('status', 'in', ['registered', 'approved'])
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const regs: TournamentRegistration[] = [];
      snapshot.forEach((d) => {
        regs.push(d.data() as TournamentRegistration);
      });
      regs.sort((a, b) => {
        const tA = (a.registeredAt as any)?.toMillis?.() || 0;
        const tB = (b.registeredAt as any)?.toMillis?.() || 0;
        return tA - tB;
      });
      callback(regs);
    },
    (err) => {
      console.error('[Hoshima Tournaments] Error subscribing to registrations:', err);
      callback([]);
    }
  );
}

/**
 * Fetch tournament registrations by captain UID
 */
export async function getCaptainTournamentRegistrations(captainUid: string): Promise<TournamentRegistration[]> {
  const regsRef = collection(db, 'tournament_registrations');
  const q = query(regsRef, where('captainUid', '==', captainUid), where('status', 'in', ['registered', 'approved']));
  const snap = await getDocs(q);
  const results: TournamentRegistration[] = [];
  snap.forEach((d) => results.push(d.data() as TournamentRegistration));
  return results;
}

/**
 * Subscribe to all matches for a tournament
 */
export function subscribeToTournamentMatches(
  tournamentId: string,
  callback: (matches: CompetitiveMatch[]) => void
) {
  const matchesRef = collection(db, 'matches');
  const q = query(
    matchesRef,
    where('competitionType', '==', 'tournament'),
    where('competitionId', '==', tournamentId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const matches: CompetitiveMatch[] = [];
      snapshot.forEach((d) => {
        matches.push({
          ...(d.data() as Omit<CompetitiveMatch, 'id'>),
          id: d.id
        });
      });
      // Sort in memory by round and matchNumber
      matches.sort((a, b) => {
        const roundA = typeof a.round === 'number' ? a.round : 1;
        const roundB = typeof b.round === 'number' ? b.round : 1;
        if (roundA !== roundB) return roundA - roundB;
        return (a.matchNumber || 0) - (b.matchNumber || 0);
      });
      callback(matches);
    },
    (err) => {
      console.error('[Hoshima Matches] Error subscribing:', err);
      callback([]);
    }
  );
}

/**
 * Generate Deterministic Single Elimination Tournament Bracket
 * Generates all rounds of the bracket tree upfront, pairing teams and byes in Round 1,
 * and automatically advancing bye winners into their Round 2 feeder matches.
 */
export async function generateSingleEliminationBracket(
  tournamentId: string,
  game: CompetitiveGame,
  teams: { id: string; name: string }[]
): Promise<void> {
  if (teams.length < 2) {
    throw new Error('At least 2 registered teams are required to generate tournament bracket.');
  }

  const matchesRef = collection(db, 'matches');

  // Clear existing matches for this tournament if any
  const existingQ = query(
    matchesRef,
    where('competitionType', '==', 'tournament'),
    where('competitionId', '==', tournamentId)
  );
  const existingSnap = await getDocs(existingQ);
  const deleteBatch = writeBatch(db);
  for (const docSnap of existingSnap.docs) {
    deleteBatch.delete(docSnap.ref);
  }
  await deleteBatch.commit();

  // Calculate bracket dimensions
  const powerOfTwo = Math.pow(2, Math.ceil(Math.log2(teams.length)));
  const totalRounds = Math.log2(powerOfTwo);
  const byesNeeded = powerOfTwo - teams.length;

  // Round 1 pairings
  const round1Pairs: { teamA: { id: string; name: string }; teamB: { id: string; name: string } }[] = [];
  const assignedTeams = [...teams];

  for (let i = 0; i < powerOfTwo / 2; i++) {
    const teamA = assignedTeams.shift() || { id: 'tbd', name: 'TBD' };
    let teamB: { id: string; name: string };

    if (i < byesNeeded) {
      teamB = { id: 'bye', name: 'BYE' };
    } else {
      teamB = assignedTeams.shift() || { id: 'tbd', name: 'TBD' };
    }
    round1Pairs.push({ teamA, teamB });
  }

  // Pre-generate match references for all rounds so we can link feeder slots
  const matchRefs = new Map<string, any>();
  const matchPayloads = new Map<string, any>();

  // 1. Prepare Round 1 matches
  for (let m = 1; m <= powerOfTwo / 2; m++) {
    const pair = round1Pairs[m - 1];
    const isByeMatch = pair.teamB.id === 'bye';
    const key = `1_${m}`;
    const docRef = doc(matchesRef);
    matchRefs.set(key, docRef);

    const payload: any = {
      competitionType: 'tournament',
      competitionId: tournamentId,
      game,
      round: 1,
      matchNumber: m,
      teamA: pair.teamA,
      teamB: pair.teamB,
      status: isByeMatch ? 'completed' : 'scheduled',
      isConfirmed: isByeMatch,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    if (isByeMatch) {
      payload.winnerId = pair.teamA.id;
      payload.winnerName = pair.teamA.name;
      payload.completedAt = serverTimestamp();
    }
    matchPayloads.set(key, payload);
  }

  // 2. Prepare Subsequent Rounds (Round 2 to Finals)
  for (let r = 2; r <= totalRounds; r++) {
    const matchesInRound = powerOfTwo / Math.pow(2, r);
    for (let m = 1; m <= matchesInRound; m++) {
      const key = `${r}_${m}`;
      const docRef = doc(matchesRef);
      matchRefs.set(key, docRef);

      matchPayloads.set(key, {
        competitionType: 'tournament',
        competitionId: tournamentId,
        game,
        round: r,
        matchNumber: m,
        teamA: { id: 'tbd', name: 'TBD' },
        teamB: { id: 'tbd', name: 'TBD' },
        status: 'scheduled',
        isConfirmed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  }

  // 3. Advance Round 1 BYE winners directly into Round 2 feeder matches
  for (let m = 1; m <= powerOfTwo / 2; m++) {
    const r1Payload = matchPayloads.get(`1_${m}`);
    if (r1Payload && r1Payload.teamB.id === 'bye') {
      const nextMatchNum = Math.ceil(m / 2);
      const isTeamA = m % 2 !== 0;
      const r2Payload = matchPayloads.get(`2_${nextMatchNum}`);
      if (r2Payload) {
        if (isTeamA) {
          r2Payload.teamA = { ...r1Payload.teamA };
        } else {
          r2Payload.teamB = { ...r1Payload.teamA };
        }
      }
    }
  }

  // 4. Batch commit all matches across all rounds
  const createBatch = writeBatch(db);
  for (const [key, payload] of matchPayloads.entries()) {
    const docRef = matchRefs.get(key);
    createBatch.set(docRef, payload);
  }
  await createBatch.commit();

  // 5. Update tournament status
  const tournRef = doc(db, 'tournaments', tournamentId);
  await updateDoc(tournRef, {
    status: 'in-progress',
    updatedAt: serverTimestamp()
  });
}

/**
 * Generate Deterministic Round Robin Match Schedule
 * Creates matches for every team against every other team.
 */
export async function generateRoundRobinSchedule(
  tournamentId: string,
  game: CompetitiveGame,
  teams: { id: string; name: string }[]
): Promise<void> {
  if (teams.length < 2) {
    throw new Error('At least 2 registered teams are required for round-robin schedule.');
  }

  const matchesRef = collection(db, 'matches');

  // Clear existing matches
  const existingQ = query(
    matchesRef,
    where('competitionType', '==', 'tournament'),
    where('competitionId', '==', tournamentId)
  );
  const existingSnap = await getDocs(existingQ);
  for (const docSnap of existingSnap.docs) {
    await deleteDoc(docSnap.ref);
  }

  let matchNumber = 1;
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const newDoc = doc(matchesRef);
      await setDoc(newDoc, {
        competitionType: 'tournament',
        competitionId: tournamentId,
        game,
        round: `Group Match`,
        matchNumber,
        teamA: teams[i],
        teamB: teams[j],
        status: 'scheduled',
        scheduledTime: serverTimestamp(),
        isConfirmed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      matchNumber++;
    }
  }

  const tournRef = doc(db, 'tournaments', tournamentId);
  await updateDoc(tournRef, {
    status: 'in-progress',
    updatedAt: serverTimestamp()
  });
}

/**
 * Propose Tournament Match Score (Captain)
 */
export async function submitProposedMatchResult(
  matchId: string,
  scoreA: number,
  scoreB: number,
  proposedByUid: string
): Promise<void> {
  const matchRef = doc(db, 'matches', matchId);
  const snap = await getDoc(matchRef);
  if (!snap.exists()) throw new Error('Match not found.');

  const matchData = snap.data() as CompetitiveMatch;
  if (matchData.isConfirmed) {
    throw new Error('Official results have already been confirmed by Administrator.');
  }

  // Prevent duplicate submission by the same captain with identical scores
  if (
    matchData.proposedBy === proposedByUid &&
    matchData.teamA?.score === scoreA &&
    matchData.teamB?.score === scoreB
  ) {
    throw new Error('This proposed score has already been submitted and is pending administrator confirmation.');
  }

  await updateDoc(matchRef, {
    'teamA.score': scoreA,
    'teamB.score': scoreB,
    proposedBy: proposedByUid,
    status: 'in-progress',
    updatedAt: serverTimestamp()
  });
}

/**
 * Confirm Tournament Match Result (Admin Only)
 * Deterministically records official score, sets isConfirmed = true,
 * and if single-elimination, advances the winner into the next round match.
 */
export async function confirmTournamentMatchResult(
  matchId: string,
  result: {
    scoreA: number;
    scoreB: number;
    winnerId: string;
    winnerName: string;
    adminUid: string;
    playerStats?: PlayerMatchPerformance[];
    map?: string;
  }
): Promise<void> {
  const matchRef = doc(db, 'matches', matchId);
  const snap = await getDoc(matchRef);
  if (!snap.exists()) throw new Error('Match not found.');

  const matchData = snap.data() as CompetitiveMatch;

  await updateDoc(matchRef, {
    'teamA.score': result.scoreA,
    'teamB.score': result.scoreB,
    winnerId: result.winnerId,
    winnerName: result.winnerName,
    status: 'completed',
    isConfirmed: true,
    confirmedBy: result.adminUid,
    playerStats: result.playerStats || [],
    map: result.map || 'Bermuda',
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  // If this is a tournament match, check if it's the Finals to crown champion
  if (matchData.competitionType === 'tournament') {
    const tournamentId = matchData.competitionId;

    // Fetch all matches in tournament to determine if all matches are completed
    const matchesRef = collection(db, 'matches');
    const q = query(
      matchesRef,
      where('competitionType', '==', 'tournament'),
      where('competitionId', '==', tournamentId)
    );
    const allMatchesSnap = await getDocs(q);
    const allMatches: CompetitiveMatch[] = [];
    allMatchesSnap.forEach((d) => allMatches.push({ ...(d.data() as Omit<CompetitiveMatch, 'id'>), id: d.id }));

    // Single elimination bracket advancement and championship crowning
    if (typeof matchData.round === 'number' || matchData.round === 'Finals') {
      const currentRound = typeof matchData.round === 'number' ? matchData.round : 1;
      const currentMatchNum = matchData.matchNumber || 1;
      const maxRound = Math.max(
        ...allMatches.map((m) => (typeof m.round === 'number' ? m.round : 1))
      );

      // If there is a subsequent round, advance/correct the winner into the feeder match
      if (currentRound < maxRound) {
        const nextRound = currentRound + 1;
        const nextMatchNum = Math.ceil(currentMatchNum / 2);
        const isTeamA = currentMatchNum % 2 !== 0;

        const nextMatch = allMatches.find(
          (m) => m.round === nextRound && m.matchNumber === nextMatchNum
        );

        if (nextMatch) {
          const targetRef = doc(db, 'matches', nextMatch.id);
          await updateDoc(targetRef, {
            [isTeamA ? 'teamA' : 'teamB']: { id: result.winnerId, name: result.winnerName },
            updatedAt: serverTimestamp()
          });
        }
      } else {
        // Finals match completed! Crown champion and runner-up
        const runnerUp =
          result.winnerName === matchData.teamA.name ? matchData.teamB.name : matchData.teamA.name;
        const tournRef = doc(db, 'tournaments', tournamentId);
        await updateDoc(tournRef, {
          champion: result.winnerName,
          runnerUp,
          status: 'completed',
          updatedAt: serverTimestamp()
        });
      }
    }
  }
}
