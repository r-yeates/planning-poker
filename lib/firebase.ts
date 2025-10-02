import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import type { ScaleType } from './estimation-scales';

// Function to generate a random room code
const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar looking characters like 1/I, 0/O
  return Array.from({ length: 5 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
};

// Function to check if a room code already exists
const isRoomCodeAvailable = async (code: string) => {
  const roomsRef = collection(db, 'rooms');
  const q = query(roomsRef, where('roomCode', '==', code));
  const snapshot = await getDocs(q);
  return snapshot.empty;
};

// Function to generate a unique room code
export const generateUniqueRoomCode = async (): Promise<string> => {
  let code = generateRoomCode();
  let attempts = 0;
  const maxAttempts = 5;

  while (!(await isRoomCodeAvailable(code)) && attempts < maxAttempts) {
    code = generateRoomCode();
    attempts++;
  }

  if (attempts === maxAttempts) {
    throw new Error('Unable to generate unique room code');
  }

  return code;
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Types for our Firestore data
export interface Participant {
  name: string;
  isHost: boolean;
  role: 'voter' | 'spectator' | 'admin';
}

export interface Vote {
  value: number | '?' | '☕';
}

export interface TimerState {
  startTime: number | null;  // timestamp when timer started
  duration: number;         // duration in seconds
  isRunning: boolean;      // whether timer is currently running
}

export interface RoundResult {
  ticket: string;
  votes: Record<string, Vote>;
  finalEstimate: number;
  completedAt: number;     // timestamp when round was completed
}

export interface TicketItem {
  id: string;
  title: string;
  description?: string;
  addedBy: string; // userId who added the ticket
  addedAt: number; // timestamp
}

export interface Room {
  currentTicket: string;
  ticketQueue: TicketItem[]; // List of tickets ready to be pointed
  votesRevealed: boolean;
  autoReveal: boolean;
  anonymousVoting: boolean; // Hide voter identities
  showTooltips: boolean; // Show helpful tooltips on voting cards
  confettiEnabled: boolean; // Enable confetti celebrations
  createdAt: Date;
  participants: Record<string, Participant>;
  votes: Record<string, Vote>;
  roomCode: string;
  password?: string; // Optional password for room access
  timer?: TimerState; // Optional timer state
  roundHistory: RoundResult[];
  scaleType: ScaleType;
  isTicketQueueCollapsed?: boolean;
  isLocked?: boolean; // Prevent new participants from joining
}

// Function to get room by code
export const getRoomByCode = async (code: string) => {
  const roomsRef = collection(db, 'rooms');
  const q = query(roomsRef, where('roomCode', '==', code.toUpperCase()));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }
  return {
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data()
  } as Room & { id: string };
};



// Function to verify room password
export const verifyRoomPassword = async (code: string, password: string): Promise<boolean> => {
  const room = await getRoomByCode(code);
  if (!room) {
    return false;
  }
  
  // If room has no password, allow access
  if (!room.password) {
    return true;
  }
  
  // Check if provided password matches
  return room.password === password;
};