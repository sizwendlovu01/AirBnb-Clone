# Airbnb Clone — Executive Technical Documentation

**Document type:** Comprehensive technical reference
**Audience:** Engineers, technical leads, recruiters, investors, clients, contributors
**Basis:** This document was produced by direct inspection of the codebase as it exists
today — every claim below is traceable to a specific file. Where a capability does not
exist (tests, CI/CD, rate limiting, caching, monitoring), this document says so
explicitly rather than describing an idealized system.

---

## 1. Project Overview

### Project name
**Airbnb Clone** — a full-stack short-term-rental marketplace clone (monorepo: `frontend/` + `backend/`).

### Purpose of the system
A learning/portfolio-grade reproduction of Airbnb's core product surface: a public
guest-facing site for discovering and booking stays, and a host-facing admin dashboard
for managing listings and reservations — both backed by one shared REST API.

### Problem being solved
Demonstrates end-to-end command of a production-shaped MERN stack: JWT authentication
with role-based access, relational-style data modeling in MongoDB, image handling
compatible with serverless deployment constraints, and a polished, componentized React
UI — the kind of feature set typically graded in a fullstack-developer technical
assessment or portfolio review.

### Target users
- **Guests** (`role: 'user'`) — browse listings, view details, make reservations, manage their own bookings.
- **Hosts** (`role: 'host'`) — everything a guest can do, plus create/update/delete their own listings and view reservations made against them.

There is no separate "super admin" role; "admin" in this project means **host**, matching
Airbnb's own model where hosts administer their own inventory.

### Core business objectives
1. Let a guest discover a place to stay and complete a booking in as few steps as possible.
2. Let a host list a property (with photos, pricing, amenities) and manage its lifecycle without developer intervention.
3. Keep pricing calculations authoritative on the server so a client can never manipulate a booking total.
4. Ship on infrastructure that costs nothing to run at small scale (Vercel + MongoDB Atlas free tiers).

### Key features
- Public home page (hero, curated destination cards, experience sections, footer)
- Destination search with typeahead suggestions (matches both known destinations and live listings)
- Location search results page with a location/guest-count filter
- Listing details page: image gallery + lightbox, feature highlights, expandable
  description/amenities, a real two-month interactive availability calendar synced with
  the booking widget, review summary + illustrative review cards, host profile card,
  "things to know" policy panel, and a live cost calculator with server-verified totals
- JWT authentication with email/password login **and** self-service registration
  (guest or host), including a "become a host" deep link
- Host dashboard: create / view / update / delete listings (multipart image upload),
  view incoming reservations, cancel reservations
- Guest reservations page: view and cancel your own bookings
- Wishlist-style "Save" (localStorage) and native/clipboard "Share" on listing pages

---

## 2. System Architecture

### 2.1 High-level architecture overview

The system is a classic three-tier web application, deployed as two independently
hostable units:

- **Client tier** — a React 18 single-page application built with Vite, communicating
  exclusively over HTTPS/JSON with the API. All routing is client-side
  (`react-router-dom` v6).
- **Application tier** — a single Express.js application (`backend/app.js`) exposing a
  REST API under `/api/*`. It runs in one of two modes from the *same source*: a
  traditional long-running Node process (`server.js`, for local dev or a host like
  Render/Railway) or a Vercel serverless function (`api/index.js`).
- **Data tier** — a single MongoDB database (Mongoose ODM) with three collections:
  `users`, `accommodations`, `reservations`.

There is no separate cache layer, message queue, or background job runner. All work
happens synchronously within the HTTP request/response cycle.

### 2.2 Architecture diagram

```mermaid
flowchart TB
    subgraph Client["Client Tier"]
        Browser["Browser<br/>React 18 SPA (Vite build)"]
    end

    subgraph AppTier["Application Tier — Express app (backend/app.js)"]
        CORS["CORS middleware"]
        BodyParse["express.json / urlencoded"]
        DBGate["DB-connect middleware<br/>(cached Mongoose connection)"]
        Routes["Routers<br/>/api/users /api/accommodations /api/reservations"]
        Auth["auth middleware<br/>protect / requireHost"]
        Upload["multer memoryStorage<br/>(images → base64)"]
        Controllers["Controllers<br/>business logic + validation"]
        ErrorHandler["Central error handler"]
    end

    subgraph DataTier["Data Tier"]
        Mongo[("MongoDB Atlas<br/>users / accommodations / reservations")]
    end

    Browser -- "HTTPS + JWT Bearer token" --> CORS
    CORS --> BodyParse --> DBGate --> Routes
    Routes --> Auth --> Controllers
    Routes --> Upload --> Controllers
    Controllers <--> Mongo
    Controllers --> ErrorHandler
    ErrorHandler -- JSON response --> Browser
```

### 2.3 Data flow diagram

```mermaid
flowchart LR
    User((Guest / Host)) -->|interacts with| UI[React Components]
    UI -->|calls| API[api/*.js axios modules]
    API -->|attaches JWT| Axios[axiosClient interceptor]
    Axios -->|HTTPS JSON or multipart| Express[Express Routes]
    Express --> MW[auth.js / upload.js]
    MW --> Ctrl[Controllers]
    Ctrl -->|Mongoose queries| DB[(MongoDB)]
    DB -->|documents| Ctrl
    Ctrl -->|JSON| Axios
    Axios -->|resolved/rejected promise| UI
    UI -->|re-render| User
```

### 2.4 Component interaction diagram (frontend)

```mermaid
flowchart TB
    App[App.jsx — Routes] --> PublicLayout
    App --> DashboardLayout

    PublicLayout --> Header
    PublicLayout --> Outlet1[Outlet: page content]
    PublicLayout --> Footer

    Outlet1 --> HomePage
    Outlet1 --> LocationPage
    Outlet1 --> LocationDetailsPage
    Outlet1 --> LoginPage
    Outlet1 --> ReservationsPage

    LocationDetailsPage --> ImageGallery
    LocationDetailsPage --> AvailabilityCalendar
    LocationDetailsPage --> CostCalculator
    LocationDetailsPage --> ReviewsSection
    LocationDetailsPage --> HostDetails
    LocationDetailsPage --> ThingsToKnow
    LocationDetailsPage --> ExploreMore

    DashboardLayout --> AdminHeader
    DashboardLayout --> Outlet2[Outlet: admin page content]
    Outlet2 --> ListingsPage
    Outlet2 --> CreateListingPage
    Outlet2 --> EditListingPage
    Outlet2 --> HostReservationsPage

    ListingsPage --> HotelListingCard
    CreateListingPage --> ListingForm
    EditListingPage --> ListingForm

    AuthContext[(AuthContext — global)] -.provides user/login/register/logout.-> Header
    AuthContext -.-> AdminHeader
    AuthContext -.-> PrivateRoute
    AuthContext -.-> HostRoute
    AuthContext -.-> LoginPage
    AuthContext -.-> CostCalculator
```

