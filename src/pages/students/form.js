// ================================================================
// Student Add / Edit Form
// ================================================================

import { createStudent, updateStudent, getStudentById } from '../../db.js';
import { getUsers } from '../../db.js';
import { navigate } from '../../router.js';
import { toast } from '../../components/toast.js';
import { YEAR_GROUPS, escapeHtml, formatDateForInput } from '../../utils.js';

export async function renderStudentForm(params = {}) {
  const isEdit = !!params.id;
  let student = null;
  let tutors = [];

  try {
    [student, tutors] = await Promise.all([
      isEdit ? getStudentById(params.id) : Promise.resolve(null),
      getUsers({ role: 'tutor' }),
    ]);
  } catch (e) {
    return `<div class="empty-state"><h3>Error loading form</h3><p>${e.message}</p></div>`;
  }

  const v = student || {};

  return `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title">${isEdit ? 'Edit Student' : 'Add New Student'}</h1>
          <p class="page-subtitle">${isEdit ? `Editing: ${escapeHtml(v.studentName || '')}` : 'Add a new student to the system'}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        </div>
      </div>

      <div class="card">
        <form id="student-form" novalidate>

          <!-- Required Fields -->
          <div class="form-section">
            <div class="form-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Required Information
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="studentName">Student Name <span class="required">*</span></label>
                <input type="text" id="studentName" name="studentName" class="form-control"
                  value="${escapeHtml(v.studentName || '')}" placeholder="e.g. John Smith" required aria-errormessage="studentName-error" />
                <div id="studentName-error" class="error-msg"><span aria-hidden="true">❌</span> Please enter the student's name.</div>
              </div>
              <div class="form-group">
                <label class="form-label" for="parentName">Parent / Guardian Name <span class="required">*</span></label>
                <input type="text" id="parentName" name="parentName" class="form-control"
                  value="${escapeHtml(v.parentName || '')}" placeholder="e.g. Jane Smith" required aria-errormessage="parentName-error" />
                <div id="parentName-error" class="error-msg"><span aria-hidden="true">❌</span> Please enter the parent or guardian's name.</div>
              </div>
            </div>

            <div class="form-group mt-2">
              <label class="form-label" for="parentEmail">Parent Email Address <span class="required">*</span></label>
              <span id="parentEmail-hint" class="form-hint">Reports will be sent to this email address.</span>
              <input type="email" id="parentEmail" name="parentEmail" class="form-control"
                value="${escapeHtml(v.parentEmail || '')}" placeholder="e.g. jane@example.com" required 
                aria-describedby="parentEmail-hint" aria-errormessage="parentEmail-error" />
              <div id="parentEmail-error" class="error-msg"><span aria-hidden="true">❌</span> Please enter a valid email address.</div>
            </div>
          </div>

          <!-- Optional Fields -->
          <div class="form-section">
            <div class="form-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Additional Information <span style="font-weight:400;color:var(--text-muted);font-size:0.8rem;text-transform:none;letter-spacing:0;">(optional – can be completed later)</span>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="firstName">First Name</label>
                <input type="text" id="firstName" name="firstName" class="form-control"
                  value="${escapeHtml(v.firstName || '')}" placeholder="First name" />
              </div>
              <div class="form-group">
                <label class="form-label" for="lastName">Last Name</label>
                <input type="text" id="lastName" name="lastName" class="form-control"
                  value="${escapeHtml(v.lastName || '')}" placeholder="Last name" />
              </div>
            </div>

            <div class="form-row mt-2">
              <div class="form-group">
                <label class="form-label" for="dateOfBirth">Date of Birth</label>
                <input type="date" id="dateOfBirth" name="dateOfBirth" class="form-control"
                  value="${formatDateForInput(v.dateOfBirth)}" />
              </div>
              <div class="form-group">
                <label class="form-label" for="yearGroup">Year Group</label>
                <select id="yearGroup" name="yearGroup" class="form-control">
                  <option value="">Select year group…</option>
                  ${YEAR_GROUPS.map(y => `<option value="${y}" ${v.yearGroup === y ? 'selected' : ''}>${y}</option>`).join('')}
                </select>
              </div>
            </div>

            <div class="form-row mt-2">
              <div class="form-group">
                <label class="form-label" for="school">Centre</label>
                <input type="text" id="school" name="school" class="form-control"
                  value="${escapeHtml(v.school || 'Sydenham')}" placeholder="e.g. Sydenham High School" />
              </div>
              <div class="form-group">
                <label class="form-label" for="startDate">Date Joined Centre</label>
                <input type="date" id="startDate" name="startDate" class="form-control"
                  value="${formatDateForInput(v.startDate)}" />
                <span class="form-hint">When the student started at Sydenham After School Club.</span>
              </div>
            </div>

            <div class="form-group mt-2">
              <label class="form-label" for="tutorAssigned">Assigned Tutor</label>
              <select id="tutorAssigned" name="tutorAssigned" class="form-control">
                <option value="">No tutor assigned</option>
                ${tutors.map(t => `<option value="${t.id}" ${v.tutorAssigned === t.id ? 'selected' : ''}>${escapeHtml(t.name)}</option>`).join('')}
              </select>
            </div>
          </div>

          <!-- Error -->
          <div id="form-error" class="form-error" style="display:none;padding:10px;background:rgba(244,63,94,0.1);border-radius:8px;border:1px solid rgba(244,63,94,0.3);margin-bottom:16px;"></div>

          <!-- Actions -->
          <div style="display:flex;justify-content:flex-end;gap:12px;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-2">Cancel</button>
            <button type="submit" class="btn btn-primary" id="btn-save">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              ${isEdit ? 'Save Changes' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function initStudentForm(params = {}) {
  const isEdit = !!params.id;
  const form = document.getElementById('student-form');
  const errorBox = document.getElementById('form-error');
  const btnSave = document.getElementById('btn-save');

  document.getElementById('btn-cancel')?.addEventListener('click', () => navigate('students'));
  document.getElementById('btn-cancel-2')?.addEventListener('click', () => navigate('students'));

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.style.display = 'none';

    const data = {
      studentName:   form.studentName.value.trim(),
      parentName:    form.parentName.value.trim(),
      parentEmail:   form.parentEmail.value.trim(),
      firstName:     form.firstName.value.trim() || null,
      lastName:      form.lastName.value.trim() || null,
      dateOfBirth:   form.dateOfBirth.value || null,
      yearGroup:     form.yearGroup.value || null,
      school:        form.school.value.trim() || null,
      startDate:     form.startDate.value || null,
      tutorAssigned: form.tutorAssigned.value || null,
    };

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    btnSave.disabled = true;
    btnSave.innerHTML = `<svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg> Saving…`;

    try {
      if (isEdit) {
        await updateStudent(params.id, data);
        toast.success('Student updated successfully');
      } else {
        const id = await createStudent(data);
        toast.success('Student added successfully');
      }
      navigate('students');
    } catch (err) {
      btnSave.disabled = false;
      btnSave.innerHTML = `Save Changes`;
      showError('Failed to save student. Please try again.');
      console.error(err);
    }
  });

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.style.display = 'block';
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
