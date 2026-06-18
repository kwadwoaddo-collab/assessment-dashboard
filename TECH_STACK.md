# Tech Stack – Assessment Dashboard

Student assessment and parent reporting system for Sydenham After School Club.

---

## Languages

| Language | Usage |
|---|---|
| JavaScript (ES Modules) | All application logic — frontend, serverless functions, seed scripts |
| HTML5 | Single entry point (`index.html`); all other markup generated at runtime via `innerHTML` |
| CSS3 | Global styles (`src/style.css`) augmented by Tailwind utility classes |

---

## Frontend

### Architecture
Vanilla JavaScript SPA with a **custom hash-based router** (`src/router.js`) and a **custom reactive store** (`src/store.js`). Pages and components are plain JS modules that return HTML strings from `render*` functions and attach event listeners in `init*` functions. Despite React and `@vitejs/plugin-react` being present in `package.json`, the application does not use React components or JSX anywhere; the dependency is unused.

| Library | Version | Purpose |
|---|---|---|
| Tailwind CSS | ^4.3.1 | Utility-first CSS framework, integrated via the Vite plugin |
| Lucide | ^1.17.0 | SVG icon set |
| jsPDF | ^4.2.1 | Client-side A4 PDF generation for assessment reports |
| jspdf-autotable | ^5.0.8 | Table plugin for jsPDF (info grid, feedback tables) |
| uuid | ^14.0.0 | UUID generation for entity IDs |

### State Management
Custom pub/sub store (`src/store.js`) — no external state library. Tracks `currentUser`, `currentPage`, `pageParams`, and `pendingReportsCount`.

### Routing
Custom hash router (`src/router.js`) using `window.history.pushState` and `hashchange` events. Route handlers are render/init function pairs registered at boot time. Page transitions use the **View Transitions API** (`document.startViewTransition`) with a CSS fallback.

### Fonts
Inter (Google Fonts, weights 300–800).

---

## Build Tooling

| Tool | Version | Purpose |
|---|---|---|
| Vite | ^8.0.12 | Development server (port 3000) and production bundler |
| @vitejs/plugin-react | ^6.0.2 | Vite plugin (present but not actively used by the app code) |
| @tailwindcss/vite | ^4.3.1 | Tailwind CSS v4 Vite integration |

Build output goes to `dist/` with source maps enabled. No TypeScript, no testing framework.

---

## Backend & Infrastructure

### Serverless Functions
Vercel hosts one serverless function:

| File | Route | Purpose |
|---|---|---|
| `api/send-report.js` | `POST /api/send-report` | Sends assessment report PDF as email attachment via the Resend API |

### Deployment
**Vercel** — `vercel.json` configures:
- Build command: `npm run build`
- Output directory: `dist`
- SPA fallback rewrite (all non-`/api` paths → `index.html`)
- Security headers: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`
- Long-lived cache headers for static assets (`/assets/`)

---

## Firebase (Google Cloud)

All three Firebase services are used. The Firestore database is named **`sydenham-asc`** and hosted in `europe-west2` (London).

### Authentication — Firebase Auth
- Email/password sign-in
- Passwordless magic-link sign-in (`sendSignInLinkToEmail` / `signInWithEmailLink`)

### Database — Cloud Firestore

| Collection | Description |
|---|---|
| `users` | Tutors, managers, and admins — linked to Firebase Auth UIDs |
| `students` | Student records (name, year group, parent details, school) |
| `reports` | Assessment reports with a five-stage lifecycle: `draft → submitted → approved/rejected → sent` |

A composite index on `reports` supports duplicate-draft detection queries filtering by `studentId`, `subject`, `assessmentType`, `status`, `createdBy`, and `createdAt` simultaneously.

**Security rules** (`firestore.rules`) enforce role-based access:
- `tutor` — create/edit own draft or rejected reports; read all reports and students
- `manager` — same write access as admin except user creation
- `admin` — full write access including user creation and draft deletion

### Storage — Firebase Storage
Stores report attachments (JPEG, PNG, WEBP, HEIC, PDF) under `reports/{reportId}/attachments/`. Max file size: 10 MB.

---

## Email

**Resend** (`resend` ^6.12.4) — transactional email service. The Vercel serverless function calls the Resend API to deliver assessment report PDFs as attachments to parent/guardian email addresses. Configured via the `RESEND_API_KEY` and `RESEND_FROM_EMAIL` environment variables set in Vercel.

---

## Notable Dependencies

| Package | Version | Notes |
|---|---|---|
| firebase | ^12.14.0 | Auth, Firestore, and Storage SDKs |
| resend | ^6.12.4 | Email delivery (server-side only, in `/api`) |
| @emailjs/browser | ^4.4.1 | Present in `package.json` but superseded by the Resend/Vercel approach |

---

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | `.env` / Vercel | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `.env` / Vercel | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | `.env` / Vercel | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `.env` / Vercel | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `.env` / Vercel | Firebase Cloud Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | `.env` / Vercel | Firebase App ID |
| `RESEND_API_KEY` | Vercel only (server-side) | Resend email API key |
| `RESEND_FROM_EMAIL` | Vercel only (server-side) | Verified sender address |

---

## User Roles

| Role | Capabilities |
|---|---|
| `tutor` | Create reports, edit own drafts/rejected reports, view students and all reports |
| `manager` | All tutor rights plus approve/reject reports, manage students |
| `admin` | Full access including user management, settings, and report deletion |
