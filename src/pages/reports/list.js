// ================================================================
// Reports List Page
// ================================================================

import { getReports, getStudents, getUsers, deleteReport } from '../../db.js';
import { navigate } from '../../router.js';
import {
  formatDate, escapeHtml, statusLabel, workingLevelClass,
  SUBJECTS, ASSESSMENT_TYPES, debounce
} from '../../utils.js';
import { isAdmin } from '../../store.js';
import { toast } from '../../components/toast.js';
import { confirmDialog } from '../../components/dialog.js';

let allReports = [];
let students = [];
let tutors = [];

export async function renderReportsList(params = {}) {
  try {
    [allReports, students, tutors] = await Promise.all([
      getReports(),
      getStudents(),
      getUsers({ role: 'tutor' }),
    ]);
  } catch (e) {
    return `<div class="empty-state"><h3>Error loading reports</h3><p>${e.message}</p></div>`;
  }

  const studentMap = {};
  students.forEach(s => { studentMap[s.id] = s; });
  const tutorMap = {};
  tutors.forEach(t => { tutorMap[t.id] = t; });

  return `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title">All Reports</h1>
          <p class="page-subtitle">${allReports.length} total report${allReports.length !== 1 ? 's' : ''}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" id="btn-new-report">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            New Report
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-input-wrapper" style="flex:2;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="search-reports" class="form-control" placeholder="Search student name…" />
        </div>

        <div class="form-group" style="min-width:140px;">
          <label class="form-label">Subject</label>
          <select id="filter-subject" class="form-control">
            <option value="">All Subjects</option>
            ${SUBJECTS.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>

        <div class="form-group" style="min-width:160px;">
          <label class="form-label">Type</label>
          <select id="filter-type" class="form-control">
            <option value="">All Types</option>
            ${ASSESSMENT_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
        </div>

        <div class="form-group" style="min-width:130px;">
          <label class="form-label">Status</label>
          <select id="filter-status" class="form-control">
            <option value="" ${!params.status ? 'selected' : ''}>All Statuses</option>
            <option value="draft" ${params.status === 'draft' ? 'selected' : ''}>Draft</option>
            <option value="submitted" ${params.status === 'submitted' ? 'selected' : ''}>Submitted</option>
            <option value="approved" ${params.status === 'approved' ? 'selected' : ''}>Approved</option>
            <option value="rejected" ${params.status === 'rejected' ? 'selected' : ''}>Rejected</option>
            <option value="sent" ${params.status === 'sent' ? 'selected' : ''}>Sent</option>
          </select>
        </div>

        ${isAdmin() ? `
        <div class="form-group" style="min-width:140px;">
          <label class="form-label">Tutor</label>
          <select id="filter-tutor" class="form-control">
            <option value="">All Tutors</option>
            ${tutors.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('')}
          </select>
        </div>` : ''}

        <div class="form-group" style="min-width:130px;">
          <label class="form-label">Date From</label>
          <input type="date" id="filter-date-from" class="form-control" />
        </div>

        <div class="form-group" style="min-width:130px;">
          <label class="form-label">Date To</label>
          <input type="date" id="filter-date-to" class="form-control" />
        </div>

        <button class="btn btn-secondary btn-sm" id="btn-clear-filters" style="align-self:flex-end;">
          Clear
        </button>
      </div>

      <!-- Table -->
      <div class="card" style="padding:0;overflow:hidden;">
        <div class="table-wrapper" id="reports-table-wrapper">
          ${renderReportsTable(allReports, studentMap, tutorMap)}
        </div>
      </div>
    </div>
  `;
}

