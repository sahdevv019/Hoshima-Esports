export interface RosterPlayer {
  id: string;
  name: string;
  tag: string;
  role: string;
  game: string;
  uid?: string;
  color: string;
}

export interface ArcadeGame {
  id?: string;
  title: string;
  desc: string;
  url: string;
  author: string;
  genre: string;
  createdAt?: any;
}

export interface ChatMessage {
  id?: string;
  name: string;
  avatar: string;
  color: string;
  bg?: string;
  time: string;
  text: string;
  timestamp: any;
  uid?: string;
}
