import { test, expect, startRoom, createRoom, vote, reveal, card, participant, me } from './support/fixtures';

test.describe('chat', () => {
  test('messages reach the other participants', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    const hostInput = host.getByPlaceholder('Type a message...').filter({ visible: true });
    await expect(guest.getByText('No messages yet. Start the conversation!').filter({ visible: true })).toBeVisible();

    await hostInput.fill('Is this a 5 or an 8?');
    await hostInput.press('Enter');
    await expect(hostInput).toHaveValue('');

    await expect(guest.getByText('Is this a 5 or an 8?').filter({ visible: true })).toBeVisible();
    await expect(guest.getByText(/^Hosty · /).filter({ visible: true })).toBeVisible();
    await expect(host.getByText(/^You · /).filter({ visible: true })).toBeVisible();

    const guestInput = guest.getByPlaceholder('Type a message...').filter({ visible: true });
    await guestInput.fill('Definitely an 8');
    await guest.getByRole('button', { name: 'Send message' }).filter({ visible: true }).click();
    await expect(host.getByText('Definitely an 8').filter({ visible: true })).toBeVisible();
  });

  test('typing in chat does not trigger keyboard shortcuts', async ({ newPlayer }) => {
    const { host } = await startRoom(newPlayer);
    const input = host.getByPlaceholder('Type a message...').filter({ visible: true });
    await input.fill('');
    await input.pressSequentially('5 hrs');
    await expect(me(host)).toContainText('Waiting...');
    await expect(host.getByRole('heading', { name: 'Keyboard Shortcuts' })).toHaveCount(0);
  });
});

test.describe('sharing', () => {
  test('the invite modal shows the code, link and QR code and copies the link', async ({ newPlayer }) => {
    const host = await newPlayer({ permissions: ['clipboard-read', 'clipboard-write'] });
    const code = await createRoom(host);

    await host.getByTitle('Invite — show QR code and link').click();
    await expect(host.getByRole('heading', { name: 'Invite to Room' })).toBeVisible();
    const link = `${new URL(host.url()).origin}/room/${code}`;
    await expect(host.getByText(link)).toBeVisible();
    await expect(host.locator('svg[height="180"]')).toBeVisible(); // the QR code

    await host.getByRole('button', { name: 'Copy Link' }).click();
    await expect(host.getByRole('button', { name: 'Copied!' })).toBeVisible();
    expect(await host.evaluate(() => navigator.clipboard.readText())).toBe(link);

    await host.getByRole('button', { name: 'Close' }).click();
    await expect(host.getByRole('heading', { name: 'Invite to Room' })).toBeHidden();
  });
});

test.describe('timer', () => {
  test('the host starts, extends and stops a timer everyone can see', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await expect(guest.getByRole('button', { name: 'Timer', exact: true })).toHaveCount(0);

    await host.getByRole('button', { name: 'Timer', exact: true }).click();
    await host.getByRole('button', { name: '2m', exact: true }).click();
    await host.getByRole('button', { name: 'Start', exact: true }).click();

    const guestTimer = guest.getByTitle(/^Timer: \d+:\d\d remaining$/);
    await expect(guestTimer).toHaveText(/^[12]:\d\d$/);

    await host.getByTitle('Timer running - click for options').click();
    await host.getByRole('button', { name: '+1 min' }).click();
    await expect(guestTimer).toHaveText(/^(2:[1-5]\d|3:00)$/);

    await host.getByTitle('Timer running - click for options').click();
    await host.getByRole('button', { name: 'Stop Timer' }).click();
    await expect(guestTimer).toHaveCount(0);
    await expect(host.getByRole('button', { name: 'Timer', exact: true })).toBeVisible();
  });
});

test.describe('keyboard shortcuts', () => {
  test('number keys vote, R reveals and H shows help', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);

    await guest.keyboard.press('6'); // sixth Fibonacci card: 8
    await expect(me(guest)).toContainText('✓ Voted');
    await host.keyboard.press('4'); // 3
    await expect(host.getByText('Everyone has voted! Click to reveal.')).toBeVisible();

    await guest.keyboard.press('r'); // host-only, ignored for guests
    await expect(guest.getByRole('heading', { name: 'Vote Distribution' })).toBeHidden();

    await host.keyboard.press('r');
    await expect(participant(host, 'Guesty')).toContainText('8');
    await expect(participant(guest, 'Hosty')).toContainText('3');

    await guest.keyboard.press('h');
    await expect(guest.getByRole('heading', { name: 'Keyboard Shortcuts' })).toBeVisible();
    await expect(guest.getByText('Admin Only')).toHaveCount(0);
    await guest.keyboard.press('Escape');
    await expect(guest.getByRole('heading', { name: 'Keyboard Shortcuts' })).toBeHidden();

    await host.keyboard.press('h');
    await expect(host.getByText('Admin Only')).toBeVisible();
  });

  test('S toggles spectator mode', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await guest.keyboard.press('s');
    await expect(participant(host, 'Guesty')).toContainText('Spectator');
    await expect(card(guest, 5)).toHaveCount(0);
    await guest.keyboard.press('s');
    await expect(card(guest, 5)).toBeVisible();
  });
});

test('the new-round notice can be dismissed', async ({ newPlayer }) => {
  const { host, guest } = await startRoom(newPlayer);
  await vote(host, 1);
  await vote(guest, 2);
  await reveal(host);
  await host.getByRole('button', { name: 'New Round' }).click();

  const notice = guest.getByRole('status', { name: 'New round started' });
  await expect(notice).toBeVisible();
  await notice.getByRole('button', { name: 'Dismiss notification' }).click();
  await expect(notice).toBeHidden();
});
