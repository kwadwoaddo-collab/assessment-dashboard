// ================================================================
// Manager Approval Screen
// ================================================================

import {
  getReportById, getStudentById, getUserById,
  approveReport, rejectReport
} from '../../db.js';
import { navigate } from '../../router.js';
import { toast } from '../../components/toast.js';
import {
  formatDate, escapeHtml, workingLevelClass, CENTRES
} from '../../utils.js';

export async function renderReportApprove(params = {}) {
  if (!params.id) return `<div class="empty-state"><h3>No report selected</h3></div>`;

  let report, student, tutor;
  try {
    report = await getReportById(params.id);
    if (!report) return `<div class="empty-state"><h3>Report not found</h3></div>`;
    if (report.status !== 'submitted') {
      return `
        <div class="empty-state">
          <h3>Report not awaiting approval</h3>
          <p>This report has status: <span class="badge badge-${report.status}">${report.status}</span></p>
          <button class="btn btn-secondary mt-2" onclick="history.back()">Go Back</button>
        </div>`;
    }
    [student, tutor] = await Promise.all([
      getStudentById(report.studentId),
      getUserById(report.createdBy),
    ]);
  } catch (e) {
    return `<div class="empty-state"><h3>Error</h3><p>${e.message}</p></div>`;
  }

  return `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title">Review Report</h1>
          <p class="page-subtitle">${escapeHtml(student?.studentName || '?')} · ${escapeHtml(report.subject)} · ${escapeHtml(report.assessmentType)}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" id="btn-back">← Back</button>
          <button class="btn btn-secondary" id="btn-edit-report">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit Report
          </button>
        </div>
      </div>

      <div class="report-detail-grid">
        <!-- Left: Full Report View -->
        <div>
          <!-- Student Info -->
          <div class="card mb-3">
            <div class="card-title mb-2">Student & Assessment</div>
            <div class="form-row">
              <div>
                <div class="info-row"><span class="info-row-label">Student</span><span class="info-row-value">${escapeHtml(student?.studentName || '—')}</span></div>
                <div class="info-row"><span class="info-row-label">Parent</span><span class="info-row-value">${escapeHtml(student?.parentName || '—')}</span></div>
                <div class="info-row"><span class="info-row-label">Parent Email</span><span class="info-row-value">${escapeHtml(student?.parentEmail || '—')}</span></div>
              </div>
              <div>
                <div class="info-row"><span class="info-row-label">Subject</span><span class="info-row-value"><strong>${escapeHtml(report.subject)}</strong></span></div>
                <div class="info-row"><span class="info-row-label">Type</span><span class="info-row-value">${escapeHtml(report.assessmentType)}</span></div>
                <div class="info-row"><span class="info-row-label">Date</span><span class="info-row-value">${formatDate(report.assessmentDate)}</span></div>
                <div class="info-row"><span class="info-row-label">Tutor</span><span class="info-row-value">${escapeHtml(tutor?.name || '—')}</span></div>
              </div>
            </div>
          </div>

          <!-- Performance -->
          <div class="card mb-3">
            <div class="card-title mb-2">Performance</div>
            <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;margin-bottom:16px;">
              ${report.assessmentScore != null ? `<div class="score-circle">${report.assessmentScore}%</div>` : ''}
              <div>
                <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px;">Working Level</div>
                <span class="working-level-badge ${workingLevelClass(report.workingLevel)}">${escapeHtml(report.workingLevel || '—')}</span>
              </div>
            </div>
            <div class="form-row">
              <div>
                <div class="info-row"><span class="info-row-label">Homework</span><span class="info-row-value">${escapeHtml(report.homeworkCompletion || '—')}</span></div>
                <div class="info-row"><span class="info-row-label">Attendance</span><span class="info-row-value">${escapeHtml(report.attendance || '—')}</span></div>
              </div>
              <div>
                <div class="info-row"><span class="info-row-label">Behaviour</span><span class="info-row-value">${escapeHtml(report.behaviourEngagement || '—')}</span></div>
              </div>
            </div>
          </div>

          <!-- Feedback -->
          ${report.strengths ? `<div class="feedback-block"><div class="feedback-block-title">Strengths</div><p>${escapeHtml(report.strengths)}</p></div>` : ''}
          ${report.areasForImprovement ? `<div class="feedback-block"><div class="feedback-block-title">Areas for Improvement</div><p>${escapeHtml(report.areasForImprovement)}</p></div>` : ''}
          ${report.topicsCovered ? `<div class="feedback-block"><div class="feedback-block-title">Topics Covered</div><p>${escapeHtml(report.topicsCovered)}</p></div>` : ''}
          ${report.additionalComments ? `<div class="feedback-block"><div class="feedback-block-title">Tutor Comments</div><p>${escapeHtml(report.additionalComments)}</p></div>` : ''}
          ${report.recommendations ? `<div class="feedback-block"><div class="feedback-block-title">Recommendations</div><p>${escapeHtml(report.recommendations)}</p></div>` : ''}
        </div>

        <!-- Right: Approval Panel -->
        <div>
          <div class="card" style="border-color:rgba(14,165,233,0.3);background:rgba(14,165,233,0.04);">
            <div class="card-title mb-3" style="color:var(--accent-400);">
              <svg style="width:16px;height:16px;display:inline;margin-right:6px;vertical-align:middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              Manager Review
            </div>

            <div class="form-group mb-3">
              <label class="form-label" for="manager-comments">Manager Comments (optional)</label>
              <textarea id="manager-comments" class="form-control" rows="5"
                placeholder="Add any comments or notes for the parent / student…"></textarea>
              <span class="form-hint">These comments will appear in the PDF report.</span>
            </div>

            <div style="display:flex;flex-direction:column;gap:10px;">
              <button class="btn btn-success" id="btn-approve" style="width:100%;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Approve Report
              </button>
              <button class="btn btn-danger" id="btn-reject" style="width:100%;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                Reject Report
              </button>
            </div>

            <div class="divider"></div>

            <p class="text-muted" style="font-size:0.775rem;line-height:1.6;">
              <strong>On approval:</strong> The report will be marked as approved and can then be sent to the parent as a PDF.<br><br>
              <strong>On rejection:</strong> The tutor will be notified and can revise and resubmit the report.
            </p>
          </div>

          <!-- Reject Modal (hidden) -->
          <div id="reject-modal" style="display:none;">
            <div class="card mt-3" style="border-color:rgba(244,63,94,0.3);background:rgba(244,63,94,0.05);">
              <div class="card-title mb-2" style="color:var(--rose-400);">Rejection Reason</div>
              <div class="form-group">
                <label class="form-label" for="rejection-reason">Please explain why this report is being rejected <span class="required">*</span></label>
                <textarea id="rejection-reason" class="form-control" rows="4"
                  placeholder="e.g. Feedback is too brief – please expand on the areas for improvement section."></textarea>
              </div>
              <div style="display:flex;gap:10px;margin-top:12px;">
                <button class="btn btn-secondary" id="btn-cancel-reject">Cancel</button>
                <button class="btn btn-danger" id="btn-confirm-reject">Confirm Rejection</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initReportApprove(params = {}) {
  document.getElementById('btn-back')?.addEventListener('click', () => navigate('reports'));
  document.getElementById('btn-edit-report')?.addEventListener('click', () =>
    navigate('report-create', { reportId: params.id })
  );

  document.getElementById('btn-approve')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-approve');
    const comments = document.getElementById('manager-comments')?.value.trim() || '';
    if (!confirm('Approve this report?')) return;
    btn.disabled = true; btn.textContent = 'Approving…';
    try {
      await approveReport(params.id, comments);
      toast.success('Report approved! You can now send it to the parent.');
      navigate('report-detail', { id: params.id });
    } catch (e) {
      btn.disabled = false;
      toast.error('Failed to approve: ' + e.message);
    }
  });

  document.getElementById('btn-reject')?.addEventListener('click', () => {
    const modal = document.getElementById('reject-modal');
    if (modal) modal.style.display = 'block';
    document.getElementById('btn-reject').style.display = 'none';
    document.getElementById('btn-approve').style.display = 'none';
  });

  document.getElementById('btn-cancel-reject')?.addEventListener('click', () => {
    const modal = document.getElementById('reject-modal');
    if (modal) modal.style.display = 'none';
    document.getElementById('btn-reject').style.display = 'flex';
    document.getElementById('btn-approve').style.display = 'flex';
  });

  document.getElementById('btn-confirm-reject')?.addEventListener('click', async () => {
    const reason = document.getElementById('rejection-reason')?.value.trim();
    if (!reason) { toast.error('Please provide a rejection reason.'); return; }
    const btn = document.getElementById('btn-confirm-reject');
    btn.disabled = true; btn.textContent = 'Rejecting…';
    try {
      await rejectReport(params.id, reason);
      toast.warning('Report rejected. The tutor has been notified.');
      navigate('reports-pending');
    } catch (e) {
      btn.disabled = false;
      toast.error('Failed to reject: ' + e.message);
    }
  });
}
