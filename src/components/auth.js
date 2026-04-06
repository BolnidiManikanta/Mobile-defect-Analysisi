import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/auth.js';
import { saveUserProfile } from '../utils/firestore-helpers.js';
import { toast } from '../utils/toast.js';
import { ico } from '../utils/icons.js';
import { t } from '../utils/i18n.js';

// ── State ──────────────────────────────────────────────────
export let authMode   = 'login';
export let authForgot = false;
export let isVendor   = false;

export function setAuthMode(m)   { authMode = m; }
export function setAuthForgot(f) { authForgot = f; }
export function setVendorRole(v) { isVendor = v; }

// ── Render ─────────────────────────────────────────────────
export function renderAuth() {
  return `
  <div class="auth-wrap">
    <div class="auth-bg"></div>
    <div class="auth-grid-lines"></div>
    <div class="auth-card fade-up">
      <div class="auth-logo">
        <div class="auth-logo-mark">${ico('shield',18,'white')}</div>
        <div>
          <div style="font-family:'Syne',sans-serif;font-size:17px;font-weight:800;letter-spacing:-.3px">SmartSep AI</div>
          <div style="font-size:9.5px;color:var(--text-3);font-family:'JetBrains Mono',monospace;letter-spacing:.06em">DAMAGE INTELLIGENCE</div>
        </div>
      </div>
      ${authForgot ? renderForgotForm() : renderLoginForm()}
    </div>
  </div>`;
}

function renderForgotForm() {
  return `
    <div class="auth-title">${t('reset_password_title')}</div>
    <div class="auth-sub">${t('reset_sub')}</div>
    <div id="auth-msg"></div>
    <div class="field">
      <label class="lbl">${t('email')}</label>
      <input class="inp" id="a-email" type="email" placeholder="you@example.com" autocomplete="email"/>
    </div>
    <button class="btn btn-primary" id="a-reset-btn" style="width:100%;margin-bottom:14px">${t('send_reset')}</button>
    <div style="text-align:center;font-size:12.5px;color:var(--text-2)">
      ${t('remembered')} <span class="auth-link" id="back-login">${t('back_login')}</span>
    </div>`;
}

function renderLoginForm() {
  const isLogin = authMode === 'login';
  return `
    <div class="auth-title">${isLogin ? t('welcome_back') : t('get_started')}</div>
    <div class="auth-sub">${isLogin ? t('sign_in_sub') : t('sign_up_sub')}</div>
    <div id="auth-msg"></div>

    <button class="google-btn" id="google-btn" type="button">
      <svg width="17" height="17" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      ${t('continue_google')}
    </button>

    <div class="divider">${t('or_use_email')}</div>

    ${!isLogin ? `
    <div class="field">
      <label class="lbl">${t('full_name')}</label>
      <input class="inp" id="a-name" type="text" placeholder="Arjun Sharma" autocomplete="name"/>
    </div>` : ''}

    <div class="field">
      <label class="lbl">${t('email')}</label>
      <input class="inp" id="a-email" type="email" placeholder="you@example.com" autocomplete="email"/>
    </div>

    <div class="field">
      <label class="lbl" style="display:flex;justify-content:space-between;align-items:center">
        <span>${t('password')}</span>
        ${isLogin ? `<span class="auth-link" id="forgot-link" style="font-size:10.5px">${t('forgot_password')}</span>` : ''}
      </label>
      <input class="inp" id="a-pw" type="password" placeholder="••••••••"
        autocomplete="${isLogin ? 'current-password' : 'new-password'}"/>
    </div>
    
    ${!isLogin ? `
    <div class="field" style="margin-top: 10px; margin-bottom: 20px;">
      <label class="toggle-wrap" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
        <input type="checkbox" id="a-vendor" style="width: 14px; height: 14px; cursor: pointer;" ${isVendor ? 'checked' : ''}/>
        <span style="font-size: 13px; font-weight: 500; color: var(--text-2);">${t('i_am_vendor')}</span>
      </label>
    </div>` : ''}

    <button class="btn btn-primary" id="a-submit" style="width:100%;margin-bottom:14px" type="button">
      ${isLogin ? t('sign_in') : t('create_account')}
    </button>

    <div style="text-align:center;font-size:12.5px;color:var(--text-2)">
      ${isLogin ? t('no_account') : t('have_account')}
      <span class="auth-link" id="auth-toggle">${isLogin ? t('create_one') : t('sign_in_link')}</span>
    </div>

    <div class="auth-footer-note">🔒 FIREBASE AUTH · END-TO-END ENCRYPTED · SECURE LOGIN</div>`;
}

