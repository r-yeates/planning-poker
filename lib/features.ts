/**
 * Feature flags. Edit the defaults below, or override per environment with the
 * NEXT_PUBLIC_FEATURE_* variables (set to "false", "0", "off" or "no" to disable).
 * Env vars are read at build time, so restart `next dev` / redeploy after changing them.
 *
 * The same flags are read by the UI and by /api/room, so a disabled feature is hidden in the
 * browser *and* rejected by the server. Existing data is left untouched, so re-enabling a
 * feature brings its tickets, backlog and history back.
 */

// ---- Defaults: change these to turn a feature off for everyone ----
const DEFAULTS = {
  /** Host can set the ticket being estimated (title / Jira, GitHub, Linear link). */
  ticketEntry: false,
  /** Paste a list of tickets and step through them. Requires ticketEntry. */
  backlog: false,
  /** Host records the agreed estimate after reveal; rounds are saved to history. */
  finalEstimates: false,
  /** Session summary modal with copy / CSV export. Requires finalEstimates. */
  sessionSummary: true,
};

const flag = (envValue: string | undefined, fallback: boolean): boolean =>
  envValue === undefined || envValue.trim() === ''
    ? fallback
    : !['false', '0', 'off', 'no'].includes(envValue.trim().toLowerCase());

// NEXT_PUBLIC_* must be referenced literally so Next can inline them into the client bundle
const ticketEntry = flag(process.env.NEXT_PUBLIC_FEATURE_TICKET_ENTRY, DEFAULTS.ticketEntry);
const finalEstimates = flag(process.env.NEXT_PUBLIC_FEATURE_FINAL_ESTIMATES, DEFAULTS.finalEstimates);

export const FEATURES = {
  ticketEntry,
  backlog: ticketEntry && flag(process.env.NEXT_PUBLIC_FEATURE_BACKLOG, DEFAULTS.backlog),
  finalEstimates,
  sessionSummary: finalEstimates && flag(process.env.NEXT_PUBLIC_FEATURE_SESSION_SUMMARY, DEFAULTS.sessionSummary),
} as const;

export type FeatureName = keyof typeof FEATURES;