### 2.5 Request lifecycle

Every API request passes through the same middleware chain regardless of hosting mode
(traditional server or Vercel serverless), because both entry points import the same
`app.js`:

```mermaid
sequenceDiagram
    participant C as Client (axios)
    participant CORS as CORS middleware
    participant BP as Body parser
    participant DB as DB-connect middleware
    participant R as Router
    participant A as auth.js (protect/requireHost)
    participant U as upload.js (multer, if multipart)
    participant Ctrl as Controller
    participant M as Mongoose Model
    participant Mongo as MongoDB

    C->>CORS: HTTP request + Authorization: Bearer <jwt>
    CORS->>BP: origin allowed
    BP->>DB: body parsed (json/urlencoded)
    DB->>DB: connectDB() — cached, resolves instantly if already connected
    DB->>R: next()
    R->>A: route requires auth?
    A->>A: jwt.verify(token, JWT_SECRET)
    A->>A: User.findById(decoded.id)
    A->>U: req.user attached, next()
    U->>U: parse multipart, buffer files in memory
    U->>Ctrl: req.files populated, next()
    Ctrl->>Ctrl: validatePayload() / business rules
    Ctrl->>M: Model.create/find/findById/save/deleteOne
    M->>Mongo: MongoDB wire protocol query
    Mongo-->>M: document(s)
    M-->>Ctrl: Mongoose document(s)
    Ctrl-->>C: res.json(...) with appropriate status code
```

---

## 3. Technology Stack

### Frontend

| Technology | Role | Why chosen / advantages |
|---|---|---|
| **React 18** | UI library, component model, hooks | Industry standard; hooks (`useState`/`useEffect`/`useContext`/`useMemo`) are used throughout for state and side effects without extra state-management libraries. |
| **Vite 8** | Dev server + production bundler | Near-instant HMR in dev, fast esbuild-based builds, zero-config for a React SPA. Chosen over CRA (unmaintained) for speed and modern defaults. |
| **react-router-dom v6** | Client-side routing | Nested route layouts (`<Outlet/>`) cleanly separate the public site chrome (`PublicLayout`) from the admin dashboard chrome (`DashboardLayout`) without duplicating `<Routes>` logic. |
| **axios** | HTTP client | Interceptor support (used for attaching the JWT to every request and normalizing error messages) is cleaner than hand-rolling `fetch` wrappers. |
| **Plain CSS (per-component stylesheets + CSS custom properties)** | Styling | No CSS framework dependency; `index.css` defines a small design-token system (`--color-primary`, `--radius-md`, etc.) reused across every component's own `.css` file. Keeps bundle size minimal and avoids a build step for a CSS-in-JS/Tailwind pipeline. |

### Backend

| Technology | Role | Why chosen / advantages |
|---|---|---|
| **Node.js 20.x** | Runtime | LTS version, pinned via `engines` in both `package.json` files so local/CI/Vercel all provision the same major version. |
| **Express 4** | HTTP framework | Minimal, well-understood, and — critically — an Express `app` instance is itself a valid `(req, res)` handler, which lets the exact same `app.js` run as a traditional server (`server.js`) or a Vercel serverless function (`api/index.js`) with zero duplicated routing logic. |
| **Mongoose 8** | MongoDB ODM | Schema definitions (`models/*.js`) give structure, defaults, and validation on top of MongoDB's schemaless documents; `.populate()` is used throughout to resolve `host`/`user`/`accommodation` references without hand-written joins. |
| **jsonwebtoken** | Auth token issuance/verification | Stateless auth — no server-side session store needed, which matters directly for serverless compatibility (no sticky sessions required). |
| **bcryptjs** | Password hashing | Pure-JavaScript implementation (unlike `bcrypt`, which needs native compilation via `node-gyp`). This was a deliberate choice for serverless/cross-platform deploy reliability — no native binary to rebuild per platform. |
| **multer (memoryStorage)** | Multipart/image upload parsing | Configured with `multer.memoryStorage()`, **not** disk storage — serverless functions have an ephemeral, largely read-only filesystem, so anything written to disk mid-request would vanish before the next invocation. Uploaded files are converted to base64 `data:` URIs and stored directly on the `Accommodation` document instead. |
| **cors** | Cross-origin requests | The SPA (one origin) and API (a different origin in production) require explicit CORS; origin is read from `CLIENT_URL`. |
| **dotenv** | Local env var loading | Loads `.env` in local dev; a no-op in production, where Vercel injects environment variables directly into `process.env`. |

### Database

| Technology | Role | Why chosen / advantages |
|---|---|---|
| **MongoDB (Atlas)** | Primary datastore | Document model maps naturally onto nested structures like `Accommodation.specificRatings` and `Reservation.priceBreakdown` without extra join tables; Atlas's free tier plus IP-allowlist-anywhere setup makes it trivial to reach from a serverless function with no fixed IP. |

### Authentication

| Component | Role |
|---|---|
| **JWT (HS256, `jsonwebtoken`)** | Bearer token issued on login/register, verified on every protected request by `middleware/auth.js`. Contains `{ id, role }`, signed with `JWT_SECRET`, expires per `JWT_EXPIRES_IN` (default `7d`). |
| **bcryptjs** | One-way password hashing with a per-user salt (`bcrypt.genSalt(10)`), applied in a Mongoose `pre('save')` hook so it's impossible to accidentally save a plaintext password. |
| **localStorage (client)** | Token persistence between page loads. See §9 and the Code Quality Review for the trade-offs of this choice vs. httpOnly cookies. |

There is no OAuth, no third-party auth provider (Clerk/Auth0/Firebase Auth), and no
session-cookie mechanism in this project — authentication is 100% self-rolled JWT.

### Cloud services

| Service | Role |
|---|---|
| **Vercel** | Hosts both the frontend (static Vite build) and the backend (Express app wrapped as a serverless function), as **two separate Vercel projects** against the same repo. |
| **MongoDB Atlas** | Managed MongoDB cluster; the only external data store. |

### Third-party APIs
None are called at runtime by the application. (Unsplash image URLs are hardcoded,
pre-selected static asset references baked into `seed.js` and a couple of frontend data
files — not a live API integration; no Unsplash API key or client is used in the code.)

