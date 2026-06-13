// ================================================================
// Report Create / Edit Form (Multi-Step)
// ================================================================

import {
  getStudents, getStudentById, getReportById,
  createReport, updateReport, submitReport, findExistingDraft, approveReport
} from '../../db.js';
import { getState, isAdmin } from '../../store.js';
import { navigate } from '../../router.js';
import { toast } from '../../components/toast.js';
import {
  SUBJECTS, ASSESSMENT_TYPES, WORKING_LEVELS,
  HOMEWORK_OPTIONS, ATTENDANCE_OPTIONS, BEHAVIOUR_OPTIONS,
  escapeHtml, formatDateForInput
} from '../../utils.js';
import { renderAttachmentWidget, initAttachmentWidget } from '../../components/attachments.js';

let currentStep = 1;
let formData = {};
let students = [];
let selectedStudent = null;
let attachments = []; // current report's attachments

export async function renderReportCreate(params = {}) {
  currentStep = 1;
  formData = {};
  selectedStudent = null;
  attachments = [];

  try {
    students = await getStudents();
  } catch (e) {
    return `<div class="empty-state"><h3>Error loading students</h3><p>${e.message}</p></div>`;
  }

  // Pre-select student if passed
  if (params.studentId) {
    selectedStudent = students.find(s => s.id === params.studentId) || null;
    if (selectedStudent) {
      formData.studentId = selectedStudent.id;
      currentStep = 2;
    }
  }

  // Load existing report for editing
  let existing = null;
  if (params.reportId) {
    try {
      existing = await getReportById(params.reportId);
      if (existing) {
        formData = { ...existing };
        attachments = existing.attachments || [];
        selectedStudent = students.find(s => s.id === existing.studentId) || null;
        currentStep = 2;
      }
    } catch (_) {}
  }

  return renderStep(params.reportId);
}

function renderStepIndicator() {
  const steps = [
    { n: 1, label: 'Select Student' },
    { n: 2, label: 'Assessment Details' },
    { n: 3, label: 'Feedback' },
    { n: 4, label: 'Review' },
  ];

  return `
    <div class="step-indicator">
      ${steps.map((s, i) => `
        ${i > 0 ? `<div class="step-connector ${currentStep > s.n ? 'done' : ''}"></div>` : ''}
        <div class="step ${currentStep === s.n ? 'active' : ''} ${currentStep > s.n ? 'done' : ''}">
          <div class="step-circle">${currentStep > s.n ? '✓' : s.n}</div>
          <span class="step-label">${s.label}</span>
        </div>
      `).join('')}
    </div>`;
}

