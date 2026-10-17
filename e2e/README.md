# End-to-end tests

```bash
npm run test:e2e                              # everything
npx playwright test --project=core            # one project
npx playwright test e2e/voting.spec.ts        # one file
npx playwright test --ui                      # interactive runner
```

Needs Java (for the Firebase emulators). The first run downloads the emulators and Chromium (`npx playwright install chromium`).

## How it runs

Playwright starts three servers (see `playwright.config.ts`):

- the **Firebase Auth and Firestore emulators** with the `demo-sprintro` project, so tests never touch a real Firebase project
- **`next dev` on :3100** with the default feature flags (`core` project)
- **`next dev` on :3101** with ticket entry, backlog, final estimates and session summary on (`features` project)

The servers build into `.next-e2e*`, so they can run alongside your own `next dev`. Locally, servers that are already running are reused.

## Layout

| Path | What it covers |
| --- | --- |
| `unit/` | Pure helpers: ticket parsing, presence, rate limiter (no browser) |
| `smoke.spec.ts` | The core join → vote → reveal → next round → leave flow |
| `home.spec.ts` | Creating rooms, joining by code, templates, unknown codes |
| `joining.spec.ts` | Name prompt, passwords, locked rooms, rejoining |
| `voting.spec.ts` | Vote privacy, statistics, special cards, spectators, auto-reveal |
| `host-controls.spec.ts` | Host handover, clearing votes, removing people, settings, scales |
| `collaboration.spec.ts` | Chat, invite modal, timer, keyboard shortcuts |
| `layout.spec.ts` | Phone and desktop layouts, loading state |
| `api.spec.ts` | Server checks called directly: auth, host-only actions, password lockout, Firestore rules, rate limiting |
| `features/` | Tickets, backlog, final estimates, session summary and CSV export |

## Writing tests

Use the helpers in `support/fixtures.ts`:

- `newPlayer()` opens a separate browser context, which is a separate anonymous user.
- `startRoom(newPlayer, ['Ana', 'Bo'])` gives you a host plus joined guests.
- `vote`, `reveal`, `participant(page, name)`, `setSetting(host, label, on)` and `confirmDialog(page, button)` cover the common steps.
- `identityOf(page)` and `roomApi(request, identity, action, payload)` call `/api/room` as a real participant, for server-side checks.

Every test creates its own room, so tests run in parallel and don't share state.
