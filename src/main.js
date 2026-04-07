// ═══════════════════════════════════════════════════════════
// SMARTSEP AI v3 — Production Main Entry Point
// ═══════════════════════════════════════════════════════════
import './styles/main.css';

import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { auth } from './firebase/auth.js';
import { 
  loadUserScans, saveScan, saveUserProfile, deleteAllScans, 
  getUserProfile, saveVendor, getVendorProfile, updateVendorPricing,
  loadVendors, createBooking, getUserBookings, getVendorBookings,
  updateBookingStatus, loadNotifications, markNotificationsRead,
  subscribeToChat, sendChatMessage, addNotification, addLog,
  saveReview, cancelBooking, updateBookingWithRepairImage, rateLimitCheck
} from './utils/firestore-helpers.js';
import { generatePDFReport } from './utils/report-generator.js';

import { toast } from './utils/toast.js';
import { MOCK_SCANS, MOCK_SHOPS } from './utils/data.js';
import { getLang, setLang, t } from './utils/i18n.js';
import { analyzeImage, initModel, isModelLoaded } from './utils/ai-model.js';
import { estimateTotalCost } from './utils/cost-engine.js';

import { renderAuth, bindAuth } from './components/auth.js';
import { renderShell } from './components/shell.js';
import { renderChatWidget } from './components/chat.js';

import { renderDashboard } from './pages/dashboard.js';
import { renderDetect, renderDetectResult } from './pages/detect.js';
import { renderLive } from './pages/live.js';
import { renderHistory, renderFullReport } from './pages/history.js';
import { renderShops } from './pages/shops.js';
import { renderBooking } from './pages/booking.js';
import { renderVendor } from './pages/vendor.js';
import { renderAdmin } from './pages/admin.js';
import { renderHelp } from './pages/help.js';
import { renderSettings } from './pages/settings.js';

// ── Permission Management ──────────────────────────────────
async function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') return;
  if (Notification.permission !== 'denied') {
    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        console.log('[SmartSep] Notification permission granted');
      }
    } catch (e) {
      console.warn('[SmartSep] Notification permission error:', e);
    }
  }
}

// Request permissions on first visit
requestNotificationPermission();

// ── App State ──────────────────────────────────────────────
let S = {
  user:           null,
  userProfile:    null,
  vendorProfile:  null,
  loading:        true,
  page:           'dashboard',
  scans:          [],
  vendors:        [],
  bookings:       [],
  vendorBookings: [],
  notifications:  [],
  notify:         false,
  camStream:      null,
  camActive:      false,
  currentChat:    null, // booking object
  chatMessages:   [],
  chatUnsub:      null,
  adminData:      { users:[], vendors:[], scans:[], logs:[] },
  detectionThreshold: 0.85,  // Live camera confidence threshold
  liveMode:       'all',      // scan mode: all, screen, body, camera
};

// ── Secondary State ────────────────────────────────────────
let detectSt = {
  brand: '', model: '', file: null, preview: null,
  fileBack: null, previewBack: null,
  status: 'idle', result: null, showModal: false, isAnalyzing: false // Add lock prevent concurrent analysis
};
let histFilter = 'all';
let histSearch = '';

// ── Router & Render ─────────────────────────────────────────
function nav(page) {
  if (S.camActive) stopCamera();
  if (S.chatUnsub) { S.chatUnsub(); S.chatUnsub = null; }
  S.page = page;
  S.notify = false;
  S.currentChat = null;
  render();
}

async function render() {
  const root = document.getElementById('root');
  if (S.loading) {
    root.innerHTML = `<div class="loading-screen"><div class="load-logo">S</div><div class="load-text">SMARTSEP AI · LOADING</div></div>`;
    return;
  }
  if (!S.user) {
    root.innerHTML = renderAuth();
    bindAuth(render);
    return;
  }

  const pageMap = {
    dashboard: () => renderDashboard(S),
    detect:    () => renderDetect(detectSt),
    live:      () => renderLive(S),
    history:   () => renderHistory(S, histFilter, histSearch),
    shops:     () => renderShops(S),
    booking:   () => renderBooking(S),
    vendor:    () => renderVendor(S),
    admin:     () => renderAdmin(S),
    help:      () => renderHelp(S),
    settings:  () => renderSettings(S),
  };

  const pageHtml = (pageMap[S.page] || pageMap.dashboard)();
  root.innerHTML = renderShell(S, pageHtml);
  
  if (S.currentChat) {
    const chatContainer = document.createElement('div');
    chatContainer.id = 'chat-container';
    chatContainer.innerHTML = renderChatWidget(S.currentChat, S.chatMessages, S.user);
    root.appendChild(chatContainer);
    bindChat();
  }

  bindShell();
  bindPageHandlers();
}

