import { test, expect, startRoom, vote, identityOf, outsider, roomApi, firestoreGet, participant } from './support/fixtures';

/**
 * Server-side rules, exercised directly against /api/room and the Firestore emulator
 * with real participants' tokens — the checks a modified client could try to bypass.
 */
test.describe('API authorization', () => {
  test('rejects requests without a valid token', async ({ request }) => {
    expect((await roomApi(request, null, 'create')).status).toBe(401);
    expect((await roomApi(request, { uid: 'x', token: 'not-a-token' }, 'create')).status).toBe(401);
  });

  test('rejects unknown actions and malformed input', async ({ newPlayer, request }) => {
    const { code, host } = await startRoom(newPlayer);
    const me = await identityOf(host);
    expect((await roomApi(request, me, 'dropTables', { roomCode: code })).status).toBe(400);
    expect((await roomApi(request, me, 'vote', { roomCode: 'not a code!', value: 5 })).status).toBe(400);
    expect((await roomApi(request, me, 'vote', { roomCode: code, value: 7 })).body.error).toBe('Invalid vote for this scale');
    expect((await roomApi(request, me, 'timer', { roomCode: code, op: 'start', minutes: 999 })).status).toBe(400);
    expect((await roomApi(request, me, 'join', { roomCode: code, name: 'x'.repeat(41) })).status).toBe(400);
  });

  test('host-only actions are refused for guests', async ({ newPlayer, request }) => {
    const { code, guest } = await startRoom(newPlayer);
    const guestId = await identityOf(guest);
    for (const [action, payload] of [
      ['reveal', {}],
      ['newRound', {}],
      ['settings', { patch: { isLocked: true } }],
      ['changeScale', { scaleType: 't-shirt' }],
      ['timer', { op: 'start', minutes: 5 }],
    ] as const) {
      const res = await roomApi(request, guestId, action, { roomCode: code, ...payload });
      expect(res.status, action).toBe(403);
      expect(res.body.error, action).toBe('Only the host can do that');
    }
  });

  test('a guest cannot kick the host or make themselves host', async ({ newPlayer, request }) => {
    const { code, host, guest } = await startRoom(newPlayer);
    const hostId = await identityOf(host);
    const guestId = await identityOf(guest);
    expect((await roomApi(request, guestId, 'kick', { roomCode: code, targetId: hostId.uid })).status).toBe(403);
    expect((await roomApi(request, guestId, 'makeHost', { roomCode: code, targetId: guestId.uid })).status).toBe(403);
    await expect(participant(guest, 'Hosty')).toContainText('Host');
  });

  test('non-participants cannot act on a room', async ({ newPlayer, request }) => {
    const { code } = await startRoom(newPlayer);
    const outsiderId = await outsider(newPlayer);
    const res = await roomApi(request, outsiderId, 'vote', { roomCode: code, value: 5 });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('You are not in this room');
  });

  test('spectators cannot vote, and nobody can vote after the reveal', async ({ newPlayer, request }) => {
    const { code, host, guest } = await startRoom(newPlayer);
    const hostId = await identityOf(host);
    const guestId = await identityOf(guest);

    await guest.getByRole('button', { name: 'Voting', exact: true }).click();
    await expect(participant(host, 'Guesty')).toContainText('Spectator');
    expect((await roomApi(request, guestId, 'vote', { roomCode: code, value: 5 })).body.error).toBe('Spectators cannot vote');

    await vote(host, 3);
    expect((await roomApi(request, hostId, 'reveal', { roomCode: code })).status).toBe(200);
    expect((await roomApi(request, hostId, 'vote', { roomCode: code, value: 5 })).status).toBe(409);
  });

  test('a password-protected room refuses joins without the password and locks out guessing', async ({ newPlayer, request }) => {
    const { code } = await startRoom(newPlayer, [], { password: 'hunter2' });
    const id = await outsider(newPlayer);

    expect((await roomApi(request, id, 'join', { roomCode: code, name: 'Eve' })).body.code).toBe('password_required');
    // 10 failures per 10 minutes, then the room refuses even the right password
    for (let i = 0; i < 10; i++) {
      expect((await roomApi(request, id, 'join', { roomCode: code, name: 'Eve', password: `guess${i}` })).body.code).toBe('wrong_password');
    }
    const locked = await roomApi(request, id, 'join', { roomCode: code, name: 'Eve', password: 'hunter2' });
    expect(locked.status).toBe(429);
    expect(locked.body.code).toBe('rate_limited');
  });
});

test.describe('vote privacy (Firestore rules)', () => {
  test('a voter can read their own vote but not anyone else’s', async ({ newPlayer, request }) => {
    const { code, host, guest } = await startRoom(newPlayer);
    const hostId = await identityOf(host);
    const guestId = await identityOf(guest);
    await vote(host, 13);

    expect(await firestoreGet(request, hostId, `rooms/${code}/votes/${hostId.uid}`)).toBe(200);
    expect(await firestoreGet(request, guestId, `rooms/${code}/votes/${hostId.uid}`)).toBe(403);
  });

  test('nobody can read the private access document', async ({ newPlayer, request }) => {
    const { code, host } = await startRoom(newPlayer, [], { password: 'hunter2' });
    expect(await firestoreGet(request, await identityOf(host), `rooms/${code}/private/access`)).toBe(403);
  });

  test('the public room document has no vote values before the reveal', async ({ newPlayer, request }) => {
    const { code, host, guest } = await startRoom(newPlayer);
    await vote(guest, 21);
    const url = `http://127.0.0.1:8080/v1/projects/demo-sprintro/databases/(default)/documents/rooms/${code}`;
    const res = await request.get(url, { headers: { Authorization: `Bearer ${(await identityOf(host)).token}` } });
    const doc = JSON.stringify(await res.json());
    expect(doc).toContain('voted');
    expect(doc).not.toContain('"21"');
    expect(doc).not.toContain('"integerValue":"21"');
  });
});

test.describe('rate limiting', () => {
  test('a flood of votes is cut off with 429 and Retry-After', async ({ newPlayer, request }) => {
    const { code, host } = await startRoom(newPlayer);
    const id = await identityOf(host);

    let blocked: Awaited<ReturnType<typeof roomApi>> | null = null;
    for (let i = 0; i < 70 && !blocked; i++) {
      const res = await roomApi(request, id, 'vote', { roomCode: code, value: i % 2 ? 3 : 5 });
      if (res.status === 429) blocked = res;
      else expect(res.status).toBe(200);
    }
    expect(blocked, 'expected the vote limit (60/min) to kick in').not.toBeNull();
    expect(blocked!.body.code).toBe('too_many_requests');
    expect(Number(blocked!.headers['retry-after'])).toBeGreaterThan(0);

    // The app shows the server's message instead of failing silently
    await host.getByRole('button', { name: '8', exact: true }).click();
    // (filtered: Next's route announcer is also an alert)
    await expect(host.getByRole('alert').filter({ hasText: 'Too many requests' })).toBeVisible();
  });
});
