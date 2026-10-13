// Helpers shared by the client and the /api/room route.

/** A participant with no heartbeat for this long is treated as gone. */
export const PRESENCE_TIMEOUT_MS = 120_000;
/** How often a joined client refreshes its own presence. */
export const HEARTBEAT_MS = 30_000;

export const SPECIAL_VOTES: readonly (number | string)[] = ['?', '☕'];

/** Milliseconds for a Firestore Timestamp (client or admin), number, or null when unknown/pending. */
export function presenceMs(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (value && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  return null;
}

/** Missing or pending (local, not yet server-stamped) presence counts as active. */
export function isParticipantActive(
  presence: Record<string, unknown> | undefined,
  participantId: string,
  now: number = Date.now()
): boolean {
  const ms = presenceMs(presence?.[participantId]);
  return ms === null ? true : now - ms < PRESENCE_TIMEOUT_MS;
}

/** Ids of active, non-spectator participants. */
export function getActiveVoterIds(
  room: {
    participants: Record<string, { role: string }>;
    presence?: Record<string, unknown>;
  },
  now: number = Date.now()
): string[] {
  return Object.entries(room.participants || {})
    .filter(([id, p]) => p.role !== 'spectator' && isParticipantActive(room.presence, id, now))
    .map(([id]) => id);
}
