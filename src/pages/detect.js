import { ico } from '../utils/icons.js';
import { t } from '../utils/i18n.js';
import { BRANDS, MODELS, DAMAGE_TYPES } from '../utils/data.js';

export function renderDetect(detectSt) {
  const d = detectSt;
  return `<div class="page fade-up">
    <div class="ph">
      <div class="ph-title">${t('ai_detection')}</div>
      <div class="ph-sub">${t('ai_detection_sub')}</div>
    </div>

    <div class="detect-grid">
      <div>
        <!-- Device Selection -->
        <div class="card" style="margin-bottom:10px">
          <div class="step-row"><div class="step-num">1</div><div class="step-lbl">${t('select_device')}</div></div>
          <div class="field">
            <label class="lbl">${t('brand')}</label>
            <select class="inp sel" id="d-brand">
              <option value="">${t('select_brand')}</option>
              ${BRANDS.map(b => `<option value="${b}" ${d.brand===b?'selected':''}>${b}</option>`).join('')}
            </select>
          </div>
          ${d.brand ? `
          <div class="field" style="margin-bottom:0">
            <label class="lbl">${t('model')}</label>
            <select class="inp sel" id="d-model">
              <option value="">${t('select_model')}</option>
              ${(MODELS[d.brand]||[]).map(m => `<option value="${m}" ${d.model===m?'selected':''}>${m}</option>`).join('')}
            </select>
          </div>` : ''}
        </div>

          <!-- Front Image -->
          <div style="margin-bottom:10px">
            <label class="lbl" style="margin-bottom:6px;display:block">${t('upload_front')} <span style="color:var(--rose)">*</span></label>
            ${d.preview ? `
            <div style="position:relative">
              <img src="${d.preview}" style="width:100%;border-radius:10px;max-height:200px;object-fit:cover;border:1px solid var(--rim)" alt="Front"/>
              <div class="img-badge" style="position:absolute;top:8px;left:8px;background:rgba(5,6,8,.6);font-size:9px;padding:3px 6px;border-radius:5px;backdrop-filter:blur(4px)">FRONT</div>
              <button class="btn btn-ghost btn-sm" id="d-reset" style="position:absolute;top:8px;right:8px;backdrop-filter:blur(12px);height:24px;width:24px;padding:0">
                ${ico('x',11)}
              </button>
            </div>` : `
            <div class="dropzone" id="dropzone">
              <div class="dz-icon">${ico('camera',22,'var(--text-3)')}</div>
              <div style="font-size:13px;font-weight:600;margin-bottom:3px">${t('drop_front_image')}</div>
              <div style="font-size:10.5px;color:var(--text-3)">JPG, PNG · Max 5MB</div>
              <input type="file" id="file-input" accept="image/*" style="display:none"/>
            </div>`}
          </div>

          <!-- Back Image -->
          <div style="margin-bottom:10px">
            <label class="lbl" style="margin-bottom:6px;display:block">${t('upload_back')} <span style="color:var(--text-3)">(Optional)</span></label>
            ${d.previewBack ? `
            <div style="position:relative">
              <img src="${d.previewBack}" style="width:100%;border-radius:10px;max-height:140px;object-fit:cover;border:1px solid var(--rim)" alt="Back"/>
              <div class="img-badge" style="position:absolute;top:8px;left:8px;background:rgba(5,6,8,.6);font-size:9px;padding:3px 6px;border-radius:5px;backdrop-filter:blur(4px)">BACK</div>
              <button class="btn btn-ghost btn-sm" id="d-reset-back" style="position:absolute;top:8px;right:8px;backdrop-filter:blur(12px);height:24px;width:24px;padding:0">
                ${ico('x',11)}
              </button>
            </div>` : `
            <div class="dropzone dz-sm" id="dropzone-back" style="min-height:90px;padding:16px">
              <div class="dz-icon">${ico('camera',16,'var(--text-3)')}</div>
              <div style="font-size:12px;color:var(--text-3)">${t('drop_back_image')}</div>
              <input type="file" id="file-input-back" accept="image/*" style="display:none"/>
            </div>`}
          </div>

          <button class="btn btn-primary" id="analyze-btn" style="width:100%;margin-top:4px" ${!d.file && !d.fileBack ? 'disabled' : ''}>
            ${d.status==='analyzing'
              ? `<div class="spin" style="border-top-color:#050608;width:12px;height:12px"></div> ${t('analyzing')}`
              : `${ico('cpu',13,'#050608')} ${t('analyze_device')}`}
          </button>
        </div>

        <!-- AI Disclaimer -->
        <div class="card" style="background:rgba(255,184,0,.06);border-color:rgba(255,184,0,.2);padding:12px 14px">
          <div style="font-size:12px;color:var(--amber);line-height:1.65">${t('disclaimer')}</div>
        </div>
      </div>

      <div id="result-panel">${renderDetectResult(d)}</div>
    </div>

    ${renderReportModal(d)}
  </div>`;
}

