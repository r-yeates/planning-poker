import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
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
export const auth = getAuth(app);

/** Sign in anonymously and return the Firebase UID, falling back to crypto.randomUUID. */
export const ensureAnonymousAuth = async (): Promise<string> => {
  // Wait for Firebase Auth to restore persisted state from localStorage before checking currentUser
  await auth.authStateReady();
  if (auth.currentUser) return auth.currentUser.uid;
  try {
    const { user } = await signInAnonymously(auth);
    return user.uid;
  } catch {
    // Fallback: generate a local UUID if auth is unavailable
    const stored = localStorage.getItem('userId');
    if (stored) return stored;
    const id = crypto.randomUUID();
    localStorage.setItem('userId', id);
    return id;
  }
};

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

export interface Room {
  currentTicket: string;
  votesRevealed: boolean;
  autoReveal: boolean;
  anonymousVoting: boolean; // Hide voter identities
  showTooltips: boolean; // Show helpful tooltips on voting cards
  confettiEnabled: boolean; // Enable confetti celebrations
  createdAt: Date;
  participants: Record<string, Participant>;
  votes: Record<string, Vote>;
  roomCode: string;
  password?: string; // DEPRECATED — do not use; kept only for type compatibility during migration
  hasPassword?: boolean; // Whether the room has a password (password stored server-side only)
  timer?: TimerState; // Optional timer state
  roundHistory: RoundResult[];
  scaleType: ScaleType;
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