function renderStep(reportId) {
  const editMode = !!reportId;
  const adminEdit = editMode && isAdmin() && !['draft','rejected'].includes(formData.status);
  // For admin edits of live reports: save keeps current status; no re-submit needed
  const saveLabel = adminEdit ? 'Save Changes' : 'Save Draft';
  const step4Action = adminEdit
    ? `<button class="btn btn-primary" id="btn-save-admin" style="display: ${currentStep === 4 ? 'flex' : 'none'};">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        Save Changes
      </button>`
    : `<button class="btn btn-secondary" id="btn-submit-report" style="display: ${currentStep === 4 ? 'flex' : 'none'};">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        Submit for Approval
      </button>
      <button class="btn btn-success" id="btn-approve-submit" style="display: ${currentStep === 4 ? 'flex' : 'none'};">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        Approve &amp; Submit
      </button>`;

  let content = '';
  if (currentStep === 1) content = renderStep1();
  else if (currentStep === 2) content = renderStep2();
  else if (currentStep === 3) content = renderStep3();
  else if (currentStep === 4) content = renderStep4(adminEdit);

  return `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title">${editMode ? (adminEdit ? '✏️ Manager Edit' : 'Edit Report') : 'Create New Report'}</h1>
          <p class="page-subtitle">
            Step ${currentStep} of 4
            ${adminEdit ? ' · <span style="color:var(--amber-500);font-weight:600;">Editing as Manager — changes save immediately</span>' : ''}
          </p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" id="btn-cancel-report">Cancel</button>
        </div>
      </div>

      <div class="card">
        ${renderStepIndicator()}
        <div id="step-content">
          ${content}
        </div>
        <div class="divider"></div>
        <div style="display:flex;justify-content:space-between;gap:12px;margin-top:4px;">
          <button class="btn btn-secondary" id="btn-prev" style="display: ${currentStep > 1 ? 'flex' : 'none'};">← Back</button>
          <div style="display:flex;gap:10px;">
            <button class="btn btn-secondary" id="btn-save-draft">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/></svg>
              ${saveLabel}
            </button>
            <button class="btn btn-primary" id="btn-next" style="display: ${currentStep < 4 ? 'flex' : 'none'};">Next →</button>
            ${step4Action}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderStep1() {
  return `
    <div class="form-section">
      <div class="form-section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        Select Student
      </div>
      <div class="form-group">
        <label class="form-label" for="step1-student">Student <span class="required">*</span></label>
        <select id="step1-student" class="form-control">
          <option value="">— Select a student —</option>
          ${students.map(s => `
            <option value="${s.id}" ${formData.studentId === s.id ? 'selected' : ''}>
              ${escapeHtml(s.studentName)}${s.yearGroup ? ' – ' + escapeHtml(s.yearGroup) : ''}
            </option>`).join('')}
        </select>
      </div>
      ${selectedStudent ? `
      <div class="info-block mt-2">
        <div class="info-block-title">Selected Student</div>
        <div class="info-row"><span class="info-row-label">Name</span><span class="info-row-value">${escapeHtml(selectedStudent.studentName)}</span></div>
        <div class="info-row"><span class="info-row-label">Parent</span><span class="info-row-value">${escapeHtml(selectedStudent.parentName || '—')}</span></div>
        <div class="info-row"><span class="info-row-label">Parent Email</span><span class="info-row-value">${escapeHtml(selectedStudent.parentEmail || '—')}</span></div>
      </div>` : ''}
    </div>`;
}

function renderStep2() {
  return `
    <div class="form-section">
      <div class="form-section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Assessment Information
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="assessmentDate">Assessment Date <span class="required">*</span></label>
          <input type="date" id="assessmentDate" class="form-control"
            value="${formData.assessmentDate ? formatDateForInput(formData.assessmentDate) : new Date().toISOString().split('T')[0]}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="subject">Subject <span class="required">*</span></label>
          <select id="subject" class="form-control">
            <option value="">— Select subject —</option>
            ${SUBJECTS.map(s => `<option value="${s}" ${formData.subject === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="form-group mt-2">
        <label class="form-label" for="assessmentType">Assessment Type <span class="required">*</span></label>
        <select id="assessmentType" class="form-control">
          <option value="">— Select type —</option>
          ${ASSESSMENT_TYPES.map(t => `<option value="${t}" ${formData.assessmentType === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        Overall Performance
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="workingLevel">Current Working Level <span class="required">*</span></label>
          <select id="workingLevel" class="form-control">
            <option value="">— Select level —</option>
            ${WORKING_LEVELS.map(l => `<option value="${l}" ${formData.workingLevel === l ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="assessmentScore">Assessment Score (%)</label>
          <input type="number" id="assessmentScore" class="form-control"
            min="0" max="100" placeholder="e.g. 85"
            value="${formData.assessmentScore != null ? formData.assessmentScore : ''}" />
        </div>
      </div>

      <div class="form-row mt-2">
        <div class="form-group">
          <label class="form-label" for="homeworkCompletion">Homework Completion <span class="required">*</span></label>
          <select id="homeworkCompletion" class="form-control">
            <option value="">— Select —</option>
            ${HOMEWORK_OPTIONS.map(o => `<option value="${o}" ${formData.homeworkCompletion === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="attendance">Attendance <span class="required">*</span></label>
          <select id="attendance" class="form-control">
            <option value="">— Select —</option>
            ${ATTENDANCE_OPTIONS.map(o => `<option value="${o}" ${formData.attendance === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="form-group mt-2">
        <label class="form-label" for="behaviourEngagement">Behaviour & Engagement <span class="required">*</span></label>
        <select id="behaviourEngagement" class="form-control">
          <option value="">— Select —</option>
          ${BEHAVIOUR_OPTIONS.map(o => `<option value="${o}" ${formData.behaviourEngagement === o ? 'selected' : ''}>${o}</option>`).join('')}
        </select>
      </div>
    </div>`;
}

function renderStep3() {
  return `
    <div class="form-section">
      <div class="form-section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
        Detailed Feedback
      </div>

      <div class="form-group">
        <label class="form-label" for="strengths">Strengths <span class="required">*</span></label>
        <textarea id="strengths" class="form-control" rows="4"
          placeholder="What did the student do particularly well in?">${escapeHtml(formData.strengths || '')}</textarea>
      </div>

      <div class="form-group mt-2">
        <label class="form-label" for="areasForImprovement">Areas for Improvement <span class="required">*</span></label>
        <textarea id="areasForImprovement" class="form-control" rows="4"
          placeholder="What areas require further development?">${escapeHtml(formData.areasForImprovement || '')}</textarea>
      </div>

      <div class="form-group mt-2">
        <label class="form-label" for="topicsCovered">Topics Covered</label>
        <textarea id="topicsCovered" class="form-control" rows="3"
          placeholder="e.g. Fractions, Algebra, Reading Comprehension…">${escapeHtml(formData.topicsCovered || '')}</textarea>
      </div>

      <div class="form-group mt-2">
        <label class="form-label" for="recommendations">Recommendations</label>
        <textarea id="recommendations" class="form-control" rows="3"
          placeholder="What should the student focus on before the next assessment?">${escapeHtml(formData.recommendations || '')}</textarea>
      </div>

      <div class="form-group mt-2">
        <label class="form-label" for="additionalComments">
          Tutor Comments
          <span style="font-size:0.75rem;font-weight:400;color:var(--text-muted);margin-left:6px;">printed on the PDF</span>
        </label>
        <textarea id="additionalComments" class="form-control" rows="4"
          placeholder="Any other comments for the parent or student not covered above…">${escapeHtml(formData.additionalComments || '')}</textarea>
      </div>

      ${isAdmin() ? `
      <div class="form-group mt-2">
        <label class="form-label" for="managerComments">
          Manager Comments
          <span style="font-size:0.75rem;font-weight:400;color:var(--text-muted);margin-left:6px;">printed on the PDF (admin only)</span>
        </label>
        <textarea id="managerComments" class="form-control" rows="4"
          placeholder="Manager comments or feedback…">${escapeHtml(formData.managerComments || '')}</textarea>
      </div>` : ''}
    </div>

    <!-- Assessment Attachments -->
    <div class="form-section">
      <div class="form-section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        Assessment Photos &amp; Documents
      </div>
      <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:16px;">
        ${formData.id
          ? 'Attach photos of completed work, scanned assessments, or any supporting documents.'
          : '⚠ Save the report as a draft first, then attachments will be enabled.'}
      </p>
      ${renderAttachmentWidget(attachments, { editable: !!formData.id })}
    </div>`;
}

function renderStep4(adminEdit = false) {
  const banner = adminEdit
    ? `<div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:12px;padding:16px;margin-bottom:24px;">
        <p style="font-size:0.875rem;color:var(--amber-500);font-weight:600;margin-bottom:6px;">✏️ Manager Edit Mode</p>
        <p style="font-size:0.825rem;color:var(--text-secondary);">You are editing this report as a manager. Saving will update the content immediately and keep the current status (<strong>${formData.status}</strong>). The tutor will not be notified.</p>
       </div>`
    : `<div style="background:rgba(20,184,166,0.06);border:1px solid rgba(20,184,166,0.2);border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="font-size:0.9rem;color:var(--teal-400);font-weight:600;margin-bottom:8px;">✓ Ready to Submit</p>
        <p class="text-secondary" style="font-size:0.875rem;">Review the report details below. Once submitted, it will be sent to the manager for approval. You can save as draft if you need to make changes.</p>
       </div>`;

  return `
    <div>
      ${banner}

      <div class="form-row">
        <div>
          <div class="info-block">
            <div class="info-block-title">Student</div>
            <div class="info-row"><span class="info-row-label">Name</span><span class="info-row-value">${escapeHtml(selectedStudent?.studentName || '—')}</span></div>
            <div class="info-row"><span class="info-row-label">Parent</span><span class="info-row-value">${escapeHtml(selectedStudent?.parentName || '—')}</span></div>
            <div class="info-row"><span class="info-row-label">Email</span><span class="info-row-value">${escapeHtml(selectedStudent?.parentEmail || '—')}</span></div>
          </div>
          <div class="info-block">
            <div class="info-block-title">Assessment</div>
            <div class="info-row"><span class="info-row-label">Subject</span><span class="info-row-value">${escapeHtml(formData.subject || '—')}</span></div>
            <div class="info-row"><span class="info-row-label">Type</span><span class="info-row-value">${escapeHtml(formData.assessmentType || '—')}</span></div>
            <div class="info-row"><span class="info-row-label">Date</span><span class="info-row-value">${formData.assessmentDate || '—'}</span></div>
            <div class="info-row"><span class="info-row-label">Score</span><span class="info-row-value">${formData.assessmentScore != null ? formData.assessmentScore + '%' : '—'}</span></div>
          </div>
        </div>
        <div>
          <div class="info-block">
            <div class="info-block-title">Performance</div>
            <div class="info-row"><span class="info-row-label">Level</span><span class="info-row-value">${escapeHtml(formData.workingLevel || '—')}</span></div>
            <div class="info-row"><span class="info-row-label">Homework</span><span class="info-row-value">${escapeHtml(formData.homeworkCompletion || '—')}</span></div>
            <div class="info-row"><span class="info-row-label">Attendance</span><span class="info-row-value">${escapeHtml(formData.attendance || '—')}</span></div>
            <div class="info-row"><span class="info-row-label">Behaviour</span><span class="info-row-value">${escapeHtml(formData.behaviourEngagement || '—')}</span></div>
          </div>
          <div class="info-block">
            <div class="info-block-title">Feedback Summary</div>
            <div class="info-row"><span class="info-row-label">Strengths</span><span class="info-row-value truncate" style="max-width:160px;">${escapeHtml((formData.strengths || '').slice(0,60))}${formData.strengths?.length > 60 ? '…' : ''}</span></div>
            <div class="info-row"><span class="info-row-label">Tutor Comments</span><span class="info-row-value truncate" style="max-width:160px;">${escapeHtml((formData.additionalComments || '').slice(0,60))}${formData.additionalComments?.length > 60 ? '…' : ''}</span></div>
            ${formData.managerComments ? `
            <div class="info-row"><span class="info-row-label">Manager Comments</span><span class="info-row-value truncate" style="max-width:160px;">${escapeHtml(formData.managerComments.slice(0,60))}${formData.managerComments.length > 60 ? '…' : ''}</span></div>` : ''}
          </div>
        </div>
      </div>
    </div>`;
}

function collectStep1() {
  const sel = document.getElementById('step1-student');
  if (!sel?.value) { toast.error('Please select a student.'); return false; }
  formData.studentId = sel.value;
  selectedStudent = students.find(s => s.id === sel.value) || null;
  return true;
}

function collectStep2() {
  const date = document.getElementById('assessmentDate')?.value;
  const subject = document.getElementById('subject')?.value;
  const type = document.getElementById('assessmentType')?.value;
  const level = document.getElementById('workingLevel')?.value;
  const score = document.getElementById('assessmentScore')?.value;
  const hw = document.getElementById('homeworkCompletion')?.value;
  const att = document.getElementById('attendance')?.value;
  const beh = document.getElementById('behaviourEngagement')?.value;

  if (!date || !subject || !type || !level || !hw || !att || !beh) {
    toast.error('Please fill in all required fields.'); return false;
  }
  Object.assign(formData, { assessmentDate: date, subject, assessmentType: type, workingLevel: level,
    assessmentScore: score !== '' ? Number(score) : null,
    homeworkCompletion: hw, attendance: att, behaviourEngagement: beh });
  return true;
}

function collectStep3() {
  const strengths = document.getElementById('strengths')?.value.trim();
  const areas = document.getElementById('areasForImprovement')?.value.trim();
  const topics = document.getElementById('topicsCovered')?.value.trim();
  const recs = document.getElementById('recommendations')?.value.trim();
  const extra = document.getElementById('additionalComments')?.value.trim();
  if (!strengths || !areas) {
    toast.error('Please fill in Strengths and Areas for Improvement.'); return false;
  }
  Object.assign(formData, { strengths, areasForImprovement: areas, topicsCovered: topics,
    tutorFeedback: null, recommendations: recs, additionalComments: extra });

  if (isAdmin()) {
    const mgrComments = document.getElementById('managerComments')?.value.trim();
    formData.managerComments = mgrComments || null;
  }
  return true;
}

async function saveReport(preserveStatus = false) {
  try {
    if (formData.id) {
      // Already has an ID — just update the existing document
      const statusToSave = preserveStatus ? formData.status : 'draft';
      await updateReport(formData.id, { ...formData, attachments, status: statusToSave });
      return formData.id;
    }

    // No ID yet — check if a draft already exists for this
    // student + subject + assessmentType (Gmail-style dedup)
    const existing = await findExistingDraft(
      formData.studentId,
      formData.subject,
      formData.assessmentType
    );

    if (existing) {
      // Reuse the existing draft — set the ID FIRST so subsequent saves
      // go through the update path and don't create yet another duplicate
      formData.id = existing.id;
      await updateReport(existing.id, { ...formData, attachments, status: 'draft' });
      toast.info('Resuming your existing draft for this student & subject.');
      return existing.id;
    }

    // No existing draft — create a fresh one
    const id = await createReport({ ...formData, attachments, status: 'draft' });
    formData.id = id;
    return id;
  } catch (e) {
    console.error('[saveReport] Failed:', e);
    toast.error('Failed to save: ' + e.message);
    return null;
  }
}

export function initReportCreate(params = {}) {
  document.getElementById('btn-cancel-report')?.addEventListener('click', () => navigate('reports'));

  // Init attachment widget if on step 3 and report exists
  if (currentStep === 3 && formData.id) {
    initAttachmentWidget(attachments, {
      editable: true,
      reportId: formData.id,
      onChange: (updated) => { attachments = [...updated]; },
    });
  }

  document.getElementById('btn-prev')?.addEventListener('click', () => {
    currentStep--;
    refreshStep(params.reportId);
  });

  document.getElementById('btn-next')?.addEventListener('click', async () => {
    let valid = false;
    if (currentStep === 1) valid = collectStep1();
    else if (currentStep === 2) valid = collectStep2();
    else if (currentStep === 3) valid = collectStep3();
    if (!valid) return;

    // Auto-save draft when moving to step 3 so the report gets an ID
    // and attachments (photos/documents) become immediately available.
    if (currentStep === 2) {
      const btn = document.getElementById('btn-next');
      if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
      const id = await saveReport();
      if (btn) { btn.disabled = false; btn.textContent = 'Next →'; }
      if (!id) return; // save failed — stay on step 2
    }

    currentStep++;
    refreshStep(params.reportId);
  });

  document.getElementById('btn-save-draft')?.addEventListener('click', async () => {
    if (currentStep === 1) collectStep1();
    else if (currentStep === 2) collectStep2();
    else if (currentStep === 3) collectStep3();
    if (!formData.studentId) { toast.error('Please select a student first.'); return; }
    // Admin editing a live report: preserve status; otherwise save as draft
    const adminEdit = !!params.reportId && isAdmin() && !['draft','rejected'].includes(formData.status);
    const id = await saveReport(adminEdit);
    if (id) { toast.success(adminEdit ? 'Report updated' : 'Draft saved'); navigate('report-detail', { id }); }
  });

  // Admin quick-save on step 4 (preserves status)
  document.getElementById('btn-save-admin')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-save-admin');
    btn.disabled = true; btn.textContent = 'Saving…';
    const id = await saveReport(true); // preserve status
    if (id) {
      toast.success('Report updated successfully');
      navigate('report-detail', { id });
    } else {
      btn.disabled = false; btn.textContent = 'Save Changes';
    }
  });

  document.getElementById('btn-submit-report')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-submit-report');
    btn.disabled = true;
    btn.textContent = 'Submitting…';
    const id = await saveReport(true);
    if (!id) { btn.disabled = false; btn.textContent = 'Submit for Approval'; return; }
    try {
      await submitReport(id);
      toast.success('Report submitted for approval!');
      navigate('report-detail', { id });
    } catch (e) {
      btn.disabled = false;
      btn.textContent = 'Submit for Approval';
      toast.error('Failed to submit: ' + e.message);
    }
  });

  document.getElementById('btn-approve-submit')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-approve-submit');
    btn.disabled = true;
    btn.textContent = 'Approving…';
    const id = await saveReport(true);
    if (!id) { btn.disabled = false; btn.textContent = 'Approve & Submit'; return; }
    try {
      await approveReport(id, '');
      toast.success('Report approved and submitted!');
      navigate('report-detail', { id });
    } catch (e) {
      btn.disabled = false;
      btn.textContent = 'Approve & Submit';
      toast.error('Failed to approve: ' + e.message);
    }
  });

  // Step 1: update preview when student selected
  document.getElementById('step1-student')?.addEventListener('change', (e) => {
    selectedStudent = students.find(s => s.id === e.target.value) || null;
    formData.studentId = e.target.value;
    const preview = document.querySelector('.info-block');
    if (selectedStudent) {
      const div = document.createElement('div');
      div.className = 'info-block mt-2';
      div.innerHTML = `
        <div class="info-block-title">Selected Student</div>
        <div class="info-row"><span class="info-row-label">Name</span><span class="info-row-value">${escapeHtml(selectedStudent.studentName)}</span></div>
        <div class="info-row"><span class="info-row-label">Parent</span><span class="info-row-value">${escapeHtml(selectedStudent.parentName || '—')}</span></div>
        <div class="info-row"><span class="info-row-label">Parent Email</span><span class="info-row-value">${escapeHtml(selectedStudent.parentEmail || '—')}</span></div>`;
      const existing = document.querySelector('.info-block');
      if (existing) existing.replaceWith(div);
      else document.querySelector('.form-section')?.appendChild(div);
    }
  });
}

function refreshStep(reportId) {
  const pageContent = document.getElementById('page-content');
  if (!pageContent) return;
  pageContent.innerHTML = renderStep(reportId);
  initReportCreate({ reportId });
}
