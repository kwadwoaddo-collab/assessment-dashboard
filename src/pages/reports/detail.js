// ================================================================
// Report Detail / View Page
// ================================================================

import {
  getReportById, getStudentById, getUserById,
  deleteReport, submitReport, updateStudent, updateReport
} from '../../db.js';
import { navigate } from '../../router.js';
import { toast } from '../../components/toast.js';
import { generateReportPDF, downloadPDF, getPDFBase64, getPDFBlob } from '../../pdf.js';
import { sendReportEmail, isEmailConfigured } from '../../email.js';
import { markReportSent } from '../../db.js';
import {
  formatDate, formatDateTime, escapeHtml,
  statusLabel, workingLevelClass, CENTRES, formatDateForInput
} from '../../utils.js';
import { isAdmin, getState } from '../../store.js';
import { renderAttachmentWidget, initAttachmentWidget } from '../../components/attachments.js';
import { confirmDialog, promptDialog } from '../../components/dialog.js';

export async function renderReportDetail(params = {}) {
  if (!params.id) return `<div class="empty-state"><h3>No report selected</h3></div>`;

  let report, student, tutor, approver;
  try {
    report = await getReportById(params.id);
    if (!report) return `<div class="empty-state"><h3>Report not found</h3></div>`;
    [student, tutor] = await Promise.all([
      getStudentById(report.studentId),
      getUserById(report.createdBy),
    ]);
    if (report.approvedBy) {
      approver = await getUserById(report.approvedBy);
    }
  } catch (e) {
    return `<div class="empty-state"><h3>Error</h3><p>${e.message}</p></div>`;
  }

  const user = getState('currentUser');
  // Tutors can edit their own draft/rejected; admins can edit anything except already-sent
  const canEdit = report.status !== 'sent' && (
    (getState('currentUser')?.uid === report.createdBy && ['draft','rejected'].includes(report.status)) ||
    isAdmin()
  );
  const canSubmit = report.status === 'draft' && user?.uid === report.createdBy;
  const canApprove = report.status === 'submitted' && isAdmin();
  const canSend = report.status === 'approved' && isAdmin();
  const canDelete = report.status === 'draft' && (user?.uid === report.createdBy || isAdmin());

  const statusBanner = () => {
    if (report.status === 'submitted') return `
      <div class="status-banner submitted">
        <div class="status-banner-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></div>
        <div class="status-banner-content"><h4>Awaiting Approval</h4><p>This report has been submitted and is waiting for manager review.</p></div>
      </div>`;
    if (report.status === 'approved') return `
      <div class="status-banner approved">
        <div class="status-banner-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
        <div class="status-banner-content"><h4>Approved – Ready to Send</h4><p>Approved by ${escapeHtml(approver?.name || 'Manager')} on ${formatDate(report.approvedAt)}. ${isAdmin() ? 'Click "Send to Parent" to email the PDF report.' : ''}</p></div>
      </div>`;
    if (report.status === 'rejected') return `
      <div class="status-banner rejected">
        <div class="status-banner-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>
        <div class="status-banner-content"><h4>Report Rejected</h4><p>${report.rejectionReason ? escapeHtml(report.rejectionReason) : 'This report was rejected. Please revise and resubmit.'}</p></div>
      </div>`;
    if (report.status === 'sent') return `
      <div class="status-banner sent">
        <div class="status-banner-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
        <div class="status-banner-content"><h4>Report Sent to Parent</h4><p>Sent to ${escapeHtml(student?.parentEmail || 'parent')} on ${formatDate(report.sentAt)}.</p></div>
      </div>`;
    return '';
  };

  return `
    <div>
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">${escapeHtml(student?.studentName || 'Unknown')} – ${escapeHtml(report.subject)}</h1>
          <p class="page-subtitle">${escapeHtml(report.assessmentType)} · ${formatDate(report.assessmentDate)}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" id="btn-back">← Back</button>
          ${canEdit ? `<button class="btn btn-secondary" id="btn-edit">Edit Report</button>` : ''}
          ${canSubmit ? `<button class="btn btn-accent" id="btn-submit">Submit for Approval</button>` : ''}
          ${canApprove ? `<button class="btn btn-primary" id="btn-approve-go">Review & Approve</button>` : ''}
          ${canSend ? `<button class="btn btn-success" id="btn-send">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Send to Parent
          </button>` : ''}
          <button class="btn btn-secondary" id="btn-download-pdf">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download PDF
          </button>
          ${canDelete ? `<button class="btn btn-danger btn-sm" id="btn-delete">Delete</button>` : ''}
        </div>
      </div>

      ${statusBanner()}

      <div class="report-detail-grid">
        <!-- Left: Main content -->
        <div>
          <!-- Student + Assessment Info -->
          <div class="card mb-3">
            <div class="card-header">
              <div class="card-title">Assessment Overview</div>
              <span class="badge badge-${report.status}">${statusLabel(report.status)}</span>
            </div>
            <div class="form-row">
              <div>
                <div class="info-row"><span class="info-row-label">Student</span><span class="info-row-value">${escapeHtml(student?.studentName || '—')}</span></div>
                <div class="info-row"><span class="info-row-label">Parent</span><span class="info-row-value">${escapeHtml(student?.parentName || '—')}</span></div>
                <div class="info-row"><span class="info-row-label">Parent Email</span><span class="info-row-value">${escapeHtml(student?.parentEmail || '—')}</span></div>
                <div class="info-row"><span class="info-row-label">Subject</span><span class="info-row-value"><strong>${escapeHtml(report.subject)}</strong></span></div>
              </div>
              <div>
                <div class="info-row"><span class="info-row-label">Assessment Type</span><span class="info-row-value">${escapeHtml(report.assessmentType)}</span></div>
                <div class="info-row"><span class="info-row-label">Assessment Date</span><span class="info-row-value">${formatDate(report.assessmentDate)}</span></div>
                <div class="info-row"><span class="info-row-label">Tutor</span><span class="info-row-value">${escapeHtml(tutor?.name || '—')}</span></div>
              </div>
            </div>
          </div>

          <!-- Performance -->
          <div class="card mb-3">
            <div class="card-title mb-2">Performance Summary</div>
            <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;margin-bottom:16px;">
              ${report.assessmentScore != null ? `
              <div class="score-circle">${report.assessmentScore}%</div>` : ''}
              <div>
                <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px;">Working Level</div>
                <span class="working-level-badge ${workingLevelClass(report.workingLevel)}">${escapeHtml(report.workingLevel || '—')}</span>
              </div>
            </div>
            <div class="form-row">
              <div>
                <div class="info-row"><span class="info-row-label">Homework Completion</span><span class="info-row-value">${escapeHtml(report.homeworkCompletion || '—')}</span></div>
                <div class="info-row"><span class="info-row-label">Attendance</span><span class="info-row-value">${escapeHtml(report.attendance || '—')}</span></div>
              </div>
              <div>
                <div class="info-row"><span class="info-row-label">Behaviour & Engagement</span><span class="info-row-value">${escapeHtml(report.behaviourEngagement || '—')}</span></div>
              </div>
            </div>
          </div>

          <!-- Feedback -->
          ${report.strengths ? `<div class="feedback-block"><div class="feedback-block-title">Strengths</div><p>${escapeHtml(report.strengths)}</p></div>` : ''}
          ${report.areasForImprovement ? `<div class="feedback-block"><div class="feedback-block-title">Areas for Improvement</div><p>${escapeHtml(report.areasForImprovement)}</p></div>` : ''}
          ${report.topicsCovered ? `<div class="feedback-block"><div class="feedback-block-title">Topics Covered</div><p>${escapeHtml(report.topicsCovered)}</p></div>` : ''}
          ${report.recommendations ? `<div class="feedback-block"><div class="feedback-block-title">Recommendations</div><p>${escapeHtml(report.recommendations)}</p></div>` : ''}
          ${report.managerComments ? `<div class="feedback-block" style="border-color:rgba(14,165,233,0.3);background:rgba(14,165,233,0.05);"><div class="feedback-block-title" style="color:var(--accent-400);">Manager Comments</div><p>${escapeHtml(report.managerComments)}</p></div>` : ''}
          ${report.additionalComments ? `<div class="feedback-block" style="border-color:rgba(245,158,11,0.3);background:rgba(245,158,11,0.04);"><div class="feedback-block-title" style="color:var(--amber-500);">Tutor Comments</div><p>${escapeHtml(report.additionalComments)}</p></div>` : ''}

          <!-- Assessment Attachments -->
          <div class="card mt-3" style="padding:20px;">
            <div class="card-header" style="margin-bottom:16px;">
              <div class="card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;display:inline;vertical-align:middle;margin-right:6px;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                Assessment Documents
              </div>
              ${(report.attachments?.length || 0) > 0
                ? `<span class="badge badge-active">${report.attachments.length} file${report.attachments.length !== 1 ? 's' : ''}</span>`
                : ''}
            </div>
            ${renderAttachmentWidget(report.attachments || [], { editable: isAdmin() && report.status !== 'sent' })}
          </div>
        </div>

        <!-- Right: Audit Trail -->
        <div>
          <div class="card">
            <div class="card-title mb-3">Audit Trail</div>
            <div class="audit-trail">
              ${report.createdAt ? `
              <div class="audit-item">
                <div class="audit-dot" style="border-color:var(--navy-600);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-muted)"><path d="M12 5v14M5 12h14"/></svg>
                </div>
                <div class="audit-content">
                  <div class="audit-action">Created</div>
                  <div class="audit-meta">${formatDateTime(report.createdAt)}</div>
                  ${tutor ? `<div class="audit-meta">by ${escapeHtml(tutor.name)}</div>` : ''}
                </div>
              </div>` : ''}

              ${report.updatedAt && report.updatedAt !== report.createdAt ? `
              <div class="audit-item">
                <div class="audit-dot" style="border-color:var(--amber-600);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--amber-500)"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </div>
                <div class="audit-content">
                  <div class="audit-action">Last Modified</div>
                  <div class="audit-meta">${formatDateTime(report.updatedAt)}</div>
                </div>
              </div>` : ''}

              ${report.submittedAt ? `
              <div class="audit-item">
                <div class="audit-dot" style="border-color:var(--accent-600);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--accent-400)"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </div>
                <div class="audit-content">
                  <div class="audit-action">Submitted for Approval</div>
                  <div class="audit-meta">${formatDateTime(report.submittedAt)}</div>
                </div>
              </div>` : ''}

              ${report.approvedAt ? `
              <div class="audit-item">
                <div class="audit-dot" style="border-color:var(--emerald-600);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--emerald-500)"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div class="audit-content">
                  <div class="audit-action">Approved</div>
                  <div class="audit-meta">${formatDateTime(report.approvedAt)}</div>
                  ${approver ? `<div class="audit-meta">by ${escapeHtml(approver.name)}</div>` : ''}
                </div>
              </div>` : ''}

              ${report.sentAt ? `
              <div class="audit-item">
                <div class="audit-dot" style="border-color:var(--violet-600);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--violet-500)"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <div class="audit-content">
                  <div class="audit-action">Sent to Parent</div>
                  <div class="audit-meta">${formatDateTime(report.sentAt)}</div>
                  <div class="audit-meta">${escapeHtml(student?.parentEmail || '')}</div>
                </div>
              </div>` : ''}
            </div>
          </div>

          <!-- Approval Info -->
          ${(report.status === 'approved' || report.status === 'sent') ? `
          <div class="card mt-3">
            <div class="card-title mb-2">Authorisation</div>
            <div class="info-row"><span class="info-row-label">Prepared By</span><span class="info-row-value">${escapeHtml(tutor?.name || '—')}</span></div>
            <div class="info-row"><span class="info-row-label">Approved By</span><span class="info-row-value">${escapeHtml(approver?.name || '—')}</span></div>
            <div class="info-row"><span class="info-row-label">Approval Date</span><span class="info-row-value">${formatDate(report.approvedAt)}</span></div>
          </div>` : ''}
        </div>
      </div>
    </div>
  `;
}

