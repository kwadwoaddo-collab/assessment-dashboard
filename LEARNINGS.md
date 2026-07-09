# Architectural Guidelines & Learnings

## Core Principles
1. **Vanilla JS & Native DOM**: The application is built using vanilla JavaScript and native DOM APIs. No frameworks (React, Vue, etc.) are used.
2. **State Management**: We use a custom, lightweight reactive store (`store.js`) for global state.
3. **Firestore Best Practices**:
   - Limit client-side data processing and filtering where possible. Use Firestore queries to improve scalability.
   - Be mindful of N+1 query patterns and fetching unbounded collections.
4. **PDF Generation**: `jsPDF` and `jspdf-autotable` are used to generate branded reports.
5. **Role-Based Access Control**: Managed at the application level via `currentUser.role`. Managers/admins can view all records, while tutors are restricted to their own.

## Recent Optimizations
- **Data Fetching**: Identified client-side date filtering and full collection fetches as scalability risks. Addressed these by proposing server-side aggregations (`getCountFromServer`, `getAggregateFromServer`) to avoid loading all documents into memory.
- **Code Smells & Bug Prevention**: Fixed variable shadowing (e.g., local `Date` objects hiding global `now()` functions) to ensure reliable helper behavior.
- **DRY Refactoring**: Centralized duplicated logic (e.g., date parsing in `utils.js` into a shared `parseDate` helper) to improve maintainability.
- **Vite Build Optimizations**: Resolved CSS `@import` ordering issues and converted ineffective dynamic imports to static imports to fix Vite compiler warnings during build.
- **Robust Date Parsing**: Addressed a critical bug where native `new Date()` failed silently on Firestore Timestamp objects during date filtering and PDF generation. Consolidated all date handling to use the robust `parseDate` and `formatDateForInput` utilities.
- **State Initialization**: Removed redundant list rebuilds (e.g. `studentMap` and `tutorMap` generation) in `reports/list.js` during delete actions to reduce unnecessary iteration cycles.
- **Build and Bundling Optimization**: Configured Rollup `manualChunks` in `vite.config.js` to split large third-party dependencies (e.g., Firebase, jsPDF) into separate vendor chunks, resolving Vite's >500kB chunk size warnings and improving initial load performance.
- **Database Scalability & Performance**: Identified a critical unbounded fetch issue in `refreshPendingCount()` where all submitted reports were downloaded to memory just to count them. Replaced this with Firestore's native `getCountFromServer()`. Additionally, enforced a safety `limit(1000)` on the default `getReports()` query to protect against unbounded reads as the database grows.
- **Phase 9 Nightly Review & Security Audit**: 
  - *UI State Sync & Filter Persistence*: Resolved bugs in `reports/list.js` (fixing a `ReferenceError` during draft deletion due to variable shadowing/scope mismatch) and in `students/list.js` and `tutors/list.js` (ensuring that deactivating/reactivating an item re-runs filtering/searches rather than rendering a raw unfiltered list).
  - *Bulk Performance Optimization*: Replaced slow, sequential, individual Firebase writes in student bulk CSV imports with chunked Firestore batch writes (`writeBatch`), reducing network roundtrips from O(N) to O(1) per 400 documents.
  - *Firestore & Storage Security Rules Hardening*: Addressed critical privilege escalation risks in `users` updates (preventing self-role/status modifications), validated write claims in `reports` (preventing users from self-approving drafts or writing reports under other tutor UIDs), and restricted Firebase Storage write/delete access to document owners or admins.
  - *Prompt Dialog & UX Polish*: Fixed an interpolation bug in `promptDialog` inside `dialog.js` where escaped template strings (e.g. `\${title}`) rendered literal text. Swapped out the telephone icon on the magic link screen for a more relevant envelope/mail icon.
  - *Utility Robustness*: Hardened `toISODate` in `utils.js` and upload checks in `storage.js` to prevent TypeErrors and RangeErrors when handling undefined parameters or Firestore Timestamp fields.
- **Phase 10 Nightly Review & Improvements**:
  - *API Token Authentication & CORS Hardening*: Addressed a major security vulnerability where `/api/send-report` was completely unauthenticated and had wildcard CORS headers, exposing the server's Resend email sending quota to the public. Secured the endpoint by passing the client's Firebase ID token in the `Authorization` header and validating it on the server using Firebase Auth's identity toolkit REST API (`accounts:lookup`).
  - *Default Filter Mismatch & Page Performance*: Fixed a mismatch where the student and tutor list views defaulted the filter dropdowns to "Active", but the tables rendered all students and tutors (including inactive ones) on initial load, causing visual inconsistency. Also optimized the reports list view by pre-filtering reports when a specific status query parameter (such as `reports-pending`) is provided, preventing redundant full list rendering and DOM layout thrashing.
  - *Timezone-Safe Date Inputs*: Resolved timezone offset bugs where `toISOString().split('T')[0]` shifted dates by one day depending on the client's timezone offset relative to UTC. Standardized all local-time form inputs to construct `YYYY-MM-DD` strings via timezone-agnostic local date methods.
  - *Module State Cleanups & Import Grouping*: Ensured module-level CSV parse state (`parsedRows`) is reset upon rendering the student import view to prevent leaking state between navigations, and cleaned up out-of-order import statements to follow architectural patterns.
- **Phase 11 Nightly Review & Improvements**:
  - *Dynamic PDF Page Splitting & Border Rendering*: Prevented layout overlapping by dynamically verifying if the height of the main assessment feedback section overflows the safe height margin on a single A4 page. If an overflow is detected, the authorization block and comments boxes are pushed to a fresh page. Ensured that page borders are dynamically rendered on all generated pages instead of just the first page. Fixed a layout typo where the student's school was incorrectly labelled 'Centre'.
  - *Magic Link Local Storage Isolation*: Prevented browser state pollution by introducing a `saveToStorage` parameter to `sendMagicLink`. When an administrator invites a new tutor or resends an invite, local storage is no longer overwritten with the tutor's email address, avoiding subsequent sign-in failures for the administrator.
  - *Reactivate Student UI Support*: Integrated a Reactivate button for inactive students in the student list table, allowing administrators to restore deactivated students.
  - *Robust CSV Import Date Parser*: Enhanced date parsing to support `YYYY/MM/DD` formats and trimmed inputs to prevent validation failures caused by trailing/leading whitespaces.
