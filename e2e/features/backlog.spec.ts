import { test, expect, startRoom, vote, confirmDialog, addBacklog } from '../support/fixtures';
import type { Page } from '@playwright/test';

const TICKETS = ['ABC-1 Login page', 'ABC-2 Password reset', 'https://github.com/acme/web/issues/42 Dark mode'];

function backlogItems(page: Page) {
  return page.locator('ol > li');
}

function currentItem(page: Page) {
  return page.locator('ol > li[aria-current="true"]');
}

test.describe('backlog', () => {
  test('pasting tickets fills the backlog and starts on the first one', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await expect(guest.getByRole('heading', { name: /^Backlog/ })).toHaveCount(0); // hidden from guests while empty

    await addBacklog(host, TICKETS);
    await expect(guest.getByRole('heading', { name: 'Backlog (0/3 estimated)' })).toBeVisible();
    await expect(backlogItems(guest)).toHaveCount(3);
    await expect(currentItem(guest)).toContainText('Login page');
    await expect(backlogItems(guest).nth(2)).toContainText('web#42');
    await expect(guest.getByRole('button', { name: '+ Add' })).toHaveCount(0);
  });

  test('the host steps through tickets with next and previous', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await addBacklog(host, TICKETS);
    await expect(host.getByRole('button', { name: 'Previous ticket' })).toBeDisabled();

    await host.getByRole('button', { name: 'Next ticket' }).click();
    await expect(currentItem(guest)).toContainText('Password reset');
    await host.getByRole('button', { name: 'Next ticket' }).click();
    await expect(currentItem(guest)).toContainText('Dark mode');
    await expect(host.getByRole('button', { name: 'Next ticket' })).toBeDisabled();

    await host.getByRole('button', { name: 'Previous ticket' }).click();
    await expect(currentItem(guest)).toContainText('Password reset');

    // Clicking an item jumps straight to it
    await backlogItems(host).first().click();
    await expect(currentItem(guest)).toContainText('Login page');
  });

  test('switching tickets with unrevealed votes asks first', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await addBacklog(host, TICKETS);
    await vote(guest, 5);

    await host.getByRole('button', { name: 'Next ticket' }).click();
    await confirmDialog(host, 'Cancel');
    await expect(currentItem(host)).toContainText('Login page');

    await host.getByRole('button', { name: 'Next ticket' }).click();
    await confirmDialog(host, 'Switch');
    await expect(currentItem(guest)).toContainText('Password reset');
    await expect(host.getByText('0 of 2 voted')).toBeVisible();
  });

  test('items can be removed, appended and replaced', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await addBacklog(host, TICKETS);

    await host.getByRole('button', { name: 'Remove Password reset from backlog' }).click();
    await expect(backlogItems(guest)).toHaveCount(2);

    await addBacklog(host, ['ABC-9 Extra']);
    await expect(backlogItems(guest)).toHaveCount(3);
    await expect(backlogItems(guest).last()).toContainText('Extra');

    await host.getByRole('button', { name: '+ Add' }).click();
    await host.getByPlaceholder(/One ticket per line/).fill('Only one');
    await host.getByRole('button', { name: 'Replace' }).click();
    await confirmDialog(host, 'Replace');
    await expect(backlogItems(guest)).toHaveCount(1);
    await expect(backlogItems(guest).first()).toContainText('Only one');
  });

  test('the add button is disabled until tickets are detected', async ({ newPlayer }) => {
    const { host } = await startRoom(newPlayer, []);
    await host.getByRole('button', { name: '+ Add' }).click();
    await expect(host.getByText('0 tickets detected')).toBeVisible();
    await expect(host.getByRole('button', { name: 'Add to backlog' })).toBeDisabled();
  });
});