// ── Event Bindings ──────────────────────────────────────────
function bindShell() {
  document.querySelectorAll('[data-page]').forEach(el => {
    el.onclick = () => nav(el.dataset.page);
  });
  const uCard = document.getElementById('u-card');
  if (uCard) uCard.onclick = () => { if(confirm(t('confirm_signout'))) signOut(auth); };

  document.getElementById('notif-btn')?.addEventListener('click', () => { S.notify = !S.notify; render(); });
  document.getElementById('mark-read')?.addEventListener('click', async () => {
    await markNotificationsRead(S.user.uid);
    S.notifications = S.notifications.map(n => ({...n, read:true}));
    S.notify = false;
    render();
  });
  document.getElementById('refresh-btn')?.addEventListener('click', () => { refreshData(); toast(t('data_refreshed'), 'info'); });
  
  // Language Dropdown
  const langBtn = document.getElementById('lang-menu-btn');
  const langDrop = document.getElementById('lang-dropdown');
  if (langBtn && langDrop) {
    langBtn.onclick = (e) => { e.stopPropagation(); langDrop.classList.toggle('open'); };
    document.addEventListener('click', () => langDrop.classList.remove('open'));
    langDrop.querySelectorAll('[data-lang]').forEach(el => {
      el.onclick = () => { setLang(el.dataset.lang); render(); };
    });
  }

  // Menu toggle
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (menuToggle && sidebar && backdrop) {
    menuToggle.onclick = () => { sidebar.classList.add('open'); backdrop.classList.add('open'); };
    backdrop.onclick = () => { sidebar.classList.remove('open'); backdrop.classList.remove('open'); };
  }
}

function bindPageHandlers() {
  if (S.page === 'detect') bindDetect();
  if (S.page === 'live') bindLive();
  if (S.page === 'history') bindHistory();
  if (S.page === 'shops') bindShops();
  if (S.page === 'booking') bindBooking();
  if (S.page === 'vendor') bindVendor();
  if (S.page === 'admin') bindAdmin();
  if (S.page === 'help') bindHelp();
  if (S.page === 'settings') bindSettings();
}

// ── Detect Logic ───────────────────────────────────────────
function bindDetect() {
  const brandSel = document.getElementById('d-brand');
  if (brandSel) brandSel.onchange = e => { detectSt.brand = e.target.value; detectSt.model = ''; render(); };
  const modelSel = document.getElementById('d-model');
  if (modelSel) modelSel.onchange = e => { detectSt.model = e.target.value; };

  const dz = document.getElementById('dropzone');
  if (dz) {
    dz.onclick = () => document.getElementById('file-input')?.click();
    dz.ondragover = e => { e.preventDefault(); dz.classList.add('dz-active'); };
    dz.ondragleave = () => dz.classList.remove('dz-active');
    dz.ondrop = e => { e.preventDefault(); handleFile(e.dataTransfer?.files[0], 'front'); };
  }
  document.getElementById('file-input')?.addEventListener('change', e => handleFile(e.target.files[0], 'front'));

  const dzBack = document.getElementById('dropzone-back');
  if (dzBack) {
    dzBack.onclick = () => document.getElementById('file-input-back')?.click();
    document.getElementById('file-input-back')?.addEventListener('change', e => handleFile(e.target.files[0], 'back'));
  }

  document.getElementById('analyze-btn')?.addEventListener('click', runDetectAnalysis);
  document.getElementById('d-reset')?.addEventListener('click', () => { detectSt.file = null; detectSt.preview = null; render(); });
  document.getElementById('d-reset-back')?.addEventListener('click', () => { detectSt.fileBack = null; detectSt.previewBack = null; render(); });
  document.getElementById('d-reset-2')?.addEventListener('click', resetDetect);
}

function handleFile(file, side) {
  if (!file) return;
  
  // Validation: Size <= 5MB, Type image/*
  const maxSizeBytes = 5 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return toast(`Image too large (${sizeMB}MB - Max 5MB)`, 'error');
  }
  if (!file.type.startsWith('image/')) {
    return toast('Invalid file type. Please upload an image (JPG, PNG, WebP, etc.)', 'error');
  }

  const reader = new FileReader();
  reader.onload = e => { 
    if (side === 'front') { detectSt.file = file; detectSt.preview = e.target.result; }
    else { detectSt.fileBack = file; detectSt.previewBack = e.target.result; }
    render(); 
  };
  reader.onerror = () => toast('Error reading file', 'error');
  reader.readAsDataURL(file);
}

