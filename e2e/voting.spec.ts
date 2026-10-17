import { test, expect, startRoom, vote, reveal, card, participant, me, setSetting, confirmDialog } from './support/fixtures';

test.describe('voting', () => {
  test('votes stay hidden until the host reveals them', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);

    await vote(guest, 13);
    await expect(participant(host, 'Guesty')).toContainText('✓ Voted');
    await expect(participant(host, 'Guesty')).not.toContainText('13');
    await expect(participant(guest, 'Hosty')).toContainText('Waiting...');
    await expect(host.getByText('1 of 2 voted')).toBeVisible();

    await vote(host, 3);
    await reveal(host);
    await expect(participant(host, 'Guesty')).toContainText('13');
    await expect(participant(guest, 'Hosty')).toContainText('3');
  });

  test('a voter can change their vote before the reveal', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await vote(guest, 3);
    // Rapid changes without waiting: the last click must win
    await card(guest, 13).click();
    await card(guest, 2).click();
    await vote(guest, 21);
    await vote(host, 21);
    await reveal(host);
    await expect(participant(host, 'Guesty')).toContainText('21');
    await expect(host.getByText('Perfect agreement! Everyone voted 21pt.')).toBeVisible();
  });

  test('voting is closed after the reveal', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await vote(guest, 5);
    await vote(host, 5);
    await reveal(host);

    await card(guest, 8).click();
    await expect(participant(host, 'Guesty')).toContainText('5');
    await expect(participant(host, 'Guesty')).not.toContainText('8');
  });

  test('shows statistics after the reveal', async ({ newPlayer }) => {
    const { host, guests } = await startRoom(newPlayer, ['Ana', 'Bo']);
    await vote(host, 2);
    await vote(guests[0], 3);
    await vote(guests[1], 8);
    await reveal(host);

    await expect(host.getByText('3 votes')).toBeVisible();
    await expect(host.getByText('Average', { exact: true })).toBeVisible();
    await expect(host.getByText('4.3', { exact: true })).toBeVisible(); // (2 + 3 + 8) / 3
    await expect(host.getByText('Median', { exact: true })).toBeVisible();
    await expect(host.getByText(/Wide spread across 3 steps/)).toBeVisible();
  });

  test('"?" and coffee votes are reported but not averaged', async ({ newPlayer }) => {
    const { host, guests } = await startRoom(newPlayer, ['Ana', 'Bo']);
    await vote(host, 5);
    await vote(guests[0], '?');
    await vote(guests[1], '☕');
    await reveal(host);

    await expect(host.getByText(/Perfect agreement! Everyone voted 5pt/)).toBeVisible();
    await expect(host.getByText(/1 person voted “\?”/)).toBeVisible();
    await expect(host.getByText(/1 asked for a break/)).toBeVisible();
  });

  test('a reveal with nobody estimating says so', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await vote(host, '?');
    await vote(guest, '?');
    await reveal(host);
    await expect(host.getByText(/Nobody gave an estimate this round/)).toBeVisible();
  });

  test('the host can reveal before everyone has voted', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await vote(host, 8);
    await expect(host.getByText('1 of 2 voted')).toBeVisible();
    await reveal(host);
    await expect(participant(host, 'Guesty')).toContainText('No vote');
    await expect(guest.getByRole('heading', { name: 'Vote Distribution' })).toBeVisible();
  });

  test('only the host sees the reveal and new-round controls', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await expect(host.getByRole('button', { name: 'Reveal Votes' })).toBeVisible();
    await expect(guest.getByRole('button', { name: /reveal/i })).toHaveCount(0);

    await vote(host, 1);
    await vote(guest, 1);
    await reveal(host);
    await expect(host.getByRole('button', { name: 'New Round' })).toBeVisible();
    await expect(guest.getByRole('button', { name: 'New Round' })).toHaveCount(0);
  });

  test('moving on from an unrevealed round asks first', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await vote(guest, 3);

    // "N" starts a new round; with unrevealed votes it must confirm
    await host.keyboard.press('n');
    await confirmDialog(host, 'Cancel');
    await expect(host.getByText('1 of 2 voted')).toBeVisible();

    await host.keyboard.press('n');
    await confirmDialog(host, 'Discard and continue');
    await expect(host.getByText('0 of 2 voted')).toBeVisible();
    await expect(me(guest)).toContainText('Waiting...');
  });
});

test.describe('spectators', () => {
  test('cannot vote and do not hold up the round', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);

    const toggle = guest.getByRole('button', { name: 'Voting', exact: true });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(guest.getByRole('button', { name: 'Spectating', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(guest.getByText(/in spectator mode/)).toBeVisible();
    await expect(card(guest, 5)).toHaveCount(0);
    await expect(participant(host, 'Guesty')).toContainText('Spectator');

    // Only the host counts now
    await expect(host.getByText('0 of 1 voted')).toBeVisible();
    await vote(host, 5);
    await expect(host.getByText('Everyone has voted! Click to reveal.')).toBeVisible();
  });

  test('switching to spectator withdraws an unrevealed vote', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await vote(guest, 8);
    await expect(host.getByText('1 of 2 voted')).toBeVisible();
    await guest.getByRole('button', { name: 'Voting', exact: true }).click();
    await expect(host.getByText('0 of 1 voted')).toBeVisible();

    // And back again
    await guest.getByRole('button', { name: 'Spectating', exact: true }).click();
    await expect(card(guest, 8)).toBeVisible();
    await expect(host.getByText('0 of 2 voted')).toBeVisible();
  });
});

test.describe('auto-reveal', () => {
  test('reveals once every voter has voted', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await setSetting(host, 'Auto-reveal votes', true);

    await vote(host, 3);
    await vote(guest, 5);
    await expect(guest.getByRole('heading', { name: 'Vote Distribution' })).toBeVisible();
    await expect(host.getByRole('heading', { name: 'Vote Distribution' })).toBeVisible();
  });

  test('does not reveal while someone is still voting', async ({ newPlayer }) => {
    const { host } = await startRoom(newPlayer);
    await setSetting(host, 'Auto-reveal votes', true);
    await vote(host, 3);
    // Longer than the client's reveal jitter (1–2.5s)
    await host.waitForTimeout(3_500);
    await expect(host.getByRole('heading', { name: 'Vote Distribution' })).toBeHidden();
  });
});
