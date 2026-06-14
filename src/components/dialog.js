// ================================================================
// Dialog UI Component (Modern top-layer animated dialogs)
// ================================================================

export function createDialogStyles() {
  if (document.getElementById('dialog-styles')) return;

  const style = document.createElement('style');
  style.id = 'dialog-styles';
  style.textContent = `
    .modern-dialog {
      background: var(--bg-card, #1e293b);
      border: 1px solid var(--border-color, rgba(148, 163, 184, 0.15));
      border-radius: var(--radius-lg, 16px);
      padding: 0;
      color: var(--text-primary, #f1f5f9);
      box-shadow: var(--shadow-lg, 0 8px 32px rgba(0,0,0,0.5));
      width: 90%;
      max-width: 400px;
      margin: auto;
      
      /* Base state (closed) */
      opacity: 0;
      transform: scale(0.95) translateY(10px);
      transition: opacity 0.3s ease-out, transform 0.3s ease-out, display 0.3s allow-discrete, overlay 0.3s allow-discrete;
    }

    /* Open state */
    .modern-dialog[open] {
      opacity: 1;
      transform: scale(1) translateY(0);

      /* Entry starting style */
      @starting-style {
        opacity: 0;
        transform: scale(0.95) translateY(10px);
      }
    }

    /* Backdrop base state (closed) */
    .modern-dialog::backdrop {
      background-color: rgba(0, 0, 0, 0);
      backdrop-filter: blur(0px);
      transition: background-color 0.3s ease-out, backdrop-filter 0.3s ease-out, display 0.3s allow-discrete, overlay 0.3s allow-discrete;
    }

    /* Backdrop open state */
    .modern-dialog[open]::backdrop {
      background-color: rgba(3, 7, 18, 0.75);
      backdrop-filter: blur(4px);

      /* Backdrop entry starting style */
      @starting-style {
        background-color: rgba(0, 0, 0, 0);
        backdrop-filter: blur(0px);
      }
    }

    /* Respect reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .modern-dialog, .modern-dialog::backdrop {
        transform: none;
        transition-duration: 0.1s;
      }
      @starting-style {
        .modern-dialog[open] {
          transform: none;
        }
      }
    }

    .modern-dialog-content {
      padding: 24px;
    }

    .modern-dialog-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .modern-dialog-desc {
      font-size: 0.875rem;
      color: var(--text-secondary, #94a3b8);
      line-height: 1.5;
      margin-bottom: 24px;
    }

    .modern-dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .modern-dialog-actions .btn {
      min-width: 80px;
    }
  `;
  document.head.appendChild(style);
}

export function confirmDialog(message, options = {}) {
  createDialogStyles();

  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'modern-dialog';
    
    const title = options.title || 'Confirm';
    const confirmText = options.confirmText || 'Confirm';
    const cancelText = options.cancelText || 'Cancel';
    const danger = options.danger || false;

    dialog.innerHTML = `
      <div class="modern-dialog-content">
        <div class="modern-dialog-title">${title}</div>
        <div class="modern-dialog-desc">${message}</div>
        <div class="modern-dialog-actions">
          <button class="btn btn-secondary" id="dialog-cancel">${cancelText}</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="dialog-confirm">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    const btnCancel = dialog.querySelector('#dialog-cancel');
    const btnConfirm = dialog.querySelector('#dialog-confirm');

    const closeDialog = (result) => {
      dialog.close();
      dialog.addEventListener('transitionend', (e) => {
        if (e.propertyName === 'opacity' || e.propertyName === 'transform') {
          dialog.remove();
        }
      }, { once: true });
      
      // Fallback for browsers that don't support transitionend reliably on dialog close
      setTimeout(() => dialog.remove(), 400); 
      
      resolve(result);
    };

    btnCancel.addEventListener('click', () => closeDialog(false));
    btnConfirm.addEventListener('click', () => closeDialog(true));
    
    // Close on backdrop click
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) closeDialog(false);
    });

    dialog.showModal();
  });
}
