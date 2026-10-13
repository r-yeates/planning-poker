import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { FieldValue, Timestamp, type Firestore, type Transaction, type DocumentReference } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { ESTIMATION_SCALES, type ScaleType } from '@/lib/estimation-scales';
import { hashPassword, verifyPassword, type StoredPassword } from '@/lib/room-passwords';
import { getActiveVoterIds, isParticipantActive } from '@/lib/room-shared';

export const runtime = 'nodejs';

/**
 * Every room mutation goes through this route. Firestore rules deny client writes to
 * room documents, so host-only actions and vote privacy are enforced here.
 *
 * Data layout:
 *   rooms/{CODE}                 public room state (voted = who has voted, votes = filled on reveal)
 *   rooms/{CODE}/votes/{uid}     the voter's own vote; readable only by that voter
 *   rooms/{CODE}/private/access  creator id, password hash, failed-attempt counter (server only)
 */

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no look-alikes (0/O, 1/I)
const CODE_LENGTH = 6;
const CODE_PATTERN = /^[A-Z0-9]{4,10}$/;
const ROOM_TTL_MS = 3 * 24 * 60 * 60 * 1000; // idle rooms expire (needs a Firestore TTL policy on `expiresAt`)
const PASSWORD_WINDOW_MS = 10 * 60 * 1000;
const PASSWORD_MAX_FAILURES = 10;
const FIRESTORE_ALREADY_EXISTS = 6;

class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

type Body = Record<string, unknown>;
type Update = Record<string, FieldValue | object | string | number | boolean>;
type Role = 'voter' | 'spectator' | 'admin';

interface RoomDoc {
  roomCode: string;
  participants: Record<string, { name: string; isHost: boolean; role: Role }>;
  voted?: Record<string, boolean>;
  presence?: Record<string, unknown>;
  votesRevealed: boolean;
  autoReveal?: boolean;
  isLocked?: boolean;
  hasPassword?: boolean;
  scaleType?: ScaleType;
  timer?: { startTime: number | null; duration: number; isRunning: boolean };
}

interface AccessDoc extends Partial<StoredPassword> {
  creatorId?: string;
  failures?: number;
  windowStart?: number;
}

const touch = () => ({ expiresAt: Timestamp.fromMillis(Date.now() + ROOM_TTL_MS) });

// ---------- request validation ----------

async function authenticate(req: NextRequest): Promise<string> {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) throw new ApiError(401, 'Sign-in required');
  try {
    return (await adminAuth().verifyIdToken(header.slice(7))).uid;
  } catch {
    throw new ApiError(401, 'Sign-in expired. Please reload the page.');
  }
}

function str(body: Body, key: string, max = 200): string {
  const v = body[key];
  if (typeof v !== 'string' || !v || v.length > max) throw new ApiError(400, `Invalid ${key}`);
  return v;
}

function cleanName(raw: unknown): string {
  const name = typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim() : '';
  if (!name || name.length > 40) throw new ApiError(400, 'Name must be 1–40 characters');
  return name;
}

function scaleOf(value: unknown): ScaleType {
  if (typeof value === 'string' && value in ESTIMATION_SCALES) return value as ScaleType;
  throw new ApiError(400, 'Invalid scale');
}

function roomRefFor(db: Firestore, body: Body) {
  const code = str(body, 'roomCode', 10).toUpperCase();
  if (!CODE_PATTERN.test(code)) throw new ApiError(400, 'Invalid room code');
  return db.collection('rooms').doc(code);
}

// ---------- room helpers ----------

async function loadRoom(tx: Transaction, ref: DocumentReference): Promise<RoomDoc> {
  const snap = await tx.get(ref);
  if (!snap.exists) throw new ApiError(404, 'Room not found');
  return snap.data() as RoomDoc;
}

function requireParticipant(room: RoomDoc, uid: string) {
  const me = room.participants?.[uid];
  if (!me) throw new ApiError(403, 'You are not in this room');
  return me;
}

function requireHost(room: RoomDoc, uid: string) {
  if (!requireParticipant(room, uid).isHost) throw new ApiError(403, 'Only the host can do that');
}

function requireParticipantId(room: RoomDoc, id: unknown): string {
  if (typeof id !== 'string' || !room.participants?.[id]) throw new ApiError(404, 'Participant not found');
  return id;
}

