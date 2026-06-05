// ================================================================
// Attachment Widget – reusable for report form & detail view
// ================================================================
// Usage:
//   renderAttachmentWidget(attachments, { editable, reportId })
//   initAttachmentWidget(attachments, { editable, reportId, onChange })

import { uploadAttachment, deleteAttachment, isImage, formatBytes, ACCEPTED_ATTR, MAX_SIZE_MB } from '../storage.js';
import { toast } from './toast.js';

export function renderAttachmentWidget(attachments = [], { editable = false } = {}) {
  const uploadZone = editable ? `
    <div id="attach-dropzone" style="
      border: 2px dashed var(--border-color);
      border-radius: var(--radius-md);
      padding: 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      background: rgba(20,184,166,0.02);
      margin-bottom: ${attachments.length ? '16px' : '0'};
    ">
      <svg style="width:32px;height:32px;color:var(--teal-400);margin-bottom:8px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <p style="font-weight:600;font-size:0.875rem;color:var(--text-primary);margin-bottom:4px;">
        Take a photo or upload a file
      </p>
      <p style="font-size:0.775rem;color:var(--text-muted);">
        Photos, scanned work, PDFs · Max ${MAX_SIZE_MB}MB each
      </p>
      <input type="file" id="attach-file-input"
        accept="${ACCEPTED_ATTR}"
        multiple
        capture="environment"
        style="display:none;" />
      <div style="display:flex;gap:8px;justify-content:center;margin-top:14px;">
        <button type="button" class="btn btn-secondary btn-sm" id="btn-camera">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          Camera
        </button>
        <button type="button" class="btn btn-secondary btn-sm" id="btn-browse-files">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Upload File
        </button>
      </div>
    </div>
    <div id="upload-progress-area"></div>
  ` : '';

  const attachmentCards = attachments.length ? `
    <div id="attachment-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;${editable ? 'margin-top:16px;' : ''}">
      ${attachments.map((a, i) => renderAttachmentCard(a, i, editable)).join('')}
    </div>` : `<div id="attachment-list"></div>`;

  return `
    <div id="attachment-widget">
      ${uploadZone}
      ${attachmentCards}
      ${!editable && !attachments.length ? `
        <p style="font-size:0.825rem;color:var(--text-muted);text-align:center;padding:12px 0;">
          No attachments on this report.
        </p>` : ''}
    </div>`;
}

function renderAttachmentCard(att, index, editable) {
  const isImg = isImage(att.type);
  const sizeStr = formatBytes(att.size || 0);

  const preview = isImg
    ? `<img src="${att.url}" alt="${escHtml(att.name)}"
          style="width:100%;height:100px;object-fit:cover;border-radius:var(--radius-sm) var(--radius-sm) 0 0;display:block;"
          loading="lazy" />`
    : `<div style="height:100px;display:flex;align-items:center;justify-content:center;background:rgba(14,165,233,0.07);border-radius:var(--radius-sm) var(--radius-sm) 0 0;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:36px;height:36px;color:var(--accent-400);">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>`;

  const deleteBtn = editable
    ? `<button type="button" class="btn btn-danger btn-sm" data-delete-attach="${index}"
          style="padding:4px 8px;font-size:0.7rem;" title="Remove">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
       </button>`
    : '';

  return `
    <div class="attachment-card" data-attach-index="${index}" style="
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      overflow: hidden;
      background: var(--bg-secondary);
      transition: box-shadow 0.2s;
    ">
      <a href="${att.url}" target="_blank" rel="noopener" style="display:block;text-decoration:none;" title="Open ${escHtml(att.name)}">
        ${preview}
      </a>
      <div style="padding:8px 10px;display:flex;align-items:flex-start;justify-content:space-between;gap:6px;">
        <div style="min-width:0;flex:1;">
          <div style="font-size:0.76rem;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escHtml(att.name)}">
            ${escHtml(att.name)}
          </div>
          <div style="font-size:0.68rem;color:var(--text-muted);">${sizeStr}</div>
        </div>
        <div style="display:flex;gap:4px;flex-shrink:0;">
          <a href="${att.url}" target="_blank" rel="noopener"
             class="btn btn-secondary btn-sm" style="padding:4px 8px;" title="Open">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
          ${deleteBtn}
        </div>
      </div>
    </div>`;
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Init ──────────────────────────────────────────────────────
export function initAttachmentWidget(attachments = [], { editable = false, reportId, onChange } = {}) {
  if (!editable) return;

  const fileInput = document.getElementById('attach-file-input');
  const dropzone  = document.getElementById('attach-dropzone');

  // Camera button — opens file picker with capture
  document.getElementById('btn-camera')?.addEventListener('click', () => {
    if (fileInput) {
      fileInput.setAttribute('capture', 'environment');
      fileInput.setAttribute('accept', 'image/*');
      fileInput.click();
    }
  });

  // Browse button — opens file picker without capture
  document.getElementById('btn-browse-files')?.addEventListener('click', () => {
    if (fileInput) {
      fileInput.removeAttribute('capture');
      fileInput.setAttribute('accept', `${ACCEPTED_ATTR}`);
      fileInput.click();
    }
  });

  // Drag & drop
  dropzone?.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--teal-400)';
    dropzone.style.background  = 'rgba(20,184,166,0.08)';
  });
  dropzone?.addEventListener('dragleave', () => {
    dropzone.style.borderColor = '';
    dropzone.style.background  = '';
  });
  dropzone?.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.style.borderColor = '';
    dropzone.style.background  = '';
    handleFiles([...e.dataTransfer.files], attachments, reportId, onChange);
  });

  fileInput?.addEventListener('change', () => {
    handleFiles([...fileInput.files], attachments, reportId, onChange);
    fileInput.value = '';
  });

  // Delete buttons
  bindDeleteButtons(attachments, reportId, onChange);
}

