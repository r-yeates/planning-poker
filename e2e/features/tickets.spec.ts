import { test, expect, startRoom } from '../support/fixtures';
import type { Page } from '@playwright/test';

async function setTicket(host: Page, text: string) {
  await host.getByRole('button', { name: /^(\+ Set ticket|Edit)$/ }).click();
  await host.getByLabel('Paste a Jira, GitHub or Linear link, or type a title').fill(text);
  await host.getByRole('button', { name: 'Save', exact: true }).click();
}

test.describe('current ticket', () => {
  test('the host sets a ticket and everyone sees it', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await expect(guest.getByText('Current Ticket')).toHaveCount(0); // hidden from guests until set
    await expect(host.getByText('Nothing set — add a ticket', { exact: false })).toBeVisible();

    await setTicket(host, 'ABC-123 Add password reset');
    await expect(guest.getByText('Add password reset')).toBeVisible();
    await expect(guest.getByText('ABC-123', { exact: true })).toBeVisible();
    await expect(guest.getByRole('button', { name: 'Edit' })).toHaveCount(0);
  });

  test('a pasted link is recognised and opens in a new tab', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await host.getByRole('button', { name: '+ Set ticket' }).click();
    await host.getByLabel('Paste a Jira, GitHub or Linear link, or type a title').fill('https://acme.atlassian.net/browse/ABC-9 Fix login');
    // Live preview before saving
    await expect(host.getByText('Jira', { exact: true })).toBeVisible();
    await host.getByRole('button', { name: 'Save', exact: true }).click();

    const link = guest.getByRole('link', { name: 'Open ticket in a new tab' });
    await expect(link).toHaveAttribute('href', 'https://acme.atlassian.net/browse/ABC-9');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    await expect(guest.getByText('Fix login')).toBeVisible();
  });

  test('the host can edit and clear the ticket', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await setTicket(host, 'First title');
    await expect(guest.getByText('First title')).toBeVisible();

    await setTicket(host, 'Second title');
    await expect(guest.getByText('Second title')).toBeVisible();

    await host.getByRole('button', { name: 'Edit' }).click();
    await host.getByRole('button', { name: 'Clear' }).click();
    await expect(guest.getByText('Second title')).toBeHidden();
    await expect(host.getByRole('button', { name: '+ Set ticket' })).toBeVisible();
  });

  test('Escape cancels editing', async ({ newPlayer }) => {
    const { host } = await startRoom(newPlayer);
    await host.getByRole('button', { name: '+ Set ticket' }).click();
    const input = host.getByLabel('Paste a Jira, GitHub or Linear link, or type a title');
    await input.fill('Never saved');
    await input.press('Escape');
    await expect(input).toBeHidden();
    await expect(host.getByText('Never saved')).toHaveCount(0);
  });
});
