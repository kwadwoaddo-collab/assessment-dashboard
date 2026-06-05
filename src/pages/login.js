// ================================================================
// Login Page  –  Email/Password  +  Magic Link (passwordless)
// ================================================================

import { login, sendMagicLink } from '../auth.js';
import { navigate } from '../router.js';
import { toast } from '../components/toast.js';

export function renderLogin() {
  return `
    <div class="login-page">
      <div class="login-bg"></div>
      <div class="login-card">
        <div class="login-logo">
          <img src="/logo.png" alt="Sydenham After School Club" />
          <h1>Assessment Portal</h1>
          <p>Sydenham After School Club</p>
        </div>

        <!-- ── Tab strip ─────────────────────────────────── -->
        <div class="login-tabs" role="tablist" aria-label="Sign-in method">
          <button
            class="login-tab active"
            id="tab-password"
            role="tab"
            aria-selected="true"
            aria-controls="panel-password"
            data-tab="password"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Password
          </button>
          <button
            class="login-tab"
            id="tab-magic"
            role="tab"
            aria-selected="false"
            aria-controls="panel-magic"
            data-tab="magic"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4l6 6M20 4l-6 6M12 2v4M12 18v4M4 20l6-6M20 20l-6-6"/>
            </svg>
            Magic Link
          </button>
        </div>

        <!-- ── Panel 1: Email & Password ─────────────────── -->
        <div id="panel-password" role="tabpanel" aria-labelledby="tab-password" class="login-panel active">
          <form class="login-form" id="login-form" novalidate>
            <div class="form-group">
              <label class="form-label" for="login-email">Email Address</label>
              <input
                type="email"
                id="login-email"
                class="form-control"
                placeholder="you@sydenhamasc.co.uk"
                autocomplete="username"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="login-password">Password</label>
              <input
                type="password"
                id="login-password"
                class="form-control"
                placeholder="••••••••"
                autocomplete="current-password"
                required
              />
            </div>

            <div id="login-error" class="form-error" style="display:none;padding:10px;background:rgba(244,63,94,0.1);border-radius:8px;border:1px solid rgba(244,63,94,0.3);"></div>

            <button type="submit" class="btn btn-primary btn-lg w-full" id="login-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              Sign In
            </button>
          </form>
        </div>

        <!-- ── Panel 2: Magic Link ────────────────────────── -->
        <div id="panel-magic" role="tabpanel" aria-labelledby="tab-magic" class="login-panel" hidden>
          <form class="login-form" id="magic-form" novalidate>
            <div class="form-group">
              <label class="form-label" for="magic-email">Email Address</label>
              <input
                type="email"
                id="magic-email"
                class="form-control"
                placeholder="you@sydenhamasc.co.uk"
                autocomplete="email"
                required
              />
            </div>

            <p class="text-muted" style="font-size:0.8rem;margin-bottom:16px;line-height:1.5;">
              We'll email you a one-click sign-in link — no password needed.
            </p>

            <div id="magic-error" class="form-error" style="display:none;padding:10px;background:rgba(244,63,94,0.1);border-radius:8px;border:1px solid rgba(244,63,94,0.3);margin-bottom:12px;"></div>

            <!-- Success confirmation — hidden until link is sent -->
            <div id="magic-success" style="display:none;padding:16px;background:rgba(20,184,166,0.1);border-radius:8px;border:1px solid rgba(20,184,166,0.3);text-align:center;">
              <svg style="width:32px;height:32px;color:#14b8a6;margin-bottom:8px;"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07
                         A19.5 19.5 0 0 1 4.69 11a19.79 19.79 0 0 1-3.07-8.67
                         A2 2 0 0 1 3.6 0h3a2 2 0 0 1 2 1.72
                         A12.84 12.84 0 0 0 9.7 5.28a2 2 0 0 1-.45 2.11L8.09 8.54
                         a16 16 0 0 0 7.37 7.37l1.15-1.16a2 2 0 0 1 2.11-.45
                         A12.84 12.84 0 0 0 21 15.14 2 2 0 0 1 22 16.92z"/>
              </svg>
              <p style="color:#14b8a6;font-weight:600;margin:0 0 6px;">Check your email!</p>
              <p style="color:#94a3b8;font-size:0.82rem;margin:0;line-height:1.5;">
                We've sent you a sign-in link.<br>You can close this tab.
              </p>
            </div>

            <button type="submit" class="btn btn-primary btn-lg w-full" id="magic-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Send Sign-in Link
            </button>
          </form>
        </div>

        <p class="text-muted" style="text-align:center;font-size:0.75rem;margin-top:24px;">
          Secure login for authorised staff only.<br>
          Contact your administrator if you need access.
        </p>
      </div>
    </div>

    <style>
      /* ── Tab strip ──────────────────────────────────────── */
      .login-tabs {
        display: flex;
        gap: 4px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 10px;
        padding: 4px;
        margin-bottom: 24px;
      }

      .login-tab {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        padding: 9px 12px;
        border: none;
        border-radius: 7px;
        background: transparent;
        color: #64748b;
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s, color 0.2s;
        line-height: 1;
      }

      .login-tab svg {
        width: 15px;
        height: 15px;
        flex-shrink: 0;
        transition: color 0.2s;
      }

      .login-tab:hover {
        background: rgba(255,255,255,0.06);
        color: #94a3b8;
      }

      .login-tab.active {
        background: rgba(20,184,166,0.15);
        color: #14b8a6;
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      }

      .login-tab.active svg {
        color: #14b8a6;
      }

      /* ── Panels ─────────────────────────────────────────── */
      .login-panel {
        animation: fadeInPanel 0.2s ease;
      }

      .login-panel[hidden] {
        display: none;
      }

      @keyframes fadeInPanel {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    </style>
  `;
}

