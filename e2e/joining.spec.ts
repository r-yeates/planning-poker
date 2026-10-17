import {
  test,
  expect,
  createRoom,
  joinRoom,
  enterName,
  me,
  participant,
  setSetting,
  expectParticipantCount,
} from './support/fixtures';

test.describe('name prompt', () => {
  test('requires a name', async ({ newPlayer }) => {
    const host = await newPlayer();
    const code = await createRoom(host);

    const guest = await newPlayer();
    await guest.goto(`/room/${code}`);
    await expect(guest.getByRole('heading', { name: 'Enter Your Name' })).toBeVisible();
    await expect(guest.getByRole('button', { name: 'Join Room' })).toBeDisabled();
    await guest.getByPlaceholder('Your name').fill('   ');
    await expect(guest.getByRole('button', { name: 'Join Room' })).toBeDisabled();
  });

  test('collapses whitespace in names', async ({ newPlayer }) => {
    const host = await newPlayer();
    const code = await createRoom(host);
    const guest = await newPlayer();
    await joinRoom(guest, code, '  Ada    Lovelace ');
    await expect(participant(host, 'Ada Lovelace')).toBeVisible();
  });

  test('remembers the name and rejoins on reload', async ({ newPlayer }) => {
    const host = await newPlayer();
    const code = await createRoom(host);
    const guest = await newPlayer();
    await joinRoom(guest, code, 'Guesty');

    await guest.reload();
    await expect(me(guest)).toContainText('Guesty');
    await expect(guest.getByPlaceholder('Your name')).toHaveCount(0);
    await expectParticipantCount(host, 2);
  });
});

test.describe('password-protected rooms', () => {
  test('the creator joins without the password', async ({ newPlayer }) => {
    const host = await newPlayer();
    await createRoom(host, { password: 'hunter2' });
    await expect(me(host)).toContainText('Host');
  });

  test('rejects a wrong password and accepts the right one', async ({ newPlayer }) => {
    const host = await newPlayer();
    const code = await createRoom(host, { password: 'hunter2' });

    const guest = await newPlayer();
    await guest.goto(`/room/${code}`);
    await expect(guest.getByRole('heading', { name: 'Enter Name & Password' })).toBeVisible();
    await enterName(guest, 'Guesty', 'wrong');
    await expect(guest.getByText('Incorrect password')).toBeVisible();

    await enterName(guest, 'Guesty', 'hunter2');
    await expect(me(guest)).toContainText('Guesty');
    await expectParticipantCount(host, 2);
  });
});

test.describe('locked rooms', () => {
  test('turn away new participants but keep existing ones', async ({ newPlayer }) => {
    const host = await newPlayer();
    const code = await createRoom(host);
    const guest = await newPlayer();
    await joinRoom(guest, code, 'Guesty');

    await setSetting(host, 'Lock room', true);

    const latecomer = await newPlayer();
    await latecomer.goto(`/room/${code}`);
    await enterName(latecomer, 'Late');
    await expect(latecomer.getByText('This room is locked and not accepting new participants.')).toBeVisible();

    // An existing participant can still come back
    await guest.reload();
    await expect(me(guest)).toContainText('Guesty');
    await expectParticipantCount(host, 2);

    // Unlocking lets the latecomer in
    await setSetting(host, 'Lock room', false);
    await joinRoom(latecomer, code, 'Late');
    await expectParticipantCount(host, 3);
  });
});
