import { ico } from '../utils/icons.js';
import { t } from '../utils/i18n.js';
import { DAMAGE_TYPES } from '../utils/data.js';
import { updateBookingWithRepairImage } from '../utils/firestore-helpers.js';

export function renderVendor(S) {
  const vendor   = S.vendorProfile || {};
  const bookings = S.vendorBookings || [];
  const pending  = bookings.filter(b => b.status === 'requested');
  const active   = bookings.filter(b => ['accepted','in_progress'].includes(b.status));
  const done     = bookings.filter(b => b.status === 'completed');
  const earnings = done.reduce((sum, b) => sum + (b.paidAmount || 0), 0);

  return `<div class="page fade-up">
    <div class="ph" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px">
      <div>
        <div class="ph-title">${t('vendor_dashboard')}</div>
        <div class="ph-sub">${vendor.name || t('vendor_sub')}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <div class="status-pill" style="background:${vendor.isApproved?'rgba(57,211,83,.12)':'rgba(255,184,0,.12)'}">
          <div class="live-dot" style="background:${vendor.isApproved?'var(--green)':'var(--amber)'}"></div>
          ${vendor.isApproved ? 'Approved' : 'Pending Approval'}
        </div>
      </div>
    </div>

    <!-- Vendor Stats -->
    <div class="stat-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:12px">
      ${[
        { label:'Pending',  val:pending.length, color:'var(--amber)',  icon:'bell'  },
        { label:'Active',   val:active.length,  color:'var(--cyan)',   icon:'zap'   },
        { label:t('jobs_done'),   val:done.length,    color:'var(--green)', icon:'check' },
        { label:t('total_earnings'), val:`₹${earnings.toLocaleString('en-IN')}`, color:'var(--lime)', icon:'trend' },
      ].map(s => `
        <div class="stat-card" style="padding:14px 16px">
          <div class="stat-lbl">${s.label}</div>
          <div class="stat-val" style="color:${s.color};font-size:22px">${s.val}</div>
          <div class="stat-bg-icon">${ico(s.icon,28,s.color)}</div>
        </div>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:12px;align-items:start">
      <!-- Inbound Requests -->
      <div>
        <div class="card" style="margin-bottom:12px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
            <div class="card-title" style="margin-bottom:0">${t('inbound_requests')} <span class="nav-badge nb-num" style="margin-left:6px">${pending.length}</span></div>
            <button class="btn btn-ghost btn-sm" id="refresh-vendor-btn">${ico('rf',11)} Refresh</button>
          </div>
          ${pending.length === 0
            ? `<div class="empty" style="padding:16px 0">
                <div class="empty-ico">${ico('check',18,'var(--text-3)')}</div>
                <div class="empty-title">${t('no_requests')}</div>
              </div>`
            : pending.map(bk => renderVendorBookingCard(bk, 'pending')).join('')}
        </div>

        <!-- Active Jobs -->
        ${active.length > 0 ? `
        <div class="card" style="margin-bottom:12px">
          <div class="card-title">Active Jobs (${active.length})</div>
          ${active.map(bk => renderVendorBookingCard(bk, 'active')).join('')}
        </div>` : ''}

        <!-- Completed Jobs -->
        ${done.length > 0 ? `
        <div class="card">
          <div class="card-title">Completed Jobs (${done.length})</div>
          ${done.slice(0,5).map(bk => renderVendorBookingCard(bk, 'done')).join('')}
        </div>` : ''}
      </div>

      <!-- Pricing & Profile -->
      <div>
        <!-- Shop Profile -->
        <div class="card" style="margin-bottom:12px">
          <div class="card-title">Shop Details</div>
          <div class="field">
            <label class="lbl">${t('vendor_name')}</label>
            <input class="inp" id="vnd-name" value="${vendor.name||''}" placeholder="Your Shop Name"/>
          </div>
          <div class="field">
            <label class="lbl">${t('vendor_phone')}</label>
            <input class="inp" id="vnd-phone" value="${vendor.phone||''}" placeholder="+91 98765 43210"/>
          </div>
          <div class="field">
            <label class="lbl">Address</label>
            <input class="inp" id="vnd-address" value="${vendor.address||''}" placeholder="Full shop address"/>
          </div>
          <div class="field" style="margin-bottom:0">
            <label class="lbl">Availability</label>
            <select class="inp sel" id="vnd-avail">
              <option value="open">Open Now</option>
              <option value="closed">Closed</option>
              <option value="by_appointment">By Appointment Only</option>
            </select>
          </div>
          <button class="btn btn-primary btn-sm" id="save-vendor-profile-btn" style="margin-top:12px">
            ${ico('check',11,'#050608')} Save Profile
          </button>
        </div>

        <!-- Pricing Editor -->
        <div class="card">
          <div class="card-title">${t('your_pricing')}</div>
          <div style="font-size:11px;color:var(--text-3);margin-bottom:12px;line-height:1.5">
            Set your repair prices per damage type. Users will see these when browsing shops.
          </div>
          ${Object.entries(DAMAGE_TYPES).map(([key, val]) => `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <span style="font-size:16px;width:20px">${val.icon}</span>
              <div style="flex:1;font-size:12px;color:var(--text-2)">${val.label}</div>
              <div style="display:flex;align-items:center;gap:4px">
                <span style="font-size:12px;color:var(--text-3)">₹</span>
                <input class="inp vnd-price" data-damage="${key}"
                  style="width:80px;padding:5px 8px;font-size:12px;text-align:right"
                  type="number" value="${(vendor.priceList||{})[key]||''}"
                  placeholder="0"/>
              </div>
            </div>`).join('')}
          <button class="btn btn-ghost btn-sm" id="save-pricing-btn" style="width:100%;margin-top:8px">
            ${ico('check',11)} ${t('save_pricing')}
          </button>
        </div>
      </div>
    </div>
  </div>`;
}

function renderVendorBookingCard(bk, mode) {
  const sevColor = { requested:'var(--amber)', accepted:'var(--cyan)', in_progress:'var(--violet)', completed:'var(--green)' }[bk.status] || 'var(--text-2)';
  return `<div class="booking-card" style="margin-bottom:10px;background:var(--ink-3);border-radius:12px;padding:12px">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;gap:8px">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:700">${bk.deviceBrand||'Unknown'} ${bk.deviceModel||''}</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:2px;font-family:'JetBrains Mono',monospace">
          ${bk.damageType ? bk.damageType.replace('_',' ') : ''} · ${bk.slotDate||''} ${bk.slotTime||''}
        </div>
        ${bk.notes ? `<div style="font-size:11px;color:var(--text-3);margin-top:3px;font-style:italic">"${bk.notes}"</div>` : ''}
      </div>
      <span class="badge" style="flex-shrink:0;background:${sevColor}22;color:${sevColor}">${bk.status.replace('_',' ')}</span>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      ${mode === 'pending' ? `
        <button class="btn btn-lime btn-sm vnd-accept-btn" data-id="${bk.id}" style="font-size:11px">
          ${ico('check',10,'#050608')} ${t('accept')}
        </button>
        <button class="btn btn-danger btn-sm vnd-reject-btn" data-id="${bk.id}" style="font-size:11px">
          ${ico('x',10)} ${t('reject')}
        </button>` : ''}
      ${mode === 'active' ? `
        <button class="btn btn-ghost btn-sm vnd-progress-btn" data-id="${bk.id}" style="font-size:11px;${bk.status==='in_progress'?'display:none':''}">
          ${ico('zap',10)} ${t('mark_in_progress')}
        </button>
        <div style="display:flex;gap:6px;width:100%;margin-top:6px">
          <input type="file" class="after-photo-input" data-id="${bk.id}" style="display:none" accept="image/*"/>
          <button class="btn btn-ghost btn-xs vnd-after-btn" data-id="${bk.id}" style="flex:1">
            ${ico('img',10)} Upload After Photo
          </button>
          <button class="btn btn-primary btn-sm vnd-complete-btn" data-id="${bk.id}" style="flex:1">
            ${ico('check',10,'#050608')} Done & Notify
          </button>
        </div>` : ''}
      <button class="btn btn-ghost btn-sm chat-btn" data-booking-id="${bk.id}" style="font-size:11px">
        ${ico('chat',10)} ${t('chat_with_user')}
      </button>
    </div>
  </div>`;
}
