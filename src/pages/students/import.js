// ================================================================
// Student Bulk Import (CSV)
// ================================================================

import { createStudent, getStudents, importStudentsBulk } from '../../db.js';
import { navigate } from '../../router.js';
import { toast } from '../../components/toast.js';
import { escapeHtml, YEAR_GROUPS } from '../../utils.js';

// ── Column aliases ────────────────────────────────────────────
// Maps common header names → internal field names
const COLUMN_MAP = {
  // Student name
  'student name': 'studentName', 'name': 'studentName', 'student': 'studentName',
  'full name': 'studentName', 'pupil name': 'studentName', 'child name': 'studentName',
  'child': 'studentName',
  // First / Last
  'first name': 'firstName', 'firstname': 'firstName', 'forename': 'firstName',
  'last name': 'lastName', 'lastname': 'lastName', 'surname': 'lastName',
  'family name': 'lastName',
  // Parent
  'parent name': 'parentName', 'parent': 'parentName', 'guardian': 'parentName',
  'parent/guardian': 'parentName', 'guardian name': 'parentName',
  'parent email': 'parentEmail', 'email': 'parentEmail', 'parent/guardian email': 'parentEmail',
  'guardian email': 'parentEmail',
  // Academic
  'year group': 'yearGroup', 'year': 'yearGroup', 'class': 'yearGroup',
  'school': 'school', 'school name': 'school',
  // Dates
  'date of birth': 'dateOfBirth', 'dob': 'dateOfBirth', 'birth date': 'dateOfBirth',
  'birthday': 'dateOfBirth', 'date joined': 'startDate', 'start date': 'startDate',
  'date joined centre': 'startDate', 'joined': 'startDate', 'enrolment date': 'startDate',
};

const REQUIRED = ['studentName'];
const FIELDS = [
  { key: 'studentName',  label: 'Student Name',       required: true },
  { key: 'firstName',    label: 'First Name',          required: false },
  { key: 'lastName',     label: 'Last Name',           required: false },
  { key: 'parentName',   label: 'Parent / Guardian',   required: false },
  { key: 'parentEmail',  label: 'Parent Email',        required: false },
  { key: 'yearGroup',    label: 'Year Group',          required: false },
  { key: 'dateOfBirth',  label: 'Date of Birth',       required: false },
  { key: 'school',       label: 'School',              required: false },
  { key: 'startDate',    label: 'Date Joined Centre',  required: false },
];

let parsedRows = [];
let existingNames = new Set();

// ── CSV Parse ─────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line) => {
    const cells = [];
    let cur = '', inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cells.push(cur.trim()); cur = '';
      } else { cur += ch; }
    }
    cells.push(cur.trim());
    return cells;
  };

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().trim());
  const rows = lines.slice(1)
    .filter(l => l.trim())
    .map(l => {
      const cells = parseRow(l);
      const obj = {};
      headers.forEach((h, i) => {
        const field = COLUMN_MAP[h];
        if (field) obj[field] = cells[i] || '';
      });
      return obj;
    });

  return { headers, rows };
}

function normaliseDate(val) {
  if (!val) return null;
  // Try DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, MM/DD/YYYY
  const dmySlash = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmySlash) return `${dmySlash[3]}-${dmySlash[2].padStart(2,'0')}-${dmySlash[1].padStart(2,'0')}`;
  const dmyDash = val.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmyDash) return `${dmyDash[3]}-${dmyDash[2].padStart(2,'0')}-${dmyDash[1].padStart(2,'0')}`;
  const isoDate = val.match(/^\d{4}-\d{2}-\d{2}$/);
  if (isoDate) return val;
  return null;
}

function normaliseYearGroup(val) {
  if (!val) return null;
  const v = val.trim();
  // Already a valid year group?
  if (YEAR_GROUPS.includes(v)) return v;
  // Try "Year 5" -> "Year 5", "5" -> "Year 5", "Y5" -> "Year 5"
  const num = v.match(/^y(?:ear\s?)?(\d+)$/i)?.[1] || v.match(/^(\d+)$/)?.[1];
  if (num) {
    const candidate = `Year ${num}`;
    if (YEAR_GROUPS.includes(candidate)) return candidate;
  }
  return v; // pass through as-is
}

function validateRow(row) {
  const errors = [];
  if (!row.studentName?.trim()) errors.push('Student name is required');
  if (row.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.parentEmail)) {
    errors.push('Invalid email');
  }
  return errors;
}

