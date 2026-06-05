// ================================================================
// Dashboard Page
// ================================================================

import { getDashboardStats } from '../db.js';
import { getState } from '../store.js';
import { navigate } from '../router.js';

export async function renderDashboard() {
  const user = getState('currentUser');
  // Tutors see only their own stats; admins & managers see the full centre
  const isTutorView = user?.role === 'tutor';
  const stats = await getDashboardStats(isTutorView ? user.uid : null);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const monthName = new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' });

  return `
    <div class="dashboard-grid">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">${greeting()}, ${user?.displayName?.split(' ')[0] || 'there'} 👋</h1>
          <p class="page-subtitle">${isTutorView ? 'Your reports overview' : `Here's an overview of Sydenham After School Club`} · ${monthName}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" id="btn-new-report">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            New Report
          </button>
          ${user?.role === 'admin' ? `
          <button class="btn btn-secondary" id="btn-add-student">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            Add Student
          </button>` : ''}
        </div>
      </div>

      <!-- Core Stats -->
      <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
        <div class="stat-card" data-nav="students" style="cursor:pointer">
          <div class="stat-icon teal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">${stats.totalStudents}</div>
            <div class="stat-label">Total Students</div>
          </div>
        </div>

        ${user?.role === 'admin' ? `
        <div class="stat-card" data-nav="tutors" style="cursor:pointer">
          <div class="stat-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">${stats.totalTutors}</div>
            <div class="stat-label">Active Tutors</div>
          </div>
        </div>` : ''}

        <div class="stat-card" data-filter="draft" style="cursor:pointer">
          <div class="stat-icon amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">${stats.draft}</div>
            <div class="stat-label">Draft Reports</div>
          </div>
        </div>

        <div class="stat-card" data-filter="submitted" style="cursor:pointer">
          <div class="stat-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">${stats.submitted}</div>
            <div class="stat-label">Awaiting Approval</div>
            ${stats.submitted > 0 && user?.role === 'admin' ? `<div class="stat-trend up">⚡ Action needed</div>` : ''}
          </div>
        </div>

        <div class="stat-card" data-filter="approved" style="cursor:pointer">
          <div class="stat-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">${stats.approved}</div>
            <div class="stat-label">Approved Reports</div>
          </div>
        </div>

        <div class="stat-card" data-filter="sent" style="cursor:pointer">
          <div class="stat-icon violet">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">${stats.sent}</div>
            <div class="stat-label">Reports Sent</div>
          </div>
        </div>
      </div>

      <!-- Monthly Metrics -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Assessment Metrics</div>
            <div class="card-subtitle">${monthName}</div>
          </div>
        </div>
        <div class="stats-grid-2">
          <div style="display:flex;align-items:center;gap:16px;padding:16px;background:rgba(20,184,166,0.06);border-radius:12px;border:1px solid rgba(20,184,166,0.15);">
            <div class="stat-icon teal" style="width:44px;height:44px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div>
              <div class="stat-value" style="font-size:1.5rem;">${stats.createdThisMonth}</div>
              <div class="stat-label">Reports Created This Month</div>
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:16px;padding:16px;background:rgba(139,92,246,0.06);border-radius:12px;border:1px solid rgba(139,92,246,0.15);">
            <div class="stat-icon violet" style="width:44px;height:44px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <div>
              <div class="stat-value" style="font-size:1.5rem;">${stats.sentThisMonth}</div>
              <div class="stat-label">Reports Sent This Month</div>
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:16px;padding:16px;background:rgba(14,165,233,0.06);border-radius:12px;border:1px solid rgba(14,165,233,0.15);">
            <div class="stat-icon blue" style="width:44px;height:44px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </div>
            <div>
              <div class="stat-value" style="font-size:1.5rem;">${stats.avgScore != null ? stats.avgScore + '%' : '—'}</div>
              <div class="stat-label">Average Assessment Score</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions (admin only) -->
      ${stats.submitted > 0 && user?.role === 'admin' ? `
      <div class="card" style="border-color:rgba(14,165,233,0.3);background:rgba(14,165,233,0.05);">
        <div class="card-header">
          <div>
            <div class="card-title" style="color:var(--accent-400);">
              <svg style="width:16px;height:16px;display:inline;margin-right:6px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              ${stats.submitted} Report${stats.submitted !== 1 ? 's' : ''} Awaiting Your Approval
            </div>
            <div class="card-subtitle">Review and approve or reject submitted reports.</div>
          </div>
          <button class="btn btn-accent" id="btn-review">
            Review Now
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>` : ''}
    </div>
  `;
}

export function initDashboard() {
  document.getElementById('btn-new-report')?.addEventListener('click', () => navigate('report-create'));
  document.getElementById('btn-add-student')?.addEventListener('click', () => navigate('student-add'));
  document.getElementById('btn-review')?.addEventListener('click', () => navigate('reports-pending'));

  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.nav));
  });

  document.querySelectorAll('[data-filter]').forEach(el => {
    el.addEventListener('click', () => {
      navigate('reports', { status: el.dataset.filter });
    });
  });
}
