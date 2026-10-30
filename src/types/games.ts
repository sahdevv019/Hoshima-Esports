export interface Scrim {
  title: string;
  time: string;
  format: string;
  spots: string;
  status: 'open' | 'full' | 'upcoming';
}

export interface Strategy {
  title: string;
  category: 'attack' | 'defense' | 'rotation' | 'team';
  desc: string;
  author: string;
  likes: number;
}

export interface SquadRole {
  name: string;
  player: string;
  tag: string;
  color: string;
}

export interface TimelineItem {
  time: string;
  title: string;
  desc: string;
}

export interface ObjectiveItem {
  text: string;
}

export interface GameDefinition {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  badgeText: string;
  badgeBorder: string;
  heroBg: string;
  iconBg: string;
  accent: string;
  playersCount: number;
  titlesCount: number;
  rankBadge: string;
  scrims: Scrim[];
  strategies: Strategy[];
  roles: SquadRole[];
  callouts: string[];
  timeline: TimelineItem[];
  objectives: ObjectiveItem[];
}