### AI services
Not applicable — no AI/ML service is integrated into this codebase.

### DevOps tools
- **concurrently** (root `package.json`) — runs the frontend and backend dev servers in one terminal for local development. This is the entire "DevOps tooling" footprint; there is no Docker, no Terraform/IaC, and no CI pipeline defined in the repository (see §12 and the Code Quality Review for the implication).

### Monitoring tools
None. Observability is limited to `console.log`/`console.error` statements in
`app.js`, `config/db.js`, and `server.js`. There is no APM, error-tracking service
(e.g. Sentry), structured logging, or uptime monitoring configured.

---

## 4. Project Structure

```
Air BnB Clone 2/
├── package.json                 # root convenience scripts (concurrently dev, install:all, seed)
├── README.md                    # project front door (see rewritten version)
├── docs/                        # this documentation set
│
├── backend/
│   ├── app.js                   # Express app: middleware + routes, NO app.listen() — the single source of truth
│   ├── server.js                # traditional entry point: connectDB() then app.listen() — local dev / Render / Railway
│   ├── api/index.js             # Vercel serverless entry point: exports the same app, no listen()
│   ├── vercel.json               # rewrites every request to api/index (serverless routing)
│   ├── seed.js                  # idempotent reset-and-seed script: 2 demo users + 9 demo listings with curated real photos
│   ├── config/
│   │   └── db.js                # Mongoose connection with a cached-promise singleton (serverless-safe)
│   ├── models/
│   │   ├── User.js               # username/email/password(hashed)/role
│   │   ├── Accommodation.js      # listing fields + specificRatings subdocument + host ref
│   │   └── Reservation.js        # booking fields + priceBreakdown subdocument + accommodation/user/host refs
│   ├── controllers/
│   │   ├── userController.js         # register, login, getMe
│   │   ├── accommodationController.js # CRUD + image-to-base64 conversion + ownership checks
│   │   └── reservationController.js   # create (server-computed pricing), getByHost, getByUser, remove
│   ├── routes/
│   │   ├── userRoutes.js
│   │   ├── accommodationRoutes.js
│   │   └── reservationRoutes.js
│   ├── middleware/
│   │   ├── auth.js               # protect (JWT verify) + requireHost (role guard)
│   │   └── upload.js             # multer memoryStorage config, image-only filter, size/count limits
│   └── utils/
│       └── generateToken.js      # jwt.sign wrapper
│
└── frontend/
    ├── vite.config.js
    ├── vercel.json                # SPA fallback rewrite (all routes → index.html)
    ├── index.html
    └── src/
        ├── main.jsx               # ReactDOM root, wraps App in BrowserRouter + AuthProvider
        ├── App.jsx                # all <Routes>, split into PublicLayout vs. dashboard route trees
        ├── index.css              # global design tokens + shared utility classes (buttons, forms, alerts)
        ├── context/
        │   └── AuthContext.jsx    # user session state; login/register/logout; session restore on load
        ├── api/                   # one thin module per REST resource, all built on axiosClient
        │   ├── axiosClient.js     # axios instance + JWT-attaching request interceptor + error-normalizing response interceptor
        │   ├── authApi.js
        │   ├── accommodationApi.js
        │   └── reservationApi.js
        ├── utils/
        │   ├── resolveImage.js    # normalizes image src (absolute URL / data URI / legacy /uploads path) + deterministic fallback images
        │   └── amenityIcons.js    # keyword → icon lookup for the amenities list
        ├── data/
        │   ├── destinations.js    # static destination list + verified real photo URLs (home page, search suggestions)
        │   └── mockReviews.js     # deterministic illustrative review content (no review backend exists — see §7)
        ├── components/
        │   ├── layout/            # Header (search + suggestions + profile dropdown), Footer, PublicLayout
        │   ├── common/            # PrivateRoute, HostRoute, Spinner
        │   ├── home/              # HeroBanner, InspirationSection, ExperiencesSection, ThingsToDoSection, ShopAirbnbSection, FutureGetaways
        │   ├── location/          # LocationFilter, LocationCard
        │   ├── details/           # ImageGallery, AvailabilityCalendar, CostCalculator, ReviewsSection, HostDetails, ThingsToKnow, ExploreMore
        │   └── admin/             # AdminHeader, HotelListingCard, ListingForm (shared by create+edit)
        └── pages/
            ├── HomePage.jsx / LocationPage.jsx / LocationDetailsPage.jsx
            ├── LoginPage.jsx (login + register tabs) / ReservationsPage.jsx / NotFoundPage.jsx
            └── admin/
                ├── DashboardLayout.jsx      # AdminHeader + pill nav + <Outlet/>
                ├── ListingsPage.jsx         # "My Hotel List" — HotelListingCard grid
                ├── CreateListingPage.jsx / EditListingPage.jsx
                └── HostReservationsPage.jsx
```

There is no `/hooks`, `/lib`, or `/services` directory — logic that would live there in a
larger app is currently folded into `api/`, `utils/`, and `context/`.

---

## 5. Database Documentation

### 5.1 ER Diagram

```mermaid
erDiagram
    USER ||--o{ ACCOMMODATION : "hosts (host ref)"
    USER ||--o{ RESERVATION : "books (user ref)"
    USER ||--o{ RESERVATION : "receives (host ref, denormalized)"
    ACCOMMODATION ||--o{ RESERVATION : "is booked as"

    USER {
        ObjectId _id PK
        string username
        string email UK "unique, lowercase"
        string password "bcrypt hash, select:false"
        string role "enum: user | host, default user"
        date createdAt
        date updatedAt
    }

    ACCOMMODATION {
        ObjectId _id PK
        string title
        string location "indexed"
        string description
        number bedrooms
        number bathrooms
        number guests
        string type
        number price
        string_array amenities
        string_array images "data URI or absolute URL, max 5"
        number weeklyDiscount "0-100 percent"
        number cleaningFee
        number serviceFee
        number occupancyTaxes
        boolean enhancedCleaning
        boolean selfCheckIn
        number rating "0-5, default 4.5"
        number reviews "count, default 0"
        object specificRatings "embedded subdocument"
        ObjectId host FK
        date createdAt
        date updatedAt
    }

    RESERVATION {
        ObjectId _id PK
        ObjectId accommodation FK
        ObjectId user FK "the guest"
        ObjectId host FK "denormalized from accommodation.host"
        date checkIn
        date checkOut
        number guests
        number nights
        object priceBreakdown "embedded subdocument, server-computed"
        date createdAt
        date updatedAt
    }
```

