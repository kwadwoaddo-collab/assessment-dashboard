// ================================================================
// Sidebar Navigation Component
// ================================================================

import { getState, isAdmin, isManagerOrAdmin } from '../store.js';
import { navigate } from '../router.js';
import { logout } from '../auth.js';
import { initials } from '../utils.js';
import { toast } from './toast.js';

const icons = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
  students:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  reports:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  tutors:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  approve:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  newreport: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`,
  settings:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>`,
  help:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  logout:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
};

export function renderSidebar(pendingCount = 0) {
  const user = getState('currentUser');
  const currentPage = getState('currentPage');
  const admin = isAdmin();
  const managerOrAdmin = isManagerOrAdmin();

  const navLink = (page, icon, label, badge = null) => `
    <button class="nav-link ${currentPage === page ? 'active' : ''}" data-nav="${page}">
      ${icons[icon]}
      ${label}
      ${badge ? `<span class="nav-badge">${badge}</span>` : ''}
    </button>`;

  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <img src="/logo.png" alt="Sydenham ASC" />
      <div class="sidebar-logo-text">
        <strong>Sydenham After School Club</strong>
        <span>Assessment Portal</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <span class="nav-section-label">Overview</span>
      ${navLink('dashboard', 'dashboard', 'Dashboard')}

      <span class="nav-section-label">Manage</span>
      ${navLink('students', 'students', 'Students')}
      ${admin ? navLink('tutors', 'tutors', 'Tutors') : ''}

      <span class="nav-section-label">Reports</span>
      ${navLink('reports', 'reports', 'All Reports')}
      ${navLink('report-create', 'newreport', 'New Report')}
      ${managerOrAdmin && pendingCount > 0 ? navLink('reports-pending', 'approve', 'Pending Approval', pendingCount) : ''}
      ${managerOrAdmin && pendingCount === 0 ? navLink('reports-pending', 'approve', 'Pending Approval') : ''}

      ${admin ? `<span class="nav-section-label">System</span>${navLink('settings', 'settings', 'Settings')}` : ''}

      <span class="nav-section-label" style="margin-top:auto;padding-top:20px;"></span>
      ${navLink('help', 'help', 'Help & Guide')}
      <button class="nav-link nav-link-signout" id="btn-signout-nav">
        ${icons.logout}
        Sign Out
      </button>
    </nav>

    <div class="sidebar-user">
      <div class="user-avatar">${initials(user?.displayName || user?.email || 'U')}</div>
      <div class="user-info">
        <strong>${user?.displayName || user?.email || 'User'}</strong>
        <span>${user?.role || 'tutor'}</span>
      </div>
      <button class="btn-logout" id="btn-logout" title="Sign out">${icons.logout}</button>
    </div>
  `;

  // Event delegation
  sidebar.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      navigate(btn.dataset.nav);
      // Close on mobile
      sidebar.classList.remove('open');
      document.querySelector('.sidebar-overlay')?.classList.remove('active');
    });
  });

  // Sign out – both the icon button and the nav link
  const doLogout = async () => {
    try {
      await logout();
      navigate('login');
    } catch (e) {
      toast.error('Failed to sign out');
    }
  };

  document.getElementById('btn-logout')?.addEventListener('click', doLogout);
  document.getElementById('btn-signout-nav')?.addEventListener('click', doLogout);
}

export function updateActiveNav(page) {
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.nav === page);
  });
}
