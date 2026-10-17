import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, signInAnonymously, connectAuthEmulator } from 'firebase/auth';
import type { ScaleType } from './estimation-scales';
import type { Ticket } from './tickets';

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

// Local emulators for the e2e tests (see playwright.config.ts); never set in production
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

let signInInFlight: Promise<string> | null = null;

/**
 * Sign in anonymously and return the Firebase UID. Concurrent callers share one sign-in;
 * otherwise each would create its own anonymous user and the page could track a different
 * user from the one its API calls are made as.
 */
export const ensureAnonymousAuth = (): Promise<string> => {
  signInInFlight ??= (async () => {
    // Wait for Firebase Auth to restore persisted state before checking currentUser
    await auth.authStateReady();
    if (auth.currentUser) return auth.currentUser.uid;
    const { user } = await signInAnonymously(auth);
    return user.uid;
  })().finally(() => {
    signInInFlight = null;
  });
  return signInInFlight;
};

// Types for our Firestore data
export interface Participant {
  name: string;
  isHost: boolean;
  role: 'voter' | 'spectator' | 'admin';
}

export interface Vote {
  value: number | string; // numbers, T-shirt sizes, '?' or '☕'
}

export interface TimerState {
  startTime: number | null;  // timestamp when timer started
  duration: number;         // duration in seconds
  isRunning: boolean;      // whether timer is currently running
}

export interface RoundResult {
  ticket: Ticket | null;
  votes: Record<string, Vote>;
  voterNames?: Record<string, string>; // omitted in anonymous rooms
  finalEstimate: number | string | null; // null = moved on without an estimate
  completedAt: number;     // timestamp when round was completed
}

export interface Room {
  currentTicket?: string; // DEPRECATED — replaced by `ticket`
  ticket?: Ticket | null; // what is being estimated this round
  backlog?: Ticket[]; // queued tickets, visible to everyone
  ticketIndex?: number | null; // position of `ticket` in `backlog`; null for an ad-hoc ticket
  roundRecorded?: boolean; // the current revealed round is already in roundHistory
  votesRevealed: boolean;
  autoReveal: boolean;
  anonymousVoting: boolean; // Hide voter identities
  showTooltips: boolean; // Show helpful tooltips on voting cards
  confettiEnabled: boolean; // Enable confetti celebrations
  createdAt: Date;
  participants: Record<string, Participant>;
  votes: Record<string, Vote>; // only populated once votes are revealed
  voted?: Record<string, boolean>; // who has voted this round (values stay private until reveal)
  presence?: Record<string, unknown>; // per-participant heartbeat (Firestore Timestamp)
  roomCode: string;
  password?: string; // DEPRECATED — do not use; kept only for type compatibility during migration
  hasPassword?: boolean; // Whether the room has a password (password stored server-side only)
  timer?: TimerState; // Optional timer state
  roundHistory?: RoundResult[];
  scaleType: ScaleType;
  isLocked?: boolean; // Prevent new participants from joining
}

// Room documents are keyed by their room code
export const getRoomByCode = async (code: string) => {
  const id = code.trim().toUpperCase();
  if (!id) return null;
  const snapshot = await getDoc(doc(db, 'rooms', id));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Room & { id: string };
};