### 5.2 Schema explanation

**`User`** (`backend/models/User.js`)
- `email` has a unique index (`unique: true`) and is lowercased/trimmed before storage,
  so lookups are case-insensitive.
- `password` has `select: false` — it is never returned by a normal `find`/`findById`;
  the login controller explicitly opts in with `.select('+password')`.
- Passwords are hashed in a `pre('save')` hook using `bcrypt.genSalt(10)` +
  `bcrypt.hash`, and only re-hashed `if (this.isModified('password'))` — so updating
  other fields on a user document (not currently exposed via any route, but schema-safe)
  wouldn't re-hash an already-hashed password.
- `toSafeObject()` is the only shape ever sent to the client — it excludes the password
  hash and Mongoose internals.

**`Accommodation`** (`backend/models/Accommodation.js`)
- `images` is a plain `[String]` — each entry is either a base64 `data:image/...`
  URI (host-uploaded), an absolute `https://` URL (seed data), or a legacy relative
  path (see resolveImage.js compatibility note in §4).
- `specificRatings` is an embedded subdocument (`_id: false`) with six 0–5 metrics
  (cleanliness, communication, checkIn, accuracy, location, value), each defaulting to
  5 — there's no logic anywhere that computes these from real review data; they're set
  once, either by the seed script or left at the schema defaults for host-created
  listings.
- A single index exists: `accommodationSchema.index({ location: 1 })`, supporting the
  location-substring search used by `GET /api/accommodations?location=`.

**`Reservation`** (`backend/models/Reservation.js`)
- `host` is **denormalized** from `accommodation.host` at creation time (not derived via
  a join on every read) specifically so `GET /api/reservations/host` can query
  `Reservation.find({ host: req.user._id })` directly, without a lookup/aggregation
  through `Accommodation` first.
- `priceBreakdown` is a plain embedded object (not a separate schema), computed once by
  `reservationController.computePriceBreakdown()` at booking time and stored — it is
  never recalculated after creation, so historical bookings retain the price terms that
  applied when they were made even if the listing's price changes later.
- A `pre('validate')` hook rejects any reservation where `checkOut <= checkIn`.

### 5.3 Relationships
- `Accommodation.host` → `User._id` (many accommodations per host)
- `Reservation.accommodation` → `Accommodation._id` (many reservations per accommodation)
- `Reservation.user` → `User._id` (many reservations per guest)
- `Reservation.host` → `User._id` (denormalized copy of the accommodation's host, for query efficiency)

### 5.4 Indexes
- `User.email` — unique index (enforced uniqueness + fast lookup on login/register)
- `Accommodation.location` — single-field index (supports the `$regex` location filter)

No indexes exist on `Reservation` beyond the default `_id` index — `host` and `user`
lookups on that collection currently perform a collection scan. At current/demo data
volumes this is invisible; see the Code Quality Review for the recommendation.

### 5.5 Constraints
- Mongoose schema-level: `required`, `min`/`max`, `enum` (see field tables above).
- Application-level: `accommodationController.validatePayload()` duplicates several of
  these checks before hitting the database (required fields present, `price >= 0`,
  `guests >= 1`) so the client gets a structured `{ errors: { field: message } }`
  response instead of a raw Mongoose `ValidationError`.
- Ownership constraints are enforced in the controller layer, not the schema: update/delete
  on an `Accommodation` checks `String(listing.host) === String(req.user._id)`; cancelling
  a `Reservation` checks the requester is either the booking guest or the listing's host.

### 5.6 Data lifecycle
- Deleting an `Accommodation` cascades: `accommodationController.remove()` also runs
  `Reservation.deleteMany({ accommodation: listing._id })` in the same request, so no
  reservation ever points at a listing that no longer exists.
- There is no soft-delete anywhere — every delete operation is a real
  `deleteOne()`/`deleteMany()`. There is no archival, audit trail, or "trash" concept.
- `seed.js` is destructive by design: it runs `deleteMany({})` on all three collections
  before inserting fresh demo data, intended for local/demo use only (see the loud
  warning implied by its behavior — running it against a production database wipes it).

---

## 6. API Documentation

Base URL: `{API_ORIGIN}/api` (e.g. `http://localhost:5000/api` locally). All
request/response bodies are JSON unless noted as `multipart/form-data`.

### 6.1 Users

#### `POST /api/users/register`
- **Purpose:** Create a new account (guest or host) and immediately log in (returns a token).
- **Auth:** None
- **Request body:**
```json
{
  "username": "Jane Doe",
  "email": "jane@example.com",
  "password": "password321",
  "role": "host"
}
```
- **Validation rules:** `username`, `email`, `password` required; `password` must be at
  least 6 characters; `email` must not already exist (case-insensitive); `role` is
  coerced to `"host"` only if exactly `"host"` is sent, otherwise `"user"`.
- **Success response — `201 Created`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "665f1...", "username": "Jane Doe", "email": "jane@example.com", "role": "host" }
}
```
- **Error responses:**
  - `400` — `{ "message": "username, email and password are required" }`
  - `400` — `{ "message": "Password must be at least 6 characters" }`
  - `409` — `{ "message": "An account with this email already exists" }`
  - `500` — `{ "message": "Failed to register user", "error": "..." }`

#### `POST /api/users/login`
- **Purpose:** Authenticate with email + password.
- **Auth:** None
- **Request body:**
```json
{ "email": "jane@example.com", "password": "password321" }
```
- **Success response — `200 OK`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "665f1...", "username": "Jane Doe", "email": "jane@example.com", "role": "host" }
}
```
- **Error responses:**
  - `400` — `{ "message": "Email and password are required" }`
  - `401` — `{ "message": "Invalid email or password" }` (used for both "no such user" and "wrong password", deliberately not distinguished, to avoid leaking which emails are registered)

#### `GET /api/users/me`
- **Purpose:** Return the currently authenticated user (used to restore a session on page load).
- **Auth:** Required (Bearer JWT)
- **Success response — `200 OK`:**
```json
{ "user": { "id": "665f1...", "username": "Jane Doe", "email": "jane@example.com", "role": "host" } }
```
- **Error responses:** `401` — `{ "message": "Not authorized, no token provided" }` / `"...invalid or expired token"` / `"...user no longer exists"`

---

### 6.2 Accommodations

#### `GET /api/accommodations`
- **Purpose:** List/search accommodations.
- **Auth:** None
- **Query parameters:** `location` (substring, case-insensitive), `guests` (minimum capacity, `$gte`)
- **Example:** `GET /api/accommodations?location=New%20York&guests=4`
- **Success response — `200 OK`:** array of accommodation objects, each with `host` populated to `{ username, email, createdAt }`, sorted newest first.