// ── Template CSV download ─────────────────────────────────────
function downloadTemplate() {
  const headers = [
    'Student Name','First Name','Last Name',
    'Parent Name','Parent Email',
    'Year Group','Date of Birth','School','Date Joined Centre'
  ];
  const example = [
    'Emma Johnson','Emma','Johnson',
    'Sarah Johnson','sarah.johnson@email.com',
    'Year 6','15/06/2013','Sydenham Primary School','01/09/2024'
  ];
  const csv = [headers.join(','), example.join(',')].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'student_import_template.csv';
  a.click(); URL.revokeObjectURL(url);
}

// ── Render ────────────────────────────────────────────────────
export async function renderImportStudents() {
  parsedRows = [];
  try {
    const students = await getStudents({ includeInactive: true });
    existingNames = new Set(students.map(s => s.studentName?.toLowerCase().trim()));
  } catch (_) {}

  return `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title">Import Students</h1>
          <p class="page-subtitle">Bulk add students from a CSV or Google Sheet export</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" id="btn-back-import">← Back to Students</button>
          <button class="btn btn-secondary" id="btn-download-template">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download Template
          </button>
        </div>
      </div>

      <!-- Instructions -->
      <div class="card mb-3">
        <div class="card-title mb-3">How to import from Google Sheets</div>
        <div style="display:flex;flex-direction:column;gap:16px;">
          ${[
            { n:1, t:'Open your Google Sheet with student data', d:'Your columns can use any of the names in the table below — the importer will recognise them automatically.' },
            { n:2, t:'File → Download → CSV (.csv)', d:'In Google Sheets, go to <strong>File → Download → Comma Separated Values (.csv)</strong>.' },
            { n:3, t:'Upload or paste the CSV below', d:'Either drag &amp; drop the file, click to browse, or paste the CSV text directly.' },
            { n:4, t:'Review and confirm', d:'Check the preview, fix any errors highlighted in red, then click <strong>Import All Valid Rows</strong>.' },
          ].map(s => `
            <div style="display:flex;gap:14px;align-items:flex-start;">
              <div style="width:28px;height:28px;border-radius:50%;background:var(--teal-500);display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;color:white;flex-shrink:0;">${s.n}</div>
              <div>
                <div style="font-weight:600;font-size:0.875rem;margin-bottom:3px;">${s.t}</div>
                <div style="font-size:0.8rem;color:var(--text-secondary);">${s.d}</div>
              </div>
            </div>`).join('')}
        </div>

        <!-- Supported column names -->
        <details style="margin-top:20px;">
          <summary style="cursor:pointer;font-size:0.825rem;font-weight:600;color:var(--teal-400);user-select:none;">
            View supported column header names ▾
          </summary>
          <div class="table-wrapper" style="margin-top:12px;">
            <table>
              <thead><tr><th>Field</th><th>Accepted column headers (any will work)</th></tr></thead>
              <tbody>
                <tr><td><strong>Student Name</strong> ✱</td><td>Student Name, Name, Student, Full Name, Pupil Name, Child Name, Child</td></tr>
                <tr><td>First Name</td><td>First Name, Firstname, Forename</td></tr>
                <tr><td>Last Name</td><td>Last Name, Lastname, Surname, Family Name</td></tr>
                <tr><td>Parent / Guardian</td><td>Parent Name, Parent, Guardian, Parent/Guardian, Guardian Name</td></tr>
                <tr><td>Parent Email</td><td>Parent Email, Email, Parent/Guardian Email, Guardian Email</td></tr>
                <tr><td>Year Group</td><td>Year Group, Year, Class — accepts "Year 6", "6", or "Y6"</td></tr>
                <tr><td>Date of Birth</td><td>Date of Birth, DOB, Birth Date, Birthday — accepts DD/MM/YYYY or YYYY-MM-DD</td></tr>
                <tr><td>School</td><td>School, School Name</td></tr>
                <tr><td>Date Joined Centre</td><td>Date Joined, Date Joined Centre, Start Date, Joined, Enrolment Date</td></tr>
              </tbody>
            </table>
          </div>
        </details>
      </div>

      <!-- Upload Area -->
      <div class="card mb-3">
        <div class="card-title mb-3">Upload or Paste CSV</div>

        <div id="drop-zone" style="
          border: 2px dashed var(--border-color);
          border-radius: var(--radius-lg);
          padding: 40px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: rgba(20,184,166,0.03);
          margin-bottom: 20px;
        ">
          <svg style="width:40px;height:40px;color:var(--teal-400);margin-bottom:12px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <p style="font-weight:600;color:var(--text-primary);margin-bottom:6px;">Drop CSV file here or click to browse</p>
          <p style="font-size:0.8rem;color:var(--text-muted);">Supports .csv files exported from Google Sheets or Excel</p>
          <input type="file" id="csv-file-input" accept=".csv,text/csv" style="display:none;" />
        </div>

        <div style="position:relative;margin-bottom:20px;">
          <div style="position:absolute;inset:0;display:flex;align-items:center;"><div style="flex:1;border-top:1px solid var(--border-color);"></div></div>
          <div style="position:relative;text-align:center;"><span style="background:var(--bg-card);padding:0 12px;font-size:0.75rem;color:var(--text-muted);">or paste CSV text</span></div>
        </div>

        <div class="form-group">
          <textarea id="csv-paste" class="form-control" rows="6"
            placeholder="Paste CSV content here…&#10;Student Name,Parent Name,Parent Email,Year Group&#10;Emma Johnson,Sarah Johnson,sarah@email.com,Year 6"></textarea>
        </div>

        <div style="display:flex;justify-content:flex-end;margin-top:12px;">
          <button class="btn btn-primary" id="btn-parse-csv">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            Preview Import
          </button>
        </div>
      </div>

      <!-- Preview Table (populated after parse) -->
      <div id="import-preview" style="display:none;">
        <div class="card" style="padding:0;overflow:hidden;">
          <div style="padding:20px;border-bottom:1px solid var(--border-color);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
            <div>
              <div class="card-title">Preview</div>
              <div class="card-subtitle" id="preview-summary"></div>
            </div>
            <button class="btn btn-primary" id="btn-confirm-import">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Import Valid Rows
            </button>
          </div>
          <div id="preview-table-wrapper" class="table-wrapper"></div>
        </div>
      </div>

      <!-- Import Progress -->
      <div id="import-progress" style="display:none;" class="card">
        <div class="card-title mb-3">Importing…</div>
        <div style="background:var(--bg-secondary);border-radius:var(--radius-full);height:8px;overflow:hidden;margin-bottom:12px;">
          <div id="import-bar" style="height:100%;background:linear-gradient(90deg,var(--teal-600),var(--teal-400));width:0%;transition:width 0.3s ease;border-radius:var(--radius-full);"></div>
        </div>
        <p id="import-progress-text" style="font-size:0.875rem;color:var(--text-secondary);"></p>
      </div>
    </div>
  `;
}

