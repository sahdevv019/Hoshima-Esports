export type CompetitiveGame = 'Free Fire Max' | 'BGMI' | 'Valorant' | 'Mobile Legends';

export const COMPETITIVE_GAMES: CompetitiveGame[] = [
  'Free Fire Max',
  'BGMI',
  'Valorant',
  'Mobile Legends'
];

export type ScrimStatus =
  | 'scheduled'
  | 'registration-open'
  | 'registration-closed'
  | 'live'
  | 'completed'
  | 'cancelled';

export interface Scrim {
  id: string;
  title: string;
  game: CompetitiveGame;
  squad: string;
  map: string;
  format: string;
  scheduledTime: any; // Firestore Timestamp or ISO string
  registrationDeadline: any;
  maxParticipants: number;
  currentParticipants: number;
  rules: string;
  description?: string;
  status: ScrimStatus;
  createdBy: string;
  creatorName: string;
  creatorRole: 'admin' | 'captain';
  createdAt?: any;
  updatedAt?: any;
  hasResults?: boolean;
}

export type ScrimRegistrationStatus = 'registered' | 'withdrawn' | 'confirmed';

export interface ScrimRegistration {
  id: string; // Document ID: `${scrimId}_${userId}`
  scrimId: string;
  game: CompetitiveGame;
  userId: string;
  userName: string;
  teamName: string;
  contact: string;
  playerUids?: string[];
  status: ScrimRegistrationStatus;
  registeredAt: any;
  withdrawnAt?: any;
}

export type TournamentStatus =
  | 'upcoming'
  | 'registration-open'
  | 'registration-closed'
  | 'in-progress'
  | 'completed'
  | 'cancelled';

export type TournamentFormat = 'single-elimination' | 'round-robin';

export interface Tournament {
  id: string;
  name: string;
  game: CompetitiveGame;
  description: string;
  startDate: any;
  endDate: any;
  registrationDeadline: any;
  maxTeams: number;
  currentTeams: number;
  format: TournamentFormat;
  rules: string;
  prizePool: string;
  bannerUrl?: string;
  status: TournamentStatus;
  createdBy: string;
  creatorName?: string;
  champion?: string;
  runnerUp?: string;
  createdAt?: any;
  updatedAt?: any;
}

export type TournamentRegistrationStatus = 'registered' | 'approved' | 'rejected' | 'withdrawn';

export interface TournamentTeamMember {
  uid?: string;
  name: string;
  role?: string;
  inGameId?: string;
}

export interface TournamentRegistration {
  id: string; // Document ID: `${tournamentId}_${captainUid}`
  tournamentId: string;
  game: CompetitiveGame;
  captainUid: string;
  captainName: string;
  teamName: string;
  contact: string;
  roster: TournamentTeamMember[];
  status: TournamentRegistrationStatus;
  registeredAt: any;
  approvedAt?: any;
  reviewedBy?: string;
  seed?: number;
}

export type MatchCompetitionType = 'scrim' | 'tournament';
export type MatchStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

export interface MatchParticipant {
  id: string;
  name: string;
  score?: number;
  isWinner?: boolean;
}

export interface PlayerMatchPerformance {
  uid?: string;
  name: string;
  team: string;
  kills: number;
  deaths: number;
  assists?: number;
  damage?: number;
  score?: number;
  isMVP?: boolean;
}

export interface CompetitiveMatch {
  id: string;
  competitionType: MatchCompetitionType;
  competitionId: string;
  game: CompetitiveGame;
  round?: string | number;
  matchNumber?: number;
  teamA: MatchParticipant;
  teamB: MatchParticipant;
  status: MatchStatus;
  winnerId?: string;
  winnerName?: string;
  scheduledTime: any;
  completedAt?: any;
  proposedBy?: string;
  confirmedBy?: string;
  isConfirmed: boolean;
  playerStats?: PlayerMatchPerformance[];
  map?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface PlayerCompetitiveStats {
  uid: string;
  displayName: string;
  gamingUsername: string;
  game: CompetitiveGame;
  squad: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number; // percentage (0..100)
  totalKills: number;
  totalDeaths: number;
  kdRatio: number;
  tournamentsWon: number;
  tournamentAppearances: number;
  recentForm: ('W' | 'L')[];
}

export interface TeamLeaderboardEntry {
  squadName: string;
  game: CompetitiveGame;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  points: number;
  trophies: number;
}