async function runDetectAnalysis() {
  if (!detectSt.file && !detectSt.fileBack) return toast(t('upload_photo_msg'), 'error');
  
  // CONCURRENT DETECTION PREVENTION: Lock if already analyzing
  if (detectSt.isAnalyzing) {
    return toast('Analysis already in progress. Please wait.', 'warning');
  }
  
  detectSt.isAnalyzing = true;
  
  // Spam Protection
  if (S.user) {
    const allowed = await rateLimitCheck(S.user.uid, 'scan_complete', 5, 2 * 60 * 1000); // 5 scans per 2 mins
    if (!allowed) {
      detectSt.isAnalyzing = false;
      return toast('Security Lock: Too many scans. Please wait 2 mins.', 'error');
    }
  }

  detectSt.status = 'analyzing';
  render();

  try {
    // Image loader with error boundary
    const loadImage = (src) => new Promise((resolve, reject) => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        // Timeout protection: image should load within 10 seconds
        const timeout = setTimeout(() => {
          reject(new Error('Image load timeout (>10s)'));
        }, 10000);
        img.onload = () => {
          clearTimeout(timeout);
          resolve(img);
        };
        img.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Failed to load image'));
        };
        img.src = src;
      } catch (e) {
        reject(new Error('Image initialization error: ' + e.message));
      }
    });

    // Parallel image analysis with error boundaries
    const analyses = [];
    if (detectSt.preview) {
      analyses.push(
        loadImage(detectSt.preview)
          .then(img => analyzeImage(img))
          .catch(err => {
            console.warn('[Detection] Front image analysis error:', err.message);
            throw new Error(`Front image analysis failed: ${err.message}`);
          })
      );
    }
    if (detectSt.previewBack) {
      analyses.push(
        loadImage(detectSt.previewBack)
          .then(img => analyzeImage(img))
          .catch(err => {
            console.warn('[Detection] Back image analysis error:', err.message);
            throw new Error(`Back image analysis failed: ${err.message}`);
          })
      );
    }
    
    const results = await Promise.all(analyses);

    // Merge results intelligently
    let finalDamages = [];
    let combinedInference = 0;
    const confidences = [];

    results.forEach((res, idx) => {
      if (!res || !res.damages) return;
      
      if (idx === 0) {
        // First image - add all damages
        finalDamages = [...res.damages];
      } else {
        // Second image - merge without duplicates
        res.damages.forEach(d => {
          const isDuplicate = finalDamages.some(fd => fd.type === d.type);
          if (!isDuplicate) finalDamages.push(d);
        });
      }
      
      combinedInference += res.inference_ms || 0;
      confidences.push(res.assessment_confidence || 0);
    });

    // Calculate final metrics
    const avgConfidence = confidences.length > 0 ? confidences.reduce((a, b) => a + b) / confidences.length : 0;
    const sevOrder = { low: 1, medium: 2, high: 3, critical: 4 };
    const maxSev = finalDamages.length > 0
      ? finalDamages.reduce((acc, d) => (sevOrder[d.severity] || 0) > (sevOrder[acc] || 0) ? d.severity : acc, 'low')
      : 'low';

    // Cost estimation
    const costData = await estimateTotalCost(detectSt.brand, finalDamages, detectSt.model);

    // Build result object
    detectSt.result = {
      id: Date.now().toString(),
      brand: detectSt.brand,
      model: detectSt.model,
      damages: finalDamages,
      overall_severity: maxSev,
      assessment_confidence: avgConfidence,
      inference_ms: combinedInference,
      repair_status: maxSev === 'critical' ? 'urgent' : maxSev === 'high' ? 'pending' : 'monitor',
      image_url: detectSt.preview,
      image_url_back: detectSt.previewBack,
      estimated_repair_cost: costData,
      aiTip: costData?.breakdown?.[0]?.aiTip || '',
      repairOrReplace: costData?.breakdown?.[0]?.repairOrReplace || null
    };

    detectSt.status = 'done';
    
    // Save scan to database
    if (S.user) {
      await saveScan(S.user.uid, detectSt.result);
      S.scans.unshift(detectSt.result);
      await addLog(S.user.uid, 'scan_complete', { damages: finalDamages.length, confidence: Math.round(avgConfidence * 100) });
    }
    
    render();
    toast(t('analysis_complete'), 'success');
  } catch (e) {
    console.error('[SmartSep AI] Analysis error:', e);
    detectSt.status = 'idle';
    render();
    // Show detailed error to user
    const errorMsg = e.message || 'Unknown error occurred';
    toast(`AI analysis failed: ${errorMsg}`, 'error');
  } finally {
    detectSt.isAnalyzing = false;
  }
}

