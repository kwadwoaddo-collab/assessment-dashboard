// ================================================================
// Student Detail / Profile Page
// ================================================================

import { getStudentById, getReportsByStudent, getUserById } from '../../db.js';
import { navigate } from '../../router.js';
import { formatDate, escapeHtml, initials, statusLabel, workingLevelClass, SUBJECTS } from '../../utils.js';
import { isAdmin } from '../../store.js';

export async function renderStudentDetail(params = {}) {
  if (!params.id) return `<div class="empty-state"><h3>No student selected</h3></div>`;

  let student, reports;
  try {
    [student, reports] = await Promise.all([
      getStudentById(params.id),
      getReportsByStudent(params.id),
    ]);
  } catch (e) {
    return `<div class="empty-state"><h3>Error</h3><p>${e.message}</p></div>`;
  }

  if (!student) return `<div class="empty-state"><h3>Student not found</h3></div>`;

  // Group reports by subject
  const bySubject = {};
  SUBJECTS.forEach(s => { bySubject[s] = []; });
  reports.forEach(r => {
    if (bySubject[r.subject]) bySubject[r.subject].push(r);
    else bySubject[r.subject] = [r];
  });

  const subjectTabs = SUBJECTS.filter(s => bySubject[s].length > 0);

  return `
    <div>
      <!-- Page Header -->
      <div class="page-header">
        <div style="display:flex;align-items:center;gap:16px;">
          <div class="user-avatar" style="width:56px;height:56px;font-size:1.1rem;">
            ${initials(student.studentName)}
          </div>
          <div>
            <h1 class="page-title">${escapeHtml(student.studentName)}</h1>
            <p class="page-subtitle">
              ${student.yearGroup ? escapeHtml(student.yearGroup) + ' · ' : ''}
              ${student.school ? escapeHtml(student.school) + ' · ' : ''}
              ${reports.length} report${reports.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" id="btn-back">← Back</button>
          ${isAdmin() ? `<button class="btn btn-secondary" id="btn-edit-student">Edit Student</button>` : ''}
          <button class="btn btn-primary" id="btn-new-report">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            New Report
          </button>
        </div>
      </div>

      <div class="report-detail-grid">
        <!-- Left: Student Info + Reports -->
        <div>
          <!-- Student Info -->
          <div class="card mb-3">
            <div class="card-header">
              <div class="card-title">Student Information</div>
              <span class="badge ${student.active !== false ? 'badge-active' : 'badge-inactive'}">
                ${student.active !== false ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div class="form-row">
              <div>
                <div class="info-row">
                  <span class="info-row-label">Parent / Guardian</span>
                  <span class="info-row-value">${escapeHtml(student.parentName || '—')}</span>
                </div>
                <div class="info-row">
                  <span class="info-row-label">Parent Email</span>
                  <span class="info-row-value">
                    <a href="mailto:${escapeHtml(student.parentEmail || '')}" style="color:var(--teal-400);text-decoration:none;">
                      ${escapeHtml(student.parentEmail || '—')}
                    </a>
                  </span>
                </div>
                <div class="info-row">
                  <span class="info-row-label">Year Group</span>
                  <span class="info-row-value">${escapeHtml(student.yearGroup || '—')}</span>
                </div>
              </div>
              <div>
                <div class="info-row">
                  <span class="info-row-label">Centre</span>
                  <span class="info-row-value">${escapeHtml(student.school || '—')}</span>
                </div>
                <div class="info-row"><span class="info-row-label">Date Joined Centre</span><span class="info-row-value">${formatDate(student.startDate)}</span></div>
                <div class="info-row">
                  <span class="info-row-label">Date of Birth</span>
                  <span class="info-row-value">${formatDate(student.dateOfBirth)}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Reports by Subject -->
          <div class="card" style="padding:0;">
            <div style="padding:20px 20px 0;">
              <div class="card-title">Assessment History</div>
              <p class="card-subtitle mt-1">${reports.length} report${reports.length !== 1 ? 's' : ''} across ${subjectTabs.length} subject${subjectTabs.length !== 1 ? 's' : ''}</p>
            </div>

            ${reports.length === 0 ? `
              <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <h3>No reports yet</h3>
                <p>Create the first report for this student.</p>
              </div>` : `
              <div class="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Assessment Type</th>
                      <th>Date</th>
                      <th>Score</th>
                      <th>Level</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${reports.map(r => `
                      <tr>
                        <td><strong>${escapeHtml(r.subject)}</strong></td>
                        <td>${escapeHtml(r.assessmentType)}</td>
                        <td>${formatDate(r.assessmentDate)}</td>
                        <td>${r.assessmentScore != null ? r.assessmentScore + '%' : '—'}</td>
                        <td>
                          ${r.workingLevel ? `<span class="working-level-badge ${workingLevelClass(r.workingLevel)}">${escapeHtml(r.workingLevel)}</span>` : '—'}
                        </td>
                        <td><span class="badge badge-${r.status}">${statusLabel(r.status)}</span></td>
                        <td>
                          <button class="btn btn-secondary btn-sm" data-view-report="${r.id}">View</button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>`}
          </div>
        </div>

        <!-- Right: Summary Sidebar -->
        <div>
          <div class="card">
            <div class="card-title mb-2">Subject Summary</div>
            ${SUBJECTS.map(subj => {
              const subjReports = bySubject[subj] || [];
              if (subjReports.length === 0) return '';
              const scores = subjReports.filter(r => r.assessmentScore != null).map(r => Number(r.assessmentScore));
              const avg = scores.length > 0 ? Math.round(scores.reduce((a,b) => a+b, 0) / scores.length) : null;
              const latest = subjReports[0];
              return `
                <div class="info-block">
                  <div class="info-block-title">${escapeHtml(subj)}</div>
                  <div class="info-row">
                    <span class="info-row-label">Reports</span>
                    <span class="info-row-value">${subjReports.length}</span>
                  </div>
                  ${avg != null ? `<div class="info-row">
                    <span class="info-row-label">Avg Score</span>
                    <span class="info-row-value">${avg}%</span>
                  </div>` : ''}
                  <div class="info-row">
                    <span class="info-row-label">Latest</span>
                    <span class="info-row-value"><span class="badge badge-${latest.status}">${statusLabel(latest.status)}</span></span>
                  </div>
                </div>`;
            }).join('')}

            ${subjectTabs.length === 0 ? `<p class="text-muted" style="font-size:0.825rem;">No assessments yet.</p>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initStudentDetail(params = {}) {
  document.getElementById('btn-back')?.addEventListener('click', () => navigate('students'));
  document.getElementById('btn-edit-student')?.addEventListener('click', () => navigate('student-edit', { id: params.id }));
  document.getElementById('btn-new-report')?.addEventListener('click', () => navigate('report-create', { studentId: params.id }));

  document.querySelectorAll('[data-view-report]').forEach(btn => {
    btn.addEventListener('click', () => navigate('report-detail', { id: btn.dataset.viewReport }));
  });
}
