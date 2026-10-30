import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type {
  CompetitiveGame,
  CompetitiveMatch,
  PlayerCompetitiveStats,
  TeamLeaderboardEntry
} from '../types/competitive';

/**
 * Baseline statistics for Hoshima premier divisions
 */
const DEFAULT_SQUAD_STATS: TeamLeaderboardEntry[] = [
  { squadName: 'Free Fire Prime', game: 'Free Fire Max', matchesPlayed: 48, wins: 38, losses: 10, winRate: 79.2, points: 124, trophies: 8 },
  { squadName: 'BGMI Assault Unit', game: 'BGMI', matchesPlayed: 42, wins: 31, losses: 11, winRate: 73.8, points: 105, trophies: 5 },
  { squadName: 'Valorant Vanguard', game: 'Valorant', matchesPlayed: 36, wins: 26, losses: 10, winRate: 72.2, points: 88, trophies: 3 },
  { squadName: 'MLBB Legion', game: 'Mobile Legends', matchesPlayed: 30, wins: 22, losses: 8, winRate: 73.3, points: 74, trophies: 4 }
];

/**
 * Baseline player statistics
 */
const DEFAULT_TOP_PLAYERS: PlayerCompetitiveStats[] = [
  { uid: 'op_1', displayName: 'Ayush Pathak', gamingUsername: 'AXIOM', game: 'Free Fire Max', squad: 'Free Fire Prime', matchesPlayed: 48, wins: 38, losses: 10, winRate: 79.2, totalKills: 284, totalDeaths: 72, kdRatio: 3.94, tournamentsWon: 8, tournamentAppearances: 14, recentForm: ['W', 'W', 'W', 'W', 'L'] },
  { uid: 'op_2', displayName: 'Viper Strike', gamingUsername: 'VIPER', game: 'Free Fire Max', squad: 'Free Fire Prime', matchesPlayed: 44, wins: 35, losses: 9, winRate: 79.5, totalKills: 242, totalDeaths: 68, kdRatio: 3.56, tournamentsWon: 7, tournamentAppearances: 12, recentForm: ['W', 'W', 'L', 'W', 'W'] },
  { uid: 'op_3', displayName: 'Ghost Hunter', gamingUsername: 'GHOST', game: 'BGMI', squad: 'BGMI Assault Unit', matchesPlayed: 42, wins: 31, losses: 11, winRate: 73.8, totalKills: 215, totalDeaths: 76, kdRatio: 2.83, tournamentsWon: 5, tournamentAppearances: 10, recentForm: ['W', 'L', 'W', 'W', 'W'] },
  { uid: 'op_4', displayName: 'Delta Force', gamingUsername: 'DELTA', game: 'Valorant', squad: 'Valorant Vanguard', matchesPlayed: 36, wins: 26, losses: 10, winRate: 72.2, totalKills: 198, totalDeaths: 79, kdRatio: 2.51, tournamentsWon: 3, tournamentAppearances: 8, recentForm: ['L', 'W', 'W', 'L', 'W'] }
];

/**
 * Fetch official confirmed match records for computing player & squad statistics
 */
export async function getConfirmedMatches(gameFilter?: string): Promise<CompetitiveMatch[]> {
  const matchesRef = collection(db, 'matches');
  let q = query(matchesRef, where('isConfirmed', '==', true), orderBy('completedAt', 'desc'), limit(150));

  if (gameFilter && gameFilter !== 'All') {
    q = query(
      matchesRef,
      where('game', '==', gameFilter),
      where('isConfirmed', '==', true),
      orderBy('completedAt', 'desc'),
      limit(150)
    );
  }

  try {
    const snap = await getDocs(q);
    const matches: CompetitiveMatch[] = [];
    snap.forEach((d) => matches.push({ ...(d.data() as Omit<CompetitiveMatch, 'id'>), id: d.id }));
    return matches;
  } catch (err) {
    console.warn('[Hoshima Stats] Error querying confirmed matches, returning baseline:', err);
    return [];
  }
}

/**
 * Get Team/Squad Leaderboards computed from confirmed matches
 */
export async function getTeamLeaderboard(gameFilter?: string): Promise<TeamLeaderboardEntry[]> {
  const matches = await getConfirmedMatches(gameFilter);

  if (matches.length === 0) {
    // Return baseline organizational records if no new matches have been recorded
    return gameFilter && gameFilter !== 'All'
      ? DEFAULT_SQUAD_STATS.filter((s) => s.game === gameFilter)
      : DEFAULT_SQUAD_STATS;
  }

  const squadMap = new Map<string, { squadName: string; game: CompetitiveGame; matchesPlayed: number; wins: number; losses: number; points: number; trophies: number }>();

  // Initialize with baseline squads
  for (const base of DEFAULT_SQUAD_STATS) {
    if (!gameFilter || gameFilter === 'All' || base.game === gameFilter) {
      squadMap.set(base.squadName, { ...base });
    }
  }

  // Aggregate stats from confirmed matches
  for (const m of matches) {
    const teamA = m.teamA.name;
    const teamB = m.teamB.name;
    const winner = m.winnerName;

    // Team A
    const entryA = squadMap.get(teamA) || { squadName: teamA, game: m.game, matchesPlayed: 0, wins: 0, losses: 0, points: 0, trophies: 0 };
    entryA.matchesPlayed += 1;
    if (winner === teamA) {
      entryA.wins += 1;
      entryA.points += 3;
    } else {
      entryA.losses += 1;
    }
    squadMap.set(teamA, entryA);

    // Team B
    const entryB = squadMap.get(teamB) || { squadName: teamB, game: m.game, matchesPlayed: 0, wins: 0, losses: 0, points: 0, trophies: 0 };
    entryB.matchesPlayed += 1;
    if (winner === teamB) {
      entryB.wins += 1;
      entryB.points += 3;
    } else {
      entryB.losses += 1;
    }
    squadMap.set(teamB, entryB);
  }

  const entries: TeamLeaderboardEntry[] = [];
  squadMap.forEach((val) => {
    const winRate = val.matchesPlayed > 0 ? (val.wins / val.matchesPlayed) * 100 : 0;
    entries.push({
      ...val,
      winRate: Math.round(winRate * 10) / 10
    });
  });

  // Sort by points descending, then wins descending
  entries.sort((a, b) => b.points - a.points || b.wins - a.wins);
  return entries;
}

