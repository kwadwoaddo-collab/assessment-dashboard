// ================================================================
// Tutors List Page
// ================================================================

import { getUsers, updateUser } from '../../db.js';
import { navigate } from '../../router.js';
import { formatDate, escapeHtml, initials } from '../../utils.js';
import { toast } from '../../components/toast.js';
import { debounce } from '../../utils.js';
import { confirmDialog } from '../../components/dialog.js';

let allTutors = [];

export async function renderTutorsList() {
  allTutors = await getUsers({ role: 'tutor' });

  return `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title">Tutors</h1>
          <p class="page-subtitle">${allTutors.filter(t => t.active !== false).length} active tutors</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" id="btn-add-tutor">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            Add Tutor
          </button>
        </div>
      </div>

      <div class="filters-bar">
        <div class="search-input-wrapper" style="flex:2;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="search-tutors" class="form-control" placeholder="Search tutors…" />
        </div>
        <div class="form-group" style="min-width:140px;">
          <label class="form-label">Status</label>
          <select id="filter-status" class="form-control">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      <div class="card" style="padding:0;overflow:hidden;">
        <div class="table-wrapper" id="tutors-table-wrapper">
          ${renderTutorsTable(allTutors.filter(t => t.active !== false))}
        </div>
      </div>
    </div>
  `;
}

function renderTutorsTable(tutors) {
  if (tutors.length === 0) {
    return `<div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <h3>No tutors found</h3>
      <p>Add a tutor account to get started.</p>
    </div>`;
  }

  const rows = tutors.map(t => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="user-avatar" style="background:linear-gradient(135deg,var(--accent-600),var(--accent-500));width:36px;height:36px;font-size:0.75rem;">${initials(t.name)}</div>
          <div>
            <div style="font-weight:600;">${escapeHtml(t.name)}</div>
            <div class="text-muted" style="font-size:0.75rem;">${escapeHtml(t.email)}</div>
          </div>
        </div>
      </td>
      <td><span class="badge badge-tutor">Tutor</span></td>
      <td>${formatDate(t.createdAt)}</td>
      <td><span class="badge ${t.active !== false ? 'badge-active' : 'badge-inactive'}">${t.active !== false ? 'Active' : 'Inactive'}</span></td>
      <td>
        <div class="table-actions">
          <button class="btn btn-secondary btn-sm" data-tutor-edit="${t.id}">Edit</button>
          ${t.active !== false
            ? `<button class="btn btn-danger btn-sm" data-tutor-deactivate="${t.id}">Deactivate</button>`
            : `<button class="btn btn-secondary btn-sm" data-tutor-activate="${t.id}">Reactivate</button>`}
        </div>
      </td>
    </tr>
  `).join('');

  return `
    <table>
      <thead>
        <tr>
          <th>Tutor</th>
          <th>Role</th>
          <th>Added</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

export function initTutorsList() {
  document.getElementById('btn-add-tutor')?.addEventListener('click', () => navigate('tutor-add'));

  const searchInput = document.getElementById('search-tutors');
  const statusFilter = document.getElementById('filter-status');

  searchInput?.addEventListener('input', debounce(applyFilters, 250));
  statusFilter?.addEventListener('change', applyFilters);
  bindActions();
}

function applyFilters() {
  const searchInput = document.getElementById('search-tutors');
  const statusFilter = document.getElementById('filter-status');
  const q = searchInput?.value.toLowerCase() || '';
  const status = statusFilter?.value || 'active';
  let filtered = allTutors;
  if (status === 'active')   filtered = filtered.filter(t => t.active !== false);
  if (status === 'inactive') filtered = filtered.filter(t => t.active === false);
  if (q) filtered = filtered.filter(t => (t.name || '').toLowerCase().includes(q) || (t.email || '').toLowerCase().includes(q));
  document.getElementById('tutors-table-wrapper').innerHTML = renderTutorsTable(filtered);
  bindActions();
}

function bindActions() {
  document.querySelectorAll('[data-tutor-edit]').forEach(btn => {
    btn.addEventListener('click', () => navigate('tutor-edit', { id: btn.dataset.tutorEdit }));
  });

  document.querySelectorAll('[data-tutor-deactivate]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const confirmed = await confirmDialog('Deactivate this tutor?', { title: 'Deactivate Tutor', danger: true });
      if (!confirmed) return;
      try {
        await updateUser(btn.dataset.tutorDeactivate, { active: false });
        toast.success('Tutor deactivated');
        allTutors = await getUsers({ role: 'tutor' });
        applyFilters();
      } catch { toast.error('Failed to deactivate tutor'); }
    });
  });

  document.querySelectorAll('[data-tutor-activate]').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await updateUser(btn.dataset.tutorActivate, { active: true });
        toast.success('Tutor reactivated');
        allTutors = await getUsers({ role: 'tutor' });
        applyFilters();
      } catch { toast.error('Failed to reactivate tutor'); }
    });
  });
}
