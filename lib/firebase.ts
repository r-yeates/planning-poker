import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, updateDoc, increment, setDoc, getDoc } from 'firebase/firestore';
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
  lastActivity?: Date; // Track when participant was last active
  status?: 'active' | 'idle' | 'disconnected'; // Current activity status
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

// Analytics Types
export interface GlobalAnalytics {
  totalRoomsCreated: number;
  totalParticipants: number;
  totalVotesCast: number;
  totalRoomsActive: number;
  totalVotingRounds: number;
  averageRoomSize: number;
  lastUpdated: Date;
  createdAt: Date;
}

export interface DailyAnalytics {
  date: string; // YYYY-MM-DD format
  roomsCreated: number;
  participantsJoined: number;
  votesCast: number;
  votingRounds: number;
  createdAt: Date;
}

// Analytics Functions
export const incrementAnalytic = async (metric: keyof Omit<GlobalAnalytics, 'lastUpdated' | 'createdAt' | 'averageRoomSize'>, value: number = 1) => {
  console.log(`📊 Incrementing global analytic: ${metric} by ${value}`);
  try {
    const analyticsRef = doc(db, 'analytics', 'global');
    await updateDoc(analyticsRef, {
      [metric]: increment(value),
      lastUpdated: new Date()
    });
    console.log(`✅ Successfully incremented ${metric}`);
  } catch (error) {
    console.log(`⚠️ Document not found, initializing analytics...`);
    // If document doesn't exist, create it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).code === 'not-found') {
      await initializeAnalytics();
      const analyticsRef = doc(db, 'analytics', 'global');
      await updateDoc(analyticsRef, {
        [metric]: increment(value),
        lastUpdated: new Date()
      });
      console.log(`✅ Analytics initialized and ${metric} incremented`);
    } else {
      console.error('❌ Error updating analytics:', error);
      throw error;
    }
  }
};

export const incrementDailyAnalytic = async (metric: keyof Omit<DailyAnalytics, 'date' | 'createdAt'>, value: number = 1) => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  console.log(`📅 Incrementing daily analytic for ${today}: ${metric} by ${value}`);
  try {
    const dailyRef = doc(db, 'analytics', `daily-${today}`);
    
    // Check if document exists
    const docSnap = await getDoc(dailyRef);
    
    if (!docSnap.exists()) {
      console.log(`📋 Creating new daily analytics document for ${today}`);
      // Create new daily document
      await setDoc(dailyRef, {
        date: today,
        roomsCreated: 0,
        participantsJoined: 0,
        votesCast: 0,
        votingRounds: 0,
        createdAt: new Date()
      });
    }
    
    await updateDoc(dailyRef, {
      [metric]: increment(value)
    });
    console.log(`✅ Successfully incremented daily ${metric}`);
  } catch (error) {
    console.error('❌ Error updating daily analytics:', error);
    throw error;
  }
};

export const initializeAnalytics = async () => {
  console.log('🚀 Initializing analytics document...');
  try {
    const analyticsRef = doc(db, 'analytics', 'global');
    const docSnap = await getDoc(analyticsRef);
    
    if (!docSnap.exists()) {
      console.log('📊 Creating new global analytics document...');
      await setDoc(analyticsRef, {
        totalRoomsCreated: 0,
        totalParticipants: 0,
        totalVotesCast: 0,
        totalRoomsActive: 0,
        totalVotingRounds: 0,
        averageRoomSize: 0,
        lastUpdated: new Date(),
        createdAt: new Date()
      });
      console.log('✅ Global analytics document created successfully');
    } else {
      console.log('📊 Global analytics document already exists');
    }
  } catch (error) {
    console.error('❌ Error initializing analytics:', error);
    throw error;
  }
};

export const getGlobalAnalytics = async (): Promise<GlobalAnalytics | null> => {
  try {
    const analyticsRef = doc(db, 'analytics', 'global');
    const docSnap = await getDoc(analyticsRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as GlobalAnalytics;
    }
    return null;
  } catch (error) {
    console.error('Error getting analytics:', error);
    return null;
  }
};

export const getDailyAnalytics = async (date: string): Promise<DailyAnalytics | null> => {
  try {
    const dailyRef = doc(db, 'analytics', `daily-${date}`);
    const docSnap = await getDoc(dailyRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as DailyAnalytics;
    }
    return null;
  } catch (error) {
    console.error('Error getting daily analytics:', error);
    return null;
  }
};