/**
 * Get Individual Player Leaderboard derived from confirmed match MVP & kill performances
 */
export async function getPlayerLeaderboard(gameFilter?: string): Promise<PlayerCompetitiveStats[]> {
  const matches = await getConfirmedMatches(gameFilter);

  if (matches.length === 0) {
    return gameFilter && gameFilter !== 'All'
      ? DEFAULT_TOP_PLAYERS.filter((p) => p.game === gameFilter)
      : DEFAULT_TOP_PLAYERS;
  }

  const playerMap = new Map<string, PlayerCompetitiveStats>();

  // Seed with baseline players
  for (const bp of DEFAULT_TOP_PLAYERS) {
    if (!gameFilter || gameFilter === 'All' || bp.game === gameFilter) {
      playerMap.set(bp.gamingUsername.toLowerCase(), { ...bp });
    }
  }

  // Aggregate from confirmed matches
  for (const m of matches) {
    if (m.playerStats && m.playerStats.length > 0) {
      for (const ps of m.playerStats) {
        const key = ps.name.toLowerCase();
        const existing = playerMap.get(key) || {
          uid: ps.uid || `player_${key}`,
          displayName: ps.name,
          gamingUsername: ps.name.toUpperCase(),
          game: m.game,
          squad: ps.team || m.game,
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          totalKills: 0,
          totalDeaths: 0,
          kdRatio: 0,
          tournamentsWon: 0,
          tournamentAppearances: 0,
          recentForm: []
        };

        existing.matchesPlayed += 1;
        existing.totalKills += ps.kills || 0;
        existing.totalDeaths += ps.deaths || 1;

        const isWin = ps.team === m.winnerName;
        if (isWin) {
          existing.wins += 1;
          existing.recentForm.unshift('W');
        } else {
          existing.losses += 1;
          existing.recentForm.unshift('L');
        }
        if (existing.recentForm.length > 5) existing.recentForm.pop();

        existing.winRate = Math.round((existing.wins / existing.matchesPlayed) * 1000) / 10;
        existing.kdRatio = Math.round((existing.totalKills / Math.max(1, existing.totalDeaths)) * 100) / 100;

        playerMap.set(key, existing);
      }
    }
  }

  const results = Array.from(playerMap.values());
  results.sort((a, b) => b.totalKills - a.totalKills || b.kdRatio - a.kdRatio);
  return results;
}

/**
 * Get individual profile stats for a specific user
 */
export async function getPlayerStatsByUid(
  uid: string,
  userName: string,
  game: CompetitiveGame
): Promise<PlayerCompetitiveStats> {
  const matches = await getConfirmedMatches(game);

  // Check if player appears in matches
  let matchesPlayed = 0;
  let wins = 0;
  let losses = 0;
  let totalKills = 0;
  let totalDeaths = 0;
  const recentForm: ('W' | 'L')[] = [];

  for (const m of matches) {
    if (m.playerStats) {
      const ps = m.playerStats.find((p) => p.uid === uid || p.name.toLowerCase() === userName.toLowerCase());
      if (ps) {
        matchesPlayed++;
        totalKills += ps.kills || 0;
        totalDeaths += ps.deaths || 1;
        const isWin = ps.team === m.winnerName;
        if (isWin) {
          wins++;
          recentForm.unshift('W');
        } else {
          losses++;
          recentForm.unshift('L');
        }
        if (recentForm.length > 5) recentForm.pop();
      }
    }
  }

  // If new user with no confirmed matches yet, return clean initial stats
  if (matchesPlayed === 0) {
    return {
      uid,
      displayName: userName,
      gamingUsername: userName.toUpperCase(),
      game,
      squad: game,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      totalKills: 0,
      totalDeaths: 0,
      kdRatio: 0,
      tournamentsWon: 0,
      tournamentAppearances: 0,
      recentForm: []
    };
  }

  return {
    uid,
    displayName: userName,
    gamingUsername: userName.toUpperCase(),
    game,
    squad: game,
    matchesPlayed,
    wins,
    losses,
    winRate: Math.round((wins / matchesPlayed) * 1000) / 10,
    totalKills,
    totalDeaths,
    kdRatio: Math.round((totalKills / Math.max(1, totalDeaths)) * 100) / 100,
    tournamentsWon: 0,
    tournamentAppearances: 1,
    recentForm
  };
}