export function renderDetectResult(d = {}) {
  if (d.status === 'idle' && !d.result) {
    return `<div class="card" style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:340px;text-align:center">
      <div class="qa-ico" style="width:56px;height:56px;border-radius:16px;margin-bottom:14px">${ico('shield',26,'var(--text-3)')}</div>
      <div style="font-weight:700;font-size:15px;margin-bottom:6px">${t('awaiting_analysis')}</div>
      <div style="font-size:12px;color:var(--text-3);max-width:220px;line-height:1.7">${t('awaiting_sub')}</div>
    </div>`;
  }

  if (d.status === 'analyzing') {
    return `<div class="card" style="text-align:center;padding:48px 20px">
      <div class="rings-wrap"><div class="ring r1"></div><div class="ring r2"></div><div class="ring r3"></div><div class="r-center"></div></div>
      <div style="font-family:'Syne',sans-serif;font-size:15px;font-weight:700;margin-bottom:6px">${t('analyzing')}</div>
      <div style="font-size:11.5px;color:var(--text-3);font-family:'JetBrains Mono',monospace;margin-bottom:16px">
        Running AI Model · Processing ${d.brand||'device'}
      </div>
      <div class="skeleton-line" style="width:70%;margin:6px auto"></div>
      <div class="skeleton-line" style="width:50%;margin:6px auto"></div>
      <div class="skeleton-line" style="width:60%;margin:6px auto"></div>
    </div>`;
  }

  const r = d.result;
  if (!r) return '';

  const sevColor = { low:'var(--green)', medium:'var(--amber)', high:'var(--rose)', critical:'var(--violet)', urgent:'var(--rose)' }[r.overall_severity] || 'var(--text-2)';
  const cost     = r.estimated_repair_cost;
  const primary  = (r.damages||[]).find(dmg => dmg.isPrimary) || r.damages?.[0];
  const secondary= (r.damages||[]).filter(dmg => !dmg.isPrimary);

  return `<div class="fade-up">
    <!-- Summary Card -->
    <div class="card" style="margin-bottom:10px;border-color:${sevColor}33">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
        <div style="flex:1;min-width:0">
          <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:15px;margin-bottom:6px">
            ${r.brand} ${r.model}
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:8px">
            <span class="badge b-${r.overall_severity}">${r.overall_severity} severity</span>
            <span class="badge b-${r.repair_status}">${r.repair_status}</span>
            ${r.model_used ? `<span class="badge" style="background:rgba(0,229,255,.12);color:var(--cyan)">${r.model_used}</span>` : ''}
          </div>
          <div style="font-size:11px;color:var(--text-3);font-family:'JetBrains Mono',monospace">
            ${t('confidence')}: <span style="color:var(--cyan)">${Math.round((r.assessment_confidence||0)*100)}%</span>
            · ${t('issues_detected')}: <span style="color:${sevColor}">${r.damages?.length||0}</span>
            ${r.inference_ms ? ` · ${r.inference_ms}ms` : ''}
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-family:'Syne',sans-serif;font-size:32px;font-weight:800;color:${r.damages?.length === 0 ? 'var(--green)' : sevColor};line-height:1">
            ${r.damages?.length || 0}
          </div>
          <div style="font-size:9.5px;color:var(--text-3);font-family:'JetBrains Mono',monospace">ISSUES</div>
        </div>
      </div>
      <div class="conf-bar" style="margin-top:10px">
        <div class="conf-fill" style="width:${Math.round((r.assessment_confidence||0)*100)}%"></div>
      </div>
    </div>

    <!-- No Damage Detected View -->
    ${r.damages?.length === 0 ? `
    <div class="card" style="text-align:center;padding:40px 20px;background:rgba(57,211,83,.05);border-color:rgba(57,211,83,.2)">
      <div class="qa-ico" style="width:64px;height:64px;border-radius:20px;margin:0 auto 16px;background:rgba(57,211,83,.1)">
        ${ico('check',32,'var(--green)')}
      </div>
      <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:20px;margin-bottom:8px;color:var(--green)">
        All Clear!
      </div>
      <div style="font-size:13px;color:var(--text-2);max-width:280px;margin:0 auto;line-height:1.6">
        Our AI system analyzed the device and found no significant surface damage or crack patterns.
      </div>
      <div style="margin-top:20px;padding:12px;background:var(--ink-2);border-radius:10px;display:inline-block;border:1px solid var(--rim)">
        <span style="font-size:11px;color:var(--text-3);font-family:'JetBrains Mono',monospace">VERIFICATION CONFIDENCE:</span>
        <span style="font-size:11px;color:var(--green);font-weight:700;margin-left:6px">${Math.round((r.assessment_confidence||0)*100)}%</span>
      </div>
    </div>` : ''}

    <!-- Bounding Box Canvas (if image present) -->
    ${d.preview ? `
    <div class="card" style="margin-bottom:10px;padding:10px">
      <div style="font-size:11px;color:var(--text-3);margin-bottom:8px;font-family:'JetBrains Mono',monospace">DAMAGE MAP</div>
      <div style="position:relative;display:inline-block;width:100%">
        <img id="result-img" src="${d.preview}" style="width:100%;border-radius:8px;display:block;max-height:220px;object-fit:contain" alt="Analyzed device"/>
        <canvas id="bbox-canvas" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"></canvas>
      </div>
    </div>` : ''}

    <!-- Primary Issue -->
    ${primary ? `
    <div class="card" style="margin-bottom:10px;border-left:3px solid ${sevColor}">
      <div style="font-size:10px;color:var(--text-3);font-family:'JetBrains Mono',monospace;margin-bottom:6px">${t('primary_issue')}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
        <div style="font-size:13.5px;font-weight:700">${primary.label}</div>
        <span class="badge b-${primary.severity}">${primary.severity}</span>
      </div>
      <div style="font-size:12px;color:var(--text-2);line-height:1.6;margin-bottom:6px">${primary.description}</div>
      <div style="font-size:10.5px;color:var(--text-3);font-family:'JetBrains Mono',monospace;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        ${ico('pin',10,'var(--text-3)')} ${primary.location}
        ${primary.affects_function ? `<span class="badge b-high" style="font-size:9px">${t('affects_function')}</span>` : ''}
      </div>
      <div class="conf-bar" style="margin-top:8px">
        <div class="conf-fill" style="width:${Math.round(primary.confidence*100)}%"></div>
      </div>
    </div>` : ''}

    <!-- Secondary Issues -->
    ${secondary.length > 0 ? `
    <div class="card" style="margin-bottom:10px">
      <div style="font-size:10px;color:var(--text-3);font-family:'JetBrains Mono',monospace;margin-bottom:10px">${t('secondary_issues')} (${secondary.length})</div>
      ${secondary.map(dmg => `
        <div class="dmg-item">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">
            <div style="font-size:13px;font-weight:600">${dmg.label}</div>
            <span class="badge b-${dmg.severity}">${dmg.severity}</span>
          </div>
          <div style="font-size:12px;color:var(--text-2);line-height:1.55;margin-bottom:4px">${dmg.description}</div>
          <div style="font-size:10.5px;color:var(--text-3);font-family:'JetBrains Mono',monospace">
            ${ico('pin',10,'var(--text-3)')} ${dmg.location}
          </div>
          <div class="conf-bar" style="margin-top:6px">
            <div class="conf-fill" style="width:${Math.round(dmg.confidence*100)}%"></div>
          </div>
        </div>`).join('')}
    </div>` : ''}

    <!-- Cost Estimation -->
    ${cost ? `
    <div class="card" style="margin-bottom:10px;background:rgba(0,229,255,.04);border-color:rgba(0,229,255,.15)">
      <div class="card-title">${t('estimated_cost')}</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
        ${[
          { label:t('min_cost'), val:`₹${(cost.min||0).toLocaleString('en-IN')}`, color:'var(--green)' },
          { label:t('market_avg'), val:`₹${(cost.avg||0).toLocaleString('en-IN')}`, color:'var(--cyan)' },
          { label:t('max_cost'), val:`₹${(cost.max||0).toLocaleString('en-IN')}`, color:'var(--rose)' },
        ].map(c => `
          <div style="text-align:center;padding:10px;background:var(--ink-2);border-radius:10px;border:1px solid var(--rim)">
            <div style="font-size:10px;color:var(--text-3);margin-bottom:4px;font-family:'JetBrains Mono',monospace">${c.label}</div>
            <div style="font-size:15px;font-weight:800;color:${c.color};font-family:'Syne',sans-serif">${c.val}</div>
          </div>`).join('')}
      </div>
      ${cost.confidence ? `
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;font-size:11px;color:var(--text-3)">
        ${ico('shield',10,'var(--green)')} ${t('cost_confidence')}: <span style="color:var(--green)">${Math.round(cost.confidence*100)}%</span>
        ${cost.discount ? ` · Multi-damage discount applied` : ''}
      </div>` : ''}
      ${r.repairOrReplace ? `
      <div style="padding:10px;background:var(--ink-3);border-radius:8px;margin-bottom:10px">
        <div style="font-size:11px;font-weight:700;color:${r.repairOrReplace.action==='repair'?'var(--green)':'var(--amber)'};margin-bottom:3px">
          ${t('repair_or_replace')}: ${r.repairOrReplace.action.toUpperCase().replace('_',' ')}
        </div>
        <div style="font-size:11px;color:var(--text-3);line-height:1.5">${r.repairOrReplace.reason}</div>
      </div>` : ''}
    </div>` : ''}

    <!-- AI Tip -->
    ${r.aiTip ? `
    <div class="card" style="margin-bottom:10px;background:rgba(57,211,83,.06);border-color:rgba(57,211,83,.2)">
      <div style="display:flex;align-items:flex-start;gap:8px">
        ${ico('cpu',13,'var(--green)')}
        <div>
          <div style="font-size:11px;font-weight:700;color:var(--green);margin-bottom:3px">${t('ai_suggestion')}</div>
          <div style="font-size:12px;color:var(--text-2);line-height:1.65">${r.aiTip}</div>
        </div>
      </div>
    </div>` : ''}

    <!-- Actions -->
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-primary btn-sm" data-page="shops">${ico('map',12,'#050608')} ${t('find_repair_shop')}</button>
      <button class="btn btn-ghost btn-sm" data-page="booking">${ico('check',12)} ${t('book_repair')}</button>
      <button class="btn btn-ghost btn-sm" id="d-reset-2">${ico('rf',12)} ${t('new_scan_btn')}</button>
    </div>
  </div>`;
}

function renderReportModal(d) {
  if (!d.result || !d.showModal) return '<div id="report-modal"></div>';
  return `<div id="report-modal"></div>`;
}