function renderPreviewTable(rows) {
  const valid   = rows.filter(r => r._errors.length === 0 && !r._duplicate);
  const dupes   = rows.filter(r => r._duplicate);
  const invalid = rows.filter(r => r._errors.length > 0);

  document.getElementById('preview-summary').textContent =
    `${rows.length} rows · ${valid.length} ready to import · ${dupes.length} duplicates skipped · ${invalid.length} with errors`;

  const confirmBtn = document.getElementById('btn-confirm-import');
  if (confirmBtn) {
    confirmBtn.disabled = valid.length === 0;
    confirmBtn.textContent = `Import ${valid.length} Student${valid.length !== 1 ? 's' : ''}`;
  }

  const tableRows = rows.map((r, i) => {
    const isError = r._errors.length > 0;
    const isDupe  = r._duplicate;
    const rowStyle = isError
      ? 'background:rgba(244,63,94,0.06);'
      : isDupe ? 'background:rgba(245,158,11,0.06);' : '';

    return `
      <tr style="${rowStyle}">
        <td style="font-size:0.8rem;color:var(--text-muted);">${i + 1}</td>
        <td><strong>${escapeHtml(r.studentName || '—')}</strong></td>
        <td>${escapeHtml(r.parentName || '—')}</td>
        <td>
          ${r.parentEmail
            ? `<a href="mailto:${escapeHtml(r.parentEmail)}" style="color:var(--teal-400);text-decoration:none;">${escapeHtml(r.parentEmail)}</a>`
            : '—'}
        </td>
        <td>${escapeHtml(r.yearGroup || '—')}</td>
        <td>${escapeHtml(r.dateOfBirth || '—')}</td>
        <td>${escapeHtml(r.school || '—')}</td>
        <td>
          ${isError
            ? `<span style="color:var(--rose-400);font-size:0.78rem;">⚠ ${r._errors.join('; ')}</span>`
            : isDupe
              ? `<span style="color:var(--amber-500);font-size:0.78rem;">⚠ Already exists</span>`
              : `<span class="badge badge-active">Ready</span>`}
        </td>
      </tr>`;
  }).join('');

  document.getElementById('preview-table-wrapper').innerHTML = `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Student Name</th>
          <th>Parent</th>
          <th>Parent Email</th>
          <th>Year</th>
          <th>Date of Birth</th>
          <th>School</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>`;
}

