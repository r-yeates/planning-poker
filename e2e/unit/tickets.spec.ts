import { test, expect } from '@playwright/test';
import { parseTicketLine, parseTicketList, ticketLabel, MAX_TITLE_LENGTH } from '../../lib/tickets';

test.describe('parseTicketLine', () => {
  test('returns null for blank lines', () => {
    expect(parseTicketLine('')).toBeNull();
    expect(parseTicketLine('   ')).toBeNull();
  });

  test('plain title', () => {
    expect(parseTicketLine('Add password reset')).toEqual({ title: 'Add password reset' });
  });

  test('Jira key with title', () => {
    expect(parseTicketLine('abc-123 Add password reset')).toEqual({ title: 'Add password reset', key: 'ABC-123' });
    expect(parseTicketLine('ABC-124: Fix login')).toEqual({ title: 'Fix login', key: 'ABC-124' });
  });

  test('Jira browse URL', () => {
    expect(parseTicketLine('https://acme.atlassian.net/browse/ABC-9 Fix login')).toEqual({
      title: 'Fix login',
      url: 'https://acme.atlassian.net/browse/ABC-9',
      key: 'ABC-9',
      source: 'jira',
    });
  });

  test('Jira board URL with selectedIssue', () => {
    const t = parseTicketLine('https://acme.atlassian.net/jira/software/projects/ABC/boards/1?selectedIssue=ABC-77');
    expect(t).toMatchObject({ key: 'ABC-77', source: 'jira', title: 'ABC-77' });
  });

  test('GitHub issue and pull request URLs', () => {
    expect(parseTicketLine('https://github.com/acme/web/issues/42')).toMatchObject({ key: 'web#42', source: 'github' });
    expect(parseTicketLine('https://github.com/acme/web/pull/7 Bump deps')).toMatchObject({ key: 'web#7', source: 'github', title: 'Bump deps' });
  });

  test('Linear URL takes its title from the slug', () => {
    expect(parseTicketLine('https://linear.app/acme/issue/ENG-12/add-dark-mode')).toMatchObject({
      key: 'ENG-12',
      source: 'linear',
      title: 'Add dark mode',
    });
  });

  test('other links are kept as generic links', () => {
    expect(parseTicketLine('Spec (https://example.com/spec)')).toEqual({ title: 'Spec', url: 'https://example.com/spec', source: 'link' });
  });

  test('strips list bullets and numbering', () => {
    expect(parseTicketLine('- Fix login')?.title).toBe('Fix login');
    expect(parseTicketLine('3. Fix login')?.title).toBe('Fix login');
  });

  test('ignores non-http URLs', () => {
    expect(parseTicketLine('javascript:alert(1)')).toEqual({ title: 'javascript:alert(1)' });
  });

  test('truncates long titles', () => {
    expect(parseTicketLine('x'.repeat(500))?.title).toHaveLength(MAX_TITLE_LENGTH);
  });
});

test('parseTicketList splits lines and drops blanks', () => {
  const list = parseTicketList('ABC-1 One\n\n  \r\nABC-2 Two\nThree');
  expect(list.map((t) => t.title)).toEqual(['One', 'Two', 'Three']);
});

test('ticketLabel prefixes the key when it differs from the title', () => {
  expect(ticketLabel({ title: 'Fix login', key: 'ABC-1' })).toBe('ABC-1 · Fix login');
  expect(ticketLabel({ title: 'ABC-1', key: 'ABC-1' })).toBe('ABC-1');
  expect(ticketLabel({ title: 'Fix login' })).toBe('Fix login');
});
