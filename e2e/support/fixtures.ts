import { test as base, expect, type BrowserContextOptions, type Page, type APIRequestContext } from '@playwright/test';

/**
 * Each player is a separate browser context, so each gets its own anonymous Firebase user,
 * localStorage and sessionStorage — like a different person on a different machine.
 */
type NewPlayer = (options?: BrowserContextOptions) => Promise<Page>;

export const test = base.extend<{ newPlayer: NewPlayer }>({
  newPlayer: async ({ browser }, use) => {
    const contexts: Awaited<ReturnType<typeof browser.newContext>>[] = [];
    await use(async (options) => {
      // Playwright applies the project's `use` options (baseURL, viewport) to new contexts
      const context = await browser.newContext(options);
      contexts.push(context);
      return context.newPage();
    });
    await Promise.all(contexts.map((c) => c.close()));
  },
});

export { expect };

// ---------- joining ----------

export async function enterName(page: Page, name: string, password?: string) {
  await page.getByPlaceholder('Your name').fill(name);
  if (password !== undefined) await page.getByPlaceholder('Room password').fill(password);
  await page.getByRole('button', { name: 'Join Room' }).click();
}

/** Creates a room from the home page and joins it as host. Returns the room code. */
export async function createRoom(page: Page, { name = 'Hosty', password }: { name?: string; password?: string } = {}) {
  await page.goto('/');
  if (password) await page.getByPlaceholder('Optional security password').fill(password);
  await page.getByRole('button', { name: 'Create Room', exact: true }).click();
  await page.waitForURL(/\/room\/[A-Z0-9]{6}$/);
  await enterName(page, name); // the creator skips the password
  await expect(me(page)).toBeVisible();
  return roomCodeOf(page);
}

/** Opens the room link and joins with a name (and password, if the room has one). */
export async function joinRoom(page: Page, code: string, name: string, password?: string) {
  await page.goto(`/room/${code}`);
  // A player with a saved name is joined automatically; the prompt shows disabled meanwhile
  const prompt = page.getByPlaceholder('Your name');
  await expect(async () => {
    const joined = await me(page).isVisible();
    const promptReady = (await prompt.isVisible()) && (await prompt.isEnabled());
    expect(joined || promptReady, 'joined, or the name prompt is ready').toBe(true);
  }).toPass();
  if (!(await me(page).isVisible())) await enterName(page, name, password);
  await expect(me(page)).toBeVisible();
}

/** A host plus `guestNames.length` guests, all joined to one room. */
export async function startRoom(newPlayer: NewPlayer, guestNames: string[] = ['Guesty'], options: { password?: string } = {}) {
  const host = await newPlayer();
  const code = await createRoom(host, options);
  const guests: Page[] = [];
  for (const name of guestNames) {
    const guest = await newPlayer();
    await joinRoom(guest, code, name, options.password);
    guests.push(guest);
  }
  await expectParticipantCount(host, guestNames.length + 1);
  return { code, host, guests, guest: guests[0] };
}

export function roomCodeOf(page: Page) {
  return new URL(page.url()).pathname.split('/').pop()!;
}

// ---------- room locators ----------

/** The participant card for `name`. */
export function participant(page: Page, name: string) {
  return page.getByTestId('participant-card').filter({ hasText: name });
}

/** The current user's own participant card. */
export function me(page: Page) {
  return page.getByTestId('participant-card').filter({ hasText: '(You)' });
}

export async function expectParticipantCount(page: Page, count: number) {
  await expect(page.getByRole('heading', { name: `Participants (${count})` })).toBeVisible();
}

/** A voting card. Exact match, so "2" doesn't hit "21". */
export function card(page: Page, value: string | number) {
  return page.getByRole('button', { name: String(value), exact: true });
}

/** Clicks a card and waits until the server has saved that vote. */
export async function vote(page: Page, value: string | number) {
  const saved = page.waitForResponse((r) => {
    if (!r.url().endsWith('/api/room') || r.request().method() !== 'POST') return false;
    const body = r.request().postDataJSON() as { action?: string; value?: unknown };
    return body.action === 'vote' && body.value === value;
  });
  await card(page, value).click();
  expect((await saved).ok(), `vote ${value} saved`).toBe(true);
  await expect(me(page)).toContainText('✓ Voted');
}

