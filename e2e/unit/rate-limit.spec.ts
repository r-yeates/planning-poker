import { test, expect } from '@playwright/test';
import { checkRateLimit, resetRateLimits } from '../../lib/rate-limit';

test.beforeEach(() => resetRateLimits());

test('allows up to the limit then blocks with a retry hint', () => {
  const now = 1_000_000;
  for (let i = 0; i < 5; i++) expect(checkRateLimit('u:a:vote', 5, now + i).allowed).toBe(true);
  const blocked = checkRateLimit('u:a:vote', 5, now + 10);
  expect(blocked.allowed).toBe(false);
  expect(blocked.retryAfterSec).toBeGreaterThan(0);
  expect(blocked.retryAfterSec).toBeLessThanOrEqual(60);
});

test('limits are per key and recover after the window', () => {
  const now = 2_000_000;
  for (let i = 0; i < 3; i++) checkRateLimit('u:a:join', 3, now);
  expect(checkRateLimit('u:a:join', 3, now).allowed).toBe(false);
  expect(checkRateLimit('u:b:join', 3, now).allowed).toBe(true);
  expect(checkRateLimit('u:a:join', 3, now + 61_000).allowed).toBe(true);
});
