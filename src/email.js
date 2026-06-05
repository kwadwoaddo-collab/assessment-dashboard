// ================================================================
// Email module – Resend (via Vercel serverless function /api/send-report)
// ================================================================
// Setup required:
//   1. Sign up at https://resend.com (free – 3,000 emails/month)
//   2. Go to API Keys → Create API Key → copy it
//   3. Add to Vercel environment variables:
//        RESEND_API_KEY = re_xxxxxxxxxxxxxxxx
//        RESEND_FROM_EMAIL = reports@sprintscaleit.co.uk  (after domain verified)
//   4. To verify your domain: Resend → Domains → Add Domain → sprintscaleit.co.uk
//      Then add the DNS records shown in your domain registrar.
//
// While domain is unverified, emails send from onboarding@resend.dev
// and can only go to the address you signed up with (Resend restriction).
// Verify your domain to send to any address.
// ================================================================

/**
 * Returns true when the app is deployed to Vercel (has the /api/send-report route).
 * In local dev without the Vercel CLI, email falls back to PDF download.
 */
export function isEmailConfigured() {
  // We always attempt the API route; the route itself checks for RESEND_API_KEY.
  // Return true so the "Send to Parent" button is always active.
  return true;
}

/**
 * Send a report email with PDF attachment to the parent.
 *
 * @param {Object} opts
 * @param {string} opts.parentEmail
 * @param {string} opts.parentName
 * @param {string} opts.studentName
 * @param {string} opts.subject       – subject name (Maths, English…)
 * @param {string} opts.assessmentType
 * @param {string} opts.reportDate
 * @param {string} opts.pdfBase64     – full data URI from jsPDF
 * @param {string} [opts.pdfFilename] – optional custom filename
 */
export async function sendReportEmail({
  parentEmail,
  parentName,
  studentName,
  subject,
  assessmentType,
  reportDate,
  pdfBase64,
  pdfFilename,
}) {
  const response = await fetch('/api/send-report', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      parentEmail,
      parentName,
      studentName,
      subject,
      assessmentType,
      reportDate,
      pdfBase64,
      pdfFilename,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Server error ${response.status}`);
  }

  return data;
}