function bindDeleteButtons(attachments, reportId, onChange) {
  document.querySelectorAll('[data-delete-attach]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const i = parseInt(btn.dataset.deleteAttach, 10);
      const att = attachments[i];
      if (!att) return;
      if (!confirm(`Remove "${att.name}"?`)) return;
      btn.disabled = true;
      try {
        if (att.path) await deleteAttachment(att.path);
        attachments.splice(i, 1);
        onChange?.(attachments);
        refreshList(attachments, true, reportId, onChange);
        toast.success('Attachment removed');
      } catch (e) {
        toast.error('Failed to remove: ' + e.message);
        btn.disabled = false;
      }
    });
  });
}

async function handleFiles(files, attachments, reportId, onChange) {
  if (!reportId) {
    toast.warning('Please save the report as a draft first, then attach files.');
    return;
  }
  const progressArea = document.getElementById('upload-progress-area');

  for (const file of files) {
    const progressId = `progress-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    if (progressArea) {
      progressArea.insertAdjacentHTML('beforeend', `
        <div id="${progressId}" style="margin-top:10px;">
          <div style="display:flex;justify-content:space-between;font-size:0.78rem;color:var(--text-secondary);margin-bottom:4px;">
            <span>${escHtml(file.name)}</span><span id="${progressId}-pct">0%</span>
          </div>
          <div style="background:var(--bg-secondary);border-radius:var(--radius-full);height:6px;overflow:hidden;">
            <div id="${progressId}-bar" style="height:100%;background:linear-gradient(90deg,var(--teal-600),var(--teal-400));width:0%;transition:width 0.2s;border-radius:var(--radius-full);"></div>
          </div>
        </div>`);
    }

    try {
      const meta = await uploadAttachment(reportId, file, pct => {
        const bar = document.getElementById(`${progressId}-bar`);
        const pctEl = document.getElementById(`${progressId}-pct`);
        if (bar) bar.style.width = pct + '%';
        if (pctEl) pctEl.textContent = pct + '%';
      });
      attachments.push(meta);
      onChange?.(attachments);
      document.getElementById(progressId)?.remove();
      refreshList(attachments, true, reportId, onChange);
      toast.success(`"${file.name}" uploaded`);
    } catch (e) {
      document.getElementById(progressId)?.remove();
      toast.error(`Failed to upload "${file.name}": ${e.message}`);
    }
  }
}

function refreshList(attachments, editable, reportId, onChange) {
  const list = document.getElementById('attachment-list');
  if (!list) return;
  list.innerHTML = attachments.map((a, i) => renderAttachmentCard(a, i, editable)).join('');
  bindDeleteButtons(attachments, reportId, onChange);
}