// ── Bind Events ────────────────────────────────────────────
export function bindAuth(renderFn) {
  // Google sign-in
  const gBtn = document.getElementById('google-btn');
  if (gBtn) gBtn.onclick = async () => {
    gBtn.disabled = true;
    gBtn.innerHTML = `<div class="spin" style="border-top-color:var(--text)"></div> Connecting…`;
    clearMsg();
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await saveUserProfile(result.user, { role: 'user' }); // Default Google sign-ins are users
      const first = result.user.displayName?.split(' ')[0] || 'there';
      toast(`Welcome, ${first}! 👋`, 'success');
    } catch (e) {
      gBtn.disabled = false;
      gBtn.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>${t('continue_google')}`;
      showMsg(friendlyErr(e.code), 'error');
    }
  };

  // Email submit
  const subBtn = document.getElementById('a-submit');
  if (subBtn) subBtn.onclick = () => handleEmailAuth(renderFn);

  // Vendor toggle
  const vCheck = document.getElementById('a-vendor');
  if (vCheck) vCheck.onchange = (e) => { isVendor = e.target.checked; };

  // Enter key
  ['a-email','a-pw','a-name'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') handleEmailAuth(renderFn); });
  });

  // Toggle mode
  const toggle = document.getElementById('auth-toggle');
  if (toggle) toggle.onclick = () => {
    authMode = authMode === 'login' ? 'signup' : 'login';
    renderFn();
  };

  // Forgot
  const forgot = document.getElementById('forgot-link');
  if (forgot) forgot.onclick = () => { authForgot = true; renderFn(); };

  // Back to login
  const back = document.getElementById('back-login');
  if (back) back.onclick = () => { authForgot = false; renderFn(); };

  // Reset submit
  const resetBtn = document.getElementById('a-reset-btn');
  if (resetBtn) resetBtn.onclick = handleReset;
}

async function handleEmailAuth(renderFn) {
  const emailEl = document.getElementById('a-email');
  const pwEl    = document.getElementById('a-pw');
  const nameEl  = document.getElementById('a-name');
  const vendorEl= document.getElementById('a-vendor');
  const btn     = document.getElementById('a-submit');
  if (!emailEl || !pwEl || !btn) return;

  const email = emailEl.value.trim();
  const pw    = pwEl.value;
  const name  = nameEl?.value.trim() || '';
  const vendorRole = vendorEl?.checked || false;

  if (!email || !pw) { showMsg('Please fill in all fields.', 'error'); return; }
  if (pw.length < 6) { showMsg('Password must be at least 6 characters.', 'error'); return; }

  btn.disabled = true;
  btn.innerHTML = `<div class="spin" style="border-top-color:#050608"></div> ${authMode === 'login' ? 'Signing in…' : 'Creating account…'}`;
  clearMsg();

  try {
    if (authMode === 'login') {
      await signInWithEmailAndPassword(auth, email, pw);
    } else {
      const cred = await createUserWithEmailAndPassword(auth, email, pw);
      if (name) await updateProfile(cred.user, { displayName: name });
      await saveUserProfile(cred.user, { role: vendorRole ? 'vendor' : 'user' });
    }
  } catch (e) {
    btn.disabled = false;
    btn.innerHTML = authMode === 'login' ? t('sign_in') : t('create_account');
    showMsg(friendlyErr(e.code), 'error');
  }
}

async function handleReset() {
  const emailEl = document.getElementById('a-email');
  const btn     = document.getElementById('a-reset-btn');
  if (!emailEl?.value) { showMsg('Enter your email address first.', 'error'); return; }
  btn.disabled = true;
  btn.innerHTML = 'Sending…';
  try {
    await sendPasswordResetEmail(auth, emailEl.value.trim());
    showMsg('Reset email sent! Check your inbox.', 'ok');
    btn.innerHTML = 'Email Sent ✓';
  } catch (e) {
    showMsg(friendlyErr(e.code), 'error');
    btn.disabled = false;
    btn.innerHTML = 'Send Reset Link';
  }
}

function showMsg(msg, type) {
  const el = document.getElementById('auth-msg');
  if (!el) return;
  const cls = type === 'error' ? 'auth-err' : 'auth-ok';
  const icon = type === 'error'
    ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
    : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="20 6 9 17 4 12"/></svg>`;
  el.innerHTML = `<div class="${cls}">${icon} ${msg}</div>`;
}
function clearMsg() {
  const el = document.getElementById('auth-msg');
  if (el) el.innerHTML = '';
}

// ── Friendly error map ─────────────────────────────────────
function friendlyErr(code) {
  const m = {
    'auth/user-not-found':          'No account found with this email.',
    'auth/wrong-password':          'Incorrect password. Please try again.',
    'auth/invalid-credential':      'Email or password is incorrect.',
    'auth/email-already-in-use':    'An account with this email already exists.',
    'auth/weak-password':           'Password must be at least 6 characters.',
    'auth/invalid-email':           'Please enter a valid email address.',
    'auth/too-many-requests':       'Too many attempts. Try again in a few minutes.',
    'auth/popup-closed-by-user':    'Sign-in cancelled. Please try again.',
    'auth/popup-blocked':           'Pop-up was blocked. Allow pop-ups for this site.',
    'auth/network-request-failed':  'Network error. Check your internet connection.',
    'auth/internal-error':          'Firebase internal error.',
  };
  return m[code] || `Authentication error (${code})`;
}

export async function handleSignOut() {
  await signOut(auth);
}