#### `GET /api/accommodations/host/mine`
- **Purpose:** List the authenticated host's own listings (used by the dashboard).
- **Auth:** Required + `role: host`
- **Success response — `200 OK`:** array of accommodations where `host === req.user._id`.

#### `GET /api/accommodations/:id`
- **Purpose:** Fetch a single listing (details page).
- **Auth:** None
- **Success response — `200 OK`:** single accommodation object, `host` populated.
- **Error responses:** `404` if not found, `400` if `:id` is not a valid ObjectId.

#### `POST /api/accommodations`
- **Purpose:** Create a listing.
- **Auth:** Required + `role: host`
- **Content-Type:** `multipart/form-data`
- **Request body (form fields):**
```
title, location, description, bedrooms, bathrooms, guests, type, price   (required)
amenities        — JSON-stringified array, e.g. ["wifi","kitchen"]
images           — up to 5 file parts (image/jpeg|png|webp|gif, ≤1.5MB each)
weeklyDiscount, cleaningFee, serviceFee, occupancyTaxes   (optional, default 0)
enhancedCleaning, selfCheckIn                              (optional booleans)
```
- **Validation rules:** all of `REQUIRED_FIELDS` present and non-empty; `price >= 0`;
  `guests >= 1`; image files must match an image mimetype and respect the multer
  size/count limits (see §9); combined image count is capped at 5 server-side
  regardless of what's submitted.
- **Success response — `201 Created`:** the newly created accommodation document.
- **Error responses:**
  - `400` — `{ "message": "Validation failed", "errors": { "price": "price is required", ... } }`
  - `400` — `{ "message": "Only image files (jpg, png, webp, gif) are allowed" }`
  - `400` — `{ "message": "Too many files" }` / `"File too large"` (Multer errors)
  - `401` / `403` — not authenticated / not a host

#### `PUT /api/accommodations/:id`
- **Purpose:** Update a listing (pre-filled edit form).
- **Auth:** Required + `role: host` + must own the listing
- **Content-Type:** `multipart/form-data` (same shape as create; `images` field carries the array of *kept* existing URLs as a JSON string, new files are separate file parts)
- **Success response — `200 OK`:** the updated document.
- **Error responses:** `404` (not found), `403` — `{ "message": "You can only edit your own listings" }`, `400` (validation), same Multer error mapping as create.

#### `DELETE /api/accommodations/:id`
- **Purpose:** Delete a listing (cascades its reservations).
- **Auth:** Required + `role: host` + must own the listing
- **Success response — `200 OK`:** `{ "message": "Accommodation deleted" }`
- **Error responses:** `404`, `403` — `{ "message": "You can only delete your own listings" }`

---

### 6.3 Reservations

#### `POST /api/reservations`
- **Purpose:** Book a stay. Price is **always recomputed server-side** from the
  listing's live price/fees — the client never supplies a total.
- **Auth:** Required
- **Request body:**
```json
{
  "accommodationId": "665f2a...",
  "checkIn": "2026-08-10",
  "checkOut": "2026-08-17",
  "guests": 2
}
```
- **Validation rules:** all four fields required; dates must parse; `checkOut` strictly
  after `checkIn`; `guests <= listing.guests`.
- **Business logic:** `nights = round((checkOut - checkIn) / 86,400,000ms)`. If
  `nights >= 7`, `weeklyDiscountAmount = round(subtotal * listing.weeklyDiscount / 100)`,
  else `0`. `total = subtotal - weeklyDiscountAmount + cleaningFee + serviceFee + occupancyTaxes`.
- **Success response — `201 Created`:**
```json
{
  "_id": "665f3b...",
  "accommodation": "665f2a...",
  "user": "665f10...",
  "host": "665f11...",
  "checkIn": "2026-08-10T00:00:00.000Z",
  "checkOut": "2026-08-17T00:00:00.000Z",
  "guests": 2,
  "nights": 7,
  "priceBreakdown": {
    "nightlyRate": 320,
    "subtotal": 2240,
    "weeklyDiscountAmount": 224,
    "cleaningFee": 50,
    "serviceFee": 50,
    "occupancyTaxes": 30,
    "total": 2146
  }
}
```
- **Error responses:** `400` (missing fields / bad dates / `checkOut <= checkIn` / over
  guest capacity), `404` (accommodation not found).

#### `GET /api/reservations/host`
- **Purpose:** List reservations made against any of the authenticated host's listings.
- **Auth:** Required
- **Success response — `200 OK`:** array, each with `accommodation` populated to
  `{ title, location, images, price }` and `user` populated to `{ username, email }`.

#### `GET /api/reservations/user`
- **Purpose:** List the authenticated guest's own bookings.
- **Auth:** Required
- **Success response — `200 OK`:** array, `accommodation` populated to `{ title, location, images, price }`.

#### `DELETE /api/reservations/:id`
- **Purpose:** Cancel a reservation.
- **Auth:** Required — the requester must be either the booking's `user` or its `host`.
- **Success response — `200 OK`:** `{ "message": "Reservation cancelled" }`
- **Error responses:** `404`, `403` — `{ "message": "You cannot cancel this reservation" }`

### 6.4 Miscellaneous

#### `GET /api/health`
- **Purpose:** Liveness check.
- **Auth:** None
- **Success response:** `{ "status": "ok", "uptime": 123.45 }`

#### Any unmatched `/api/*` route
- Returns `404` — `{ "message": "Route not found" }`

---

## 7. Authentication & Authorization

### Authentication flow
1. Client posts credentials to `/api/users/login` or `/api/users/register`.
2. Server verifies (bcrypt compare) or creates (bcrypt hash) the user, then signs a JWT
   containing `{ id, role }` with `JWT_SECRET`, expiring after `JWT_EXPIRES_IN` (default `7d`).
3. Client stores the token in `localStorage` under the key `airbnb_token` and the user
   object in React state (`AuthContext`).
4. Every subsequent axios request has the token attached by a request interceptor:
   `Authorization: Bearer <token>`.
5. On page load/refresh, `AuthContext` reads the stored token and calls `GET
   /api/users/me` to re-verify it's still valid server-side (rather than trusting a
   locally-decoded, unverified token) — an expired or tampered token is silently cleared
   and the user is treated as logged out.

