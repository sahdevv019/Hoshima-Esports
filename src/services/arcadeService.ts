import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ArcadeGame } from '../types/roster';
import { DEFAULT_ARCADE_GAMES } from '../data/defaultArcade';

export function subscribeToArcadeGames(callback: (games: ArcadeGame[]) => void) {
  const arcadeRef = collection(db, 'arcade');

  return onSnapshot(
    arcadeRef,
    (snapshot) => {
      if (snapshot.empty) {
        callback(DEFAULT_ARCADE_GAMES);
        return;
      }
      const games: ArcadeGame[] = [];
      snapshot.forEach((d) => {
        games.push({
          ...(d.data() as Omit<ArcadeGame, 'id'>),
          id: d.id
        });
      });
      callback(games);
    },
    (err) => {
      console.warn('[Hoshima Arcade] Falling back to default arcade games:', err.message);
      callback(DEFAULT_ARCADE_GAMES);
    }
  );
}

export async function addArcadeGame(game: Omit<ArcadeGame, 'id' | 'createdAt'>): Promise<string> {
  if (!game.title?.trim() || !game.url?.trim() || !game.desc?.trim()) {
    throw new Error('Title, Description, and URL are required.');
  }

  const arcadeRef = collection(db, 'arcade');
  const docRef = await addDoc(arcadeRef, {
    ...game,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}
