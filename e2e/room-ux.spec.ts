import { test, expect, startRoom, createRoom, joinRoom, card, vote, reveal, participant, openTab } from './support/fixtures';

const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };

test.describe('room accessibility and usability', () => {
  test('the selected card is exposed with aria-pressed and the cards are labelled', async ({ newPlayer }) => {
    const { host } = await startRoom(newPlayer);
    await expect(host.getByRole('group', { name: 'Your estimate' })).toBeVisible();
    await expect(card(host, 5)).toHaveAttribute('aria-pressed', 'false');
    await vote(host, 5);
    await expect(card(host, 5)).toHaveAttribute('aria-pressed', 'true');
  });

  test('guests are told the host reveals, and cards are dimmed after the reveal', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await expect(guest.getByText('Waiting for the host to reveal votes')).toBeVisible();
    await vote(host, 3);
    await vote(guest, 5);
    await reveal(host);
    await expect(guest.getByRole('heading', { name: 'Votes are revealed' })).toBeVisible();
    await expect(card(guest, 8)).toHaveClass(/opacity-60/);
  });

  test('the share dialog closes with Escape and returns focus to the invite button', async ({ newPlayer }) => {
    const { host } = await startRoom(newPlayer);
    const invite = host.getByTitle('Invite — show QR code and link');
    await invite.click();
    await expect(host.getByRole('dialog', { name: 'Invite to Room' })).toBeVisible();
    await host.keyboard.press('Escape');
    await expect(host.getByRole('dialog')).toBeHidden();
    await expect(invite).toBeFocused();
  });

  test('an unknown room offers a way out instead of a pointless retry', async ({ newPlayer }) => {
    const page = await newPlayer();
    await page.goto('/room/ZZZZZZ');
    await expect(page.getByText('Room not found')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create a room' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try Again' })).toHaveCount(0);
  });
});