function resetDetect() {
  detectSt = { brand:'', model:'', file:null, preview:null, fileBack:null, previewBack:null, status:'idle', result:null, showModal: false, isAnalyzing: false };
  render();
}

// ── Live Logic ─────────────────────────────────────────────
let liveInterval = null;
async function bindLive() {
  // Preload AI model
  document.getElementById('preload-model-btn')?.addEventListener('click', async () => {
    await initModel();
    render();
  });

  // Camera controls
  document.getElementById('start-cam')?.addEventListener('click', startCamera);
  document.getElementById('stop-cam')?.addEventListener('click', stopCamera);
  
  // Sensitivity slider
  const sens = document.getElementById('sensitivity');
  if (sens) {
    sens.oninput = e => {
      const val = e.target.value;
      document.getElementById('sens-label').textContent = `High (${val}%)`;
      // Store in state for real-time detection threshold
      S.detectionThreshold = parseInt(val) / 100;
      console.log('[Live] Threshold updated to', S.detectionThreshold);
    };
    // Initialize threshold on page load
    S.detectionThreshold = parseInt(sens.value) / 100;
  }

  // Scan mode selector
  const modeSelect = document.getElementById('live-mode');
  if (modeSelect) {
    modeSelect.oninput = e => {
      S.liveMode = e.target.value;
      console.log('[Live] Mode changed to', S.liveMode);
    };
    S.liveMode = modeSelect.value;
  }

  // Capture current frame for manual analysis
  document.getElementById('capture-btn')?.addEventListener('click', async () => {
    if (!S.camActive) return toast('Camera not active', 'error');
    
    try {
      const video = document.querySelector('#cam-frame video');
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      // Convert to blob and create file
      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'capture_' + Date.now() + '.jpg', { type: 'image/jpeg' });
        
        // Simulate upload to detect page
        detectSt.file = file;
        detectSt.preview = canvas.toDataURL();
        S.page = 'detect';
        render();
        
        // Auto-trigger analysis
        setTimeout(() => {
          document.getElementById('analyze-btn')?.click();
        }, 100);
      }, 'image/jpeg', 0.92);
      
      toast('Frame captured! Go to detect tab', 'info');
    } catch (e) {
      console.error('[Capture]', e);
      toast('Capture failed', 'error');
    }
  });
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    S.camStream = stream;
    S.camActive = true;
    render();
    
    const video = document.createElement('video');
    video.srcObject = stream;
    video.setAttribute('playsinline', ''); // iOS requirement
    await video.play();
    document.getElementById('cam-frame').prepend(video);
    video.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;inset:0';

    const canvas = document.getElementById('live-canvas');
    const ctx = canvas.getContext('2d');
    
    // Real-time detection loop with performance throttling
    let lastAnalysisTime = 0;
    const analysisInterval = 800; // Analyze every 0.8 seconds (~1.25 FPS)
    let frameCount = 0;
    let fpsTime = Date.now();
    
    const process = async (now) => {
      if (!S.camActive) return;
      
      frameCount++;
      
      // Calculate FPS
      const elapsed = Date.now() - fpsTime;
      if (elapsed >= 1000) {
        document.getElementById('stat-fps').textContent = frameCount + ' fps';
        frameCount = 0;
        fpsTime = Date.now();
      }
      
      // Throttle analysis
      if (Date.now() - lastAnalysisTime > analysisInterval) {
        lastAnalysisTime = Date.now();
        
        try {
          if (!isModelLoaded()) {
            document.getElementById('stat-status').textContent = 'Loading model...';
          } else {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const start = performance.now();
            const result = await analyzeImage(video);
            const duration = Math.round(performance.now() - start);
            
            if (result && result.damages && result.damages.length > 0) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              
              // Filter damages based on settings
              let displayed = result.damages;
              const threshold = S.detectionThreshold || 0.85;
              const mode = S.liveMode || 'all';
              
              // Filter by confidence threshold
              displayed = displayed.filter(d => d.confidence >= threshold);
              
              // Filter by scan mode
              if (mode !== 'all') {
                const modeMap = {
                  'screen': ['screen_crack', 'display', 'glass'],
                  'body': ['frame', 'bent_case', 'dent', 'battery_swelling'],
                  'camera': ['camera_lens', 'camera_crack']
                };
                const allowedTypes = modeMap[mode] || [];
                displayed = displayed.filter(d => allowedTypes.some(t => d.label.toLowerCase().includes(t)));
              }
              
              document.getElementById('stat-det').textContent = result.damages.length + ' / ' + displayed.length + ' match';
              document.getElementById('stat-status').textContent = displayed.length > 0 ? '🔴 DAMAGE DETECTED' : '✓ No damage';
              
              // Draw bounding boxes for matched damages
              displayed.forEach((d, idx) => {
                if (d.bbox) {
                  const [x, y, w, h] = d.bbox;
                  const scaleX = canvas.width / 640;
                  const scaleY = canvas.height / 480;
                  
                  const color = {critical: '#FF3D6B', high: '#FF6B35', medium: '#FFB800', low: '#39D353'}[d.severity] || '#00E5FF';
                  ctx.strokeStyle = color;
                  ctx.lineWidth = 3;
                  ctx.shadowColor = color;
                  ctx.shadowBlur = 8;
                  ctx.strokeRect(x*scaleX, y*scaleY, w*scaleX, h*scaleY);
                  
                  // Label with confidence
                  ctx.shadowColor = 'rgba(0,0,0,0.5)';
                  ctx.shadowBlur = 3;
                  ctx.shadowOffsetX = 1;
                  ctx.shadowOffsetY = 1;
                  ctx.fillStyle = color;
                  ctx.font = 'bold 13px monospace';
                  const label = d.label.replace(/_/g, ' ') + ' ' + Math.round(d.confidence*100) + '%';
                  ctx.fillText(label, x*scaleX + 5, y*scaleY - 8);
                }
              });
              
              document.getElementById('stat-inf').textContent = duration + 'ms';
            } else {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              document.getElementById('stat-det').textContent = '0';
              document.getElementById('stat-status').textContent = '✓ No damage detected';
              document.getElementById('stat-inf').textContent = duration + 'ms';
            }
          }
        } catch (e) {
          console.warn('[Live] Detection:', e.message);
        }
      }
      
      requestAnimationFrame(process);
    };
    requestAnimationFrame(process);
    
  } catch (e) {
    if (e.name === 'NotAllowedError') {
      const denied = document.getElementById('cam-denied');
      if (denied) denied.style.display = 'block';
      toast('Camera permission denied. Allow access and try again.', 'error');
    } else if (e.name === 'NotFoundError') {
      toast('No camera found on this device', 'error');
    } else {
      toast('Camera error: ' + e.message, 'error');
    }
    console.error('[Camera]', e);
  }
}