export function initReportDetail(params = {}) {
  document.getElementById('btn-back')?.addEventListener('click', () => navigate('reports'));
  document.getElementById('btn-edit')?.addEventListener('click', () => navigate('report-create', { reportId: params.id }));
  document.getElementById('btn-approve-go')?.addEventListener('click', () => navigate('report-approve', { id: params.id }));

  // Init attachment widget (admins can delete from detail view too)
  const reportEl = document.getElementById('attachment-widget');
  if (reportEl && isAdmin()) {
    // We need the live report to get attachments for deletion
    (async () => {
      const report = await getReportById(params.id);
      const atts = report?.attachments || [];
      if (atts.length > 0) {
        initAttachmentWidget(atts, {
          editable: isAdmin() && report.status !== 'sent',
          reportId: params.id,
          onChange: async (updated) => {
            await updateReport(params.id, { attachments: updated });
          },
        });
      }
    })();
  }

  document.getElementById('btn-submit')?.addEventListener('click', async () => {
    const confirmed = await confirmDialog('Submit this report for manager approval?', { title: 'Submit Report' });
    if (!confirmed) return;
    const btn = document.getElementById('btn-submit');
    btn.disabled = true; btn.textContent = 'Submitting…';
    try {
      await submitReport(params.id);
      toast.success('Report submitted for approval!');
      navigate('report-detail', { id: params.id });
    } catch (e) {
      btn.disabled = false;
      toast.error('Failed to submit: ' + e.message);
    }
  });

  document.getElementById('btn-download-pdf')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-download-pdf');
    btn.disabled = true; btn.textContent = 'Generating PDF…';
    try {
      const [report, student, tutor, approver] = await loadReportData(params.id);
      const doc = await generateReportPDF(report, student, tutor, approver);
      const assessmentDate = report.assessmentDate ? formatDateForInput(report.assessmentDate) : formatDateForInput(new Date());
      const filename = `Report_${(student?.studentName || 'student').replace(/\s+/g,'_')}_${(report.subject || '').replace(/\s+/g,'_')}_${assessmentDate}.pdf`;
      downloadPDF(doc, filename);
      toast.success('PDF downloaded!');
    } catch (e) {
      toast.error('Failed to generate PDF: ' + e.message);
      console.error(e);
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download PDF`;
    }
  });

  document.getElementById('btn-send')?.addEventListener('click', async () => {
    const report = await getReportById(params.id);
    let student = await getStudentById(report.studentId);

    if (!student?.parentEmail) {
      const emailInput = await promptDialog(
        `Please enter the Parent's Email Address to send the report:`, 
        '', 
        { title: `Missing Parent Email for ${student.studentName}`, type: 'email' }
      );
      if (!emailInput || !emailInput.trim()) {
        toast.error('Parent email is required to send the report.');
        return;
      }
      let nameInput = student?.parentName;
      if (!nameInput) {
        nameInput = await promptDialog(
          `(Optional) Enter the Parent/Guardian's Name for ${student.studentName}:`, 
          'Parent/Guardian', 
          { title: 'Parent/Guardian Name' }
        );
      }
      
      try {
        await updateStudent(student.id, { 
          parentEmail: emailInput.trim(), 
          parentName: (nameInput || 'Parent/Guardian').trim() 
        });
        toast.success('Student record updated with parent details.');
        student.parentEmail = emailInput.trim();
        student.parentName = (nameInput || 'Parent/Guardian').trim();
      } catch (err) {
        toast.error('Failed to update student record: ' + err.message);
        return;
      }
    }

    const confirmed = await confirmDialog(`Send this report to ${student?.parentName || 'parent'} at ${student?.parentEmail}?`, { title: 'Send Report' });
    if (!confirmed) return;

    const btn = document.getElementById('btn-send');
    btn.disabled = true; btn.textContent = 'Sending…';

    try {
      const [rep, stu, tutor, approver] = await loadReportData(params.id);
      const doc = await generateReportPDF(rep, stu, tutor, approver);
      const pdfBase64 = getPDFBase64(doc);

      if (isEmailConfigured()) {
        await sendReportEmail({
          parentEmail: stu.parentEmail,
          parentName: stu.parentName,
          studentName: stu.studentName,
          subject: rep.subject,
          assessmentType: rep.assessmentType,
          reportDate: formatDate(rep.assessmentDate),
          pdfBase64,
        });
      } else {
        // Download PDF as fallback if email not configured
        const assessmentDate = rep.assessmentDate ? formatDateForInput(rep.assessmentDate) : formatDateForInput(new Date());
        downloadPDF(doc, `Report_${stu.studentName.replace(/\s+/g,'_')}_${(rep.subject || '').replace(/\s+/g,'_')}_${assessmentDate}.pdf`);
        toast.warning('Email not configured — PDF downloaded instead. Set up EmailJS in .env to enable email sending.');
      }

      await markReportSent(params.id);
      toast.success(`Report sent to ${stu.parentEmail}!`);
      navigate('report-detail', { id: params.id });
    } catch (e) {
      btn.disabled = false;
      toast.error('Failed to send: ' + e.message);
      console.error(e);
    }
  });

  document.getElementById('btn-delete')?.addEventListener('click', async () => {
    const confirmed = await confirmDialog('Delete this draft report? This cannot be undone.', { title: 'Delete Report', danger: true });
    if (!confirmed) return;
    try {
      await deleteReport(params.id);
      toast.success('Report deleted');
      navigate('reports');
    } catch (e) {
      toast.error('Failed to delete report');
    }
  });
}

async function loadReportData(id) {
  const report = await getReportById(id);
  const [student, tutor] = await Promise.all([
    getStudentById(report.studentId),
    getUserById(report.createdBy),
  ]);
  let approver = null;
  if (report.approvedBy) approver = await getUserById(report.approvedBy);
  return [report, student, tutor, approver];
}
