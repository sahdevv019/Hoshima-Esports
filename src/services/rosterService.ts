import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { RosterPlayer } from '../types/roster';
import { DEFAULT_ROSTER } from '../data/defaultRoster';

export function subscribeToRoster(callback: (players: RosterPlayer[]) => void) {
  const rosterRef = collection(db, 'roster');

  return onSnapshot(
    rosterRef,
    (snapshot) => {
      if (snapshot.empty) {
        // Fallback to default roster data if collection is not yet populated
        callback(DEFAULT_ROSTER);
        return;
      }
      const players: RosterPlayer[] = [];
      snapshot.forEach((d) => {
        players.push({
          ...(d.data() as Omit<RosterPlayer, 'id'>),
          id: d.id
        });
      });
      callback(players);
    },
    (err) => {
      console.warn('[Hoshima Roster] Falling back to static roster:', err.message);
      callback(DEFAULT_ROSTER);
    }
  );
}

export async function addRosterPlayer(player: Omit<RosterPlayer, 'id'>): Promise<string> {
  const rosterRef = collection(db, 'roster');
  const docRef = await addDoc(rosterRef, player);
  return docRef.id;
}

export async function updateRosterPlayer(id: string, player: Partial<RosterPlayer>): Promise<void> {
  const playerRef = doc(db, 'roster', id);
  await updateDoc(playerRef, player);
}

export async function deleteRosterPlayer(id: string): Promise<void> {
  const playerRef = doc(db, 'roster', id);
  await deleteDoc(playerRef);
}