function stopCamera() {
  if (S.camStream) S.camStream.getTracks().forEach(t => t.stop());
  if (liveInterval) clearInterval(liveInterval);
  S.camStream = null;
  S.camActive = false;
  render();
}

// ── History Logic ──────────────────────────────────────────
function bindHistory() {
  document.querySelectorAll('[data-filter]').forEach(el => {
    el.onclick = () => { histFilter = el.dataset.filter; render(); };
  });
  const search = document.getElementById('hist-search');
  if (search) search.oninput = e => { histSearch = e.target.value; render(); };
  
  document.querySelectorAll('.view-report-btn').forEach(btn => {
    btn.onclick = () => {
      const scan = S.scans.find(s => s.id === btn.dataset.scanId) || MOCK_SCANS[btn.dataset.idx];
      const modal = document.getElementById('hist-modal');
      const cont  = document.getElementById('modal-content');
      if (modal && cont) {
        cont.innerHTML = renderFullReport(scan);
        modal.style.display = 'flex';
        document.getElementById('close-modal').onclick = () => modal.style.display = 'none';
        
        // PDF Single from Modal
        const pdfBtn = modal.querySelector('.export-pdf-single');
        if (pdfBtn) pdfBtn.onclick = () => generatePDFReport(scan);
      }
    };
  });

  document.getElementById('export-pdf-all')?.addEventListener('click', () => {
    if (S.scans.length === 0) return toast('No scans to export', 'error');
    toast('Generating summary...', 'info');
    // For now, export first 3 or just the visible ones as individual PDFs or one map
    S.scans.slice(0, 5).forEach((s, i) => {
      setTimeout(() => generatePDFReport(s), i * 1500);
    });
  });
}