// Analytics tracking functions for specific events
export const trackRoomCreated = async () => {
  console.log('🏠 Tracking room created...');
  try {
    await incrementAnalytic('totalRoomsCreated');
    await incrementAnalytic('totalRoomsActive');
    await incrementDailyAnalytic('roomsCreated');
    console.log('✅ Room creation tracked successfully');
  } catch (error) {
    console.error('❌ Error tracking room creation:', error);
  }
};

export const trackParticipantJoined = async () => {
  console.log('👤 Tracking participant joined...');
  try {
    await incrementAnalytic('totalParticipants');
    await incrementDailyAnalytic('participantsJoined');
    console.log('✅ Participant join tracked successfully');
  } catch (error) {
    console.error('❌ Error tracking participant join:', error);
  }
};

export const trackVoteCast = async () => {
  console.log('🗳️ Tracking vote cast...');
  try {
    await incrementAnalytic('totalVotesCast');
    await incrementDailyAnalytic('votesCast');
    console.log('✅ Vote cast tracked successfully');
  } catch (error) {
    console.error('❌ Error tracking vote cast:', error);
  }
};

export const trackVotingRoundCompleted = async () => {
  console.log('🎯 Tracking voting round completed...');
  try {
    await incrementAnalytic('totalVotingRounds');
    await incrementDailyAnalytic('votingRounds');
    console.log('✅ Voting round completion tracked successfully');
  } catch (error) {
    console.error('❌ Error tracking voting round completion:', error);
  }
};

