import {
  test,
  expect,
  startRoom,
  vote,
  reveal,
  card,
  participant,
  me,
  setSetting,
  openSettings,
  confirmDialog,
  expectParticipantCount,
} from './support/fixtures';

test.describe('participant management', () => {
  test('the host can hand over the host role', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await participant(host, 'Guesty').getByRole('button', { name: 'Make Host' }).click();

    await expect(me(guest)).toContainText('Host');
    await expect(guest.getByRole('button', { name: 'Room Settings' })).toBeVisible();
    await expect(host.getByRole('button', { name: 'Room Settings' })).toHaveCount(0);
    await expect(host.getByRole('button', { name: 'Reveal Votes' })).toHaveCount(0);
  });

  test('the host can clear one participant’s vote', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await vote(guest, 8);
    await expect(host.getByText('1 of 2 voted')).toBeVisible();

    await participant(host, 'Guesty').getByRole('button', { name: 'Clear Vote' }).click();
    await expect(host.getByText('0 of 2 voted')).toBeVisible();
    await expect(me(guest)).toContainText('Waiting...');
  });

  test('a removed participant sees why and cannot rejoin', async ({ newPlayer }) => {
    const { code, host, guest } = await startRoom(newPlayer);
    await participant(host, 'Guesty').getByRole('button', { name: 'Remove participant' }).click();

    await expect(guest.getByRole('heading', { name: 'You were removed' })).toBeVisible();
    await expectParticipantCount(host, 1);

    // A reload auto-joins with the saved name, and the server refuses
    await guest.goto(`/room/${code}`);
    await expect(guest.getByRole('heading', { name: 'You were removed' })).toBeVisible();
    await expectParticipantCount(host, 1);

    await guest.getByRole('button', { name: 'Back to home' }).click();
    await guest.waitForURL('/');
  });

  test('guests get no management controls', async ({ newPlayer }) => {
    const { guest } = await startRoom(newPlayer);
    const hostCard = participant(guest, 'Hosty');
    await expect(hostCard.getByRole('button')).toHaveCount(0);
  });

  test('when the host leaves, someone else becomes host', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await host.getByRole('button', { name: 'Leave' }).click();
    const dialog = host.getByRole('alertdialog');
    await expect(dialog).toContainText('The host role will pass to another participant.');
    await confirmDialog(host, 'Leave');
    await host.waitForURL('/');

    await expectParticipantCount(guest, 1);
    await expect(me(guest)).toContainText('Host');
  });

  test('cancelling the leave dialog keeps you in the room', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await guest.getByRole('button', { name: 'Leave' }).click();
    await confirmDialog(guest, 'Cancel');
    await expect(me(guest)).toBeVisible();
    await expectParticipantCount(host, 2);
  });
});

test.describe('room settings', () => {
  test('are only offered to the host; guests see read-only badges', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await expect(guest.getByRole('button', { name: 'Room Settings' })).toHaveCount(0);

    const badges = guest.getByLabel('Room settings');
    await expect(badges).toContainText('Fibonacci');
    await expect(badges.getByText('Auto-reveal')).toHaveClass(/line-through/);

    await setSetting(host, 'Auto-reveal votes', true);
    await setSetting(host, 'Lock room', true);
    await expect(badges.getByText('Auto-reveal')).not.toHaveClass(/line-through/);
    await expect(badges.getByText('Locked')).not.toHaveClass(/line-through/);
  });

  test('anonymous voting hides names', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await setSetting(host, 'Anonymous voting', true);

    await expect(guest.getByText('Anonymous voting is active')).toBeVisible();
    await expect(participant(guest, 'Hosty')).toHaveCount(0);
    await expect(guest.getByTestId('participant-card').filter({ hasText: 'Anonymous' })).toHaveCount(2);

    await setSetting(host, 'Anonymous voting', false);
    await expect(participant(guest, 'Hosty')).toBeVisible();
  });

  test('changing the scale swaps the cards and clears votes after confirming', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await vote(guest, 5);
    await openSettings(host);
    const scale = host.getByRole('combobox');

    await scale.selectOption({ label: 'T-Shirt Sizes' });
    await confirmDialog(host, 'Cancel');
    await expect(card(guest, 5)).toBeVisible();
    await expect(host.getByText('1 of 2 voted')).toBeVisible();

    await scale.selectOption({ label: 'T-Shirt Sizes' });
    await confirmDialog(host, 'Change scale');
    await expect(card(guest, 'XL')).toBeVisible();
    await expect(card(guest, 5)).toHaveCount(0);
    await expect(host.getByText('0 of 2 voted')).toBeVisible();

    await vote(guest, 'M');
    await vote(host, 'L');
    await reveal(host);
    await expect(participant(host, 'Guesty')).toContainText('M');
  });

  test('card tooltips can be turned on', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await expect(card(guest, 13)).not.toHaveAttribute('title');
    await setSetting(host, 'Card tooltips', true);
    await expect(card(guest, 13)).toHaveAttribute('title', /Epic task/);
  });
});
