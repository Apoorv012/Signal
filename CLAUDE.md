# CLAUDE.md — project guide for AI agents

Read this first, then `README.md` (setup, architecture, DB schema, API). This file holds what the
README does not: how to work with this user, gotchas, current status and the roadmap.

## 1. What this is

A **Signal messenger clone** for the Scaler SDE Fullstack assessment (the brief is a PDF outside the repo:
`Scaler_SDE_Fullstack_Assignment_-_Signal_Clone.pdf`; design screenshots are in `App Screens/`).

Required stack: Next.js (TypeScript) + Python (FastAPI) + SQLite + WebSockets. Encryption may be simulated.

**How it is graded** (drives every decision): functionality incl. real-time, **UI/UX similarity to Signal
("look and feel exactly the same")**, DB design, API design, **code quality, modularity, clarity**, and the
user's ability to explain every line in an interview. Prefer clear, boring, well-separated code over clever
code. Keep comments short and explanatory ("why", not "what").

Deliverables still open: public GitHub repo (frontend/ + backend/), README (done), **hosted demo link**.

## 2. Working agreement with the user (important)

- **Never run `git commit` or `git push`.** The user's SSH key needs a passphrase. Stage with `git add`
  (never blind `git add -A`; check `git status` so no `.db`, `.env`, `node_modules`, `.venv`, uploads are
  staged), show `git diff --cached --stat`, then give a commit message in a `bash` code block for the user
  to run.
- **Commit messages have NO `Co-Authored-By` / attribution trailer** (explicit user instruction). Use
  Conventional Commits (`feat:`, `fix:`, …), a subject plus an optional body via a second `-m`.
- Test targets are **Windows desktop browser and iPhone Safari only**. Tablet just uses the desktop layout.
- **Never `rm -rf frontend/.next` (or run `npm run build`) while the user's servers are up.** Check
  `netstat -ano | grep -E ":(3000|8000) .*LISTEN"` first. Their frontend is often `next start` (production build):
  deleting `.next` breaks it until they rebuild (this happened once).
- The user tests by running the servers themselves. **Do not leave dev servers running** when you finish
  (they hold ports 3000/8000; the user then gets `WinError 10013`). Stop any server you started.
- Be honest about verification: say what was actually checked (tests / typecheck / browser) and what was not.
- The user likes concise summaries with a clear "what changed / how to try it / commit message". They give
  UI feedback via screenshots and short notes; treat those as bugs/polish items.
- Ask before anything hard to reverse. Firewall rules, deleting data etc. are for the user to run.

## 3. Commands

```bash
# backend (from backend/, venv at backend/.venv)
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000   # add --host 0.0.0.0 for phone testing
.venv\Scripts\python -m pytest -q          # 99 tests, ~10s
.venv\Scripts\ruff check . ; .venv\Scripts\ruff format .

# frontend (from frontend/)
npm run dev                      # add -- -H 0.0.0.0 for phone testing
npm run typecheck ; npm run lint ; npx prettier --write "src/**/*.{ts,tsx,css}"
npm run build && npm run start   # production check
```

Reset demo data: stop the backend, delete `backend/data/`, restart (auto-seeds when the DB is empty).
Demo login: Riley `+15550000001`, Maya `+15550000002`, OTP `123456`.

Before finishing any change run: backend `ruff` + `pytest`; frontend `typecheck` + `lint` + `prettier --check`.

## 4. Code map and conventions

Layout and responsibilities are in the README ("Architecture"). Conventions to keep:

**Frontend**
- `app/` pages are thin; UI lives in `features/<domain>`; reusable primitives in `components/ui`.
- Components never call the API. Data/behaviour lives in `hooks/`; HTTP in `lib/api/*` (one file per resource).
- **All cache mutation goes through `lib/query/cache.ts`** (`upsertMessage`, `updateMessageStatus`,
  `updateReactions`, `upsertConversation`, …) so HTTP responses and WebSocket events produce identical state.
  WebSocket events are interpreted only in `lib/realtime/handleEvent.ts`.
- Conversation order = `lastActivityAt` (same as the server). `upsertMessage` must keep it updated.
- **Styling:** Tailwind v4 + CSS variables in `app/globals.css` (tokens sampled from the Signal screenshots;
  light/dark; separate iPhone overrides in the `max-width: 767px` block). Use the semantic utilities
  (`bg-list`, `text-secondary`, `bg-bubble-in`, …), never raw colours in components.
- **All sizes are `rem`.** Desktop root font = `clamp(13px, 1.05vw, 16px)`, iPhone 16px. `Icon`/`Avatar`
  take px sizes and convert to rem. Arbitrary values like `text-[1.0625rem]` are intentional
  (17px on iPhone). Breakpoint: `md` (768px) switches iPhone stacked layout ↔ desktop 3-pane.
