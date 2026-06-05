// ================================================================
// Settings Page
// ================================================================

import { navigate } from '../router.js';
import { toast } from '../components/toast.js';
import { CENTRES } from '../utils.js';

export function renderSettings() {
  const centre = CENTRES.sydenham;
  return `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title">Settings</h1>
          <p class="page-subtitle">Sydenham After School Club configuration</p>
        </div>
      </div>

      <!-- Centre Info (informational - future editable) -->
      <div class="card mb-3">
        <div class="card-header">
          <div class="card-title">Centre Information</div>
          <span class="badge badge-active">Active Centre</span>
        </div>

        <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
          <img src="/logo.png" alt="Logo" style="width:64px;height:64px;object-fit:contain;background:white;border-radius:12px;padding:6px;border:1px solid var(--border-color);" />
          <div>
            <div style="font-size:1rem;font-weight:700;">${centre.name}</div>
            <div class="text-muted" style="font-size:0.825rem;">Centre ID: ${centre.id}</div>
          </div>
        </div>

        <div class="info-block">
          <div class="info-block-title">Contact Details (on PDF reports)</div>
          <div class="info-row"><span class="info-row-label">Email</span><span class="info-row-value">${centre.email}</span></div>
          <div class="info-row"><span class="info-row-label">Phone</span><span class="info-row-value">${centre.phone}</span></div>
          <div class="info-row"><span class="info-row-label">Website</span><span class="info-row-value">${centre.website}</span></div>
        </div>

        <div class="info-block mt-2" style="border-color:rgba(14,165,233,0.2);background:rgba(14,165,233,0.04);">
          <div class="info-block-title" style="color:var(--accent-400);">Future-Proofed for Multi-Centre</div>
          <p style="font-size:0.825rem;color:var(--text-secondary);line-height:1.7;">
            The system is designed to support multiple centres (Dagenham, Peckham, etc.) in future versions.
            Each centre will have its own students, reports, and branding. Additional centres can be added
            without structural changes to the database.
          </p>
        </div>
      </div>

      <!-- Email Setup – Resend -->
      <div class="card mb-3">
        <div class="card-header">
          <div>
            <div class="card-title">Email Setup</div>
            <div class="card-subtitle">PDF reports are sent to parents via Resend</div>
          </div>
          <span class="badge badge-active">✓ Configured</span>
        </div>

        <!-- Status: configured -->
        <div style="background:rgba(20,184,166,0.06);border:1px solid rgba(20,184,166,0.2);border-radius:10px;padding:16px;margin-bottom:20px;">
          <p style="font-size:0.85rem;font-weight:600;color:var(--teal-400);margin-bottom:6px;">✓ Email delivery is active</p>
          <p style="font-size:0.825rem;color:var(--text-secondary);line-height:1.6;">
            Reports are sent automatically when you click <strong>"Send to Parent"</strong>.
            The PDF is attached directly to the email. Parents can reply to <strong>info@sydenhamasc.co.uk</strong>.
          </p>
        </div>

        <div class="info-block">
          <div class="info-block-title">Email Configuration</div>
          <div class="info-row"><span class="info-row-label">Provider</span><span class="info-row-value">Resend (resend.com)</span></div>
          <div class="info-row"><span class="info-row-label">From</span><span class="info-row-value">reports@sprintscaleit.co.uk</span></div>
          <div class="info-row"><span class="info-row-label">Reply-To</span><span class="info-row-value">info@sydenhamasc.co.uk</span></div>
          <div class="info-row"><span class="info-row-label">Attachment</span><span class="info-row-value">PDF report included automatically</span></div>
          <div class="info-row"><span class="info-row-label">Limit</span><span class="info-row-value">3,000 emails / month · 100 / day (free tier)</span></div>
        </div>

        <div class="divider"></div>

        <div class="card-title mb-2" style="font-size:0.875rem;">What the parent receives</div>
        <div style="background:rgba(15,23,42,0.6);border:1px solid var(--border-color);border-radius:10px;padding:16px;font-size:0.8rem;color:var(--text-secondary);line-height:1.8;">
          <strong style="color:var(--text-primary);">From:</strong> Sydenham After School Club &lt;reports@sprintscaleit.co.uk&gt;<br/>
          <strong style="color:var(--text-primary);">Subject:</strong> Assessment Report – [Student Name] – [Date]<br/>
          <strong style="color:var(--text-primary);">Attachment:</strong> Assessment_Report_[Student]_[Subject]_[Date].pdf<br/><br/>
          The email includes the student name, subject, assessment type, and report date in a branded HTML layout.
          The full PDF report is attached. Parents can reply directly to info@sydenhamasc.co.uk.
        </div>

        <div style="margin-top:12px;">
          <a href="https://resend.com/emails" target="_blank" class="btn btn-secondary btn-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            View Sent Emails (Resend Dashboard)
          </a>
        </div>
      </div>

      <!-- Firebase Info -->
      <div class="card">
        <div class="card-title mb-2">Firebase Configuration</div>
        <div class="info-block">
          <div class="info-row"><span class="info-row-label">Project ID</span><span class="info-row-value">assessment-dashboard-5610a</span></div>
          <div class="info-row"><span class="info-row-label">Auth</span><span class="info-row-value"><span class="badge badge-active">Email/Password</span> &nbsp;<span class="badge badge-active">Magic Link</span></span></div>
          <div class="info-row"><span class="info-row-label">Database</span><span class="info-row-value">Cloud Firestore</span></div>
          <div class="info-row"><span class="info-row-label">Region</span><span class="info-row-value">europe-west2 (London)</span></div>
        </div>
        <div style="margin-top:12px;">
          <a href="https://console.firebase.google.com/project/assessment-dashboard-5610a/overview" target="_blank" class="btn btn-secondary btn-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Open Firebase Console
          </a>
        </div>
      </div>
    </div>
  `;
}

export function initSettings() {
  // Settings page is currently read-only for Phase 1
}
