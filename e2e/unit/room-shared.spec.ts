import { test, expect } from '@playwright/test';
import { getActiveVoterIds, isParticipantActive, presenceMs, PRESENCE_TIMEOUT_MS } from '../../lib/room-shared';

const NOW = 10_000_000;

test('presenceMs understands numbers, Timestamps and pending values', () => {
  expect(presenceMs(123)).toBe(123);
  expect(presenceMs({ toMillis: () => 456 })).toBe(456);
  expect(presenceMs(null)).toBeNull();
  expect(presenceMs(undefined)).toBeNull();
  expect(presenceMs({})).toBeNull();
});

test('isParticipantActive treats missing presence as active and old heartbeats as away', () => {
  expect(isParticipantActive(undefined, 'a', NOW)).toBe(true);
  expect(isParticipantActive({ a: NOW - 1_000 }, 'a', NOW)).toBe(true);
  expect(isParticipantActive({ a: NOW - PRESENCE_TIMEOUT_MS }, 'a', NOW)).toBe(false);
});

test('getActiveVoterIds excludes spectators and absent participants', () => {
  const room = {
    participants: {
      host: { role: 'voter' },
      watcher: { role: 'spectator' },
      away: { role: 'voter' },
      fresh: { role: 'voter' },
    },
    presence: { host: NOW, watcher: NOW, away: NOW - PRESENCE_TIMEOUT_MS - 1 },
  };
  expect(getActiveVoterIds(room, NOW).sort()).toEqual(['fresh', 'host']);
});
