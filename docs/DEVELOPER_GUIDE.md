# Developer Onboarding Guide

This is the guide a new developer should read before touching code. It documents how
this codebase is actually structured and written today — plus, where a practice doesn't
exist yet (git history, CI, tests), it says so and recommends what to adopt rather than
pretending it's already in place.

---

## 1. Local Setup Guide

### Prerequisites
- Node.js **20.x** (matches the `engines` field pinned in both `package.json` files —
  using a different major version is untested)
- npm (ships with Node)
- A MongoDB instance: local `mongod`, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### Steps
```bash
git clone <repo-url>
cd "Air BnB Clone 2"

npm run install:all          # installs backend/ and frontend/ node_modules

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# edit backend/.env: set MONGO_URI and JWT_SECRET at minimum

npm run seed                 # destructive reset + demo data (2 users, 9 listings)
npm run dev                   # frontend :5173, backend :5000
```

Demo accounts after seeding:
- Guest: `john@example.com` / `password123`
- Host: `jane@example.com` / `password321`

### Verifying the setup worked
```bash
curl http://localhost:5000/api/health
# => {"status":"ok","uptime":...}
```
Then open http://localhost:5173 — you should see the home page with real listing photos.

---

## 2. Development Workflow

There is no CI, no pre-commit hook, and no automated test suite in this repository
today (see `docs/EXECUTIVE_DOCUMENTATION.md` §12–13). In their absence, the practical
workflow is:

1. Make your change.
2. **Manually verify it** against the running app — start `npm run dev`, exercise the
   affected flow in a real browser, and check the browser console and the backend
   terminal output for errors. This project was built with exactly this discipline: every
   feature added during development was checked against a live instance before being
   considered done, using a temporary (uncommitted) Playwright script when browser
   automation was warranted.
3. Run both builds before considering a change complete:
   ```bash
   cd frontend && npm run build   # must complete with no errors
   cd ../backend && node --check <changed-file.js>   # syntax check, or run the app and hit the changed route
   ```
4. If you touched anything under `backend/`, restart the dev server (`node --watch
   server.js` auto-restarts on file save, but double-check the restart succeeded — see
   the Debugging Guide below for a known `EADDRINUSE` race on Windows/WSL setups).

### Recommended addition (not yet in place)
Add `mongodb-memory-server` + `supertest` as dev dependencies and write integration
tests against the real Express `app` export (`backend/app.js`) — this exact combination
was used ad hoc during development to verify the serverless refactor and the base64
image-upload path, and works cleanly against this codebase.

---

## 3. Coding Standards

These are the conventions **actually used** throughout the current codebase — follow them
for consistency, don't introduce a different style in new code.

### General
- **No comments explaining *what* code does** — identifiers are named to make that
  self-evident. Comments are reserved for *why*: a non-obvious constraint, a workaround,
  or a design decision that isn't visible from the code itself. Examples already in the
  codebase: the note in `middleware/upload.js` explaining *why* memory storage is used
  (serverless filesystem constraints), or the note in `CostCalculator.jsx` explaining
  that the client-side price is a preview, not authoritative.
- Prefer editing existing files over creating new ones; don't add abstractions for a
  single use case.
- Don't add error handling for scenarios that can't occur given the code's own guarantees.

### Backend (`backend/`)
- CommonJS (`require`/`module.exports`), not ESM — matches `"type": "commonjs"` in `backend/package.json`.
- One file per concern: `models/`, `controllers/`, `routes/`, `middleware/`, `utils/`.
- Controllers are plain async functions exported as a named object
  (`module.exports = { getAll, getMine, ... }`), not classes.
- Every controller wraps its body in `try { ... } catch (err) { res.status(...).json({ message, error }) }`
  — follow this exact shape for new endpoints so error responses stay consistent.
- Route files are thin: they just wire `router.METHOD(path, ...middleware, controllerFn)`.
  No business logic belongs in a route file.
- Ownership checks (e.g. "can this user edit this listing?") belong in the controller,
  not the route or a separate middleware — see `accommodationController.update`/`remove`
  for the pattern (`String(listing.host) !== String(req.user._id)`).

### Frontend (`frontend/`)
- Functional components + hooks only — no class components anywhere in the codebase.
- ESM (`import`/`export`), JSX file extension `.jsx`.
- One component per file, PascalCase filename matching the export
  (`HotelListingCard.jsx` exports `HotelListingCard`).
- Each component folder (`components/home/`, `components/details/`, etc.) has its own
  `.css` file(s) imported directly by the component — no CSS-in-JS, no Tailwind, no
  global stylesheet beyond `index.css`'s shared design tokens and utility classes
  (`.btn`, `.form-group`, `.alert`, etc.). New components should reuse those utility
  classes rather than re-declaring button/form styles.
- API calls never happen directly in a component — they go through the thin wrapper
  modules in `src/api/` (one file per REST resource), which are the only files that
  import `axiosClient`.
- Shared/global state is React Context (`AuthContext`) only — there is no Redux/Zustand/etc.
  in this project; don't introduce one for a single piece of shared state.
- Route guards (`PrivateRoute`, `HostRoute`) wrap page elements at the `<Route>` level in
  `App.jsx`, not inside the page component itself.

### Naming conventions observed
- React components: PascalCase (`ListingForm`, `AvailabilityCalendar`).
- Hooks/functions/variables: camelCase.
- CSS classes: kebab-case with a component-scoped prefix (`.hotel-card__title`,
  `.availability-calendar__day`) — a lightweight BEM-like convention, not a strict BEM
  implementation.