- **Icons** are CSS-masked SVGs from `public/icons/<name>.svg` (Signal-Desktop icon set + hand-drawn
  `pin.svg`). To add one: put the SVG in `public/icons/` and add the name to the `IconName` union in
  `components/icons/Icon.tsx`. Use `label` prop for meaningful icons (accessible name + tooltip).
- Placeholder controls must respond: use `useComingSoon()` toasts instead of dead buttons.
- Toasts: `pushToast(message, {key, title, href})` merges same-key toasts, max 3 visible.
- Session: `stores/session.ts` (zustand persist with `skipHydration`; read via `useSessionReady()`).
  Guards in `features/auth/AuthGuards.tsx`; `user.hasProfile === false` sends the user to `/profile`.

**Backend**
- Routes = HTTP only → `services/` hold rules/permissions and raise `core/errors.py` exceptions
  (mapped to JSON in `main.py`) → `presenters.py` shapes viewer-specific DTOs → `realtime/notifier.py`
  pushes events. Keep that separation.
- Schemas are camelCase on the wire (`CamelModel`); DB timestamps are UTC via `UTCDateTime`.
- Add a test for every behaviour change (`tests/conftest.py` gives `alice`/`bob`/`carol`, `dm`, `group`
  fixtures and an `Account` helper with `.ws()` for WebSocket tests).

## 5. Gotchas (learned the hard way)

- **Shell heredocs with curly quotes/emoji break the Bash tool on this Windows setup** ("unexpected EOF").
  Create such files with the Write/Edit tools (or a Python script from a file), not `cat <<EOF`.
- **Never run `npm run build` while `npm run dev` is running**: both write `frontend/.next` and the dev
  server dies with `Cannot find module './331.js'`. Stop dev, `rm -rf .next`, rebuild/restart.
- Prettier/format tooling rewrites files after edits; if Write/Edit says the file changed, re-Read first.
- zustand `persist` has no `persist` API during SSR → only touch it in effects (this once broke `next build`).
- `crypto.randomUUID` is unavailable on `http://<lan-ip>` (insecure context) → use `lib/ids.ts newClientId`.
- Windows browsers don't render flag emoji → country picker shows ISO codes.
- Dev-only hydration warning mentioning `data-protonpass-form` comes from the user's Proton Pass extension.
- Next's dev indicator is disabled in `next.config.ts` (it overlapped the composer on mobile widths).
- Native `<select>` popups need `color-scheme` (set per theme in `globals.css`) to be readable in dark mode.
- `ruff` ignores B008 for FastAPI `Depends/File/Query/Form/Header` (see `pyproject.toml`).
- Git prints "LF will be replaced by CRLF" warnings on Windows; harmless.
- The Claude-in-Chrome extension connects now, but its Chrome could not reach `localhost` (connection error
  page for `localhost:3000` and `127.0.0.1:3000`), so the built-in browser pane was used. Both were tried
  in the last session; the built-in pane worked
  (its screenshots are sometimes cropped/timeout; `get_page_text` / `javascript_tool` are reliable).
  `.claude/launch.json` defines `frontend` and `backend` preview servers for that pane.

## 6. Current status (end of the last session)

Done and committed/staged: everything in the README's "Feature status" marked Done — auth + onboarding,
contacts (a direct message auto-saves both people as contacts), DM + group chat with real-time
delivery/read receipts/typing/presence, group admin controls, message + in-chat search, list filters,
right-click menus (Phase D below), settings (toggles persist per account in localStorage), dark mode,
responsive layouts, seed data, 99 backend tests.
Later additions (unstaged/staged until committed): username + password accounts (phone optional),
add phone / set password on an existing account, group admin icon buttons with confirmations, linked
devices (= sessions), simulated E2E (safety numbers).
Also fixed after two QA passes: long-word bubble overflow, readable 422 errors + input `maxLength`,
multiline composer (Shift+Enter), confirm dialogs (leave/remove/log out), clickable links, phone number
kept out of the verify URL (sessionStorage).
Working tree check: run `git status` / `git log --oneline` to see what is committed vs staged.

Verification level: backend fully tested; frontend typechecked/linted and exercised in a browser at
desktop size (login, live messages, typing, ticks, unread/toasts, group info). **iPhone width was
checked before the API integration; the integrated app has been used on the user's phone successfully
(chat in DM + group works).**

## 7. Roadmap (do in this order unless the user says otherwise)

