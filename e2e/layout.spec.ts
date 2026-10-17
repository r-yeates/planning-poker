import { test, expect, createRoom, joinRoom, card, me, openTab } from './support/fixtures';
import type { Page } from '@playwright/test';

const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test.describe('on a phone', () => {
  test('the voting cards come before the sidebar and nothing scrolls sideways', async ({ newPlayer }) => {
    const host = await newPlayer(PHONE);
    const code = await createRoom(host);
    const guest = await newPlayer(PHONE);
    await joinRoom(guest, code, 'Guesty');

    for (const page of [host, guest]) {
      const cardTop = (await card(page, 5).boundingBox())!.y;
      const participantsTop = (await page.getByRole('heading', { name: /^Participants/ }).boundingBox())!.y;
      expect(cardTop).toBeLessThan(participantsTop);
      await expectNoHorizontalScroll(page);
    }
  });

  test('chat is shown once, below the voting area', async ({ newPlayer }) => {
    const host = await newPlayer(PHONE);
    await createRoom(host);
    await expect(host.getByPlaceholder('Type a message...').filter({ visible: true })).toHaveCount(0); // behind its tab
    await openTab(host, 'Chat');
    await expect(host.getByPlaceholder('Type a message...').filter({ visible: true })).toHaveCount(1);
  });

  test('a vote can be cast by tapping a card', async ({ newPlayer }) => {
    const host = await newPlayer(PHONE);
    await createRoom(host);
    await card(host, 8).tap();
    await expect(me(host)).toContainText('✓ Voted');
  });
});

test.describe('on a desktop', () => {
  test('the sidebar sits beside the voting cards and chat is in the sidebar', async ({ newPlayer }) => {
    const host = await newPlayer();
    await createRoom(host);
    const cardBox = (await card(host, 5).boundingBox())!;
    const participantsBox = (await host.getByRole('heading', { name: /^Participants/ }).boundingBox())!;
    expect(participantsBox.x).toBeLessThan(cardBox.x);
    await openTab(host, 'Chat');
    await expect(host.getByPlaceholder('Type a message...').filter({ visible: true })).toHaveCount(1);
    await expectNoHorizontalScroll(host);
  });
});

test('the loading skeleton is announced to screen readers', async ({ newPlayer }) => {
  const page = await newPlayer();
  // Hold back the auth emulator so the room stays in its loading state long enough to check
  await page.route('http://127.0.0.1:9099/**', async (route) => {
    await new Promise((r) => setTimeout(r, 1_500));
    await route.continue();
  });
  await page.goto('/room/ZZZZZZ');
  await expect(page.getByRole('status', { name: 'Loading room' })).toBeVisible();
});
