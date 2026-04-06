import { ico } from '../utils/icons.js';
import { t, LANGUAGES, getLang } from '../utils/i18n.js';

export function renderShell(S, pageHtml) {
  const u = S.user;
  const prof = S.userProfile || {};
  const isVendor = prof.role === 'vendor';
  
  const avatarHtml = u.photoURL
    ? `<img src="${u.photoURL}" alt="${u.displayName}" referrerpolicy="no-referrer"/>`
    : (u.displayName || u.email || 'U')[0].toUpperCase();
  const name = u.displayName || u.email?.split('@')[0] || 'User';
  const scanCount = S.scans.length;
  const currentLang = getLang();
  const activeLang = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  const NAV = [
    { page:'dashboard', icon:'home',    label: t('nav_dashboard') },
    { page:'detect',    icon:'zap',     label: t('nav_detect'),  badge:'new' },
    { page:'live',      icon:'video',   label: t('nav_live') },
    { page:'history',   icon:'clock',   label: t('nav_history'),  badge: scanCount || '' },
    { page:'shops',     icon:'map',     label: t('nav_shops') },
    { page:'booking',   icon:'check',   label: t('nav_booking') },
  ];

  // Admin access
  if (prof.role === 'admin') {
    NAV.push({ page:'admin', icon:'shield', label: 'Admin', badge:'root' });
  }

  // Vendor specific navigation
  if (isVendor) {
    NAV.push({ page:'vendor', icon:'rf', label: t('nav_vendor'), badge: S.vendorBookings?.filter(b => b.status === 'requested').length || '' });
  }

  const NAV2 = [
    { page:'payment',  icon:'credit',   label: t('nav_payment'),   badge:'pro' },
    { page:'help',     icon:'alert',    label: t('help_support') },
    { page:'settings', icon:'settings', label: t('nav_settings') },
  ];

  const TITLES = {
    dashboard: t('nav_dashboard'), 
    detect: t('nav_detect'), 
    live: t('nav_live'),
    history: t('nav_history'), 
    shops: t('nav_shops'), 
    booking: t('nav_booking'),
    vendor: t('nav_vendor'),
    admin: 'Admin Console',
    payment: t('nav_payment'), 
    help: t('help_support'),
    settings: t('nav_settings')
  };

  return `
  <div class="shell">
    <aside class="sidebar" id="sidebar">
      <div class="s-logo">
        <div class="logo-icon">${ico('shield',16,'white')}</div>
        <div>
          <div class="logo-name">SmartSep AI</div>
          <div class="logo-tag">damage intelligence</div>
        </div>
      </div>

      <div class="s-section">Main</div>
      <nav>
        ${NAV.map(it => navItem(it, S.page)).join('')}
      </nav>

      <div class="s-section" style="margin-top:8px">Account</div>
      <nav>
        ${NAV2.map(it => navItem(it, S.page)).join('')}
      </nav>

      <div class="s-footer">
        <div class="u-card" id="u-card">
          <div class="u-avatar">${avatarHtml}</div>
          <div style="flex:1;min-width:0">
            <div class="u-name">${name}</div>
            <div class="u-plan">${isVendor ? 'VENDOR' : 'FREE'} · ${scanCount} scans</div>
          </div>
          <span style="opacity:.35;flex-shrink:0">${ico('logout',13)}</span>
        </div>
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="icon-btn menu-toggle" id="menu-toggle">${ico('menu', 18)}</button>
          <div class="topbar-title">${TITLES[S.page] || 'SmartSep AI'}</div>
        </div>
        <div class="topbar-right">
          <!-- Language Selector -->
          <div class="lang-selector-wrap">
            <button class="lang-active-btn" id="lang-menu-btn">
              <span>${activeLang.flag}</span>
              <span class="lang-label">${activeLang.label}</span>
              ${ico('ar', 10)}
            </button>
            <div class="lang-dropdown" id="lang-dropdown">
              ${LANGUAGES.map(l => `
                <div class="lang-opt ${l.code === currentLang ? 'active' : ''}" data-lang="${l.code}">
                  <span>${l.flag}</span> <span>${l.label}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="status-pill"><div class="live-dot"></div>Live</div>
          <div class="icon-btn" id="notif-btn" title="Notifications">
            ${ico('bell',14)}
            ${S.notifications?.filter(n => !n.read).length ? '<div class="notif-dot" id="notif-indicator"></div>' : ''}
          </div>
          <div class="icon-btn" id="refresh-btn" title="Refresh">${ico('rf',14)}</div>
        </div>
      </header>

      ${S.notify ? renderNotifyPanel(S.notifications || []) : ''}

      <div class="scroll-area">
        ${pageHtml}
      </div>
    </div>
    
    <!-- Mobile Sidebar Backdrop -->
    <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
  </div>`;
}

function navItem(it, currentPage) {
  const active = currentPage === it.page;
  let badge = '';
  if (it.badge === 'new') badge = `<span class="nav-badge nb-new">NEW</span>`;
  else if (it.badge === 'pro') badge = `<span class="nav-badge nb-pro">PRO</span>`;
  else if (it.badge) badge = `<span class="nav-badge nb-num">${it.badge}</span>`;
  return `
    <div class="nav-item ${active ? 'active' : ''}" data-page="${it.page}">
      <span class="nav-ico">${ico(it.icon, 15, active ? 'var(--cyan)' : 'currentColor')}</span>
      <span>${it.label}</span>
      ${badge}
    </div>`;
}

function renderNotifyPanel(notifications) {
  const items = notifications.length ? notifications : [
    { color:'var(--cyan)',  title: 'Welcome', body: 'AI model v2.4 deployed — improved accuracy', createdAt: new Date() },
  ];
  
  return `
  <div class="notify-panel" id="notify-panel">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--rim)">
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px">Notifications</div>
      <span style="font-size:9.5px;color:var(--cyan);cursor:pointer;font-family:'JetBrains Mono',monospace" id="mark-read">MARK ALL READ</span>
    </div>
    <div class="notify-list">
      ${items.map(it => `
        <div class="notify-item ${it.read ? 'read' : ''}">
          <div class="notify-dot" style="background:${it.color || 'var(--cyan)'};box-shadow:0 0 6px ${it.color || 'var(--cyan)'}"></div>
          <div>
            <div style="font-size:12.5px;font-weight:500;margin-bottom:2px">${it.title || it.text}</div>
            <div style="font-size:11.5px;color:var(--text-2);margin-bottom:2px">${it.body || ''}</div>
            <div style="font-size:10.5px;color:var(--text-3);font-family:'JetBrains Mono',monospace">${timeSince(it.createdAt)}</div>
          </div>
        </div>`).join('')}
    </div>
  </div>`;
}

function timeSince(date) {
  if (!date) return 'just now';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "just now";
}