/** Copies every private vote into the public room doc. Reads must precede the caller's writes. */
async function revealVotes(tx: Transaction, ref: DocumentReference, room: RoomDoc) {
  const snap = await tx.get(ref.collection('votes'));
  const votes: Record<string, { value: number | string }> = {};
  snap.forEach((d) => {
    if (room.participants[d.id]) votes[d.id] = { value: d.data().value };
  });
  tx.update(ref, { votesRevealed: true, votes, ...touch() });
}

async function clearAllVotes(tx: Transaction, ref: DocumentReference) {
  const snap = await tx.get(ref.collection('votes'));
  snap.forEach((d) => tx.delete(d.ref));
}

// ---------- actions ----------

type Handler = (db: Firestore, uid: string, body: Body) => Promise<Body>;

const handlers: Record<string, Handler> = {
  async create(db, uid, body) {
    const scaleType = body.scaleType === undefined ? 'fibonacci' : scaleOf(body.scaleType);
    const flag = (k: string) => body[k] === true;
    const password = typeof body.password === 'string' ? body.password.trim() : '';
    if (password.length > 100) throw new ApiError(400, 'Password too long');

    const access: AccessDoc = { creatorId: uid, ...(password ? await hashPassword(password) : {}) };

    for (let attempt = 0; attempt < 8; attempt++) {
      const roomCode = Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
      const ref = db.collection('rooms').doc(roomCode);
      const batch = db.batch();
      // create() fails if the code is taken, so codes can never collide
      batch.create(ref, {
        roomCode,
        participants: {},
        votes: {},
        voted: {},
        presence: {},
        votesRevealed: false,
        autoReveal: flag('autoReveal'),
        anonymousVoting: flag('anonymousVoting'),
        showTooltips: flag('showTooltips'),
        confettiEnabled: false,
        isLocked: false,
        currentTicket: '',
        scaleType,
        createdAt: Timestamp.now(),
        timer: { startTime: null, duration: 0, isRunning: false },
        roundHistory: [],
        ...(password ? { hasPassword: true } : {}),
        ...touch(),
      });
      batch.set(ref.collection('private').doc('access'), access);
      try {
        await batch.commit();
        return { roomCode };
      } catch (err) {
        if ((err as { code?: number }).code === FIRESTORE_ALREADY_EXISTS) continue;
        throw err;
      }
    }
    throw new ApiError(503, 'Could not allocate a room code. Please try again.');
  },

  async join(db, uid, body) {
    const ref = roomRefFor(db, body);
    const name = cleanName(body.name);
    const password = typeof body.password === 'string' ? body.password : '';
    const accessRef = ref.collection('private').doc('access');

    const [roomSnap, accessSnap] = await Promise.all([ref.get(), accessRef.get()]);
    if (!roomSnap.exists) throw new ApiError(404, 'Room not found');
    const room = roomSnap.data() as RoomDoc;
    const access = (accessSnap.data() || {}) as AccessDoc;

    if (!room.participants?.[uid]) {
      // The creator's first join skips the lock and password checks
      const isCreatorFirstJoin = access.creatorId === uid && Object.keys(room.participants || {}).length === 0;
      if (room.isLocked && !isCreatorFirstJoin) {
        throw new ApiError(403, 'This room is locked and not accepting new participants.', 'room_locked');
      }
      if (access.passwordHash && !isCreatorFirstJoin) {
        await checkPassword(db, accessRef, password);
      }
    }

    await db.runTransaction(async (tx) => {
      const current = await loadRoom(tx, ref);
      if (current.participants?.[uid]) return; // already joined
      const isEmpty = Object.keys(current.participants || {}).length === 0;
      if (current.isLocked && !(isEmpty && access.creatorId === uid)) {
        throw new ApiError(403, 'This room is locked and not accepting new participants.', 'room_locked');
      }
      tx.update(ref, {
        [`participants.${uid}`]: { name, isHost: isEmpty, role: 'voter' },
        [`presence.${uid}`]: Timestamp.now(),
        ...touch(),
      });
    });
    return { ok: true };
  },

  async leave(db, uid, body) {
    const ref = roomRefFor(db, body);
    const roomEmpty = await db.runTransaction(async (tx) => {
      const room = await loadRoom(tx, ref);
      const me = room.participants?.[uid];
      if (!me) return false;

      const remaining = Object.keys(room.participants).filter((id) => id !== uid);
      if (remaining.length === 0) return true;

      const update: Update = {
        [`participants.${uid}`]: FieldValue.delete(),
        [`voted.${uid}`]: FieldValue.delete(),
        [`presence.${uid}`]: FieldValue.delete(),
        ...touch(),
      };
      if (me.isHost) {
        // Prefer someone who is actually still here
        const active = remaining.filter((id) => isParticipantActive(room.presence, id));
        const pool = active.length ? active : remaining;
        update[`participants.${pool[randomInt(pool.length)]}.isHost`] = true;
      }
      tx.update(ref, update);
      tx.delete(ref.collection('votes').doc(uid));
      return false;
    });
    if (roomEmpty) await db.recursiveDelete(ref);
    return { ok: true };
  },

  async vote(db, uid, body) {
    const ref = roomRefFor(db, body);
    await db.runTransaction(async (tx) => {
      const room = await loadRoom(tx, ref);
      const me = requireParticipant(room, uid);
      if (me.role === 'spectator') throw new ApiError(403, 'Spectators cannot vote');
      if (room.votesRevealed) throw new ApiError(409, 'Votes are already revealed');
      const value = body.value;
      const allowed = ESTIMATION_SCALES[room.scaleType || 'fibonacci'].values;
      if (!allowed.some((v) => v === value)) throw new ApiError(400, 'Invalid vote for this scale');
      tx.set(ref.collection('votes').doc(uid), { value });
      tx.update(ref, { [`voted.${uid}`]: true, ...touch() });
    });
    return { ok: true };
  },

  async reveal(db, uid, body) {
    const ref = roomRefFor(db, body);
    await db.runTransaction(async (tx) => {
      const room = await loadRoom(tx, ref);
      requireHost(room, uid);
      if (room.votesRevealed) return;
      await revealVotes(tx, ref, room);
    });
    return { ok: true };
  },

  /** Any participant may trigger it, but it only succeeds when every active voter has voted. */
  async autoReveal(db, uid, body) {
    const ref = roomRefFor(db, body);
    const revealed = await db.runTransaction(async (tx) => {
      const room = await loadRoom(tx, ref);
      requireParticipant(room, uid);
      if (room.votesRevealed || !room.autoReveal) return false;
      const voters = getActiveVoterIds(room);
      if (voters.length === 0 || !voters.every((id) => room.voted?.[id])) return false;
      await revealVotes(tx, ref, room);
      return true;
    });
    return { ok: true, revealed };
  },

  async newRound(db, uid, body) {
    const ref = roomRefFor(db, body);
    await db.runTransaction(async (tx) => {
      const room = await loadRoom(tx, ref);
      requireHost(room, uid);
      await clearAllVotes(tx, ref);
      tx.update(ref, { votesRevealed: false, votes: {}, voted: {}, currentTicket: '', ...touch() });
    });
    return { ok: true };
  },

  async clearVote(db, uid, body) {
    const ref = roomRefFor(db, body);
    await db.runTransaction(async (tx) => {
      const room = await loadRoom(tx, ref);
      requireHost(room, uid);
      if (room.votesRevealed) throw new ApiError(409, 'Votes are already revealed');
      const target = requireParticipantId(room, body.targetId);
      tx.delete(ref.collection('votes').doc(target));
      tx.update(ref, { [`voted.${target}`]: FieldValue.delete(), ...touch() });
    });
    return { ok: true };
  },

  async kick(db, uid, body) {
    const ref = roomRefFor(db, body);
    await db.runTransaction(async (tx) => {
      const room = await loadRoom(tx, ref);
      requireHost(room, uid);
      const target = requireParticipantId(room, body.targetId);
      if (target === uid) throw new ApiError(400, 'Use Leave to remove yourself');
      tx.update(ref, {
        [`participants.${target}`]: FieldValue.delete(),
        [`voted.${target}`]: FieldValue.delete(),
        [`presence.${target}`]: FieldValue.delete(),
        ...touch(),
      });
      tx.delete(ref.collection('votes').doc(target));
    });
    return { ok: true };
  },

  async makeHost(db, uid, body) {
    const ref = roomRefFor(db, body);
    await db.runTransaction(async (tx) => {
      const room = await loadRoom(tx, ref);
      requireHost(room, uid);
      const target = requireParticipantId(room, body.targetId);
      if (target === uid) return;
      tx.update(ref, {
        [`participants.${uid}.isHost`]: false,
        [`participants.${target}.isHost`]: true,
        ...touch(),
      });
    });
    return { ok: true };
  },

  async toggleRole(db, uid, body) {
    const ref = roomRefFor(db, body);
    await db.runTransaction(async (tx) => {
      const room = await loadRoom(tx, ref);
      const me = requireParticipant(room, uid);
      const becomingSpectator = me.role !== 'spectator';
      const update: Update = {
        [`participants.${uid}.role`]: becomingSpectator ? 'spectator' : 'voter',
        ...touch(),
      };
      if (becomingSpectator) {
        update[`voted.${uid}`] = FieldValue.delete();
        tx.delete(ref.collection('votes').doc(uid));
        if (room.votesRevealed) update[`votes.${uid}`] = FieldValue.delete();
      }
      tx.update(ref, update);
    });
    return { ok: true };
  },

  async settings(db, uid, body) {
    const ref = roomRefFor(db, body);
    const patch = (body.patch || {}) as Body;
    const allowed = ['autoReveal', 'anonymousVoting', 'showTooltips', 'confettiEnabled', 'isLocked'];
    const update: Record<string, boolean> = {};
    for (const key of allowed) {
      if (key in patch) {
        if (typeof patch[key] !== 'boolean') throw new ApiError(400, `Invalid ${key}`);
        update[key] = patch[key] as boolean;
      }
    }
    if (Object.keys(update).length === 0) throw new ApiError(400, 'No valid settings provided');
    await db.runTransaction(async (tx) => {
      const room = await loadRoom(tx, ref);
      requireHost(room, uid);
      tx.update(ref, { ...update, ...touch() });
    });
    return { ok: true };
  },

  async changeScale(db, uid, body) {
    const ref = roomRefFor(db, body);
    const scaleType = scaleOf(body.scaleType);
    await db.runTransaction(async (tx) => {
      const room = await loadRoom(tx, ref);
      requireHost(room, uid);
      await clearAllVotes(tx, ref);
      tx.update(ref, { scaleType, votesRevealed: false, votes: {}, voted: {}, ...touch() });
    });
    return { ok: true };
  },

  async timer(db, uid, body) {
    const ref = roomRefFor(db, body);
    const op = body.op;
    const minutes = Number(body.minutes);
    await db.runTransaction(async (tx) => {
      const room = await loadRoom(tx, ref);
      requireHost(room, uid);
      if (op === 'start') {
        if (!Number.isFinite(minutes) || minutes < 1 || minutes > 180) throw new ApiError(400, 'Minutes must be 1–180');
        tx.update(ref, { timer: { startTime: Date.now(), duration: Math.round(minutes) * 60, isRunning: true }, ...touch() });
      } else if (op === 'reset') {
        tx.update(ref, { timer: { startTime: null, duration: 0, isRunning: false }, ...touch() });
      } else if (op === 'add') {
        if (!Number.isFinite(minutes) || minutes < 1 || minutes > 60) throw new ApiError(400, 'Minutes must be 1–60');
        if (!room.timer?.isRunning) return;
        tx.update(ref, { 'timer.duration': room.timer.duration + Math.round(minutes) * 60, ...touch() });
      } else {
        throw new ApiError(400, 'Invalid timer operation');
      }
    });
    return { ok: true };
  },
};