### A. Bonus features — DONE (design notes kept for reference)
Built: attachments (`Composer` upload + preview + drag/drop/paste, `ImageViewer`, `useVoiceRecorder`),
reactions (`ReactionBar` in the message menu header, clickable `ReactionPills`, `useReactions`), replies
(`replyDraft` in `stores/ui.ts`, strip in `Composer`, `ReplyQuote`), keyboard shortcuts
(`features/shell/KeyboardShortcuts` + `ShortcutsModal`; Ctrl+N is reserved by browsers so new chat is Alt+N),
disappearing messages (`DisappearingModal`, `useMessageExpiry`, backend `expiry_service` sweep every 60 s).
Not built from these ideas: hover action bar on desktop (the right-click / long-press menu covers it),
swipe-to-reply on messages, GIF and Contact attachments (still "coming soon").
In the browser pane `requestAnimationFrame` does not fire while the pane is hidden, so jump-to-message
(scroll + flash) cannot be verified when `document.visibilityState` is "hidden".

1. **Attachments** — Composer `+` tray (`features/chat/AttachmentTray.tsx`, currently "coming soon" toasts):
   hidden `<input type="file">` for Photos (image/*) and File → `uploadAttachment` (`lib/api/messages.ts`)
   → show preview/progress → `send({ body, attachment })` (`useSendMessage` already accepts
   `attachment` and infers `kind` from mime). Optimistic message can use a `blob:` preview URL.
   Rendering exists: `ImageContent`, `FileContent`, `VoiceContent` (audio playback works).
   Optional: drag-drop/paste images, voice recording (MediaRecorder → upload with `durationSec`),
   image viewer overlay. Limit 25 MB (server enforces).
2. **Reactions** — message hover/long-press action bar with a small emoji picker (❤️ 👍 😂 😮 😢 🙏 + more);
   `setReaction/removeReaction` exist in `lib/api/messages.ts`; `updateReactions` cache helper and the
   `reaction.updated` event handler exist; `ReactionPills` renders them (make pills clickable to toggle).
   One reaction per user per message (server replaces).
3. **Reply / quoted messages** — action "Reply" → quote strip above the composer (`OutgoingDraft.replyTo`
   is already supported) → `ReplyQuote` component inside the bubble (`message.replyTo` has senderName +
   preview); clicking it scrolls to the original message. Esc cancels the reply.
4. **Keyboard shortcuts** — hook `useKeyboardShortcuts` mounted in the app shell: Ctrl+N new chat,
   Ctrl+F focus list search, Alt+↑/↓ previous/next chat, Esc close modal/reply, Ctrl+/ shortcuts help
   modal (list them). Show hints in tooltips.
5. **Disappearing messages (functional)** — backend sets `expires_at` and hides expired messages on fetch.
   Missing: timer picker for **direct** chats (header menu → modal reuse of the Group info select),
   client-side removal of expired messages while the chat is open (timeout at `expiresAt`), optional
   backend sweep task that deletes expired rows. Note `MessageMeta` already shows the timer glyph.
6. Dark mode and responsive design already exist; re-verify each new feature in both themes and both
   layouts.

### B. UI/UX polish pass (compare with `App Screens/` at 1324px desktop and 393px iPhone)
Known items from user feedback and self-review:
- General pixel parity (spacing, font sizes/weights, iPhone header blur/gradient, unread preview weight).
- Desktop: hamburger menu, in-chat search, contact-info screen when tapping a DM avatar/title, group
  avatar upload, profile photo change in Settings → General.
- Optional reference screens not built: Desktop **Story** viewer and **Video call** screens (`App Screens/Desktop/`).
- Styled 404 page (currently Next default), loading skeletons instead of blank panes.
- Rename API flag `isNewUser` → `needsProfile` (it now means "profile incomplete"); update
  `AuthOut`, `frontend/src/types`, tests.
- Settings toggles are local-only placeholders (by design); consider persisting them in localStorage.
- Remove dead/unused API helpers only if still unused after Phase A (`getMe`, `removeContact`).

### D. Right-click context menus — DONE (kept here as design notes)
Replace the browser's default menu with app menus, desktop only (touch keeps long-press). Signal Desktop
does this: the chat-list menu offers Pin/Unpin, Mark as unread, Mute (duration submenu), Archive and
Delete; a message has a hover "more" menu (also on right-click) with React, Reply, Forward, Copy, Select,
Info and Delete ("Delete for me" / "Delete for everyone" within a time limit, own messages only).
"Select" enters multi-select mode: checkboxes on messages, a footer bar with "N selected", Forward and
Delete, and a cancel button. Forward opens a chat picker (Signal allows up to 5 chats).
- **Chat list item** (`ConversationListItem` + `hooks/useConversationActions`): Pin, Mute, Mark as
  unread/read (`marked_unread`, cleared on open), Clear messages (`cleared_at` per member, mirrors
  `joined_at`; `queries.history_start`), Delete chat (1:1 = clear, it returns with the next message;
  group = leave). A cleared 1:1 chat stays in the cache but `useConversations().visible` hides it.
- **Message** (`MessageList` + `hooks/useMessageActions`): Select (multi-select state in `stores/ui.ts`,
  `SelectionBar` replaces the composer), Copy (`lib/clipboard.ts`, works on http LAN), Forward
  (`ForwardModal`, max 5 chats, text only until attachments exist), Delete (`DeleteMessagesDialog`):
  "for me" = `message_hidden` row, "for everyone" = own messages < 24 h, sets `deleted_at` and pushes
  `message.deleted` (handled only in `lib/realtime/handleEvent.ts`).
- `ContextMenu` + `useContextMenu` serve both input types and leave text inputs alone: mouse right-click
  (popup at the cursor, closes on scroll/resize/blur) and touch long-press (`useLongPress`, 450 ms, pointer
  events because iOS Safari never fires `contextmenu`). Below 768px the menu is a bottom sheet
  (no resize/blur/scroll auto-close: iOS address-bar resizes would dismiss it). Spread
  `menuProps(items)` on the pressable element; `.touch-menu-target` (globals.css) disables the native
  callout / text selection on coarse pointers.
- **Swipe actions** (`features/conversations/SwipeableRow`): touch-only, iPhone layout only (actions are
  `md:hidden`). Right = Pin / Unread, left = Mute / Delete; one row open at a time; a swipe or a tap on
  an open row never opens the chat. Swipe-to-reply on messages is not built (needs Reply, Phase A).
- Testing touch in the browser pane: dispatch `PointerEvent`s with `pointerType: "touch"` and `await`
  ~40 ms between moves (React must re-render between events). Real-device behaviour (iOS haptics,
  rubber-banding, address bar) is NOT covered by that and needs the user's phone.
- After `resize_window` preset desktop the pane can report `innerWidth: 0`; use an explicit
  1280x720 resize before desktop checks.
- **Reply / React** items are not in the menus yet: add them when those Phase A features are built.
- Existing SQLite files get new columns via `app/db/columns.py` (`add_missing_columns`, no Alembic):
  add any future column there too.

### C. Deployment + submission — DONE (live at https://signal.apoorvm.com, Docker Compose + Caddy on EC2 via `deploy/`; repo is public; README has the demo link). The notes below are the original plan.
- Frontend → **Vercel** (`NEXT_PUBLIC_API_URL` = public https backend URL; the WebSocket URL is derived).
- Backend → an always-on host (user has free credits, must not spin down). Add a `Dockerfile`
  (uvicorn, single worker), mount a persistent volume for `DATABASE_URL=sqlite:////data/signal.db` and
  `MEDIA_DIR=/data/media`, set `CORS_ORIGINS` to the Vercel URL. Keep a single instance (in-memory
  WebSocket manager). Seeding runs automatically on an empty DB.
- Update the README with the live demo link and demo accounts; make the GitHub repo public.
- Final pre-submission pass: fresh clone → follow README from scratch; `next build` clean; all checks green.

## 8. Decisions log (so you don't relitigate them)

- **Username accounts**: `users.phone` is nullable; username + password (PBKDF2) via `/auth/register-username` and
  `/auth/login-username`. Usernames are unique ignoring case. Accounts are NEVER merged: a phone account can
  add a username/password, a username account can add a phone (OTP) unless another account owns it. Account
  deletion is not built (ask the user before adding it: destructive).
- **Linked devices = active sessions** (`device_name` from the User-Agent, `last_active_at`). Unlink revokes.
- **End-to-end encryption is SIMULATED on purpose**: real E2E would break server-side message search and list
  previews, and WebCrypto (`crypto.subtle`) does not exist on `http://<lan-ip>` phone testing. We ship safety
  numbers + verify + lock notices and say "simulated" in the UI and README. Do not present it as real crypto.
- **DB migrations**: no Alembic. `app/db/columns.py` adds new columns and rebuilds `users` once to drop NOT NULL on
  `phone` (verified on a copy of the real DB). Add future columns to `ADDED_COLUMNS`.

- Icons copied from Signal-Desktop's icon set (user accepted the AGPL note; credited in README).
- Seed avatars from randomuser.me / picsum.photos, copied into `backend/app/seed/media`.
- Direct chats are hidden until the first message; groups/Note to Self listed immediately.
- One reaction per user per message; one attachment per message; ids are integers.
- Numbers must include a country code; the backend never guesses one.
- Toast policy: one per chat, merged counter, max 3, top-right (desktop) / top banner (phone).
