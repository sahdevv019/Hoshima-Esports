import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ChatMessage } from '../types/roster';

export function subscribeToChannelMessages(
  gameId: string,
  channel: string,
  callback: (messages: ChatMessage[]) => void
) {
  const collectionName = `chats_${gameId}_${channel}`;
  const chatRef = collection(db, collectionName);
  const q = query(chatRef, orderBy('timestamp', 'asc'), limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((d) => {
        messages.push({
          ...(d.data() as Omit<ChatMessage, 'id'>),
          id: d.id
        });
      });
      callback(messages);
    },
    (err) => {
      console.warn(`[Hoshima Chat] Channel ${collectionName} listener warning:`, err.message);
      callback([]);
    }
  );
}

export async function sendChannelMessage(
  gameId: string,
  channel: string,
  msg: {
    name: string;
    avatar: string;
    color: string;
    text: string;
    uid?: string;
  }
): Promise<void> {
  const text = msg.text.trim();
  if (!text) return;

  const collectionName = `chats_${gameId}_${channel}`;
  const chatRef = collection(db, collectionName);

  await addDoc(chatRef, {
    name: msg.name,
    avatar: msg.avatar,
    color: msg.color,
    bg: 'rgba(255,255,255,.05)',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    text,
    uid: msg.uid || null,
    timestamp: serverTimestamp()
  });
}
