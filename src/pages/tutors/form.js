// ================================================================
// Tutor Add / Edit Form
// ================================================================

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase.js';
import { createUserRecord } from '../../auth.js';
import { getUserById, updateUser } from '../../db.js';
import { navigate } from '../../router.js';
import { toast } from '../../components/toast.js';
import { escapeHtml } from '../../utils.js';

export async function renderTutorForm(params = {}) {
  const isEdit = !!params.id;
  let tutor = null;

  if (isEdit) {
    try {
      const { getUserById: getUser } = await import('../../db.js');
      tutor = await getUser(params.id);
    } catch (e) {
      return `<div class="empty-state"><h3>Error loading tutor</h3><p>${e.message}</p></div>`;
    }
  }

  const v = tutor || {};

  return `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title">${isEdit ? 'Edit Tutor' : 'Add New Tutor'}</h1>
          <p class="page-subtitle">${isEdit ? `Editing: ${escapeHtml(v.name || '')}` : 'Create a new tutor account'}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        </div>
      </div>

      <div class="card" style="max-width:560px;">
        <form id="tutor-form" novalidate>
          <div class="form-section">
            <div class="form-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Tutor Details
            </div>

            <div class="form-group">
              <label class="form-label" for="tutor-name">Full Name <span class="required">*</span></label>
              <input type="text" id="tutor-name" name="name" class="form-control"
                value="${escapeHtml(v.name || '')}" placeholder="e.g. Sarah Johnson" required />
            </div>

            <div class="form-group mt-2">
              <label class="form-label" for="tutor-email">Email Address <span class="required">*</span></label>
              <input type="email" id="tutor-email" name="email" class="form-control"
                value="${escapeHtml(v.email || '')}" placeholder="e.g. sarah@sydenhamasc.co.uk"
                ${isEdit ? 'disabled' : ''} required />
              ${isEdit ? '<span class="form-hint">Email cannot be changed after account creation.</span>' : ''}
            </div>

            ${!isEdit ? `
            <div class="form-group mt-2">
              <label class="form-label" for="tutor-password">Temporary Password <span class="required">*</span></label>
              <input type="password" id="tutor-password" name="password" class="form-control"
                placeholder="At least 8 characters" required autocomplete="new-password" />
              <span class="form-hint">The tutor will use this password to log in. Ask them to update it after first login.</span>
            </div>` : ''}
          </div>

          <div id="form-error" class="form-error" style="display:none;padding:10px;background:rgba(244,63,94,0.1);border-radius:8px;border:1px solid rgba(244,63,94,0.3);margin-bottom:16px;"></div>

          <div style="display:flex;justify-content:flex-end;gap:12px;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-2">Cancel</button>
            <button type="submit" class="btn btn-primary" id="btn-save">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              ${isEdit ? 'Save Changes' : 'Create Tutor Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function initTutorForm(params = {}) {
  const isEdit = !!params.id;
  const form = document.getElementById('tutor-form');
  const errorBox = document.getElementById('form-error');
  const btnSave = document.getElementById('btn-save');

  document.getElementById('btn-cancel')?.addEventListener('click', () => navigate('tutors'));
  document.getElementById('btn-cancel-2')?.addEventListener('click', () => navigate('tutors'));

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.style.display = 'none';

    const name     = form.name.value.trim();
    const email    = form.email?.value?.trim();
    const password = form.password?.value;

    if (!name) { showError('Name is required.'); return; }
    if (!isEdit && !email) { showError('Email is required.'); return; }
    if (!isEdit && (!password || password.length < 8)) {
      showError('Password must be at least 8 characters.'); return;
    }

    btnSave.disabled = true;
    btnSave.textContent = 'Saving…';

    try {
      if (isEdit) {
        const { updateUser: upd } = await import('../../db.js');
        await upd(params.id, { name });
        toast.success('Tutor updated');
      } else {
        // Create Firebase Auth user then write Firestore profile
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await createUserRecord(cred.user.uid, { name, email, role: 'tutor' });
        toast.success(`Tutor account created for ${name}`);
      }
      navigate('tutors');
    } catch (err) {
      btnSave.disabled = false;
      btnSave.textContent = isEdit ? 'Save Changes' : 'Create Tutor Account';
      const code = err.code;
      if (code === 'auth/email-already-in-use') showError('An account with this email already exists.');
      else if (code === 'auth/weak-password') showError('Password is too weak. Use at least 8 characters.');
      else showError('Failed to save. Please try again.');
    }
  });

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.style.display = 'block';
  }
}