// ── Shops Logic ───────────────────────────────────────────
function bindShops() {
  document.querySelectorAll('.book-vendor-btn').forEach(btn => {
    btn.onclick = () => {
      const shop = JSON.parse(btn.dataset.shop);
      nav('booking');
      setTimeout(() => {
        const sel = document.getElementById('bk-vendor');
        if (sel) { sel.value = shop.id; render(); }
      }, 50);
    };
  });
}

// ── Help Logic ──────────────────────────────────────────────
function bindHelp() {
  const search = document.getElementById('faq-search');
  if (search) {
    search.oninput = e => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.faq-item').forEach(it => {
        const text = it.innerText.toLowerCase();
        it.style.display = text.includes(q) ? 'block' : 'none';
      });
    };
  }
}

// ── Booking Logic ──────────────────────────────────────────
async function bindBooking() {
  document.getElementById('confirm-booking-btn')?.addEventListener('click', async () => {
    const vId = document.getElementById('bk-vendor').value;
    const br  = document.getElementById('bk-brand').value;
    const mo  = document.getElementById('bk-model').value;
    const da  = document.getElementById('bk-damage').value;
    const d   = document.getElementById('bk-date').value;
    const t   = document.getElementById('bk-time').value;

    if (!vId || !br || !mo || !da || !d || !t) return toast('Please fill all fields', 'error');

    const booking = {
      uid: S.user.uid,
      vendorId: vId, vendorName: S.vendors.find(v => v.id===vId)?.name || 'Vendor',
      deviceBrand: br, deviceModel: mo, damageType: da,
      slotDate: d, slotTime: t,
      userName: S.user.displayName || S.user.email,
      status: 'requested',
      paymentStatus: 'pending',
      createdAt: Date.now()
    };

    const id = await createBooking(S.user.uid, booking);
    if (id) {
       toast('Booking confirmed! Please wait for vendor approval.', 'success');
       nav('booking');
       refreshData();
    }
  });

  document.querySelectorAll('.chat-btn').forEach(btn => {
    btn.onclick = () => openChat(btn.dataset.bookingId);
  });

  // Phase 7: Cancellation, Reschedule & Reviews
  document.querySelectorAll('.bk-cancel-btn').forEach(btn => {
    btn.onclick = async () => {
      if (confirm('Cancel this booking?')) {
        await cancelBooking(btn.dataset.id, 'User cancelled');
        toast('Booking cancelled', 'info');
        refreshData();
      }
    };
  });

  document.querySelectorAll('.bk-reschedule-btn').forEach(btn => {
    btn.onclick = (e) => {
      const id = btn.dataset.id;
      const modal = document.getElementById('hist-modal');
      const cont = document.getElementById('modal-content');
      if (!modal || !cont) return;
      import('./pages/booking.js').then(pg => {
        cont.innerHTML = pg.renderRescheduleModal(id);
        modal.style.display = 'flex';
        document.getElementById('close-reschedule').onclick = () => modal.style.display = 'none';

        document.getElementById('submit-reschedule-btn').onclick = async () => {
          const date = document.getElementById('reschedule-date').value;
          const time = document.getElementById('reschedule-time').value;
          if (!date || !time) return toast('Please select date and time', 'error');
          
          await rescheduleBooking(id, date, time);
          toast('Reschedule requested', 'success');
          modal.style.display = 'none';
          refreshData();
        };
      });
    };
  });

  document.querySelectorAll('.bk-review-btn').forEach(btn => {
    btn.onclick = (e) => {
      const { id, vendorId } = btn.dataset;
      const modal = document.getElementById('hist-modal');
      const cont = document.getElementById('modal-content');
      if (!modal || !cont) return;
      import('./pages/booking.js').then(pg => {
        cont.innerHTML = pg.renderReviewModal(id, vendorId);
        modal.style.display = 'flex';
        document.getElementById('close-review').onclick = () => modal.style.display = 'none';
        
        let rating = 0;
        cont.querySelectorAll('.star-input').forEach(star => {
          star.onclick = () => {
            rating = parseInt(star.dataset.val);
            cont.querySelectorAll('.star-input').forEach(s => s.style.opacity = parseInt(s.dataset.val) <= rating ? '1' : '.3');
          };
        });

        document.getElementById('submit-review-btn').onclick = async () => {
          if (rating === 0) return toast('Please select a rating', 'error');
          const text = document.getElementById('review-text').value;
          await saveReview(S.user.uid, vendorId, { rating, text, bookingId: id });
          toast('Review posted!', 'success');
          modal.style.display = 'none';
          refreshData();
        };
      });
    };
  });
}

