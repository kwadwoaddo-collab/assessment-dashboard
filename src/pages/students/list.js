// ================================================================
// Students List Page
// ================================================================

import { getStudents, deactivateStudent, updateStudent } from '../../db.js';
import { navigate } from '../../router.js';
import { formatDate, initials, escapeHtml, debounce } from '../../utils.js';
import { toast } from '../../components/toast.js';
import { isAdmin } from '../../store.js';
import { confirmDialog } from '../../components/dialog.js';

let allStudents = [];

export async function renderStudentsList() {
  allStudents = await getStudents({ includeInactive: true });

  return `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title">Students</h1>
          <p class="page-subtitle">${allStudents.filter(s => s.active !== false).length} active students</p>
        </div>
        ${isAdmin() ? `
        <div class="page-header-actions">
          <button class="btn btn-secondary" id="btn-import-students">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Import from CSV
          </button>
          <button class="btn btn-primary" id="btn-add-student">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            Add Student
          </button>
        </div>` : ''}
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-input-wrapper" style="flex:2;min-width:200px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="search-students" class="form-control" placeholder="Search by name, parent or email…" />
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

      <!-- Table -->
      <div class="card" style="padding:0;overflow:hidden;">
        <div class="table-wrapper" id="students-table-wrapper">
          ${renderStudentsTable(allStudents.filter(s => s.active !== false))}
        </div>
      </div>
    </div>
  `;
}

function renderStudentsTable(students) {
  if (students.length === 0) {
    return `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        <h3>No students found</h3>
        <p>Add a student to get started.</p>
      </div>`;
  }

  const rows = students.map(s => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="user-avatar" style="width:36px;height:36px;font-size:0.75rem;">${initials(s.studentName)}</div>
          <div>
            <div style="font-weight:600;">${escapeHtml(s.studentName)}</div>
            ${s.yearGroup ? `<div class="text-muted" style="font-size:0.75rem;">${escapeHtml(s.yearGroup)}</div>` : ''}
          </div>
        </div>
      </td>
      <td>${escapeHtml(s.parentName || '—')}</td>
      <td>
        <a href="mailto:${escapeHtml(s.parentEmail || '')}" style="color:var(--teal-400);text-decoration:none;">
          ${escapeHtml(s.parentEmail || '—')}
        </a>
      </td>
      <td>${escapeHtml(s.school || '—')}</td>
      <td>${formatDate(s.startDate)}</td>
      <td>
        <span class="badge ${s.active !== false ? 'badge-active' : 'badge-inactive'}">
          ${s.active !== false ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>
        <div class="table-actions">
          <button class="btn btn-secondary btn-sm" data-student-view="${s.id}" title="View profile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          ${isAdmin() ? `
          <button class="btn btn-secondary btn-sm" data-student-edit="${s.id}" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-secondary btn-sm" data-student-report="${s.id}" title="New report">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          </button>
          ${s.active !== false ? `
          <button class="btn btn-danger btn-sm" data-student-deactivate="${s.id}" title="Deactivate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          </button>` : `
          <button class="btn btn-secondary btn-sm" data-student-activate="${s.id}" title="Reactivate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>`}` : ''}
        </div>
      </td>
    </tr>
  `).join('');

  return `
    <table>
      <thead>
        <tr>
          <th>Student</th>
          <th>Parent / Guardian</th>
          <th>Parent Email</th>
          <th>Centre</th>
          <th>Date Joined</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

export function initStudentsList() {
  document.getElementById('btn-add-student')?.addEventListener('click', () => navigate('student-add'));
  document.getElementById('btn-import-students')?.addEventListener('click', () => navigate('student-import'));

  const searchInput = document.getElementById('search-students');
  const statusFilter = document.getElementById('filter-status');

  searchInput?.addEventListener('input', debounce(applyFilters, 250));
  statusFilter?.addEventListener('change', applyFilters);

  bindTableActions();
}

function applyFilters() {
  const searchInput = document.getElementById('search-students');
  const statusFilter = document.getElementById('filter-status');
  const q = searchInput?.value.toLowerCase() || '';
  const status = statusFilter?.value || 'active';

  let filtered = allStudents;

  if (status === 'active')   filtered = filtered.filter(s => s.active !== false);
  if (status === 'inactive') filtered = filtered.filter(s => s.active === false);

  if (q) {
    filtered = filtered.filter(s =>
      (s.studentName || '').toLowerCase().includes(q) ||
      (s.parentName || '').toLowerCase().includes(q) ||
      (s.parentEmail || '').toLowerCase().includes(q) ||
      (s.school || '').toLowerCase().includes(q)
    );
  }

  const wrapper = document.getElementById('students-table-wrapper');
  if (wrapper) wrapper.innerHTML = renderStudentsTable(filtered);
  bindTableActions();
}

function bindTableActions() {
  document.querySelectorAll('[data-student-view]').forEach(btn => {
    btn.addEventListener('click', () => navigate('student-detail', { id: btn.dataset.studentView }));
  });

  document.querySelectorAll('[data-student-edit]').forEach(btn => {
    btn.addEventListener('click', () => navigate('student-edit', { id: btn.dataset.studentEdit }));
  });

  document.querySelectorAll('[data-student-report]').forEach(btn => {
    btn.addEventListener('click', () => navigate('report-create', { studentId: btn.dataset.studentReport }));
  });

  document.querySelectorAll('[data-student-deactivate]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const confirmed = await confirmDialog('Deactivate this student? They will no longer appear in active lists.', { title: 'Deactivate Student', danger: true });
      if (!confirmed) return;
      try {
        await deactivateStudent(btn.dataset.studentDeactivate);
        toast.success('Student deactivated');
        allStudents = await getStudents({ includeInactive: true });
        applyFilters();
      } catch (e) {
        toast.error('Failed to deactivate student');
      }
    });
  });

  document.querySelectorAll('[data-student-activate]').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await updateStudent(btn.dataset.studentActivate, { active: true });
        toast.success('Student reactivated');
        allStudents = await getStudents({ includeInactive: true });
        applyFilters();
      } catch (e) {
        toast.error('Failed to reactivate student');
      }
    });
  });
}