- Mongoose models: singular PascalCase (`User`, `Accommodation`, `Reservation`), matching
  Mongoose's own convention of auto-pluralizing to the collection name.

---

## 4. Git Workflow

**This repository has no git history yet** — `git status` currently returns "not a git
repository." The following is a **recommended workflow to adopt**, not a description of
existing practice:

1. `git init`, commit the current state as the baseline.
2. Adopt a simple trunk-based flow: `main` is always deployable (it's what each Vercel
   project should track); feature branches (`feat/...`, `fix/...`) merge into `main` via
   PR.
3. Since there's no CI yet, a PR's "gate" is manual: the author confirms in the PR
   description that they ran both builds and manually verified the change (see §2).
4. Commit messages: describe *why*, not just *what* — consistent with the "why not what"
   commenting standard above.

### Branching strategy (recommended, not yet in place)
```
main                      — deployable; each push here can auto-deploy via Vercel's git integration
├── feat/short-description
├── fix/short-description
└── chore/short-description
```
No `develop`/staging branch exists or is required at this project's current size — see
`docs/EXECUTIVE_DOCUMENTATION.md` §10 for why a staging environment isn't configured yet.

---

## 5. Deployment Workflow

See `README.md` → Deployment and `docs/EXECUTIVE_DOCUMENTATION.md` §10 for the full
picture. Short version for a developer making a change that needs to ship:

1. Merge to `main` (once git is initialized and a remote exists).
2. Vercel's git integration auto-builds and deploys both projects (frontend + backend)
   if they're connected to that branch.
3. There is no automated smoke test post-deploy — manually hit
   `https://<backend>.vercel.app/api/health` and load the frontend URL after every
   production deploy until a real CI/CD pipeline exists.

---

## 6. Debugging Guide

### Backend won't start / crashes on boot
- Check `MONGO_URI` is set and reachable. `config/db.js` logs `[mongo] connection
  error: ...` on failure — read the actual message, it's usually a bad connection
  string, an unreached Atlas IP allowlist, or a wrong password.
- `node --check <file>.js` catches syntax errors fast without booting the whole app.

### `EADDRINUSE: address already in use :::5000` (or `:5173`)
This happens most often on Windows/WSL setups where `node --watch` restarts the process
but the OS hasn't fully released the port from the previous instance yet. Find and kill
the actual process holding the port, then restart:
```bash
# Windows (from WSL, via cmd.exe)
cmd.exe /c "netstat -ano | findstr :5000"
cmd.exe /c "taskkill /F /PID <pid>"

# macOS/Linux
lsof -i :5000
kill -9 <pid>
```

### JWT-related 401s
- Confirm the token is actually being sent: check the `Authorization` header in the
  Network tab — it should read `Bearer <token>`, attached by the request interceptor in
  `frontend/src/api/axiosClient.js`.
- `JWT_SECRET` must be identical between the token that was issued and the server
  verifying it — if you changed `JWT_SECRET` after users already had tokens, every
  existing token is now invalid (expected — not a bug).

### Image upload failing
- Multer enforces **1.5MB per file, 5 files max** (`backend/middleware/upload.js`,
  `MAX_IMAGES_PER_LISTING` in `accommodationController.js`). Errors surface as `400`
  with a message like `"File too large"` or `"Too many files"` — these are mapped from
  Multer's own error codes in the central error handler (`app.js`), not raw crashes.

### CORS errors in the browser console
- The backend's `cors()` middleware only allows `CLIENT_URL`. If it's unset it defaults
  to `*` (which actually wouldn't produce a CORS error — so if you're seeing one, it
  means `CLIENT_URL` **is** set, just to the wrong origin). Fix the env var and restart.

### Frontend shows stale data after a backend change
- `node --watch server.js` restarts the backend automatically, but the frontend
  (`vite`) has its own HMR — if a component seems stuck, hard-refresh the browser
  (React Fast Refresh occasionally can't hot-swap a context provider, e.g.
  `AuthContext.jsx`, and falls back to a full page reload; if that didn't trigger, do it
  manually).

### "It works locally but not on Vercel"
- Check you're not relying on anything written to disk — the entire reason
  `middleware/upload.js` uses `memoryStorage()` is that Vercel's filesystem is
  ephemeral. Any new feature that tries to write a file to `backend/` at runtime will
  behave differently (or fail) in production. See `docs/EXECUTIVE_DOCUMENTATION.md` §2/§9.
- Check environment variables are set **in the Vercel dashboard**, not just in a local
  `.env` file — `.env` is gitignored and never reaches Vercel.

---

## 7. Common Issues and Fixes — Quick Reference

| Issue | Fix |
|---|---|
| `npm run seed` wiped data you wanted to keep | There's no undo — `seed.js` is destructive by design. Don't run it against a database you care about. |
| New host account can't see any listings | Correct behavior — `/dashboard` only shows listings where `host === req.user._id`. A brand-new host has none until they create one. |
| Edited listing lost its images | Check the `ListingForm` submit payload includes `existingImages` for any photos you wanted to keep — the update endpoint replaces the array, it doesn't merge with what's already stored unless the kept URLs are resubmitted. |
| Guest booking rejected with "maximum of N guests" | Server-side check against `Accommodation.guests` — this is intentional, not a bug; the client also validates this before submit. |
