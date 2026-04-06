import { ico } from '../utils/icons.js';
import { t } from '../utils/i18n.js';
import { MOCK_SHOPS } from '../utils/data.js';

export function renderShops(S = {}) {
  const shops = S.vendors?.length ? S.vendors : MOCK_SHOPS;

  return `<div class="page fade-up">
    <div class="ph" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px">
      <div>
        <div class="ph-title">${t('repair_shops')}</div>
        <div class="ph-sub">${t('shops_sub')} · Sivakasi, Tamil Nadu</div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" id="use-location-btn">${ico('pin',11)} Use My Location</button>
        <input class="search-inp" id="shop-search" placeholder="Search shops…" style="width:160px"/>
      </div>
    </div>

    <!-- Map placeholder (Leaflet will be injected here) -->
    <div class="map-placeholder" id="shops-map" style="margin-bottom:14px;height:220px;position:relative">
      <div class="map-grid"></div>
      <div style="text-align:center;z-index:1">
        <div style="font-size:11px;color:var(--text-3);font-family:'JetBrains Mono',monospace;margin-bottom:8px;letter-spacing:.06em">
          MAP VIEW · SIVAKASI 626123
        </div>
        ${ico('pin',20,'var(--cyan)')}
        <div style="font-size:10.5px;color:var(--text-3);margin-top:6px">${shops.length} ${t('shops_found')}</div>
      </div>
    </div>

    <!-- Filter bar -->
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
      ${['All','Screen','Battery','Water Damage','Apple','Samsung'].map((f,i) => `
        <div class="filter-chip ${i===0?'active':''}" data-shop-filter="${f}">${f}</div>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px" id="shops-grid">
      ${shops.map(sh => renderShopCard(sh)).join('')}
    </div>

    <!-- Booking modal triggered from shop cards -->
    <div id="book-modal" class="modal-overlay" style="display:none">
      <div class="modal-box">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:16px">${t('book_repair_title')}</div>
          <button class="btn btn-ghost btn-sm" id="close-book-modal">${ico('x',12)}</button>
        </div>
        <div id="book-modal-content"></div>
      </div>
    </div>
  </div>`;
}

export function renderShopCard(sh) {
  return `<div class="shop-card" data-shop-id="${sh.id}">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px">
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
          <div style="font-family:'Syne',sans-serif;font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${sh.name}</div>
          ${sh.verified ? `<span title="Verified" style="color:var(--cyan);font-size:13px">✓</span>` : ''}
        </div>
        <div style="font-size:11px;color:var(--text-3);line-height:1.5">${sh.address}</div>
      </div>
      <span class="open-pill ${sh.open?'op-open':'op-closed'}" style="flex-shrink:0">
        ● ${sh.open?t('open'):t('closed')}
      </span>
    </div>

    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:3px">
        <span class="star">★</span>
        <span style="font-size:12.5px;font-weight:700">${sh.rating}</span>
        <span style="font-size:11px;color:var(--text-3)">(${sh.reviews})</span>
      </div>
      <span style="color:var(--rim-3)">·</span>
      <span style="font-size:11px;color:var(--cyan);font-family:'JetBrains Mono',monospace">${sh.distance}</span>
      <span style="color:var(--rim-3)">·</span>
      <span style="font-size:11px;color:var(--text-2);font-family:'JetBrains Mono',monospace">${sh.price}</span>
      <span style="color:var(--rim-3)">·</span>
      <span style="font-size:11px;color:var(--text-2);font-family:'JetBrains Mono',monospace">${sh.time}</span>
    </div>

    <div style="margin-bottom:12px;display:flex;flex-wrap:wrap;gap:3px">
      ${sh.services.map(sv => `<span class="shop-tag">${sv}</span>`).join('')}
    </div>

    ${sh.priceList ? `
    <div style="margin-bottom:10px;padding:8px;background:var(--ink-3);border-radius:8px">
      <div style="font-size:9.5px;font-family:'JetBrains Mono',monospace;color:var(--text-3);margin-bottom:5px">TYPICAL PRICES</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">
        ${Object.entries(sh.priceList).slice(0,3).map(([k,v]) => `
          <span style="font-size:10px;padding:2px 6px;background:var(--ink-2);border-radius:4px;color:var(--text-2);font-family:'JetBrains Mono',monospace">
            ${k.replace('_',' ')}: ₹${v.toLocaleString('en-IN')}
          </span>`).join('')}
      </div>
    </div>` : ''}

    <div style="display:flex;gap:7px">
      <button class="btn btn-primary btn-sm" style="flex:1" onclick="location.href='tel:${sh.phone}'">
        ${ico('phone',11,'#050608')} ${t('call_now')}
      </button>
      <button class="btn btn-ghost btn-sm book-vendor-btn" style="flex:1" data-shop='${JSON.stringify({id:sh.id,name:sh.name,phone:sh.phone})}'>
        ${ico('check',11)} ${t('book_this_vendor')}
      </button>
      <button class="btn btn-ghost btn-sm" style="padding:6px 8px" onclick="window.open('https://maps.google.com/?q=${encodeURIComponent(sh.address)}','_blank')" title="${t('directions')}">
        ${ico('map',11)}
      </button>
    </div>
  </div>`;
}
