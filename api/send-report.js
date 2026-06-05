// ================================================================
// Vercel Serverless Function – Send report email via Resend
// POST /api/send-report
// ================================================================
// Environment variable required (set in Vercel dashboard, NOT .env):
//   RESEND_API_KEY = re_xxxxxxxxxxxxxxxx

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// "From" address — must be on a domain verified in Resend.
// Until you verify sprintscaleit.co.uk, use onboarding@resend.dev for testing.
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME    = 'Sydenham After School Club';

export default async function handler(req, res) {
  // CORS – allow requests from same origin only
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    parentEmail,
    parentName,
    studentName,
    subject,
    assessmentType,
    reportDate,
    pdfBase64,       // full data URI: "data:application/pdf;base64,AAAA..."
    pdfFilename,
  } = req.body || {};

  if (!parentEmail || !pdfBase64) {
    return res.status(400).json({ error: 'parentEmail and pdfBase64 are required' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY is not set on the server' });
  }

  // Strip the data URI prefix to get raw base64
  const base64Content = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;

  const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:28px 32px;">
            <p style="margin:0;color:#14b8a6;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Sydenham After School Club</p>
            <h1 style="margin:6px 0 0;color:#ffffff;font-size:20px;">Student Assessment Report</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;color:#334155;font-size:15px;">Dear ${parentName || 'Parent/Guardian'},</p>
            <p style="margin:0 0 16px;color:#334155;font-size:15px;">
              Please find attached the assessment report for <strong>${studentName}</strong>.
            </p>

            <!-- Info box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px;">
                  <table width="100%" cellpadding="4" cellspacing="0">
                    <tr>
                      <td style="color:#64748b;font-size:13px;width:140px;"><strong>Student</strong></td>
                      <td style="color:#1e293b;font-size:13px;">${studentName}</td>
                    </tr>
                    <tr>
                      <td style="color:#64748b;font-size:13px;"><strong>Subject</strong></td>
                      <td style="color:#1e293b;font-size:13px;">${subject || '—'}</td>
                    </tr>
                    <tr>
                      <td style="color:#64748b;font-size:13px;"><strong>Assessment Type</strong></td>
                      <td style="color:#1e293b;font-size:13px;">${assessmentType || '—'}</td>
                    </tr>
                    <tr>
                      <td style="color:#64748b;font-size:13px;"><strong>Report Date</strong></td>
                      <td style="color:#1e293b;font-size:13px;">${reportDate || '—'}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 24px;color:#334155;font-size:14px;line-height:1.6;">
              The full report is attached as a PDF. If you have any questions, please contact us at
              <a href="mailto:info@sydenhamasc.co.uk" style="color:#14b8a6;">info@sydenhamasc.co.uk</a>
              or call <strong>07584 874710</strong>.
            </p>
            <p style="margin:0;color:#334155;font-size:14px;">Kind regards,<br/><strong>Sydenham After School Club</strong></p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0f172a;padding:16px 32px;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:11px;">
              info@sydenhamasc.co.uk &nbsp;|&nbsp; 07584 874710 &nbsp;|&nbsp; www.sydenhamasc.co.uk
            </p>
            <p style="margin:6px 0 0;color:#475569;font-size:10px;">Confidential – For Parent/Guardian use only</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const result = await resend.emails.send({
      from:     `${FROM_NAME} <${FROM_ADDRESS}>`,
      to:       [parentEmail],
      reply_to: 'info@sydenhamasc.co.uk',
      subject:  `Assessment Report – ${studentName} – ${reportDate || ''}`.trim(),
      html:     emailHtml,
      attachments: [
        {
          filename: pdfFilename || `Assessment_Report_${(studentName || 'student').replace(/\s+/g, '_')}.pdf`,
          content:  base64Content,
        },
      ],
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return res.status(500).json({ error: result.error.message || 'Resend error' });
    }

    return res.status(200).json({ success: true, id: result.data?.id });
  } catch (err) {
    console.error('Send failed:', err);
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
