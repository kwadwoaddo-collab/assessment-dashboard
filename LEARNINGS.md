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