/**
 * Verifies a room password and records failures. Failures are persisted outside the
 * throwing path, otherwise the transaction would roll the counter back.
 */
async function checkPassword(db: Firestore, accessRef: DocumentReference, password: string) {
  const outcome = await db.runTransaction(async (tx) => {
    const access = ((await tx.get(accessRef)).data() || {}) as AccessDoc;
    if (!access.passwordHash) return 'ok';

    const now = Date.now();
    let failures = access.failures ?? 0;
    let windowStart = access.windowStart ?? now;
    if (now - windowStart > PASSWORD_WINDOW_MS) {
      failures = 0;
      windowStart = now;
    }
    if (failures >= PASSWORD_MAX_FAILURES) return 'locked';
    if (!password) return 'required';

    if (await verifyPassword({ passwordHash: access.passwordHash, salt: access.salt }, password)) {
      if (failures > 0) tx.update(accessRef, { failures: 0, windowStart: now });
      return 'ok';
    }
    tx.update(accessRef, { failures: failures + 1, windowStart });
    return 'wrong';
  });

  if (outcome === 'locked') throw new ApiError(429, 'Too many incorrect attempts. Try again in a few minutes.', 'rate_limited');
  if (outcome === 'required') throw new ApiError(401, 'This room requires a password', 'password_required');
  if (outcome === 'wrong') throw new ApiError(401, 'Incorrect password', 'wrong_password');
}

export async function POST(req: NextRequest) {
  try {
    const uid = await authenticate(req);
    const body = (await req.json()) as Body;
    const handler = typeof body.action === 'string' && Object.hasOwn(handlers, body.action) ? handlers[body.action] : null;
    if (!handler) throw new ApiError(400, 'Unknown action');
    return NextResponse.json(await handler(adminDb(), uid, body));
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    console.error('room action error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