export function initLogin() {
  // ── Tab switching ────────────────────────────────────────
  document.querySelectorAll('.login-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      // Update tab states
      document.querySelectorAll('.login-tab').forEach(t => {
        const isActive = t.dataset.tab === target;
        t.classList.toggle('active', isActive);
        t.setAttribute('aria-selected', String(isActive));
      });

      // Show/hide panels
      document.getElementById('panel-password').hidden = (target !== 'password');
      document.getElementById('panel-magic').hidden    = (target !== 'magic');
    });
  });

  // ── Panel 1: Email & Password ────────────────────────────
  const form     = document.getElementById('login-form');
  const errorBox = document.getElementById('login-error');
  const btn      = document.getElementById('login-btn');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      showError(errorBox, 'Please enter your email and password.');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = spinnerHTML('Signing in…');
    errorBox.style.display = 'none';

    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('dashboard');
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
        Sign In`;

      const code = err.code;
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        showError(errorBox, 'Invalid email or password. Please try again.');
      } else if (code === 'auth/too-many-requests') {
        showError(errorBox, 'Too many failed attempts. Please try again later.');
      } else {
        showError(errorBox, 'Unable to sign in. Please check your connection and try again.');
      }
    }
  });

  // ── Panel 2: Magic Link ──────────────────────────────────
  const magicForm    = document.getElementById('magic-form');
  const magicError   = document.getElementById('magic-error');
  const magicSuccess = document.getElementById('magic-success');
  const magicBtn     = document.getElementById('magic-btn');

  magicForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('magic-email').value.trim();

    if (!email) {
      showError(magicError, 'Please enter your email address.');
      return;
    }

    magicBtn.disabled = true;
    magicBtn.innerHTML = spinnerHTML('Sending link…');
    magicError.style.display = 'none';

    try {
      await sendMagicLink(email);
      // Hide the form fields and show the success state
      magicForm.querySelector('.form-group').style.display  = 'none';
      magicForm.querySelector('p.text-muted').style.display = 'none';
      magicBtn.style.display                               = 'none';
      magicSuccess.style.display                           = 'block';
    } catch (err) {
      magicBtn.disabled = false;
      magicBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
        Send Sign-in Link`;

      const code = err.code;
      if (code === 'auth/user-not-found') {
        showError(magicError, 'No account found for that email address.');
      } else if (code === 'auth/invalid-email') {
        showError(magicError, 'Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        showError(magicError, 'Too many requests. Please wait a moment and try again.');
      } else {
        showError(magicError, err.message || 'Unable to send the link. Please try again.');
      }
    }
  });

  // ── Helpers ──────────────────────────────────────────────
  function showError(box, msg) {
    box.textContent = msg;
    box.style.display = 'block';
  }

  function spinnerHTML(label) {
    return `
      <svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="2" x2="12" y2="6"/>
        <line x1="12" y1="18" x2="12" y2="22"/>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
        <line x1="2" y1="12" x2="6" y2="12"/>
        <line x1="18" y1="12" x2="22" y2="12"/>
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
      </svg>
      ${label}`;
  }
}