test.describe('on a phone', () => {
  test('host actions on participants are reachable without hover', async ({ newPlayer }) => {
    const host = await newPlayer(PHONE);
    const code = await createRoom(host);
    const guest = await newPlayer(PHONE);
    await joinRoom(guest, code, 'Guesty');
    await expect(participant(host, 'Guesty').getByRole('button', { name: /^Remove participant/ })).toBeVisible();
  });

  test('the reveal bar stays pinned to the bottom of the viewport', async ({ newPlayer }) => {
    const host = await newPlayer(PHONE);
    await createRoom(host);
    const button = host.getByRole('button', { name: 'Reveal Votes' });
    await expect(button).toBeVisible();
    const box = (await button.boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(844);
    expect(box.y + box.height).toBeGreaterThan(844 - 200);
  });

  test('voting cards are comfortable touch targets', async ({ newPlayer }) => {
    const host = await newPlayer(PHONE);
    await createRoom(host);
    const box = (await card(host, 5).boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  });
});

test.describe('onboarding and shared timer', () => {
  test('a host alone in the room is prompted to invite, and the prompt goes away once someone joins', async ({ newPlayer }) => {
    const host = await newPlayer();
    const code = await createRoom(host);
    await expect(host.getByText("You're the only one here")).toBeVisible();
    await host.getByRole('button', { name: 'Invite your team' }).click();
    await expect(host.getByRole('dialog', { name: 'Invite to Room' })).toBeVisible();
    await host.keyboard.press('Escape');

    const guest = await newPlayer();
    await joinRoom(guest, code, 'Guesty');
    await expect(host.getByText("You're the only one here")).toBeHidden();
  });

  test('the round timer agrees between clients and restarts on a new round', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    const timer = (page: typeof host) => page.getByText(/^\d+:\d\d$/).first();
    await expect(timer(host)).toBeVisible();
    await expect(timer(guest)).toBeVisible();
    await host.waitForTimeout(2200);
    const seconds = async (page: typeof host) => {
      const [m, s] = (await timer(page).innerText()).split(':').map(Number);
      return m * 60 + s;
    };
    expect(Math.abs((await seconds(host)) - (await seconds(guest)))).toBeLessThanOrEqual(2);

    await vote(host, 3);
    await vote(guest, 5);
    await reveal(host);
    await host.getByRole('button', { name: 'New Round' }).click();
    await expect.poll(async () => seconds(guest)).toBeLessThanOrEqual(3);
  });
});

test.describe('side rail tabs', () => {
  test('People is the default tab and the arrow keys move between tabs', async ({ newPlayer }) => {
    const { host } = await startRoom(newPlayer);
    const people = host.getByRole('tab', { name: /^People/ });
    const chat = host.getByRole('tab', { name: /^Chat/ });
    await expect(people).toHaveAttribute('aria-selected', 'true');
    await expect(host.getByRole('tabpanel', { name: /People/ })).toBeVisible();

    await people.focus();
    await host.keyboard.press('ArrowRight');
    await expect(chat).toHaveAttribute('aria-selected', 'true');
    await expect(chat).toBeFocused();
    await expect(host.getByPlaceholder('Type a message...')).toBeVisible();
    await host.keyboard.press('ArrowLeft');
    await expect(people).toHaveAttribute('aria-selected', 'true');
    await expect(host.getByPlaceholder('Type a message...')).toBeHidden();
  });

  test('unread chat messages show on the Chat tab and clear when it is opened', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await openTab(guest, 'Chat');
    const input = guest.getByPlaceholder('Type a message...');
    await input.fill('ping');
    await input.press('Enter');

    // The host is on People, so the message is unread
    const chatTab = host.getByRole('tab', { name: /^Chat/ });
    await expect(chatTab).toContainText('1');
    await openTab(host, 'Chat');
    await expect(host.getByText('ping')).toBeVisible();
    await expect(chatTab).not.toContainText('1');
  });

  test('on a phone the tabs sit below the voting cards', async ({ newPlayer }) => {
    const host = await newPlayer(PHONE);
    await createRoom(host);
    const cardTop = (await card(host, 5).boundingBox())!.y;
    const tabsTop = (await host.getByRole('tablist').boundingBox())!.y;
    expect(cardTop).toBeLessThan(tabsTop);
  });
});

test.describe('participant strip and chat size', () => {
  test('on a phone a status strip shows who has voted, above the cards', async ({ newPlayer }) => {
    const host = await newPlayer(PHONE);
    const code = await createRoom(host);
    const guest = await newPlayer(PHONE);
    await joinRoom(guest, code, 'Guesty');

    const strip = host.getByRole('list', { name: 'Voting status' });
    await expect(strip).toBeVisible();
    await expect(strip.getByRole('listitem', { name: 'Guesty: waiting to vote' })).toBeVisible();
    expect((await strip.boundingBox())!.y).toBeLessThan((await card(host, 5).boundingBox())!.y);

    await vote(guest, 5);
    await expect(strip.getByRole('listitem', { name: 'Guesty: voted' })).toBeVisible();
    await expect(strip.getByRole('listitem', { name: 'Hosty (you): waiting to vote' })).toBeVisible();

    await vote(host, 8);
    await reveal(host);
    await expect(strip.getByRole('listitem', { name: 'Guesty: voted 5' })).toBeVisible();
  });

  test('the strip is not shown on desktop, where the People tab is already beside the cards', async ({ newPlayer }) => {
    const { host } = await startRoom(newPlayer);
    await expect(host.getByRole('list', { name: 'Voting status' })).toBeHidden();
  });

  test('an empty chat is still a comfortable size', async ({ newPlayer }) => {
    const { host } = await startRoom(newPlayer);
    await openTab(host, 'Chat');
    const empty = host.getByText('No messages yet. Start the conversation!');
    await expect(empty).toBeVisible();
    const box = (await empty.locator('xpath=..').boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(200);
  });
});

