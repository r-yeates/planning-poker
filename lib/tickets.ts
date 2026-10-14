// Ticket parsing shared by the client (live preview) and /api/room (authoritative).

export type TicketSource = 'jira' | 'github' | 'linear' | 'link';

export interface Ticket {
  id: string;
  title: string;
  url?: string;
  key?: string;
  source?: TicketSource;
}

export type ParsedTicket = Omit<Ticket, 'id'>;

export const MAX_TITLE_LENGTH = 200;
export const MAX_URL_LENGTH = 500;
export const MAX_BACKLOG = 200;

const URL_PATTERN = /https?:\/\/[^\s<>"']+/i;
const KEY_PATTERN = /^([A-Z][A-Z0-9]+-\d+)\b[\s:\-–—]*(.*)$/i;

const humanize = (slug: string) => {
  const words = decodeURIComponent(slug).replace(/[-_]+/g, ' ').trim();
  return words ? words[0].toUpperCase() + words.slice(1) : '';
};

function classifyUrl(raw: string): { url: string; key?: string; source: TicketSource; slugTitle?: string } | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  const url = parsed.toString();
  if (url.length > MAX_URL_LENGTH) return null;

  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname;
  let m: RegExpMatchArray | null;

  if ((host === 'linear.app' || host.endsWith('.linear.app')) && (m = path.match(/\/issue\/([A-Z][A-Z0-9]*-\d+)(?:\/([^/]+))?/i))) {
    return { url, key: m[1].toUpperCase(), source: 'linear', slugTitle: m[2] ? humanize(m[2]) : undefined };
  }
  if (host === 'github.com' && (m = path.match(/^\/[^/]+\/([^/]+)\/(?:issues|pull)\/(\d+)/))) {
    return { url, key: `${m[1]}#${m[2]}`, source: 'github' };
  }
  if ((m = path.match(/\/browse\/([A-Z][A-Z0-9]+-\d+)/i)) || (m = parsed.search.match(/selectedIssue=([A-Z][A-Z0-9]+-\d+)/i))) {
    return { url, key: m[1].toUpperCase(), source: 'jira' };
  }
  return { url, source: 'link' };
}

/**
 * Accepts `URL`, `URL title`, `title URL`, `KEY-123 title`, `KEY<TAB>Summary` (spreadsheet/Jira
 * export paste) or a plain title. Returns null for blank lines.
 */
export function parseTicketLine(line: string): ParsedTicket | null {
  let text = line.trim().replace(/^([-*•]|\d+[.)])\s+/, ''); // list bullets / numbering
  if (!text) return null;

  const result: ParsedTicket = { title: '' };
  let slugTitle: string | undefined;

  const urlMatch = text.match(URL_PATTERN);
  if (urlMatch && urlMatch.index !== undefined) {
    const info = classifyUrl(urlMatch[0].replace(/[),.;]+$/, ''));
    if (info) {
      result.url = info.url;
      result.source = info.source;
      if (info.key) result.key = info.key;
      slugTitle = info.slugTitle;
    }
    text = `${text.slice(0, urlMatch.index)} ${text.slice(urlMatch.index + urlMatch[0].length)}`;
  }

  text = text.replace(/\s+/g, ' ').trim();
  const keyMatch = text.match(KEY_PATTERN);
  if (keyMatch) {
    const key = keyMatch[1].toUpperCase();
    if (!result.key) result.key = key;
    if (key === result.key) text = keyMatch[2].trim();
  }
  text = text.replace(/^[\s:\-–—|]+|[\s:\-–—|([{<]+$/g, ''); // separators, and brackets the URL sat in

  const title = text || slugTitle || result.key || result.url || '';
  if (!title) return null;
  result.title = title.slice(0, MAX_TITLE_LENGTH);
  return result;
}

export function parseTicketList(text: string): ParsedTicket[] {
  return text
    .split(/\r?\n/)
    .map(parseTicketLine)
    .filter((t): t is ParsedTicket => t !== null);
}

/** Short label such as "ABC-123 · Fix login" */
export function ticketLabel(ticket: Pick<Ticket, 'title' | 'key'>): string {
  return ticket.key && ticket.key !== ticket.title ? `${ticket.key} · ${ticket.title}` : ticket.title;
}
