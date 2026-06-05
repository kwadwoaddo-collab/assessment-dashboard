// ================================================================
// Help / User Guide Page (role-based)
// ================================================================

import { getState } from '../../store.js';

// ── Shared accordion component ───────────────────────────────────
function section(number, title, icon, content) {
  return `
    <div class="help-section">
      <div class="help-section-header">
        <div class="help-section-num">${number}</div>
        <span class="help-section-icon">${icon}</span>
        <h2 class="help-section-title">${title}</h2>
      </div>
      <div class="help-section-body">${content}</div>
    </div>`;
}

function steps(items) {
  return `<ol class="help-steps">${items.map(s => `<li>${s}</li>`).join('')}</ol>`;
}

function tip(text) {
  return `<div class="help-callout tip">💡 <span>${text}</span></div>`;
}

function note(text) {
  return `<div class="help-callout note">ℹ️ <span>${text}</span></div>`;
}

function warn(text) {
  return `<div class="help-callout warn">⚠️ <span>${text}</span></div>`;
}

function table(headers, rows) {
  return `
    <table class="help-table">
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;
}

// ── Manager / Admin guide ────────────────────────────────────────
function renderManagerGuide() {
  return `
    ${section(1, 'Signing In', '🔐', `
      <p>You receive a welcome email with a <strong>Sign in to your account</strong> button. Click it — you are logged in instantly with no password needed.</p>
      <p>If the link has expired, go to the app, enter your email and click <strong>Send Sign-in Link</strong> to get a fresh one.</p>
      ${note('Sign-in links expire after a short time for security. Always use the most recent email.')}
    `)}

    ${section(2, 'Your Dashboard', '📊', `
      <p>The Dashboard gives you a live overview of the whole centre.</p>
      ${table(
        ['Card', 'What it shows'],
        [
          ['<strong>Total Students</strong>', 'All active enrolled students'],
          ['<strong>Draft Reports</strong>', 'Reports started but not yet submitted by tutors'],
          ['<strong>Awaiting Approval</strong>', 'Reports submitted by tutors waiting for your sign-off'],
          ['<strong>Approved Reports</strong>', 'Reports you have approved this cycle'],
          ['<strong>Reports Sent</strong>', 'Reports already emailed to parents'],
        ]
      )}
      <p style="margin-top:12px">The <strong>Assessment Metrics</strong> section shows monthly report counts and the centre's average assessment score.</p>
    `)}

    ${section(3, 'Adding Students', '👩‍🎓', `
      ${steps([
        'Click <strong>Students</strong> in the left sidebar.',
        'Click <strong>+ Add Student</strong> (top right).',
        'Fill in: Student Name, Parent / Guardian Name, and Parent Email Address <em>(required)</em>. Add Year Group and Date of Birth if available.',
        'Click <strong>Add Student</strong>.',
      ])}
      ${tip('Use <strong>Import from CSV</strong> on the Students page to upload an entire class at once. Download the template, fill it in, then upload.')}
    `)}

    ${section(4, 'Inviting Tutors & Managers', '👩‍🏫', `
      ${steps([
        'Click <strong>Staff</strong> in the left sidebar.',
        'Click <strong>+ Invite Staff Member</strong>.',
        'Enter the person\'s <strong>Full Name</strong> and <strong>Email Address</strong>.',
        'Set their <strong>Role</strong> — Tutor or Manager.',
        'Click <strong>Create & Send Invite</strong>.',
      ])}
      <p>They receive an email with a sign-in link. They click it and are immediately logged in — no password needed.</p>
      ${note('If you invite someone who already has an account, the system resends their sign-in link and updates their role — no duplicates are created.')}
    `)}

    ${section(5, 'Approving & Sending Reports', '✅', `
      <p>A blue banner on the Dashboard alerts you when reports are awaiting approval.</p>
      ${steps([
        'Click <strong>Review Now</strong> on the banner, or go to <strong>All Reports</strong> and filter by <em>Submitted</em>.',
        'Open a report to read the tutor\'s feedback, scores and comments.',
        'Click <strong>Approve</strong> to accept, or <strong>Reject</strong> to return it to the tutor with a note.',
        'Once approved, click <strong>Send to Parent</strong> to email the PDF report automatically.',
      ])}
      ${warn('Only <strong>Approved</strong> reports can be sent to parents. Reports must be approved first.')}
    `)}

    ${section(6, 'Managing Staff', '👥', `
      <p>Click <strong>Staff</strong> in the sidebar to see all tutors and managers.</p>
      <ul class="help-list">
        <li>Click a staff member's name to view their profile and reports.</li>
        <li>Click <strong>Resend Invite</strong> to send a fresh sign-in link if they can't log in.</li>
        <li>Use <strong>Deactivate</strong> if a staff member leaves — their reports are safely preserved.</li>
      </ul>
    `)}

    ${section(7, 'Good to Know', '💡', `
      <div class="help-tips-grid">
        <div class="help-tip-card"><strong>🔒 Tutor privacy</strong>Tutors can only see their own reports and students — not other tutors' work.</div>
        <div class="help-tip-card"><strong>✏️ Edit any report</strong>You can edit a submitted report before sending it to a parent.</div>
        <div class="help-tip-card"><strong>📄 No duplicate drafts</strong>If a tutor starts a second report for the same student and subject, it continues the existing draft.</div>
        <div class="help-tip-card"><strong>📥 Download PDF</strong>Any approved report can be downloaded as a PDF as well as emailed.</div>
        <div class="help-tip-card"><strong>📊 Filtering</strong>Use filters on All Reports to search by tutor, student, subject, status or date.</div>
        <div class="help-tip-card"><strong>📎 Attachments</strong>Tutors can attach photos or documents to any report before submitting.</div>
      </div>
    `)}
  `;
}

// ── Tutor guide ──────────────────────────────────────────────────
function renderTutorGuide() {
  return `
    ${section(1, 'Signing In', '🔐', `
      <p>You received a welcome email with a <strong>Sign in to your account</strong> button. Click it — you are logged in instantly, no password needed.</p>
      <p>If the link has expired, go to the app, enter your email and click <strong>Send Sign-in Link</strong> to get a fresh one.</p>
      ${note('Sign-in links expire after a short time for security. Check your junk folder if you cannot find the email.')}
    `)}

    ${section(2, 'Your Dashboard', '📊', `
      <p>Your Dashboard shows a personal summary of <strong>your own</strong> reports and activity.</p>
      ${table(
        ['Card', 'What it shows'],
        [
          ['<strong>Students</strong>', 'Students you have written reports for'],
          ['<strong>Draft Reports</strong>', 'Your reports saved but not yet submitted'],
          ['<strong>Awaiting Approval</strong>', 'Your submitted reports waiting for manager sign-off'],
          ['<strong>Approved / Sent</strong>', 'Reports the manager has approved or sent to parents'],
        ]
      )}
    `)}

    ${section(3, 'Writing a Report', '📝', `
      <p>Reports are created in 4 simple steps.</p>
      ${steps([
        '<strong>Step 1 – Select Student:</strong> Choose the student you are writing about from the dropdown.',
        '<strong>Step 2 – Assessment Details:</strong> Fill in the subject, assessment type, score, working level, homework completion, attendance and behaviour.',
        '<strong>Step 3 – Feedback:</strong> Write the student\'s strengths, areas for improvement, topics covered and recommendations. You can also upload photos of their work here.',
        '<strong>Step 4 – Review & Submit:</strong> Check everything looks correct, then click <strong>Submit for Approval</strong>.',
      ])}
      ${tip('Click <strong>Save Draft</strong> at any step to save your progress and come back later. Drafts are never visible to parents.')}
    `)}

    ${section(4, 'Uploading Photos & Documents', '📎', `
      <p>On <strong>Step 3</strong> of the report form you will see an <strong>Assessment Photos & Documents</strong> section.</p>
      ${steps([
        'Click <strong>Upload File</strong> to attach a document or image from your device.',
        'On a phone, you can also click <strong>Take Photo</strong> to use your camera directly.',
        'You can attach multiple files — worksheets, test papers, photos of work etc.',
        'Attachments are included when the PDF is sent to the parent.',
      ])}
      ${note('Attachments become available once the report has been auto-saved (this happens automatically when you click Next from Step 2).')}
    `)}

    ${section(5, 'Submitting for Approval', '✅', `
      <p>Once you are happy with a report, click <strong>Submit for Approval</strong> on Step 4.</p>
      <ul class="help-list">
        <li>The manager will review and either <strong>approve</strong> or <strong>reject</strong> the report.</li>
        <li>If rejected, you will see the manager's comments on the report and can edit and resubmit.</li>
        <li>Once approved, the manager sends the PDF to the parent — you do not need to do anything further.</li>
      </ul>
      ${warn('Once submitted, you cannot edit the report unless the manager rejects it back to you.')}
    `)}

    ${section(6, 'Viewing Your Reports', '📋', `
      <p>Click <strong>All Reports</strong> in the sidebar to see all your reports. Use the filters to search by student, status or date.</p>
      <p>Click any report to view it in full, download the PDF, or check the approval status.</p>
      ${tip('Use the <strong>New Report</strong> button in the sidebar to start a new report quickly at any time.')}
    `)}

    ${section(7, 'Tips', '💡', `
      <div class="help-tips-grid">
        <div class="help-tip-card"><strong>📄 One draft per student</strong>Only one draft exists per student, subject and type — starting again continues the same draft.</div>
        <div class="help-tip-card"><strong>💾 Auto-saved</strong>Your progress is saved automatically as you move between steps.</div>
        <div class="help-tip-card"><strong>🔒 Your work is private</strong>Other tutors cannot see your reports. Only you and the manager can.</div>
        <div class="help-tip-card"><strong>📧 Need help?</strong>Contact your centre manager if you have any questions about the system.</div>
      </div>
    `)}
  `;
}

// ── Main render ──────────────────────────────────────────────────
export function renderHelp() {
  const user = getState('currentUser');
  const role = user?.role || 'tutor';
  const isManagerOrAdmin = role === 'admin' || role === 'manager';
  const firstName = user?.displayName?.split(' ')[0] || 'there';

  const roleLabel = isManagerOrAdmin ? 'Centre Manager' : 'Tutor';
  const roleColor = isManagerOrAdmin ? '#14b8a6' : '#8b5cf6';

  return `
    <div class="help-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Help & User Guide</h1>
          <p class="page-subtitle">
            Hi ${firstName} — this guide is tailored to your role as
            <span style="color:${roleColor};font-weight:600;">${roleLabel}</span>.
          </p>
        </div>
      </div>

      <div class="help-sections">
        ${isManagerOrAdmin ? renderManagerGuide() : renderTutorGuide()}
      </div>
    </div>

    <style>
      .help-page { max-width: 820px; }
      .help-sections { display: flex; flex-direction: column; gap: 16px; margin-top: 8px; }

      .help-section {
        background: var(--bg-card, #1a2236);
        border: 1px solid var(--border, rgba(255,255,255,0.07));
        border-radius: 14px;
        overflow: hidden;
      }
      .help-section-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 18px 24px;
        border-bottom: 1px solid var(--border, rgba(255,255,255,0.07));
        background: rgba(255,255,255,0.02);
      }
      .help-section-num {
        width: 26px; height: 26px;
        background: #0f172a;
        color: #14b8a6;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: 700;
        flex-shrink: 0;
        border: 1px solid rgba(20,184,166,0.3);
      }
      .help-section-icon { font-size: 18px; }
      .help-section-title {
        font-size: 15px;
        font-weight: 700;
        color: var(--text-primary, #f1f5f9);
        margin: 0;
      }
      .help-section-body {
        padding: 20px 24px;
        color: var(--text-secondary, #94a3b8);
        font-size: 14px;
        line-height: 1.7;
      }
      .help-section-body p { margin-bottom: 10px; }

      .help-steps { list-style: none; counter-reset: s; padding: 0; margin: 8px 0; }
      .help-steps li {
        counter-increment: s;
        display: flex; gap: 12px;
        margin-bottom: 10px;
        color: var(--text-secondary, #94a3b8);
      }
      .help-steps li::before {
        content: counter(s);
        width: 22px; height: 22px;
        background: #14b8a6;
        color: #fff;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: 700;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .help-list { padding-left: 20px; margin: 8px 0; }
      .help-list li { margin-bottom: 8px; }

      .help-callout {
        border-radius: 8px;
        padding: 10px 14px;
        margin: 12px 0;
        font-size: 13px;
        display: flex; gap: 8px;
        align-items: flex-start;
        line-height: 1.5;
      }
      .help-callout.tip  { background: rgba(20,184,166,0.08); border-left: 3px solid #14b8a6; }
      .help-callout.note { background: rgba(59,130,246,0.08); border-left: 3px solid #3b82f6; }
      .help-callout.warn { background: rgba(245,158,11,0.08); border-left: 3px solid #f59e0b; }

      .help-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 13px; }
      .help-table th {
        background: rgba(15,23,42,0.8);
        color: #94a3b8;
        padding: 8px 12px;
        text-align: left;
        font-weight: 600;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .help-table td {
        padding: 9px 12px;
        border-bottom: 1px solid rgba(255,255,255,0.05);
        color: var(--text-secondary, #94a3b8);
      }
      .help-table tr:last-child td { border-bottom: none; }

      .help-tips-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 10px;
        margin-top: 8px;
      }
      .help-tip-card {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 10px;
        padding: 12px 14px;
        font-size: 13px;
        color: var(--text-secondary, #94a3b8);
        line-height: 1.5;
      }
      .help-tip-card strong {
        display: block;
        color: var(--text-primary, #f1f5f9);
        margin-bottom: 4px;
        font-size: 12px;
      }
    </style>
  `;
}

export function initHelp() {
  // No interactive elements needed
}
