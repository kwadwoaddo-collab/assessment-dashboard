// ================================================================
// Utilities – shared helpers
// ================================================================

export function parseDate(dateStr) {
  if (!dateStr) return null;
  return dateStr.toDate ? dateStr.toDate() : new Date(dateStr);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = parseDate(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '—'; }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = parseDate(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return '—'; }
}

export function formatDateForInput(dateStr) {
  if (!dateStr) return '';
  try {
    const d = parseDate(dateStr);
    return d.toISOString().split('T')[0];
  } catch { return ''; }
}

export function toISODate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toISOString();
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function statusLabel(status) {
  const map = {
    draft: 'Draft',
    submitted: 'Submitted',
    approved: 'Approved',
    rejected: 'Rejected',
    sent: 'Sent',
  };
  return map[status] || status;
}

export function workingLevelClass(level) {
  const map = {
    'Below Expected': 'wl-below',
    'Working Towards Expected': 'wl-towards',
    'At Expected Standard': 'wl-at',
    'Above Expected Standard': 'wl-above',
    'Excellent': 'wl-excellent',
  };
  return map[level] || '';
}

export function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function thisMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export function isThisMonth(dateStr) {
  if (!dateStr) return false;
  try {
    const d = parseDate(dateStr);
    const currentDate = new Date();
    return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth();
  } catch { return false; }
}

export function average(arr) {
  if (!arr || arr.length === 0) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

// Centre configuration (future-proofed for multi-centre)
export const CENTRES = {
  sydenham: {
    id: 'sydenham',
    name: 'Sydenham After School Club',
    email: 'info@sydenhamasc.co.uk',
    phone: '07584 874710',
    website: 'www.sydenhamasc.co.uk',
  }
};

export const SUBJECTS = [
  'Mathematics',
  'English',
  'Verbal Reasoning',
  'Non-Verbal Reasoning',
  'Science',
];

export const ASSESSMENT_TYPES = [
  'Initial Assessment',
  'Half-Termly Assessment',
  'Termly Assessment',
  'Mock Assessment',
  'End of Year Assessment',
];

export const WORKING_LEVELS = [
  'Below Expected',
  'Working Towards Expected',
  'At Expected Standard',
  'Above Expected Standard',
  'Excellent',
];

export const HOMEWORK_OPTIONS = ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement'];
export const ATTENDANCE_OPTIONS = ['Excellent', 'Good', 'Fair', 'Poor'];
export const BEHAVIOUR_OPTIONS = ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement'];
export const YEAR_GROUPS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 'Year 13'];

export const REPORT_STATUSES = ['draft', 'submitted', 'approved', 'rejected', 'sent'];