// ── Vendor Logic ───────────────────────────────────────────
async function bindVendor() {
  // Save vendor profile (name, phone, address, availability)
  document.getElementById('save-vendor-profile-btn')?.addEventListener('click', async () => {
    const name = document.getElementById('vnd-name')?.value;
    const phone = document.getElementById('vnd-phone')?.value;
    const address = document.getElementById('vnd-address')?.value;
    const availability = document.getElementById('vnd-avail')?.value;
    
    if (!name || !phone) {
      return toast('Name & phone required', 'error');
    }
    
    try {
      await saveVendor(S.user.uid, { name, phone, address, availability });
      toast('Profile saved successfully', 'success');
    } catch (err) {
      console.error('[Vendor] Save failed:', err);
      toast('Failed to save profile', 'error');
    }
  });

  // Save vendor pricing
  document.getElementById('save-pricing-btn')?.addEventListener('click', async () => {
    const list = {};
    document.querySelectorAll('.vnd-price').forEach(inp => {
      if (inp.value) list[inp.dataset.damage] = parseInt(inp.value);
    });
    await updateVendorPricing(S.user.uid, list);
    toast('Pricing updated', 'success');
  });

  // Accept pending request
  document.querySelectorAll('.vnd-accept-btn').forEach(btn => {
    btn.onclick = async () => {
      await updateBookingStatus(btn.dataset.id, 'accepted', 'Vendor accepted your request');
      refreshData();
    };
  });

  // Reject pending request
  document.querySelectorAll('.vnd-reject-btn').forEach(btn => {
    btn.onclick = async () => {
      await updateBookingStatus(btn.dataset.id, 'rejected', 'Vendor declined your request');
      refreshData();
    };
  });

  // Mark repair in progress
  document.querySelectorAll('.vnd-progress-btn').forEach(btn => {
    btn.onclick = async () => {
      await updateBookingStatus(btn.dataset.id, 'in_progress', 'Repairs started');
      refreshData();
    };
  });

  // Upload after-repair photo
  document.querySelectorAll('.vnd-after-btn').forEach(btn => {
    btn.onclick = () => {
      const fileInput = document.querySelector(`.after-photo-input[data-id="${btn.dataset.id}"]`);
      fileInput?.click();
    };
  });

  document.querySelectorAll('.after-photo-input').forEach(input => {
    input.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      const bookingId = input.dataset.id;
      if (!file) return;

      try {
        const reader = new FileReader();
        reader.onload = async (evt) => {
          toast('Uploading after photo...', 'info');
          await updateBookingWithRepairImage(bookingId, evt.target.result);
          toast('After photo uploaded', 'success');
          refreshData();
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error('[Vendor] Photo upload failed:', err);
        toast('Photo upload failed', 'error');
      }
    });
  });

  // Mark repair complete & notify user
  document.querySelectorAll('.vnd-complete-btn').forEach(btn => {
    btn.onclick = async () => {
      await updateBookingStatus(btn.dataset.id, 'completed', 'Device ready for pickup');
      refreshData();
    };
  });

  // Refresh vendor bookings
  document.getElementById('refresh-vendor-btn')?.addEventListener('click', async () => {
    toast('Refreshing bookings...', 'info');
    S.vendorBookings = await getVendorBookings(S.user.uid);
    renderPage();
  });

  // Chat with customer
  document.querySelectorAll('.chat-btn').forEach(btn => {
    btn.onclick = () => openChat(btn.dataset.bookingId);
  });
}

