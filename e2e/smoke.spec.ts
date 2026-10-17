import { test, expect, startRoom, vote, reveal, participant, expectParticipantCount, confirmDialog } from './support/fixtures';

test('join → vote → reveal → next round → leave', async ({ newPlayer }) => {
  const { host, guest } = await startRoom(newPlayer);

  await vote(host, 5);
  await vote(guest, 8);
  await expect(host.getByText('Everyone has voted! Click to reveal.')).toBeVisible();

  await reveal(host);
  await expect(guest.getByRole('heading', { name: 'Vote Distribution' })).toBeVisible();
  await expect(participant(guest, 'Hosty')).toContainText('5');
  await expect(participant(host, 'Guesty')).toContainText('8');

  await host.getByRole('button', { name: 'New Round' }).click();
  await expect(guest.getByRole('status', { name: 'New round started' })).toBeVisible();
  await expect(host.getByText('0 of 2 voted')).toBeVisible();
  await expect(guest.getByRole('heading', { name: 'Vote Distribution' })).toBeHidden();

  await guest.getByRole('button', { name: 'Leave' }).click();
  await confirmDialog(guest, 'Leave');
  await guest.waitForURL('/');
  await expectParticipantCount(host, 1);
});
