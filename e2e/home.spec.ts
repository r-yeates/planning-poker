import { test, expect, createRoom, enterName, me, roomCodeOf, card, expectParticipantCount } from './support/fixtures';

test.describe('home page', () => {
  test('creates a room and makes the creator the host', async ({ newPlayer }) => {
    const host = await newPlayer();
    const code = await createRoom(host);
    expect(code).toMatch(/^[A-Z2-9]{6}$/);
    await expect(me(host)).toContainText('Host');
    await expect(host.getByRole('button', { name: 'Room Settings' })).toBeVisible();
  });

  test('joins an existing room by code', async ({ newPlayer }) => {
    const host = await newPlayer();
    const code = await createRoom(host);

    const guest = await newPlayer();
    await guest.goto('/');
    await guest.getByPlaceholder('Enter 6-character code').fill(code.toLowerCase());
    await guest.getByRole('button', { name: 'Join Room' }).click();
    await guest.waitForURL(`/room/${code}`);
    await enterName(guest, 'Guesty');
    await expect(me(guest)).toContainText('Guesty');
    await expectParticipantCount(host, 2);
  });

  test('reports an unknown room code', async ({ newPlayer }) => {
    const page = await newPlayer();
    await page.goto('/');
    await page.getByPlaceholder('Enter 6-character code').fill('ZZZZZZ');
    await page.getByRole('button', { name: 'Join Room' }).click();
    await expect(page.getByText('Room not found. Please check the code and try again.')).toBeVisible();
    await expect(page).toHaveURL('/');
  });

  test('asks for the password of a protected room before leaving the home page', async ({ newPlayer }) => {
    const host = await newPlayer();
    const code = await createRoom(host, { password: 'hunter2' });

    const guest = await newPlayer();
    await guest.goto('/');
    await guest.getByPlaceholder('Enter 6-character code').fill(code);
    await guest.getByRole('button', { name: 'Join Room' }).click();
    await expect(guest.getByText('This room requires a password.')).toBeVisible();
  });

  test('a template sets the scale and settings', async ({ newPlayer }) => {
    const host = await newPlayer();
    await host.goto('/');
    await host.getByRole('button', { name: /^Bug Triage/ }).click();
    await host.waitForURL(/\/room\/[A-Z0-9]{6}$/);
    await enterName(host, 'Hosty');

    // T-shirt sizes and anonymous voting
    await expect(card(host, 'XL')).toBeVisible();
    await expect(card(host, 13)).toHaveCount(0);
    await expect(host.getByText('Anonymous voting is active')).toBeVisible();
    expect(roomCodeOf(host)).toHaveLength(6);
  });
});

test('an unknown room link shows an error', async ({ newPlayer }) => {
  const page = await newPlayer();
  await page.goto('/room/ZZZZZZ');
  await expect(page.getByText('Room not found')).toBeVisible();
});