// ── Admin Logic ───────────────────────────────────────────
async function bindAdmin() {
  document.getElementById('refresh-logs-btn')?.addEventListener('click', async () => {
    toast('Updating analytics...', 'info');
    await refreshData();
  });
  
  document.getElementById('admin-seed-btn')?.addEventListener('click', async () => {
     const { DEVICE_DATA } = await import('./utils/data.js');
     const { seedDevices } = await import('./utils/firestore-helpers.js');
     await seedDevices(DEVICE_DATA);
     toast('Price database synchronized', 'success');
  });

  document.getElementById('admin-notify-btn')?.addEventListener('click', async () => {
    const msg = prompt('Enter message to broadcast:');
    if (msg) {
      // In a real system, iterate users or use a global topic
      await addNotification(S.user.uid, {
        title: 'System Update',
        body: msg,
        color: 'var(--amber)',
        read: false,
        createdAt: new Date()
      });
      toast('Notification broadcast sent', 'success');
    }
  });
}
function bindSettings() {
  document.getElementById('save-profile')?.addEventListener('click', async () => {
    const name = document.getElementById('set-name').value;
    const loc  = document.getElementById('set-location').value;
    await updateProfile(S.user, { displayName: name });
    await saveUserProfile(S.user, { location: loc });
    toast(t('profile_updated'), 'success');
    refreshData();
  });
  document.getElementById('toggle-vendor-form')?.addEventListener('click', () => {
    document.getElementById('vendor-form').style.display = 'block';
    document.getElementById('toggle-vendor-form').style.display = 'none';
  });
  document.getElementById('save-vendor-btn')?.addEventListener('click', async () => {
    const name = document.getElementById('vnd-reg-name').value;
    const phone = document.getElementById('vnd-reg-phone').value;
    if (!name || !phone) return toast('Missing details', 'error');
    await saveVendor(S.user.uid, { name, phone, verified: false });
    toast('Vendor registration submitted!', 'success');
    refreshData();
  });
}

// ── Chat Logic ─────────────────────────────────────────────
async function openChat(bookingId) {
  const bk = S.bookings.concat(S.vendorBookings).find(b => b.id === bookingId);
  if (!bk) return;
  S.currentChat = bk;
  if (S.chatUnsub) S.chatUnsub();
  S.chatUnsub = subscribeToChat(bookingId, msgs => {
    S.chatMessages = msgs;
    const chatMsgsEl = document.getElementById('chat-messages');
    if (chatMsgsEl) {
      chatMsgsEl.innerHTML = renderChatWidget(S.currentChat, S.chatMessages, S.user).match(/<div class="chat-messages".*>([\s\S]*)<\/div>\s*<div class="chat-input-area"/)[1];
      chatMsgsEl.scrollTop = chatMsgsEl.scrollHeight;
    } else {
      render();
    }
  });
  render();
}

function bindChat() {
  document.getElementById('close-chat')?.addEventListener('click', () => {
    if (S.chatUnsub) S.chatUnsub();
    S.chatUnsub = null;
    S.currentChat = null;
    render();
  });
  const input = document.getElementById('chat-input');
  const send = document.getElementById('chat-send-btn');
  if (input && send) {
    const doSend = async () => {
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      await sendChatMessage(S.currentChat.id, S.user.uid, text);
    };
    send.onclick = doSend;
    input.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); } };
  }
}

// ── Data Management ────────────────────────────────────────
async function refreshData() {
  if (!S.user) return;
  const [prof, scans, vends, bks, vBks, notifs] = await Promise.all([
    getUserProfile(S.user.uid),
    loadUserScans(S.user.uid),
    loadVendors(),
    getUserBookings(S.user.uid),
    getVendorBookings(S.user.uid),
    loadNotifications(S.user.uid)
  ]);
  S.userProfile = prof;
  S.scans = scans;
  S.vendors = vends || MOCK_SHOPS;
  S.bookings = bks;
  S.vendorBookings = vBks;
  S.notifications = notifs;
  if (prof && prof.role === 'vendor') {
    S.vendorProfile = await getVendorProfile(S.user.uid);
  }
  render();
}

// ── Initialization ─────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  S.loading = false;
  S.user = user;
  if (user) {
    const profile = await saveUserProfile(user);
    await refreshData();
    
    // Lazy-load AI model in background (non-blocking)
    // Defer to next tick to not block initial render
    setTimeout(() => {
      initModel().catch(e => console.warn('[Model] Background load failed:', e.message));
    }, 2000);
    
  } else {
    render();
  }
});

// Phase 7: Global Network Resilience
window.addEventListener('online', () => {
  toast('Connection restored', 'success');
  const label = document.getElementById('net-status-label');
  if (label) { label.style.color = 'var(--green)'; label.innerText = '● Online'; }
});
window.addEventListener('offline', () => {
  toast('You are offline. Some features may be disabled.', 'error');
  const label = document.getElementById('net-status-label');
  if (label) { label.style.color = 'var(--rose)'; label.innerText = '● Offline'; }
});
