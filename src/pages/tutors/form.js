// ================================================================
// Tutor Add / Edit Form
// ================================================================
// Uses a secondary Firebase app instance to create tutor accounts
// WITHOUT signing the admin out. The tutor never needs a password —
// they log in via magic link (passwordless email link).
// ================================================================

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { createUserRecord } from '../../auth.js';
import { updateUser } from '../../db.js';
import { navigate } from '../../router.js';
import { toast } from '../../components/toast.js';
import { escapeHtml } from '../../utils.js';
import { sendMagicLink } from '../../auth.js';

// ── Secondary Firebase app (doesn't affect admin's auth session) ──
function getSecondaryAuth() {
  const config = {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  };
  // Reuse if already created, otherwise initialise a named secondary instance
  const existing = getApps().find(a => a.name === 'secondary');
  const secondaryApp = existing || initializeApp(config, 'secondary');
  return getAuth(secondaryApp);
}

/** Generate a strong random password — the tutor never uses this directly */
function randomPassword() {
  return crypto.randomUUID().replace(/-/g, '') + 'Aa1!';
}

export async function renderTutorForm(params = {}) {
  const isEdit = !!params.id;
  let tutor = null;

  if (isEdit) {
    try {
      const { getUserById } = await import('../../db.js');
      tutor = await getUserById(params.id);
    } catch (e) {
      return `<div class="empty-state"><h3>Error loading tutor</h3><p>${e.message}</p></div>`;
    }
  }

  const v = tutor || {};

  return `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title">${isEdit ? 'Edit Staff Member' : 'Invite Staff Member'}</h1>
          <p class="page-subtitle">${isEdit ? `Editing: ${escapeHtml(v.name || '')}` : 'Create an account and send a sign-in link'}</p>
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
                value="${escapeHtml(v.email || '')}" placeholder="e.g. sarah@email.com"
                ${isEdit ? 'disabled' : ''} required />
              ${isEdit
                ? '<span class="form-hint">Email cannot be changed after account creation.</span>'
                : '<span class="form-hint">A sign-in link will be emailed to them automatically — no password needed.</span>'}
            </div>

            ${!isEdit ? `
            <div class="form-group mt-2">
              <label class="form-label" for="tutor-role">Role <span class="required">*</span></label>
              <select id="tutor-role" name="role" class="form-control">
                <option value="tutor">Tutor — can create & submit reports</option>
                <option value="manager">Manager — can approve reports & view all</option>
                <option value="admin">Admin — full system access</option>
              </select>
              <span class="form-hint" id="role-hint">Select the appropriate access level.</span>
            </div>` : ''}
          </div>

          <!-- Info box about magic links -->
          ${!isEdit ? `
          <div style="background:rgba(20,184,166,0.06);border:1px solid rgba(20,184,166,0.2);border-radius:12px;padding:16px;margin-bottom:20px;font-size:0.85rem;color:var(--text-secondary);line-height:1.6;">
            <strong style="color:var(--teal-400);">✉ Passwordless sign-in</strong><br/>
            The person will receive a sign-in link by email. They click it and are logged in instantly — no password needed.
            You can resend the link anytime from the Staff list.
          </div>` : ''}

          <div id="form-error" class="form-error" style="display:none;padding:10px;background:rgba(244,63,94,0.1);border-radius:8px;border:1px solid rgba(244,63,94,0.3);margin-bottom:16px;"></div>

          <div style="display:flex;justify-content:flex-end;gap:12px;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-2">Cancel</button>
            <button type="submit" class="btn btn-primary" id="btn-save">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              ${isEdit ? 'Save Changes' : 'Create & Send Invite'}
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

    const name  = form.name.value.trim();
    const email = form.email?.value?.trim();
    const role  = form.role?.value || 'tutor';

    if (!name) { showError('Name is required.'); return; }
    if (!isEdit && !email) { showError('Email is required.'); return; }

    btnSave.disabled = true;
    btnSave.textContent = isEdit ? 'Saving…' : 'Creating account…';

    try {
      if (isEdit) {
        await updateUser(params.id, { name });
        toast.success('Tutor updated');
        navigate('tutors');
        return;
      }

      // ── Create new tutor ──────────────────────────────────────
      // Step 1: Create the Firebase Auth account using a SECONDARY app
      // so the admin stays logged in.
      const secondaryAuth = getSecondaryAuth();
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth, email, randomPassword()
      );

      // Step 2: Write the Firestore user document
      await createUserRecord(cred.user.uid, { name, email, role, active: true });

      // Step 3: Sign the secondary session out (good housekeeping)
      await secondaryAuth.signOut();

      // Step 4: Send the tutor their magic sign-in link
      btnSave.textContent = 'Sending invite…';
      await sendMagicLink(email);

      toast.success(`✉ Account created & invite sent to ${name}`);
      navigate('tutors');

    } catch (err) {
      btnSave.disabled = false;
      btnSave.textContent = isEdit ? 'Save Changes' : 'Create & Send Invite';
      if (err.code === 'auth/email-already-in-use') {
        showError('An account with this email already exists.');
      } else {
        showError(err.message || 'Failed to save. Please try again.');
        console.error(err);
      }
    }
  });

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.style.display = 'block';
  }
}
