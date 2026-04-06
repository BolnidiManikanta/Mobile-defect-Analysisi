import { ico } from '../utils/icons.js';
import { t } from '../utils/i18n.js';
import { MOCK_SCANS } from '../utils/data.js';
import { generatePDFReport } from '../utils/report-generator.js';

export function renderHistory(S, histFilter = 'all', histSearch = '') {
  const scans    = S.scans.length ? S.scans : MOCK_SCANS;
  let   filtered = [...scans];

  if (histFilter !== 'all') {
    if (['low','medium','high','critical'].includes(histFilter)) {
      filtered = filtered.filter(s => s.overall_severity === histFilter);
    } else if (['screen_crack','display_damage','battery_swelling','water_damage','frame_damage','camera_crack','scratches'].includes(histFilter)) {
      filtered = filtered.filter(s => s.damages?.some(d => d.type === histFilter));
    } else {
      filtered = filtered.filter(s => s.repair_status === histFilter);
    }
  }
  if (histSearch) {
    const q = histSearch.toLowerCase();
    filtered = filtered.filter(s =>
      `${s.brand} ${s.model}`.toLowerCase().includes(q) ||
      s.damages?.some(d => d.label.toLowerCase().includes(q))
    );
  }

  const filters = [
    { key:'all',       label:t('filter_all') },
    { key:'screen_crack', label:'Screen' },
    { key:'battery_swelling', label:'Battery' },
    { key:'low',       label:t('filter_low') },
    { key:'medium',    label:t('filter_medium') },
    { key:'high',      label:t('filter_high') },
    { key:'critical',  label:t('filter_critical') },
    { key:'pending',   label:t('filter_pending') },
    { key:'repaired',  label:t('filter_repaired') },
  ];

  return `<div class="page fade-up">
    <div class="ph" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px">
      <div>
        <div class="ph-title">${t('scan_history')}</div>
        <div class="ph-sub">${scans.length} ${t('total')} · ${filtered.length} ${t('shown')} · sorted newest first</div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" id="export-btn">${ico('dl',12)} CSV</button>
        <button class="btn btn-primary btn-sm" id="export-pdf-all">${ico('dl',12, '#050608')} PDF Summary</button>
      </div>
    </div>

    <div class="filter-bar">
      <input class="search-inp" id="hist-search" placeholder="${t('search_placeholder')}" value="${histSearch}"/>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${filters.map(f => `
          <div class="filter-chip ${histFilter===f.key?'active':''}" data-filter="${f.key}">${f.label}</div>`).join('')}
      </div>
    </div>

    ${filtered.length === 0
      ? `<div class="card"><div class="empty">
          <div class="empty-ico">${ico('search',20,'var(--text-3)')}</div>
          <div class="empty-title">${t('no_scans_found')}</div>
          <div class="empty-sub">${t('adjust_filters')}</div>
        </div></div>`
      : `<div class="card" style="padding:0;overflow:hidden">
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;font-size:12.5px">
              <thead>
                <tr style="border-bottom:1px solid var(--rim)">
                  ${['','Device','Date','Severity','Status','Est. Cost','Issues',t('actions')].map(h =>
                    `<th style="padding:10px 14px;text-align:left;font-size:9.5px;color:var(--text-3);font-weight:700;text-transform:uppercase;letter-spacing:.09em;font-family:'JetBrains Mono',monospace;white-space:nowrap">${h}</th>`
                  ).join('')}
                </tr>
              </thead>
              <tbody>
                ${filtered.map((s,idx) => `
                  <tr class="hist-row" style="border-bottom:1px solid var(--rim)">
                    <td style="padding:10px 8px 10px 14px;width:44px">
                      ${s.image_url
                        ? `<img src="${s.image_url}" alt="scan" style="width:38px;height:38px;object-fit:cover;border-radius:8px;border:1px solid var(--rim)"/>`
                        : `<div style="width:38px;height:38px;border-radius:8px;background:var(--ink-3);display:flex;align-items:center;justify-content:center">${ico('phone',14,'var(--text-3)')}</div>`}
                    </td>
                    <td style="padding:10px 14px;font-weight:600;white-space:nowrap">
                      ${s.brand} ${s.model}
                      ${s.damages?.[0] ? `<div style="font-size:10px;color:var(--text-3);margin-top:2px;font-family:'JetBrains Mono',monospace">${s.damages[0].label}</div>` : ''}
                    </td>
                    <td style="padding:10px 14px;color:var(--text-2);font-family:'JetBrains Mono',monospace;font-size:11px;white-space:nowrap">
                      ${new Date(s.created_at||Date.now()).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                      <div style="font-size:10px;color:var(--text-3)">${new Date(s.created_at||Date.now()).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div>
                    </td>
                    <td style="padding:10px 14px"><span class="badge b-${s.overall_severity}">${s.overall_severity}</span></td>
                    <td style="padding:10px 14px"><span class="badge b-${s.repair_status}">${s.repair_status}</span></td>
                    <td style="padding:10px 14px">
                      <div style="display:flex;flex-direction:column;gap:1px">
                        <span class="cost-tag" style="font-size:11px">₹${s.estimated_repair_cost?.min?.toLocaleString('en-IN')||'—'}</span>
                        ${s.estimated_repair_cost?.max ? `<span style="font-size:9.5px;color:var(--text-3);font-family:'JetBrains Mono',monospace">max ₹${s.estimated_repair_cost.max.toLocaleString('en-IN')}</span>` : ''}
                      </div>
                    </td>
                    <td style="padding:10px 14px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-2)">${s.damages?.length||0}</td>
                    <td style="padding:10px 14px">
                      <div style="display:flex;gap:5px">
                        <button class="btn btn-ghost btn-xs view-report-btn" data-scan-id="${s.id}" data-idx="${idx}" title="${t('view_report')}">${ico('eye',11)} ${t('view_report')}</button>
                      </div>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>`}

    <!-- Full Report Modal -->
    <div id="hist-modal" class="modal-overlay" style="display:none">
      <div class="modal-box">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:16px">Full Damage Report</div>
          <button class="btn btn-ghost btn-sm" id="close-modal">${ico('x',12)} ${t('close')}</button>
        </div>
        <div id="modal-content"></div>
      </div>
    </div>
  </div>`;
}

export function renderFullReport(scan) {
  if (!scan) return '<div class="empty"><div class="empty-title">Scan not found</div></div>';
  const sevColor = { low:'var(--green)', medium:'var(--amber)', high:'var(--rose)', critical:'var(--violet)' }[scan.overall_severity] || 'var(--text-2)';
  return `
    <div style="margin-bottom:14px">
      <div style="font-size:16px;font-weight:700;margin-bottom:6px">${scan.brand} ${scan.model}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
        <span class="badge b-${scan.overall_severity}">${scan.overall_severity} severity</span>
        <span class="badge b-${scan.repair_status}">${scan.repair_status}</span>
        <span style="font-size:10px;color:var(--text-3);font-family:'JetBrains Mono',monospace;align-self:center">
          ${new Date(scan.created_at||Date.now()).toLocaleString('en-IN')}
        </span>
      </div>
      <div style="font-size:11px;color:var(--text-3);font-family:'JetBrains Mono',monospace">
        AI Confidence: <span style="color:var(--cyan)">${Math.round((scan.assessment_confidence||0)*100)}%</span>
      </div>
    </div>

    ${scan.image_url && !scan.repairImage ? `<img src="${scan.image_url}" style="width:100%;border-radius:10px;max-height:160px;object-fit:cover;margin-bottom:14px;border:1px solid var(--rim)" alt="Scan"/>` : ''}

    <div style="margin-bottom:14px">
      <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Detected Issues</div>
      ${(scan.damages||[]).map(dmg => `
        ${scan.repairImage ? `
    <div class="card" style="margin-bottom:12px;padding:12px">
      <div class="card-title">Repair Verification</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div>
          <div style="font-size:10px;color:var(--text-3);margin-bottom:4px;text-align:center">BEFORE</div>
          <img src="${scan.image_url}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;border:1px solid var(--rim)"/>
        </div>
        <div>
          <div style="font-size:10px;color:var(--cyan);margin-bottom:4px;text-align:center">AFTER REPAIR</div>
          <img src="${scan.repairImage}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;border:1px solid var(--cyan)"/>
        </div>
      </div>
    </div>` : ''}

    <div class="card" style="margin-bottom:12px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
            <div style="font-size:13px;font-weight:700">${dmg.label} ${dmg.isPrimary?'<span class="badge" style="font-size:9px;background:rgba(0,229,255,.15);color:var(--cyan)">PRIMARY</span>':''}</div>
            <span class="badge b-${dmg.severity}">${dmg.severity}</span>
          </div>
          <div style="font-size:12px;color:var(--text-2);line-height:1.6;margin-bottom:4px">${dmg.description}</div>
          <div style="font-size:10px;color:var(--text-3);font-family:'JetBrains Mono',monospace">
            📍 ${dmg.location} · Confidence: ${Math.round(dmg.confidence*100)}%
            ${dmg.affects_function ? ' · <span style="color:var(--rose)">Affects Function</span>' : ''}
          </div>
        </div>`).join('')}
    </div>

    ${scan.estimated_repair_cost ? `
    <div style="margin-bottom:14px">
      <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Cost Estimate</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        <div style="text-align:center;padding:10px;background:var(--ink-2);border-radius:10px">
          <div style="font-size:9.5px;color:var(--text-3);margin-bottom:3px">MIN</div>
          <div style="font-size:16px;font-weight:800;color:var(--green)">₹${(scan.estimated_repair_cost.min||0).toLocaleString('en-IN')}</div>
        </div>
        <div style="text-align:center;padding:10px;background:var(--ink-2);border-radius:10px">
          <div style="font-size:9.5px;color:var(--text-3);margin-bottom:3px">AVG</div>
          <div style="font-size:16px;font-weight:800;color:var(--cyan)">₹${(scan.estimated_repair_cost.avg||0).toLocaleString('en-IN')}</div>
        </div>
        <div style="text-align:center;padding:10px;background:var(--ink-2);border-radius:10px">
          <div style="font-size:9.5px;color:var(--text-3);margin-bottom:3px">MAX</div>
          <div style="font-size:16px;font-weight:800;color:var(--rose)">₹${(scan.estimated_repair_cost.max||0).toLocaleString('en-IN')}</div>
        </div>
      </div>
    </div>` : ''}

    ${scan.aiTip ? `
    <div style="padding:12px;background:rgba(57,211,83,.07);border:1px solid rgba(57,211,83,.2);border-radius:10px;margin-bottom:12px">
      <div style="font-size:11px;font-weight:700;color:var(--green);margin-bottom:4px">AI Suggestion</div>
      <div style="font-size:12px;color:var(--text-2);line-height:1.65">${scan.aiTip}</div>
    </div>` : ''}

    <div style="padding:12px;background:rgba(255,184,0,.06);border:1px solid rgba(255,184,0,.2);border-radius:10px;font-size:11px;color:var(--amber);margin-bottom:12px">
      ${t('disclaimer')}
    </div>
    <button class="btn btn-primary export-pdf-single" style="width:100%" data-scan-id="${scan.id}">
      ${ico('dl',12,'#050608')} Download PDF Report
    </button>`;
}