function renderReportsTable(reports, studentMap, tutorMap) {
  if (!studentMap) {
    studentMap = {};
    students.forEach(s => { studentMap[s.id] = s; });
  }
  if (!tutorMap) {
    tutorMap = {};
    tutors.forEach(t => { tutorMap[t.id] = t; });
  }

  if (reports.length === 0) {
    return `<div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
      <h3>No reports found</h3>
      <p>Try adjusting your filters or create a new report.</p>
    </div>`;
  }

  const rows = reports.map(r => {
    const student = studentMap[r.studentId];
    const tutor = tutorMap[r.createdBy];
    return `
      <tr>
        <td>
          <div style="font-weight:600;">${escapeHtml(student?.studentName || 'Unknown Student')}</div>
          ${student?.yearGroup ? `<div class="text-muted" style="font-size:0.75rem;">${escapeHtml(student.yearGroup)}</div>` : ''}
        </td>
        <td><strong>${escapeHtml(r.subject || '—')}</strong></td>
        <td style="font-size:0.825rem;">${escapeHtml(r.assessmentType || '—')}</td>
        <td>${formatDate(r.assessmentDate)}</td>
        <td>${r.assessmentScore != null ? r.assessmentScore + '%' : '—'}</td>
        <td>${escapeHtml(tutor?.name || 'Unknown')}</td>
        <td><span class="badge badge-${r.status}">${statusLabel(r.status)}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" data-view-report="${r.id}">View</button>
            ${r.status === 'submitted' && isAdmin()
              ? `<button class="btn btn-accent btn-sm" data-approve-report="${r.id}">Review</button>`
              : ''}
            ${r.status === 'draft'
              ? `<button class="btn btn-danger btn-sm" data-delete-report="${r.id}" title="Delete this draft">Delete</button>`
              : ''}
          </div>
        </td>
      </tr>`;
  }).join('');

  return `
    <table>
      <thead>
        <tr>
          <th>Student</th>
          <th>Subject</th>
          <th>Type</th>
          <th>Date</th>
          <th>Score</th>
          <th>Tutor</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

export function initReportsList(params = {}) {
  document.getElementById('btn-new-report')?.addEventListener('click', () => navigate('report-create'));

  const studentMap = {};
  students.forEach(s => { studentMap[s.id] = s; });
  const tutorMap = {};
  tutors.forEach(t => { tutorMap[t.id] = t; });

  // Apply initial filter from params
  if (params.status) {
    const sel = document.getElementById('filter-status');
    if (sel) sel.value = params.status;
  }

  function applyFilters() {
    const q = (document.getElementById('search-reports')?.value || '').toLowerCase();
    const subject = document.getElementById('filter-subject')?.value || '';
    const type = document.getElementById('filter-type')?.value || '';
    const status = document.getElementById('filter-status')?.value || '';
    const tutorId = document.getElementById('filter-tutor')?.value || '';
    const dateFrom = document.getElementById('filter-date-from')?.value;
    const dateTo = document.getElementById('filter-date-to')?.value;

    let filtered = allReports;

    if (q) filtered = filtered.filter(r => {
      const s = studentMap[r.studentId];
      return (s?.studentName || '').toLowerCase().includes(q);
    });
    if (subject) filtered = filtered.filter(r => r.subject === subject);
    if (type)    filtered = filtered.filter(r => r.assessmentType === type);
    if (status)  filtered = filtered.filter(r => r.status === status);
    if (tutorId) filtered = filtered.filter(r => r.createdBy === tutorId);
    if (dateFrom) {
      const from = new Date(dateFrom);
      filtered = filtered.filter(r => {
        const d = r.assessmentDate ? new Date(r.assessmentDate) : null;
        return d && d >= from;
      });
    }
    if (dateTo) {
      const to = new Date(dateTo); to.setHours(23,59,59,999);
      filtered = filtered.filter(r => {
        const d = r.assessmentDate ? new Date(r.assessmentDate) : null;
        return d && d <= to;
      });
    }

    const wrapper = document.getElementById('reports-table-wrapper');
    if (wrapper) wrapper.innerHTML = renderReportsTable(filtered, studentMap, tutorMap);
    bindActions();
  }

  ['search-reports','filter-subject','filter-type','filter-status','filter-tutor','filter-date-from','filter-date-to']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener(id === 'search-reports' ? 'input' : 'change', debounce(applyFilters, 200));
      }
    });

  document.getElementById('btn-clear-filters')?.addEventListener('click', () => {
    ['search-reports','filter-subject','filter-type','filter-status','filter-tutor','filter-date-from','filter-date-to']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
    applyFilters();
  });

  // Apply initial status filter if passed
  if (params.status) applyFilters();

  bindActions();
}

function bindActions() {
  document.querySelectorAll('[data-view-report]').forEach(btn =>
    btn.addEventListener('click', () => navigate('report-detail', { id: btn.dataset.viewReport }))
  );
  document.querySelectorAll('[data-approve-report]').forEach(btn =>
    btn.addEventListener('click', () => navigate('report-approve', { id: btn.dataset.approveReport }))
  );
  document.querySelectorAll('[data-delete-report]').forEach(btn =>
    btn.addEventListener('click', async () => {
      const confirmed = await confirmDialog('Delete this draft report? This cannot be undone.', { title: 'Delete Draft', danger: true });
      if (!confirmed) return;
      const id = btn.dataset.deleteReport;
      try {
        await deleteReport(id);
        // Remove from local list and re-render
        allReports = allReports.filter(r => r.id !== id);
        const studentMap = {};
        students.forEach(s => { studentMap[s.id] = s; });
        const tutorMap = {};
        tutors.forEach(t => { tutorMap[t.id] = t; });
        const wrapper = document.getElementById('reports-table-wrapper');
        if (wrapper) wrapper.innerHTML = renderReportsTable(allReports, studentMap, tutorMap);
        const subtitle = document.querySelector('.page-subtitle');
        if (subtitle) subtitle.textContent = `${allReports.length} total report${allReports.length !== 1 ? 's' : ''}`;
        bindActions();
      } catch (e) {
        toast.error('Failed to delete: ' + e.message);
      }
    })
  );
}
