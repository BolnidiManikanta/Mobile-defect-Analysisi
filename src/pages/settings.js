import { ico } from '../utils/icons.js';
import { t, LANGUAGES, getLang, setLang } from '../utils/i18n.js';

export function renderSettings(S) {
  const u    = S.user;
  const name = u?.displayName || '';
  const email= u?.email || '';
  const prof = S.userProfile || {};
  const lang = getLang();
  const isVendor = prof.role === 'vendor';

  const toggles = [
    { id:'t-push',     label:t('push_notif'),   sub:t('push_notif_sub'),   def:true  },
    { id:'t-email',    label:t('email_alerts'),  sub:t('email_alerts_sub'), def:true  },
    { id:'t-whatsapp', label:t('whatsapp'),       sub:t('whatsapp_sub'),     def:false },
    { id:'t-autosave', label:t('auto_save'),      sub:t('auto_save_sub'),    def:true  },
  ];

  return `<div class="page fade-up" style="max-width:680px">
    <div class="ph">
      <div class="ph-title">${t('settings')}</div>
      <div class="ph-sub">${t('settings_sub')}</div>
    </div>

    <!-- Profile Card -->
    <div class="card" style="margin-bottom:12px">
      <div class="card-title">${t('profile')}</div>
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
        <div class="u-avatar" style="width:54px;height:54px;font-size:20px;font-weight:700;border-radius:50%;flex-shrink:0">
          ${u?.photoURL
            ? `<img src="${u.photoURL}" referrerpolicy="no-referrer" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`
            : (name||email||'U')[0].toUpperCase()}
        </div>
        <div>
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px">${name||'No display name'}</div>
          <div style="font-size:11.5px;color:var(--text-3);font-family:'JetBrains Mono',monospace;margin-top:2px">${email}</div>
          <div style="margin-top:6px;display:flex;gap:5px;flex-wrap:wrap">
            <span class="badge b-cyan">${isVendor ? 'VENDOR' : 'FREE PLAN'}</span>
            <span class="badge" style="background:var(--ink-3);color:var(--text-3)">${S.scans.length} SCANS</span>
            ${prof.isApproved ? `<span class="badge" style="background:rgba(57,211,83,.15);color:var(--green)">APPROVED VENDOR</span>` : ''}
          </div>
        </div>
      </div>
      <div class="field">
        <label class="lbl">${t('display_name')}</label>
        <input class="inp" id="set-name" value="${name}" placeholder="Enter your display name"/>
      </div>
      <div class="field">
        <label class="lbl">${t('email')}</label>
        <input class="inp" value="${email}" disabled style="opacity:.5"/>
      </div>
      <div class="field" style="margin-bottom:0">
        <label class="lbl">${t('location')}</label>
        <input class="inp" id="set-location" value="${prof.location||'Sivakasi, Tamil Nadu'}" placeholder="Your city, state"/>
      </div>
      <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" id="save-profile">${ico('check',11,'#050608')} ${t('save_changes')}</button>
        <button class="btn btn-ghost btn-sm" id="change-pw">${ico('lock',11)} ${t('reset_password')}</button>
        <button class="btn btn-ghost btn-sm" id="signout-btn">${ico('logout',11)} ${t('sign_out')}</button>
      </div>
    </div>

    <!-- Language Switcher -->
    <div class="card" style="margin-bottom:12px">
      <div class="card-title">${t('language')}</div>
      <div style="font-size:12px;color:var(--text-3);margin-bottom:12px">${t('language_sub')}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${LANGUAGES.map(l => `
          <button class="lang-btn ${lang===l.code?'active':''}" data-lang="${l.code}">
            <span style="font-size:18px">${l.flag}</span>
            <span>${l.label}</span>
          </button>`).join('')}
      </div>
    </div>

    <!-- Notifications -->
    <div class="card" style="margin-bottom:12px">
      <div class="card-title">${t('notifications')}</div>
      ${toggles.map(tog => `
        <div class="toggle-wrap">
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600">${tog.label}</div>
            <div style="font-size:11.5px;color:var(--text-3);margin-top:2px">${tog.sub}</div>
          </div>
          <label class="toggle">
            <input type="checkbox" id="${tog.id}" ${tog.def?'checked':''}/>
            <div class="toggle-track"></div>
            <div class="toggle-thumb"></div>
          </label>
        </div>`).join('')}
    </div>

    <!-- Vendor Registration -->
    <div class="card" style="margin-bottom:12px">
      <div class="card-title">${t('vendor_mode')}</div>
      <div style="font-size:12px;color:var(--text-3);margin-bottom:14px;line-height:1.65">${t('vendor_mode_sub')}</div>
      ${isVendor
        ? `<div style="display:flex;align-items:center;gap:8px;padding:10px;background:rgba(57,211,83,.08);border-radius:8px;border:1px solid rgba(57,211,83,.2)">
            <div style="width:8px;height:8px;border-radius:50%;background:var(--green)"></div>
            <div style="font-size:12px;color:var(--green)">You are registered as a vendor</div>
            <button class="btn btn-ghost btn-sm" data-page="vendor" style="margin-left:auto">Open Dashboard</button>
           </div>`
        : `<div id="vendor-form" style="display:none">
            <div class="field">
              <label class="lbl">${t('vendor_name')}</label>
              <input class="inp" id="vnd-reg-name" placeholder="Your repair shop name"/>
            </div>
            <div class="field">
              <label class="lbl">${t('vendor_phone')}</label>
              <input class="inp" id="vnd-reg-phone" type="tel" placeholder="+91 98765 43210"/>
            </div>
            <div class="field">
              <label class="lbl">${t('vendor_city')}</label>
              <input class="inp" id="vnd-reg-city" placeholder="Sivakasi, Tamil Nadu"/>
            </div>
            <div class="field" style="margin-bottom:0">
              <label class="lbl">${t('vendor_services')}</label>
              <input class="inp" id="vnd-reg-services" placeholder="Screen, Battery, Water Damage…"/>
            </div>
            <button class="btn btn-primary btn-sm" id="save-vendor-btn" style="margin-top:12px;width:100%">
              ${ico('check',11,'#050608')} ${t('save_vendor')}
            </button>
          </div>
          <button class="btn btn-ghost btn-sm" id="toggle-vendor-form" style="width:100%">
            ${ico('zap',11)} ${t('become_vendor')}
          </button>`}
    </div>

    <!-- Danger Zone -->
    <div class="card" style="border-color:rgba(255,61,107,.2)">
      <div class="card-title" style="color:var(--rose)">${t('danger_zone')}</div>
      <div style="font-size:12px;color:var(--text-3);margin-bottom:14px;line-height:1.65">${t('danger_note')}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-danger btn-sm" id="delete-scans">${ico('x',11)} ${t('delete_scans')}</button>
        <button class="btn btn-danger btn-sm" id="signout-btn-2">${ico('logout',11)} ${t('sign_out_all')}</button>
      </div>
    </div>
  </div>`;
}
