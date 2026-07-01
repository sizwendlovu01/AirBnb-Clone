# Architecture Diagrams

Consolidated reference of every diagram referenced across the documentation set. All
diagrams are Mermaid and render natively on GitHub. Source of truth for the claims
embedded in these diagrams is the actual code — see
`docs/EXECUTIVE_DOCUMENTATION.md` for the file-by-file detail behind each box.

---

## 1. System Architecture

```mermaid
flowchart TB
    subgraph Client["Client Tier"]
        Browser["Browser<br/>React 18 SPA (Vite build)"]
    end

    subgraph AppTier["Application Tier — Express app (backend/app.js)"]
        CORS["CORS middleware<br/>(origin = CLIENT_URL)"]
        BodyParse["express.json / urlencoded"]
        DBGate["DB-connect middleware<br/>(cached Mongoose connection)"]
        Routes["Routers<br/>/api/users /api/accommodations /api/reservations"]
        Auth["auth middleware<br/>protect / requireHost"]
        Upload["multer memoryStorage<br/>(images → base64 data URIs)"]
        Controllers["Controllers<br/>validation + ownership checks + business logic"]
        ErrorHandler["Central error handler<br/>(Multer errors → 400)"]
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

**Key architectural fact:** the same `app.js` is imported by both `server.js`
(traditional, calls `app.listen()`) and `api/index.js` (Vercel serverless, does not call
`listen()`) — there is exactly one copy of the routing/middleware logic, not two
maintained in parallel.

---

## 2. Database ERD

```mermaid
erDiagram
    USER ||--o{ ACCOMMODATION : "hosts (host ref)"
    USER ||--o{ RESERVATION : "books (user ref)"
    USER ||--o{ RESERVATION : "receives (host ref, denormalized)"
    ACCOMMODATION ||--o{ RESERVATION : "is booked as"

    USER {
        ObjectId _id PK
        string username
        string email UK "unique, lowercase, indexed"
        string password "bcrypt hash, select:false"
        string role "enum: user | host"
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
        string_array images "base64 data URI or absolute URL, max 5"
        number weeklyDiscount
        number cleaningFee
        number serviceFee
        number occupancyTaxes
        boolean enhancedCleaning
        boolean selfCheckIn
        number rating
        number reviews
        object specificRatings "embedded subdocument"
        ObjectId host FK
        date createdAt
        date updatedAt
    }

    RESERVATION {
        ObjectId _id PK
        ObjectId accommodation FK
        ObjectId user FK
        ObjectId host FK "denormalized copy of accommodation.host"
        date checkIn
        date checkOut
        number guests
        number nights
        object priceBreakdown "embedded, computed server-side once at booking time"
        date createdAt
        date updatedAt
    }
```

---

## 3. Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as React (AuthContext)
    participant API as Express API
    participant DB as MongoDB

    U->>FE: submits email + password (or registration form)
    FE->>API: POST /api/users/login  (or /register)
    API->>DB: findOne({email}).select('+password')  [login]<br/>or create({...}) with pre-save bcrypt hash [register]
    DB-->>API: user document
    API->>API: bcrypt.compare(password, hash)  [login only]
    API->>API: jwt.sign({id, role}, JWT_SECRET, {expiresIn: JWT_EXPIRES_IN})
    API-->>FE: { token, user }
    FE->>FE: localStorage.setItem('airbnb_token', token)
    FE->>FE: setUser(user) in React state

    Note over FE,API: Session restore on page load
    FE->>FE: read token from localStorage
    FE->>API: GET /api/users/me
    API->>API: jwt.verify + User.findById(decoded.id)
    API-->>FE: current user, or 401 (token cleared client-side)

    Note over FE,API: Every subsequent request
    FE->>API: any request + Authorization: Bearer <token>
    API->>API: protect middleware verifies + attaches req.user
    API->>API: requireHost middleware (host-only routes)
    API-->>FE: 200 response, or 401/403
```

---

## 4. User Journey

```mermaid
flowchart TD
    Start(["Visitor lands on Home Page"]) --> Browse{"Browsing or logging in?"}

    Browse -->|Browse| Search["Search a destination<br/>(header suggestions / destination card / footer link)"]
    Search --> Results["Location results page<br/>(LocationCard grid)"]
    Results --> Details["Listing details page"]
    Details --> BookAttempt{"Logged in?"}
    BookAttempt -->|No| Login1["Redirect to /login<br/>(original page remembered)"]
    Login1 --> AuthChoice
    BookAttempt -->|Yes| Reserve["Pick dates + guests → Reserve"]
    Reserve --> Confirmed["Reservation created<br/>(server-computed price)"]
    Confirmed --> MyReservations["/reservations — view/cancel"]

    Browse -->|Log in / Sign up| AuthChoice{"Have an account?"}
    AuthChoice -->|Yes| Login2["Log in tab"]
    AuthChoice -->|No| Register["Sign up tab<br/>(optional 'I want to host' checkbox)"]
    Login2 --> RoleCheck{"role?"}
    Register --> RoleCheck
    RoleCheck -->|user| Home2["Redirect home"]
    RoleCheck -->|host| Dashboard["Redirect to /dashboard"]

    Dashboard --> HostFlow["My Hotel List:<br/>Create / Update / Delete listings"]
    HostFlow --> HostReservations["/dashboard/reservations —<br/>view bookings on own listings"]
```

---

## 5. Request Lifecycle (single request, detailed)

```mermaid
sequenceDiagram
    participant C as Client (axios)
    participant CORS as CORS middleware
    participant BP as Body parser
    participant DB as DB-connect middleware
    participant R as Router
    participant A as auth.js
    participant U as upload.js (multipart only)
    participant Ctrl as Controller
    participant M as Mongoose Model
    participant Mongo as MongoDB

    C->>CORS: HTTP request (+ Authorization header if authenticated)
    CORS->>BP: origin allowed (matches CLIENT_URL)
    BP->>DB: body parsed
    DB->>DB: connectDB() — cached; instant if already connected (readyState === 1)
    DB->>R: next()
    alt route requires auth
        R->>A: protect middleware
        A->>A: jwt.verify(token, JWT_SECRET)
        A->>A: User.findById(decoded.id)
        A->>R: req.user attached
    end
    alt route requires host role
        R->>A: requireHost middleware
        A->>R: req.user.role === 'host' ? next() : 403
    end
    alt multipart request (create/update listing)
        R->>U: multer.array('images', 5)
        U->>U: buffer files in memory, filter by mimetype, enforce size/count limits
        U->>R: req.files populated (or 400 MulterError)
    end
    R->>Ctrl: controller function invoked
    Ctrl->>Ctrl: validatePayload() / inline business rules / ownership check
    Ctrl->>M: Model.create / find / findById / save / deleteOne
    M->>Mongo: MongoDB wire protocol query
    Mongo-->>M: document(s)
    M-->>Ctrl: Mongoose document(s)
    Ctrl-->>C: res.json(...) with status code (200/201/400/401/403/404/500)
```

---

## 6. Deployment Architecture

```mermaid
flowchart TB
    subgraph VercelFE["Vercel Project #1 — Root: frontend/"]
        Build1["vite build → dist/"]
        CDN["Static hosting + CDN"]
        Rewrite1["vercel.json:<br/>/(.*) → /index.html<br/>(SPA fallback)"]
    end

    subgraph VercelBE["Vercel Project #2 — Root: backend/"]
        Rewrite2["vercel.json:<br/>/(.*) → /api/index"]
        Fn["Serverless Function<br/>api/index.js → app.js"]
    end

    subgraph Atlas["MongoDB Atlas"]
        DB[("Cluster<br/>Network Access: 0.0.0.0/0")]
    end

    EnvFE["Env: VITE_API_URL"] -.-> Build1
    EnvBE["Env: MONGO_URI, JWT_SECRET,<br/>JWT_EXPIRES_IN, CLIENT_URL"] -.-> Fn

    User(["End user browser"]) -->|GET /| CDN
    CDN --> Rewrite1
    User -->|"fetch(VITE_API_URL + /api/...)"| Rewrite2
    Rewrite2 --> Fn
    Fn <-->|Mongoose, cached connection| DB

    style VercelFE fill:#f5f5ff
    style VercelBE fill:#fff5f5
    style Atlas fill:#f0fff4
```

**Why two projects, not one:** the frontend is a static SPA build with its own
framework preset (Vite) and the backend is a Node API best run as serverless functions
— different build steps, different runtimes. Keeping them as two Vercel projects (a
common pattern for MERN-style apps on Vercel) means either half can be redeployed
independently and neither `vercel.json` has to do double duty.
