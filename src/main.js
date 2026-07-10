// ================================================================
// Main App Entry Point
// ================================================================

import './style.css';
import { initAuth, completeMagicLinkSignIn } from './auth.js';
import { isSignInWithEmailLink } from 'firebase/auth';
import { auth } from './firebase.js';
import { getState, setState, subscribe } from './store.js';
import { navigate, initRouter, registerRoute, render } from './router.js';
import { renderSidebar, updateActiveNav } from './components/nav.js';
import { getPendingReportsCount } from './db.js';

// ── Pages ──────────────────────────────────────────────────────
import { renderLogin, initLogin } from './pages/login.js';
import { renderDashboard, initDashboard } from './pages/dashboard.js';
import { renderStudentsList, initStudentsList } from './pages/students/list.js';
import { renderStudentForm, initStudentForm } from './pages/students/form.js';
import { renderStudentDetail, initStudentDetail } from './pages/students/detail.js';
import { renderImportStudents, initImportStudents } from './pages/students/import.js';
import { renderTutorsList, initTutorsList } from './pages/tutors/list.js';
import { renderTutorForm, initTutorForm } from './pages/tutors/form.js';
import { renderReportCreate, initReportCreate } from './pages/reports/create.js';
import { renderReportsList, initReportsList } from './pages/reports/list.js';
import { renderReportDetail, initReportDetail } from './pages/reports/detail.js';
import { renderReportApprove, initReportApprove } from './pages/reports/approve.js';
import { renderSettings, initSettings } from './pages/settings.js';
import { renderHelp, initHelp } from './pages/help.js';

// ── App Shell ──────────────────────────────────────────────────
function renderAppShell() {
  document.getElementById('app').innerHTML = `
    <div id="app-shell">
      <div id="sidebar"></div>
      <div id="main-content">
        <header id="top-header">
          <div>
            <div class="header-title" id="header-title">Dashboard</div>
          </div>
          <div class="header-actions">
            <button class="btn-menu" id="btn-menu-toggle" aria-label="Open menu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:24px;height:24px;"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </header>
        <main id="page-content" role="main"></main>
      </div>
    </div>
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
  `;

  // Mobile menu toggle
  document.getElementById('btn-menu-toggle')?.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar?.classList.toggle('open');
    overlay?.classList.toggle('active');
  });
  document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('active');
  });
}

// ── Route Definitions ─────────────────────────────────────────
function registerRoutes() {
  const r = (path, renderFn, initFn, titleFn, allowedRoles = null) => {
    registerRoute(path, async () => {
      const user = getState('currentUser');
      if (!user) { navigate('login'); return ''; }
      if (allowedRoles && !allowedRoles.includes(user.role)) { navigate('dashboard'); return ''; }
      const params = getState('pageParams') || {};
      return await renderFn(params);
    });
    addEventListener('page-rendered', (e) => {
      if (e.detail?.page !== path) return;
      const params = getState('pageParams') || {};
      initFn?.(params);
      // Update header title
      const titleEl = document.getElementById('header-title');
      if (titleEl) titleEl.textContent = typeof titleFn === 'function' ? titleFn(params) : titleFn;
      updateActiveNav(path);
    });
  };

  r('dashboard',       renderDashboard,     initDashboard,     'Dashboard');
  r('students',        renderStudentsList,  initStudentsList,  'Students');
  r('student-add',     renderStudentForm,   initStudentForm,   'Add Student',      ['admin', 'manager']);
  r('student-edit',    renderStudentForm,   initStudentForm,   'Edit Student',     ['admin', 'manager']);
  r('student-detail',  renderStudentDetail, initStudentDetail, 'Student Profile');
  r('student-import',  renderImportStudents, initImportStudents, 'Import Students', ['admin', 'manager']);
  r('tutors',          renderTutorsList,    initTutorsList,    'Tutors',       ['admin']);
  r('tutor-add',       renderTutorForm,     initTutorForm,     'Add Tutor',    ['admin']);
  r('tutor-edit',      renderTutorForm,     initTutorForm,     'Edit Tutor',   ['admin']);
  r('reports',         renderReportsList,   initReportsList,   'All Reports');
  r('reports-pending', p => renderReportsList({ status: 'submitted' }),
                                           p => initReportsList({ status: 'submitted' }), 'Pending Approval', ['admin', 'manager']);
  r('report-create',   renderReportCreate,  initReportCreate,  'New Report');
  r('report-detail',   renderReportDetail,  initReportDetail,  'Report Detail');
  r('report-approve',  renderReportApprove, initReportApprove, 'Review Report', ['admin', 'manager']);
  r('settings',        renderSettings,      initSettings,      'Settings',     ['admin']);
  r('help',            renderHelp,          initHelp,          'Help & Guide');

  // Login (no auth guard)
  registerRoute('login', () => renderLogin());
  addEventListener('page-rendered', (e) => {
    if (e.detail?.page === 'login') initLogin();
  });
}

