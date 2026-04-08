import { ico } from '../utils/icons.js';
import { t } from '../utils/i18n.js';
import { isModelLoaded, isModelLoading } from '../utils/ai-model.js';

export function renderLive(S) {
  const modelStatus = isModelLoaded() ? 'ready' : isModelLoading() ? 'loading' : 'idle';
  const modelColor  = { ready:'var(--green)', loading:'var(--amber)', idle:'var(--text-3)' }[modelStatus];
  const modelLabel  = { ready:t('model_ready'), loading:t('model_loading'), idle:'AI Model Not Loaded' }[modelStatus];

  return `<div class="page fade-up">
    <div class="ph">
      <div class="ph-title">${t('live_detection')}</div>
      <div class="ph-sub">${t('live_sub')}</div>
    </div>

    <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:12px">
      <div>
        <!-- Camera Frame -->
        <div class="cam-frame" id="cam-frame" style="position:relative">
          <div class="cam-corner cc-tl"></div>
          <div class="cam-corner cc-tr"></div>
          <div class="cam-corner cc-bl"></div>
          <div class="cam-corner cc-br"></div>
          <div class="scan-line" id="scan-line" style="${S.camActive ? '' : 'display:none'}"></div>

          <!-- Canvas overlay for bounding boxes -->
          <canvas id="live-canvas" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2"></canvas>

          <div class="cam-placeholder" id="cam-placeholder" style="${S.camActive ? 'display:none' : ''}">
            ${ico('camera',32,'var(--text-3)')}
            <div style="font-size:12.5px;color:var(--text-3);text-align:center;line-height:1.7;margin-top:8px">
              ${t('camera_offline')}<br/>
              <span style="font-size:11px;font-family:'JetBrains Mono',monospace">Click Start Camera below</span>
            </div>
          </div>

          <!-- Detection overlay labels -->
          <div id="live-labels" style="position:absolute;bottom:10px;left:10px;right:10px;z-index:3;display:${S.camActive?'block':'none'}">
          </div>
        </div>

        <!-- Camera Denied Fallback -->
        <div id="cam-denied" style="display:none" class="card" style="margin-top:10px;background:rgba(255,61,107,.06);border-color:rgba(255,61,107,.2)">
          <div style="text-align:center;padding:10px">
            <div style="font-size:13px;font-weight:600;color:var(--rose);margin-bottom:6px">${ico('alert',13,'var(--rose)')} ${t('camera_denied')}</div>
            <button class="btn btn-ghost btn-sm" data-page="detect">${t('try_upload')}</button>
          </div>
        </div>

        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
          <button class="btn btn-primary" id="start-cam" ${S.camActive?'style="display:none"':''}>
            ${ico('video',13,'#050608')} ${t('start_camera')}
          </button>
          <button class="btn btn-danger btn-sm" id="stop-cam" ${!S.camActive?'style="display:none"':''}>
            ${ico('x',12)} ${t('stop_camera')}
          </button>
          <button class="btn btn-ghost btn-sm" id="capture-btn" ${!S.camActive?'disabled':''}>
            ${ico('camera',12)} ${t('capture_analyze')}
          </button>
        </div>
      </div>

      <div>
        <!-- Model Status Card -->
        <div class="card" style="margin-bottom:10px;border-color:${modelColor}33">
          <div class="card-title">AI Model Status</div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <div style="width:8px;height:8px;border-radius:50%;background:${modelColor};box-shadow:0 0 8px ${modelColor}"></div>
            <span style="font-size:12px;color:${modelColor};font-family:'JetBrains Mono',monospace">${modelLabel}</span>
          </div>
          ${modelStatus === 'idle' ? `
          <button class="btn btn-ghost btn-sm" id="preload-model-btn" style="width:100%">
            ${ico('cpu',11)} Load AI Model Now
          </button>` : ''}
          ${modelStatus === 'loading' ? `
          <div class="skeleton-line" style="width:100%;margin-top:4px"></div>` : ''}
        </div>

        <!-- Detection Settings -->
        <div class="card" style="margin-bottom:10px">
          <div class="card-title">${t('scan_mode')}</div>
          <div class="field">
            <label class="lbl" style="display:flex;justify-content:space-between">
              <span>${t('sensitivity')}</span>
              <span style="color:var(--cyan);font-family:'JetBrains Mono',monospace;font-size:10.5px" id="sens-label">Balanced (70%)</span>
            </label>
            <input type="range" id="sensitivity" min="30" max="100" value="70"
              style="width:100%;accent-color:var(--cyan);cursor:pointer"/>
          </div>
          <div class="field" style="margin-bottom:0">
            <label class="lbl">${t('scan_mode')}</label>
            <select class="inp sel" id="live-mode">
              <option value="all">Auto — All damage types</option>
              <option value="screen">Screen cracks only</option>
              <option value="body">Body damage only</option>
              <option value="camera">Camera lens damage</option>
            </select>
          </div>
        </div>

        <!-- Live Stats -->
        <div class="card" style="margin-bottom:10px">
          <div class="card-title">Live Feed Stats</div>
          ${[
            { label:t('fps'),         id:'stat-fps',    default:'—' },
            { label:'Resolution',     id:'stat-res',    default:'—' },
            { label:'AI Inference',   id:'stat-inf',    default:'—' },
            { label:t('detections'), id:'stat-det',    default:'0' },
            { label:t('status'),      id:'stat-status', default: S.camActive ? t('camera_active') : t('camera_offline') },
          ].map(it => `
            <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--rim);font-size:12px">
              <span style="color:var(--text-2)">${it.label}</span>
              <span id="${it.id}" style="color:var(--cyan);font-family:'JetBrains Mono',monospace;font-size:10.5px">${S.camActive && it.default==='—' ? '…' : it.default}</span>
            </div>`).join('')}
        </div>

        <!-- Live Detection Result -->
        <div id="live-result" class="card" style="display:none;border-color:var(--cyan)33">
          <div class="card-title">Last Detection</div>
          <div id="live-result-content"></div>
        </div>

        <!-- Tips -->
        <div class="card" style="background:var(--cyan-dim);border-color:rgba(0,229,255,.15)">
          <div style="display:flex;align-items:flex-start;gap:8px">
            ${ico('info',13,'var(--cyan)')}
            <div style="font-size:12px;color:var(--text-2);line-height:1.7">
              <strong style="color:var(--text)">${t('camera_tip').split(':')[0]}:</strong><br/>
              ${t('camera_tip').split(':')[1] || t('camera_tip')}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}
