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

      <!-- EmailJS Setup Guide -->
      <div class="card mb-3">
        <div class="card-header">
          <div>
            <div class="card-title">Email Setup (EmailJS)</div>
            <div class="card-subtitle">Required to send PDF reports to parents automatically</div>
          </div>
        </div>

        <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:10px;padding:16px;margin-bottom:16px;">
          <p style="font-size:0.85rem;font-weight:600;color:var(--amber-500);margin-bottom:8px;">⚠ Email not yet configured</p>
          <p style="font-size:0.825rem;color:var(--text-secondary);">
            Until EmailJS is set up, clicking "Send to Parent" will download the PDF locally instead.
            Follow the steps below to enable automatic email delivery.
          </p>
        </div>

        <div style="display:flex;flex-direction:column;gap:16px;">
          ${[
            { n:1, title:'Create a free EmailJS account', detail:'Go to <a href="https://emailjs.com" target="_blank" style="color:var(--teal-400)">emailjs.com</a> and sign up. Free plan includes 200 emails/month.' },
            { n:2, title:'Add an Email Service', detail:'In the EmailJS dashboard, go to Email Services → Add Service. Connect Gmail or Outlook (use info@sydenhamasc.co.uk).' },
            { n:3, title:'Create an Email Template', detail:'Go to Email Templates → Create New. Use the template below. Copy the Template ID.' },
            { n:4, title:'Get your Public Key', detail:'Go to Account → General → Public Key. Copy it.' },
            { n:5, title:'Add keys to .env file', detail:'Open the <code style="background:rgba(148,163,184,0.15);padding:2px 6px;border-radius:4px;">.env</code> file in the project and replace the three YOUR_* placeholders with your real values, then restart the dev server.' },
          ].map(s => `
            <div style="display:flex;gap:14px;align-items:flex-start;">
              <div style="width:28px;height:28px;border-radius:50%;background:var(--teal-500);display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;color:white;flex-shrink:0;">${s.n}</div>
              <div>
                <div style="font-weight:600;font-size:0.875rem;margin-bottom:3px;">${s.title}</div>
                <div style="font-size:0.8rem;color:var(--text-secondary);">${s.detail}</div>
              </div>
            </div>`).join('')}
        </div>

        <div class="divider"></div>

        <div class="card-title mb-2" style="font-size:0.875rem;">EmailJS Template (copy this exactly)</div>
        <pre style="background:rgba(15,23,42,0.6);border:1px solid var(--border-color);border-radius:10px;padding:16px;font-size:0.78rem;color:var(--text-secondary);overflow-x:auto;line-height:1.7;">Subject: Student Progress Report – {{student_name}}

Dear {{parent_name}},

Please find attached the latest assessment report for {{student_name}}.

Subject:          {{subject_name}}
Assessment Type:  {{assessment_type}}
Report Date:      {{report_date}}

If you have any questions regarding this report, please do not hesitate 
to contact us.

Kind regards,

{{centre_name}}
{{centre_email}}

---
This report was generated by the Sydenham ASC Assessment Portal.</pre>
      </div>

      <!-- Firebase Info -->
      <div class="card">
        <div class="card-title mb-2">Firebase Configuration</div>
        <div class="info-block">
          <div class="info-row"><span class="info-row-label">Project ID</span><span class="info-row-value">assessment-dashboard-5610a</span></div>
          <div class="info-row"><span class="info-row-label">Auth</span><span class="info-row-value"><span class="badge badge-active">Email/Password Enabled</span></span></div>
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