// ── Pending count for sidebar badge ──────────────────────────
async function refreshPendingCount() {
  const user = getState('currentUser');
  if (!user || user.role !== 'admin') return;
  try {
    const count = await getPendingReportsCount();
    setState('pendingReportsCount', count);
    renderSidebar(count);
  } catch (_) {}
}

// ── Bootstrap ──────────────────────────────────────────────
async function boot() {
  registerRoutes();
  initRouter();

  // ── Magic-link handler ───────────────────────────────────
  // This must run BEFORE initAuth so that the Firebase session is established
  // and onAuthStateChanged fires with the signed-in user.
  const currentUrl = window.location.href;
  if (isSignInWithEmailLink(auth, currentUrl)) {
    // Show a full-screen loading message while we complete the sign-in.
    document.getElementById('app').innerHTML = `
      <div style="
        position:fixed;inset:0;display:flex;flex-direction:column;
        align-items:center;justify-content:center;
        background:#0a0f1e;gap:16px;
      ">
        <svg style="width:40px;height:40px;animation:spin 1s linear infinite;color:#14b8a6"
             viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="2" x2="12" y2="6"/>
          <line x1="12" y1="18" x2="12" y2="22"/>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
          <line x1="2" y1="12" x2="6" y2="12"/>
          <line x1="18" y1="12" x2="22" y2="12"/>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
        </svg>
        <p style="color:#94a3b8;font-family:system-ui;font-size:0.95rem;margin:0">
          Signing you in…
        </p>
      </div>
    `;
    try {
      await completeMagicLinkSignIn(currentUrl);
      // Clean up the one-time-use query params from the URL without reloading.
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      console.error('Magic-link sign-in failed:', err);
      // Surface the error briefly then fall through to the normal login page.
      document.getElementById('app').innerHTML = `
        <div style="
          position:fixed;inset:0;display:flex;flex-direction:column;
          align-items:center;justify-content:center;
          background:#0a0f1e;gap:16px;
        ">
          <p style="color:#f43f5e;font-family:system-ui;font-size:0.95rem;margin:0;max-width:320px;text-align:center">
            Sign-in link expired or already used. Please request a new one.
          </p>
        </div>
      `;
      await new Promise(r => setTimeout(r, 2500));
    }
  }
  // ────────────────────────────────────────────────
  initAuth(async () => {
    const user = getState('currentUser');
    const loading = document.getElementById('loading-screen');

    if (!user) {
      if (loading) document.getElementById('app').innerHTML = '';
      document.getElementById('app').innerHTML = renderLogin();
      setState('currentPage', 'login');
      initLogin();
      return;
    }

    // Render app shell
    renderAppShell();
    await renderSidebar(0);

    // Navigate to dashboard (or restore hash)
    const hash = window.location.hash.replace('#', '');
    const startPage = hash && hash !== 'login' ? hash : 'dashboard';
    navigate(startPage);

    // Load pending badge
    await refreshPendingCount();

    // Re-render sidebar on page change to update active state + badge
    subscribe('currentPage', async (page) => {
      const count = getState('pendingReportsCount');
      renderSidebar(count);
      if (page !== 'login') await refreshPendingCount();
    });
  });
}

// Sync aria-invalid with the CSS :user-invalid state
const syncAria = (el) => {
  if (el && el.matches) {
    el.setAttribute?.('aria-invalid', el.matches(':user-invalid') ? 'true' : 'false');
  }
};
document.addEventListener('blur', (e) => syncAria(e.target), true);
document.addEventListener('input', (e) => {
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('aria-invalid')) {
    syncAria(e.target);
  }
});

boot().catch((err) => {
  console.error('Fatal app error:', err);
  document.getElementById('app').innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0a0f1e;color:#f1f5f9;text-align:center;padding:20px;">
      <svg style="width:64px;height:64px;color:#f43f5e;margin-bottom:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
      <h2 style="margin-bottom:8px;">Failed to load application</h2>
      <p style="color:#94a3b8;max-width:400px;">${err.message || 'An unexpected error occurred. Please refresh the page or try again later.'}</p>
      <button onclick="window.location.reload()" style="margin-top:24px;padding:10px 20px;background:#14b8a6;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Reload Page</button>
    </div>
  `;
});