```mermaid
sequenceDiagram
    participant U as User
    participant FE as React (AuthContext)
    participant API as Express API
    participant DB as MongoDB

    U->>FE: submits email + password
    FE->>API: POST /api/users/login
    API->>DB: findOne({email}).select('+password')
    DB-->>API: user document (with hash)
    API->>API: bcrypt.compare(password, hash)
    API->>API: jwt.sign({id, role}, JWT_SECRET, {expiresIn})
    API-->>FE: { token, user }
    FE->>FE: localStorage.setItem('airbnb_token', token)
    FE->>FE: setUser(user) — React state

    Note over FE,API: On every later request
    FE->>API: any request + Authorization: Bearer <token>
    API->>API: jwt.verify(token, JWT_SECRET)
    API->>DB: User.findById(decoded.id)
    DB-->>API: current user
    API->>API: req.user = user
    API-->>FE: response (200) or 401 if invalid/expired
```

### User roles
- `user` (guest) — default role.
- `host` — set at registration time via a checkbox ("I want to host my place"), or
  present on seeded demo accounts. There is no promotion/demotion flow after signup —
  role is fixed at account creation.

### Permissions matrix

| Action | Guest | Host (own resource) | Host (other's resource) |
|---|---|---|---|
| Browse/search listings | ✅ | ✅ | ✅ |
| View listing details | ✅ | ✅ | ✅ |
| Create a reservation | ✅ | ✅ | ✅ |
| View/cancel own reservations | ✅ | ✅ | ✅ |
| Create a listing | ❌ | ✅ | — |
| Update/delete a listing | ❌ | ✅ | ❌ (`403`) |
| View reservations on a listing | ❌ | ✅ | ❌ |
| Access `/dashboard/*` (frontend) | ❌ (redirected home) | ✅ | — |

### Session management
There is no server-side session store — JWT is fully stateless. "Logging out" is purely
a client-side action (`localStorage.removeItem` + clearing React state); a token is
valid until it expires or `JWT_SECRET` is rotated, and there is no token-revocation/blocklist
mechanism.

### Security mechanisms in place
- Passwords: bcrypt hash, 10 salt rounds, never returned by default queries.
- Authorization header verified per-request via `jwt.verify` (rejects tampered/expired tokens).
- Ownership re-checked in controllers for every mutating accommodation/reservation route
  (not just gated by role) — a host cannot edit or delete another host's listing even
  though both satisfy `requireHost`.
- CORS restricts cross-origin requests to `CLIENT_URL`.

See §10 (Security Documentation) and the Code Quality Review for gaps (no rate limiting,
no refresh-token rotation, `localStorage` token storage trade-offs).

---

## 8. Core Features Documentation

### 8.1 Guest browsing & search
- **Purpose:** Let anyone discover available stays without an account.
- **Business logic:** `GET /api/accommodations` filters by case-insensitive location
  substring and minimum guest count; no pagination exists (see Code Quality Review).
- **User flow:** Home page destination card / header search suggestion / footer link →
  `/locations/:location` → `LocationCard` grid → click → `/listings/:id`.
- **Backend flow:** `accommodationController.getAll` → Mongoose `$regex` + `$gte` query → populate host → return array.
- **Edge cases:** `:location` of `"anywhere"` is treated specially by `LocationPage` as
  "no filter" (returns everything) — this is a frontend convention, not a backend one;
  the backend just receives an empty `location` query in that case.
- **Error handling:** Network/API failures surface via the shared axios error
  interceptor as a message string, rendered in an `.alert-error` box.

### 8.2 Listing details & booking
- **Purpose:** Show everything a guest needs to decide, and let them book.
- **Workflow:** Load listing → render gallery, host info, amenities, reviews →
  guest picks dates either via the mid-page `AvailabilityCalendar` or the sticky
  `CostCalculator` (both controlled from the same `checkIn`/`checkOut` state in
  `LocationDetailsPage`, so they always agree) → live price breakdown recalculates
  client-side as a preview → "Reserve" submits to `POST /api/reservations`.
- **Business logic:** See §6.3 for the exact pricing formula. The **client-side**
  calculation in `CostCalculator.jsx` intentionally mirrors the **server-side** formula
  in `reservationController.js` exactly, but only the server's computation is ever
  persisted — the client number is a preview, not a source of truth.
- **Edge cases:** Booking without being logged in redirects to `/login` with the
  original page remembered in router state, so a successful login returns the guest to
  the listing instead of the home page. Guest count above the listing's `guests` cap is
  rejected both client-side (before submit) and server-side (authoritative).
- **Error handling:** Reservation failures show inline via `.alert-error` inside the cost
  calculator; success shows an inline confirmation message.

### 8.3 Host listing management
- **Purpose:** Let a host create, edit, and remove their own inventory.
- **Workflow:** `/dashboard` ("My Hotel List") → `HotelListingCard` per listing (image,
  stats, rating, price, Update/Delete) → Create/Edit use the same `ListingForm`
  component, differing only in initial values and the submit handler.
- **Business logic:** Image handling (§6.2/§9): up to 5 images, 1.5MB each, converted to
  base64 and capped server-side regardless of what the client sends. `ListingForm`
  duplicates the size/count validation client-side purely for fast feedback — the
  server-side cap is what actually protects the database.
- **Edge cases:** Editing a listing lets a host remove individual previously-uploaded
  images (`keptImages` state) independently of adding new ones (`newFiles` state); both
  lists are merged and re-capped at 5 on submit.
- **Error handling:** `ListingForm` shows per-field errors from both client validation
  and the server's `{ errors: {...} }` shape; delete requires a confirm dialog.

### 8.4 Reservation management (guest + host)
- **Purpose:** Let guests see/cancel their own bookings, and hosts see bookings against
  their listings.
- **Workflow:** `ReservationsPage` (guest, under `/reservations`) and
  `HostReservationsPage` (host, under `/dashboard/reservations`) both render a table with
  a Cancel action.
- **Business logic:** Cancellation is a hard delete — no cancellation-fee logic, no
  refund flow (there is no payment integration to refund from in the first place).
- **Edge cases:** Cancel is authorized for *either* party to the booking (guest or host),
  checked in `reservationController.remove`.

### 8.5 Authentication UI (login/register)
- **Purpose:** Single page (`/login`) with a tab toggle between Log in and Sign up.
- **Workflow:** Sign-up supports a `?mode=register&role=host` query string (used by the
  header's "Become a host" link) to land directly on the registration tab with the host
  checkbox pre-checked.
- **Business logic:** On success, both flows redirect based on `location.state.from`
  (if the user was bounced here from a protected route) or, failing that, by role
  (`host` → `/dashboard`, `user` → `/`).
- **Edge cases:** Demo-account quick-fill buttons on the login tab populate the form but
  do not submit it. Password confirmation mismatch and duplicate-email registration are
  both validated (client-side for the former, server 409 for the latter).

### 8.6 Illustrative content (documented explicitly, not hidden)
Two pieces of UI content are **not** backed by real data and should not be represented as
such in a portfolio/interview context:
- **Review cards** (`ReviewsSection` + `data/mockReviews.js`) — no `Review` model or
  endpoint exists. Cards are deterministically generated per listing ID from a fixed pool
  of names/quotes so the same listing always shows the same illustrative reviews.
- **Host trust badges** ("Superhost", "Identity verified", review count in `HostDetails`)
  — hardcoded presentational text, not derived from any verification workflow.

---

## 9. Environment Configuration

### Backend (`backend/.env`)

| Variable | Purpose | Required | Example | Security notes |
|---|---|---|---|---|
| `PORT` | Port for the traditional (`server.js`) entry point. Unused by the Vercel serverless entry point. | No (defaults to `5000`) | `5000` | Not sensitive. |
| `MONGO_URI` | MongoDB connection string. | **Yes** | `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/airbnb-clone` | Contains DB credentials — never commit; set via hosting provider's dashboard in production. |
| `JWT_SECRET` | HMAC signing key for JWTs. | **Yes** | a long random hex/base64 string | If leaked, an attacker can forge valid tokens for any user/role. Rotate immediately if exposed; rotating invalidates all existing sessions. |
| `JWT_EXPIRES_IN` | Token lifetime (any `ms`-compatible string). | No (defaults to `7d`) | `7d` | Longer = more convenient, more exposure if a token is stolen. |
| `CLIENT_URL` | Allowed CORS origin. | No (defaults to `*`) | `https://your-frontend.vercel.app` | Leaving this as `*` in production allows any site to call the API from a browser — see Security Documentation. |

### Frontend (`frontend/.env`)

| Variable | Purpose | Required | Example | Security notes |
|---|---|---|---|---|
| `VITE_API_URL` | Base origin of the backend API (no trailing slash, no `/api` suffix — that's appended in `axiosClient.js`). | No (defaults to `http://localhost:5000`) | `https://your-backend.vercel.app` | Not sensitive — this is public by nature (it's baked into the client bundle and visible to anyone). |

### Complete `.env.example` (as currently committed)

`backend/.env.example`:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/airbnb-clone
JWT_SECRET=replace-this-with-a-long-random-string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

`frontend/.env.example`:
```
VITE_API_URL=http://localhost:5000
```

---

## 10. Deployment Documentation

### Development environment
Local machine. `npm run install:all` then `npm run dev` (root) runs both apps via
`concurrently`; frontend on `:5173`, backend on `:5000` (`node --watch server.js`,
auto-restarting on file changes). Requires a reachable MongoDB — either a local `mongod`
or an Atlas cluster referenced by `MONGO_URI`.

### Staging environment
**Not configured.** There is no staging-specific config, environment, or branch strategy
defined anywhere in the repository. A staging setup would in practice be a third Vercel
project (frontend + backend) pointed at a separate Atlas database/branch, using the same
deployment mechanics described below for production.

### Production environment

**Primary approach: one Vercel project, repo root.** A root-level `vercel.json` defines
two `builds` (frontend via `@vercel/static-build`, backend via `@vercel/node`) and
`routes` that send `/api/*` to the backend function and everything else to the
frontend's built `index.html`. Both halves are served from the same domain, so no CORS
configuration is needed between them.

- **Root Directory** (Vercel dashboard): left blank — the repo root, not `frontend` or `backend`.
- **Environment variables** (all in this one project): `MONGO_URI`, `JWT_SECRET`,
  `JWT_EXPIRES_IN`. `CLIENT_URL` and `VITE_API_URL` are intentionally left **unset** —
  `axiosClient.js`'s `baseURL` falls back to `''` (same-origin relative `/api`) when
  `VITE_API_URL` isn't set, rather than a hardcoded `localhost` URL.
- MongoDB Atlas → Network Access → `0.0.0.0/0` (serverless functions have no static outbound IP).

**Alternate approach: two independent Vercel projects** (still fully supported —
`backend/vercel.json` and `frontend/vercel.json` remain committed for this path):
- **Backend project**, root directory `backend/`. Its own `vercel.json` rewrites all
  paths to `api/index.js`. Environment variables: `MONGO_URI`, `JWT_SECRET`,
  `JWT_EXPIRES_IN`, and `CLIENT_URL` set to the frontend project's URL (required here,
  since the two projects are different origins and CORS applies).
- **Frontend project**, root directory `frontend/`. Its own `vercel.json` adds the SPA
  fallback rewrite. `VITE_API_URL` set to the backend project's URL.
- Trade-off vs. the single-project approach: two dashboards/URLs to manage, but
  independent redeploys (a frontend-only change doesn't rebuild the backend, and vice versa).

### Build process
- Frontend: `vite build` — type-checking is **not** part of the build (this is a
  JavaScript, not TypeScript, project — there is no `tsc` step). Output is static
  HTML/CSS/JS in `frontend/dist/`.
- Backend: no build step — it's plain CommonJS Node.js, run directly.

### Deployment process
Push to the branch connected to each Vercel project (or run `vercel --prod` via the CLI)
triggers an automatic build + deploy. There is no manual deployment checklist beyond
"env vars are set" and "Atlas network access allows Vercel's IPs" (`0.0.0.0/0`, since
serverless functions don't have static outbound IPs on the free tier).

### Hosting requirements
- Node 20.x runtime (both apps).
- One MongoDB instance reachable over the public internet (Atlas free tier is
  sufficient at current scale).
- No persistent disk requirement (a deliberate constraint — see §6.2 and §9's image
  handling notes).

### CI/CD pipeline
**None exists.** There is no `.github/workflows/`, no other CI configuration file, and no
automated test/lint/build gate before merge or deploy in this repository. Vercel's
git-integration auto-deploy (build-on-push) is the only "pipeline," and it runs the
production build with no test or lint step in front of it. See the Code Quality Review
for the recommended addition.

### Infrastructure requirements
Minimal — this is intentionally a "serverless + managed database" stack with zero
servers to patch or scale manually. The trade-off (documented honestly, not glossed
over) is the image-storage constraint in §6.2/§9: no persistent volume means no
traditional file uploads, hence the base64-in-MongoDB approach.

---

## 11. Security Documentation

| Area | Current state |
|---|---|
| **Authentication security** | bcrypt password hashing (10 rounds); JWT signed with `HS256`; no brute-force protection on login/register (no rate limiting — see below). |
| **Authorization security** | Role check (`requireHost`) plus per-resource ownership check in controllers (not just role-based) for every mutating accommodation/reservation route. |
| **Input validation** | Manual field-presence/type checks in each controller (`validatePayload`, inline checks in `reservationController`); no schema-validation library (Joi/Zod/express-validator) — validation logic is hand-written and duplicated between frontend and backend. |
| **API security** | CORS restricted to `CLIENT_URL`, but **defaults to `*` if that env var is unset** — a production deployment that forgets to set `CLIENT_URL` is wide open to cross-origin requests from any site. |
| **Rate limiting** | **Not implemented.** No `express-rate-limit` or equivalent anywhere in `package.json` or middleware — login, register, and every other endpoint can be called at unlimited frequency by any client. |
| **Secrets management** | `.env` files are gitignored; production secrets live only in the Vercel dashboard. `JWT_SECRET` has no rotation mechanism. |
| **Data protection** | Passwords are hashed, never logged, never returned by default queries (`select: false`). No field-level encryption for any other data (not needed at this data sensitivity level — no payment/PII beyond email). |
| **OWASP considerations** | *Injection*: Mongoose parameterizes queries, so classic NoSQL injection via query operators is mitigated for the current code (no raw `$where` or string-built queries exist). *Broken Auth*: JWT in `localStorage` is readable by any script that achieves XSS on the page (no httpOnly cookie option is used) — see the Code Quality Review for the recommended mitigation. *Security Misconfiguration*: the CORS-defaults-to-`*` issue above; no `helmet`-style security headers are set anywhere. *Vulnerable Components*: dependencies were deliberately chosen to avoid native-binary packages (e.g. `bcryptjs` over `bcrypt`) for serverless portability, which incidentally also avoids a class of native-module supply-chain risk. |

---

## 12. Performance Documentation

- **Caching strategy:** None. No HTTP cache headers, no Redis/in-memory cache, no
  CDN-level caching beyond whatever Vercel applies by default to static frontend assets.
  Every API call hits MongoDB directly.
- **Query optimization:** Two indexes exist (`User.email`, `Accommodation.location`).
  `Reservation` queries by `host`/`user` are unindexed collection scans. No query uses
  `.lean()`, so every result is hydrated into a full Mongoose document even for simple
  read-only list endpoints.
- **Scalability considerations:** The stateless JWT design and serverless-safe cached
  Mongoose connection (`config/db.js`) mean the backend itself scales horizontally
  without code changes. The real ceiling is the database: unindexed reservation queries
  and unpaginated list endpoints (`GET /api/accommodations`, `/reservations/*`) would
  degrade linearly as those collections grow past a few thousand documents.
- **Performance bottlenecks (current, at scale):**
  1. No pagination on any list endpoint — a large `accommodations` or `reservations`
     collection is returned in full on every call.
  2. Base64 image storage inflates document size (~33% over the raw binary) and network
     payload size for every listing fetch that includes images, compared to serving
     images from a CDN/object store and returning only a URL.
  3. No caching means popular/unchanged data (e.g. a rarely-updated listing) is
     re-fetched from MongoDB on every page view.
- **Recommended improvements:** add `.skip()/.limit()` pagination + indexes on
  `Reservation.host`/`Reservation.user`; move images to object storage (S3/Cloudinary)
  once the constraint that motivated base64 storage (see §6.2) is no longer binding
  (e.g. if hosting moves off pure-serverless); add `.lean()` to read-only queries.

---

## 13. Testing Documentation

**No automated test suite exists in this repository.** There is no test runner
dependency (Jest/Vitest/Mocha/Playwright/Cypress) in either `package.json`, no `__tests__`
directory, and no `*.test.js`/`*.spec.js` file anywhere in the codebase.

- **Unit tests:** None.
- **Integration tests:** None.
- **End-to-end tests:** None committed to the repo. During development, ad-hoc
  end-to-end verification was performed using a temporary, uncommitted Playwright
  harness (spun up and torn down manually per change) driving a real headless browser
  against the running app to confirm specific flows worked — this was a development-time
  verification practice, not a persisted, repeatable test suite, and it does not run in
  CI (because no CI exists).
- **Coverage summary:** 0% automated coverage. See the Code Quality Review and Future
  Improvements for the recommended path to a real test suite (starting with API
  integration tests via `supertest` + `mongodb-memory-server`, since those tools were
  already proven to work against this exact codebase during manual verification).

---

## 14. Future Improvements Roadmap

### Short-term (days–weeks)
- Add a real automated test suite: API integration tests (supertest +
  mongodb-memory-server) covering auth, ownership checks, and the reservation pricing
  formula; a handful of frontend component tests (Vitest + React Testing Library).
- Add `express-rate-limit` to `/api/users/login` and `/api/users/register` at minimum.
- Stop defaulting CORS `origin` to `*`; fail closed (require `CLIENT_URL` to be set) in production.
- Add `.lean()` to read-only list queries; add pagination to `GET /api/accommodations`.

### Medium-term (weeks–months)
- Move image storage to a real object store (S3/Cloudinary/UploadThing) with signed
  upload URLs, removing the 1.5MB/5-image constraint that base64-in-MongoDB currently imposes.
- Add indexes on `Reservation.host` and `Reservation.user`.
- Replace hand-written request validation with a schema library (Zod/Joi) shared (or at
  least mirrored) between frontend and backend to remove the current duplication.
- Add a CI pipeline (GitHub Actions): lint + test + build on every PR, before any Vercel deploy gate.
- Build a real review system (model + endpoints) to replace the illustrative mock reviews.

### Long-term (months+)
- Introduce refresh-token rotation (short-lived access token + httpOnly-cookie refresh
  token) to address the `localStorage`-JWT XSS exposure documented in §11.
- Add a payment integration (Stripe) to back the currently-cosmetic pricing/cancellation flow.
- Add structured logging + an error-tracking service (Sentry) + basic uptime monitoring.
- Introduce a caching layer (Redis or HTTP caching headers) for read-heavy, rarely-changing endpoints.

### Scalability enhancements
- Read replicas / connection pooling tuning on MongoDB Atlas once traffic justifies it.
- CDN in front of listing images once they move off base64-in-document storage.
- Consider splitting the monolithic Express app into resource-specific serverless
  functions if cold-start latency becomes an issue at higher traffic (currently a single
  function handles all routes, per `vercel.json`'s catch-all rewrite).