export async function reveal(host: Page) {
  await host.getByRole('button', { name: /reveal/i }).click();
  await expect(host.getByRole('heading', { name: 'Vote Distribution' })).toBeVisible();
}

/** Expands the host's Room Settings panel if it is collapsed. */
export async function openSettings(host: Page) {
  const autoReveal = host.getByRole('switch', { name: 'Auto-reveal votes' });
  if (!(await autoReveal.isVisible())) await host.getByRole('button', { name: 'Room Settings' }).click();
  await expect(autoReveal).toBeVisible();
}

export async function setSetting(host: Page, label: string, on: boolean) {
  await openSettings(host);
  const toggle = host.getByRole('switch', { name: label });
  if ((await toggle.getAttribute('aria-checked')) !== String(on)) await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', String(on));
}

/** Answers the in-app confirm dialog. */
export async function confirmDialog(page: Page, button: string) {
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: button }).click();
  await expect(dialog).toBeHidden();
}

// ---------- feature-flagged panels ----------

/** Switches the side rail to a tab (People, Backlog or Chat). */
export async function openTab(page: Page, name: 'People' | 'Backlog' | 'Chat') {
  const tab = page.getByRole('tab', { name: new RegExp(`^${name}`) });
  if ((await tab.getAttribute('aria-selected')) !== 'true') await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
}

/** Pastes tickets into the backlog (features project only). */
export async function addBacklog(host: Page, lines: string[]) {
  await openTab(host, 'Backlog');
  await host.getByRole('button', { name: '+ Add' }).click();
  await host.getByPlaceholder(/One ticket per line/).fill(lines.join('\n'));
  await expect(host.getByText(`${lines.length} ticket${lines.length === 1 ? '' : 's'} detected`)).toBeVisible();
  await host.getByRole('button', { name: 'Add to backlog' }).click();
  await expect(host.getByPlaceholder(/One ticket per line/)).toBeHidden();
}

// ---------- direct API access ----------

export interface Identity {
  uid: string;
  token: string;
}

/** A signed-in user who is not in any room. The room page signs in on load, even for an unknown code. */
export async function outsider(newPlayer: NewPlayer): Promise<Identity> {
  const page = await newPlayer();
  await page.goto('/room/ZZZZZZ');
  await expect(page.getByText('Room not found')).toBeVisible();
  return identityOf(page);
}

/** Reads the signed-in anonymous user's uid and ID token from Firebase's IndexedDB store. */
export async function identityOf(page: Page): Promise<Identity> {
  const identity = await page.evaluate(
    () =>
      new Promise<{ uid: string; token: string } | null>((resolve, reject) => {
        const open = indexedDB.open('firebaseLocalStorageDb');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const all = open.result.transaction('firebaseLocalStorage', 'readonly').objectStore('firebaseLocalStorage').getAll();
          all.onerror = () => reject(all.error);
          all.onsuccess = () => {
            const entry = (all.result as { fbase_key: string; value: { uid: string; stsTokenManager: { accessToken: string } } }[]).find((e) =>
              e.fbase_key.startsWith('firebase:authUser:')
            );
            resolve(entry ? { uid: entry.value.uid, token: entry.value.stsTokenManager.accessToken } : null);
          };
        };
      })
  );
  if (!identity) throw new Error('No signed-in Firebase user on this page');
  return identity;
}

/** Calls /api/room as `identity`, the way the app does. */
export async function roomApi(request: APIRequestContext, identity: Identity | null, action: string, payload: Record<string, unknown> = {}) {
  const response = await request.post('/api/room', {
    headers: identity ? { Authorization: `Bearer ${identity.token}` } : {},
    data: { action, ...payload },
  });
  return { status: response.status(), body: await response.json().catch(() => ({})), headers: response.headers() };
}

/** Reads a Firestore document through the emulator's REST API as `identity`, so security rules apply. */
export async function firestoreGet(request: APIRequestContext, identity: Identity, path: string) {
  const url = `http://127.0.0.1:8080/v1/projects/demo-sprintro/databases/(default)/documents/${path}`;
  const response = await request.get(url, { headers: { Authorization: `Bearer ${identity.token}` } });
  return response.status();
}
