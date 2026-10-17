import { readFile } from 'fs/promises';
import { test, expect, startRoom, vote, reveal, participant, addBacklog } from '../support/fixtures';

function estimate(page: import('@playwright/test').Page, value: string | number) {
  return page.getByRole('radiogroup', { name: 'Final estimate' }).getByRole('radio', { name: String(value), exact: true });
}

test.describe('final estimates', () => {
  test('suggests the most common vote and records the host’s choice', async ({ newPlayer }) => {
    const { host, guests } = await startRoom(newPlayer, ['Ana', 'Bo']);
    await vote(host, 3);
    await vote(guests[0], 5);
    await vote(guests[1], 5);
    await reveal(host);

    await expect(host.getByText('Suggested: 5 (most common)')).toBeVisible();
    await expect(estimate(host, 5)).toHaveAttribute('aria-checked', 'true');
    // "?" and coffee are not offered as final estimates
    await expect(estimate(host, '?')).toHaveCount(0);
    await expect(guests[0].getByRole('radiogroup', { name: 'Final estimate' })).toHaveCount(0);

    await estimate(host, 8).click();
    await host.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(host.getByText('Saved as 8.')).toBeVisible();
    await expect(guests[0].getByText('Final estimate:')).toContainText('8');

    // Can be corrected
    await estimate(host, 5).click();
    await host.getByRole('button', { name: 'Update' }).click();
    await expect(guests[1].getByText('Final estimate:')).toContainText('5');
  });

  test('re-vote clears the round on the same ticket', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await vote(host, 1);
    await vote(guest, 13);
    await reveal(host);

    await host.getByRole('button', { name: 'Re-vote' }).click();
    await expect(guest.getByRole('heading', { name: 'Vote Distribution' })).toBeHidden();
    await expect(host.getByText('0 of 2 voted')).toBeVisible();
    await expect(participant(host, 'Guesty')).toContainText('Waiting...');
  });

  test('save & next walks the backlog and builds the session summary', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await addBacklog(host, ['ABC-1 Login page', 'ABC-2 Password reset', 'ABC-3 Dark mode']);

    // Ticket 1: estimated 5
    await vote(host, 5);
    await vote(guest, 5);
    await reveal(host);
    await estimate(host, 5).click();
    await host.getByRole('button', { name: 'Save & next ticket' }).click();
    await expect(guest.getByRole('status', { name: 'New round started' })).toBeVisible();
    await expect(guest.locator('ol > li[aria-current="true"]')).toContainText('Password reset');
    await expect(guest.getByRole('heading', { name: 'Backlog (1/3 estimated)' })).toBeVisible();

    // Ticket 2: skipped after reveal
    await vote(host, 8);
    await vote(guest, 13);
    await reveal(host);
    await host.getByRole('button', { name: 'Skip to next' }).click();
    await expect(guest.locator('ol > li[aria-current="true"]')).toContainText('Dark mode');

    // Ticket 3: last one, so the button starts a new round instead
    await vote(host, 2);
    await vote(guest, 3);
    await reveal(host);
    await estimate(host, 3).click();
    await expect(host.getByRole('button', { name: 'Save & new round' })).toBeVisible();
    await host.getByRole('button', { name: 'Save & new round' }).click();
    await expect(guest.getByRole('heading', { name: 'Backlog (2/3 estimated)' })).toBeVisible();

    // Summary for everyone
    await guest.getByRole('button', { name: /Summary/ }).click();
    const summary = guest.getByRole('dialog', { name: 'Session Summary' });
    await expect(summary).toBeVisible();
    const rows = summary.locator('tbody tr');
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText('Login page');
    await expect(rows.nth(0)).toContainText('5×2');
    await expect(rows.nth(1)).toContainText('skipped');
    await expect(summary.getByText('Estimated', { exact: true }).locator('..')).toContainText('2');
    await expect(summary.getByText('Skipped', { exact: true }).locator('..')).toContainText('1');
    await expect(summary.getByText('Total points', { exact: true }).locator('..')).toContainText('8');

    // CSV export
    const [download] = await Promise.all([guest.waitForEvent('download'), summary.getByRole('button', { name: 'Download CSV' }).click()]);
    expect(download.suggestedFilename()).toMatch(/^sprintro-[A-Z0-9]{6}-\d{4}-\d{2}-\d{2}\.csv$/);
    const csv = await readFile((await download.path())!, 'utf8');
    expect(csv).toContain('"Ticket","Key","URL","Final estimate","Votes","Completed"');
    expect(csv).toContain('"Login page","ABC-1","","5","5×2"');
    expect(csv).toContain('"Password reset","ABC-2","",""');

    await summary.getByRole('button', { name: 'Close' }).click();
    await expect(summary).toBeHidden();
  });

  test('CSV export neutralises spreadsheet formulas in ticket titles', async ({ newPlayer }) => {
    const { host, guest } = await startRoom(newPlayer);
    await host.getByRole('button', { name: '+ Set ticket' }).click();
    await host.getByLabel('Paste a Jira, GitHub or Linear link, or type a title').fill('=1+2 totals');
    await host.getByRole('button', { name: 'Save', exact: true }).click();

    await vote(host, 1);
    await vote(guest, 1);
    await reveal(host);
    await host.getByRole('button', { name: 'Save & new round' }).click();

    await host.getByRole('button', { name: /Summary/ }).click();
    const summary = host.getByRole('dialog', { name: 'Session Summary' });
    const [download] = await Promise.all([host.waitForEvent('download'), summary.getByRole('button', { name: 'Download CSV' }).click()]);
    const csv = await readFile((await download.path())!, 'utf8');
    expect(csv).toContain(`"'=1+2 totals"`);
  });

  test('an empty summary explains itself', async ({ newPlayer }) => {
    const { host } = await startRoom(newPlayer, []);
    await host.getByRole('button', { name: /Summary/ }).click();
    const summary = host.getByRole('dialog', { name: 'Session Summary' });
    await expect(summary.getByText('No rounds yet.', { exact: false })).toBeVisible();
    await expect(summary.getByRole('button', { name: 'Download CSV' })).toBeDisabled();
  });
});