function processCSV(text) {
  const { headers, rows } = parseCSV(text);

  if (rows.length === 0) {
    toast.error('No data rows found. Check your CSV has a header row and at least one data row.');
    return;
  }

  // Check for at least one recognised column
  const recognised = headers.some(h => COLUMN_MAP[h]);
  if (!recognised) {
    toast.error('No recognised column headers found. Download the template to see the expected format.');
    return;
  }

  parsedRows = rows.map(row => {
    const normalised = {
      ...row,
      studentName: row.studentName?.trim() || (row.firstName && row.lastName ? `${row.firstName.trim()} ${row.lastName.trim()}` : null),
      yearGroup:   normaliseYearGroup(row.yearGroup),
      dateOfBirth: normaliseDate(row.dateOfBirth),
      startDate:   normaliseDate(row.startDate),
      parentEmail: row.parentEmail?.trim().toLowerCase() || null,
      parentName:  row.parentName?.trim() || null,
      school:      row.school?.trim() || null,
    };
    normalised._errors    = validateRow(normalised);
    normalised._duplicate = existingNames.has(normalised.studentName?.toLowerCase().trim());
    return normalised;
  });

  const preview = document.getElementById('import-preview');
  if (preview) preview.style.display = 'block';
  preview?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  renderPreviewTable(parsedRows);
  toast.success(`Parsed ${parsedRows.length} rows. Review below and click Import.`);
}

export function initImportStudents() {
  document.getElementById('btn-back-import')?.addEventListener('click', () => navigate('students'));
  document.getElementById('btn-download-template')?.addEventListener('click', downloadTemplate);

  // File drop zone
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('csv-file-input');

  dropZone?.addEventListener('click', () => fileInput?.click());
  dropZone?.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--teal-400)';
    dropZone.style.background = 'rgba(20,184,166,0.08)';
  });
  dropZone?.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '';
    dropZone.style.background = '';
  });
  dropZone?.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.style.borderColor = '';
    dropZone.style.background = '';
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  });

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) readFile(file);
  });

  function readFile(file) {
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('csv-paste').value = e.target.result;
      processCSV(e.target.result);
    };
    reader.readAsText(file);
  }

  // Paste parse
  document.getElementById('btn-parse-csv')?.addEventListener('click', () => {
    const text = document.getElementById('csv-paste')?.value.trim();
    if (!text) { toast.error('Please upload a file or paste CSV text first.'); return; }
    processCSV(text);
  });

  // Confirm import
  document.getElementById('btn-confirm-import')?.addEventListener('click', async () => {
    const valid = parsedRows.filter(r => r._errors.length === 0 && !r._duplicate);
    if (valid.length === 0) { toast.error('No valid rows to import.'); return; }

    const progress = document.getElementById('import-progress');
    const bar = document.getElementById('import-bar');
    const progressText = document.getElementById('import-progress-text');
    const confirmBtn = document.getElementById('btn-confirm-import');

    if (progress) progress.style.display = 'block';
    if (confirmBtn) confirmBtn.disabled = true;
    progress?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    try {
      const dataToImport = valid.map(row => {
        const { _errors, _duplicate, ...data } = row;
        return data;
      });
      
      if (bar) bar.style.width = '50%';
      if (progressText) progressText.textContent = `Importing ${valid.length} students...`;
      
      await importStudentsBulk(dataToImport);
      
      if (bar) bar.style.width = '100%';
      if (progressText) progressText.textContent = `Successfully imported ${valid.length} students!`;
      toast.success(`✅ Successfully imported ${valid.length} student${valid.length !== 1 ? 's' : ''}!`);
    } catch (e) {
      console.error('Bulk import failed:', e);
      toast.error('Bulk import failed: ' + e.message);
      if (confirmBtn) confirmBtn.disabled = false;
      if (progress) progress.style.display = 'none';
      return;
    }

    setTimeout(() => navigate('students'), 1500);
  });
}