export const trackRoomClosed = async () => {
  console.log('🚪 Tracking room closed...');
  try {
    await incrementAnalytic('totalRoomsActive', -1);
    console.log('✅ Room closure tracked successfully');
  } catch (error) {
    console.error('❌ Error tracking room closure:', error);
  }
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

// Demo room creation function
export const createDemoRoom = async (): Promise<string> => {
  console.log('🎭 Creating demo room...');
  
  const demoParticipants = {
    'demo-user-1': {
      name: 'Sarah Chen (Product Owner)',
      isHost: true,
      role: 'voter' as const
    },
    'demo-user-2': {
      name: 'Marcus Johnson (Tech Lead)',
      isHost: false,
      role: 'voter' as const
    },
    'demo-user-3': {
      name: 'Elena Rodriguez (Frontend Dev)',
      isHost: false,
      role: 'voter' as const
    },
    'demo-user-4': {
      name: 'David Kim (Backend Dev)',
      isHost: false,
      role: 'voter' as const
    },
    'demo-user-5': {
      name: 'Aisha Patel (QA Engineer)',
      isHost: false,
      role: 'voter' as const
    },
    'demo-user-6': {
      name: 'Tom Wilson (DevOps)',
      isHost: false,
      role: 'voter' as const
    },
    'demo-user-7': {
      name: 'Lisa Zhang (UX Designer)',
      isHost: false,
      role: 'spectator' as const
    },
    'demo-user-8': {
      name: 'Ahmed Al-Hassan (Scrum Master)',
      isHost: false,
      role: 'spectator' as const
    }
  };

  const roomCode = await generateUniqueRoomCode();
  const demoRoomData: Omit<Room, 'createdAt'> & { createdAt: Date } = {
    roomCode,
    participants: demoParticipants,
    votes: {}, // Start with no votes
    votesRevealed: false,
    autoReveal: false, // Disable auto-reveal for demo control
    anonymousVoting: false,
    showTooltips: true,
    confettiEnabled: true, // Enable confetti by default
    currentTicket: 'User Story: Shopping Cart - Add ability to save items for later purchase',
    ticketQueue: [
      {
        id: 'ticket-1',
        title: 'API Rate Limiting Implementation',
        description: 'Implement throttling for external API calls to prevent abuse',
        addedBy: 'demo-user-1',
        addedAt: Date.now()
      },
      {
        id: 'ticket-2', 
        title: 'User Profile Settings Page',
        description: 'Create a comprehensive settings page where users can manage their profile information',
        addedBy: 'demo-user-2',
        addedAt: Date.now()
      },
      {
        id: 'ticket-3',
        title: 'Database Migration Tool',
        description: 'Automated schema update system for production deployments',
        addedBy: 'demo-user-3',
        addedAt: Date.now()
      }
    ],
    scaleType: 'fibonacci',
    createdAt: new Date(),
    timer: {
      startTime: null,
      duration: 0,
      isRunning: false
    },
    roundHistory: [
      {
        ticket: 'User Authentication System - OAuth 2.0 integration with social providers',
        votes: {
          'demo-user-1': { value: 5 },
          'demo-user-2': { value: 8 },
          'demo-user-3': { value: 5 },
          'demo-user-4': { value: 8 },
          'demo-user-5': { value: 5 },
          'demo-user-6': { value: 5 }
        },
        finalEstimate: 5,
        completedAt: Date.now() - 1800000 // 30 minutes ago
      },
      {
        ticket: 'Database Migration Tool - Automated schema update system',
        votes: {
          'demo-user-1': { value: 3 },
          'demo-user-2': { value: 5 },
          'demo-user-3': { value: 3 },
          'demo-user-4': { value: 5 },
          'demo-user-5': { value: 3 },
          'demo-user-6': { value: 3 }
        },
        finalEstimate: 3,
        completedAt: Date.now() - 3600000 // 1 hour ago
      }
    ]
  };

  try {
    const docRef = await addDoc(collection(db, 'rooms'), demoRoomData);
    console.log(`✅ Demo room created with code: ${roomCode}`);
    
    // Start the demo progression after a short delay
    setTimeout(() => startDemoProgression(docRef.id), 2000);
    
    return roomCode;
  } catch (error) {
    console.error('❌ Error creating demo room:', error);
    throw error;
  }
};

// Function to simulate voting progression in demo room
const startDemoProgression = async (roomId: string) => {
  console.log('🎭 Starting demo voting progression...');
  
  const demoVotingSequence = [
    // Round 1: Team members vote gradually
    { delay: 3000, action: 'vote', userId: 'demo-user-1', value: 8, message: 'Sarah votes 8' },
    { delay: 5000, action: 'vote', userId: 'demo-user-3', value: 5, message: 'Elena votes 5' },
    { delay: 7000, action: 'vote', userId: 'demo-user-2', value: 13, message: 'Marcus votes 13' },
    { delay: 9000, action: 'vote', userId: 'demo-user-5', value: 8, message: 'Aisha votes 8' },
    { delay: 11000, action: 'vote', userId: 'demo-user-4', value: 13, message: 'David votes 13' },
    { delay: 13000, action: 'vote', userId: 'demo-user-6', value: 5, message: 'Tom votes 5' },
    
    // Reveal votes and show consensus
    { delay: 15000, action: 'reveal', message: 'Revealing votes...' },
    
    // Start new round
    { delay: 20000, action: 'newRound', 
      ticket: 'API Rate Limiting - Implement throttling for external API calls',
      message: 'Starting new round...' },
    
    // Round 2: Faster voting with better consensus
    { delay: 23000, action: 'vote', userId: 'demo-user-1', value: 5, message: 'Sarah votes 5' },
    { delay: 24000, action: 'vote', userId: 'demo-user-2', value: 5, message: 'Marcus votes 5' },
    { delay: 25000, action: 'vote', userId: 'demo-user-3', value: 8, message: 'Elena votes 8' },
    { delay: 26000, action: 'vote', userId: 'demo-user-4', value: 5, message: 'David votes 5' },
    { delay: 27000, action: 'vote', userId: 'demo-user-5', value: 5, message: 'Aisha votes 5' },
    { delay: 28000, action: 'vote', userId: 'demo-user-6', value: 5, message: 'Tom votes 5' },
    
    // Final reveal
    { delay: 30000, action: 'reveal', message: 'Final reveal - great consensus!' },
  ];

  // Execute the demo sequence
  for (const step of demoVotingSequence) {
    setTimeout(async () => {
      try {
        console.log(`🎭 Demo: ${step.message}`);
        const docRef = doc(db, 'rooms', roomId);
        
        switch (step.action) {
          case 'vote':
            await updateDoc(docRef, {
              [`votes.${step.userId}`]: { value: step.value }
            });
            break;
            
          case 'reveal':
            await updateDoc(docRef, {
              votesRevealed: true
            });
            break;
            
          case 'newRound':
            await updateDoc(docRef, {
              votesRevealed: false,
              votes: {},
              currentTicket: step.ticket
            });
            break;
        }
      } catch (error) {
        console.error('❌ Demo progression error:', error);
      }
    }, step.delay);
  }
};
