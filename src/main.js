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
};

// ── Secondary State ────────────────────────────────────────
let detectSt = {
  brand: '', model: '', file: null, preview: null,
  fileBack: null, previewBack: null,
  status: 'idle', result: null, showModal: false
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
  
  // Validation: Size < 5MB, Type image/*
  if (file.size > 5 * 1024 * 1024) return toast('Image too large (Max 5MB)', 'error');
  if (!file.type.startsWith('image/')) return toast('Invalid file type', 'error');

  const reader = new FileReader();
  reader.onload = e => { 
    if (side === 'front') { detectSt.file = file; detectSt.preview = e.target.result; }
    else { detectSt.fileBack = file; detectSt.previewBack = e.target.result; }
    render(); 
  };
  reader.readAsDataURL(file);
}

async function runDetectAnalysis() {
  if (!detectSt.file && !detectSt.fileBack) return toast(t('upload_photo_msg'), 'error');
  
  // Phase 7: Spam Protection
  if (S.user) {
    const allowed = await rateLimitCheck(S.user.uid, 'scan_complete', 5, 2 * 60 * 1000); // 5 scans per 2 mins
    if (!allowed) return toast('Security Lock: Too many scans. Please wait 2 mins.', 'error');
  }

  detectSt.status = 'analyzing';
  render();

  try {
    let finalDamages = [];
    let combinedInference = 0;
    let confidenceSum = 0;
    let imagesProcessed = 0;

    // Process Front
    if (detectSt.preview) {
      const img = new Image();
      img.src = detectSt.preview;
      await new Promise(r => img.onload = r);
      const res = await analyzeImage(img, detectSt.brand, detectSt.model);
      finalDamages = [...res.damages];
      combinedInference += res.inference_ms;
      confidenceSum += res.assessment_confidence;
      imagesProcessed++;
    }

    // Process Back
    if (detectSt.previewBack) {
      const imgB = new Image();
      imgB.src = detectSt.previewBack;
      await new Promise(r => imgB.onload = r);
      const resB = await analyzeImage(imgB, detectSt.brand, detectSt.model);
      // Merge unique damage types or locations
      resB.damages.forEach(d => {
        if (!finalDamages.find(fd => fd.type === d.type && fd.location === d.location)) {
          finalDamages.push(d);
        }
      });
      combinedInference += resB.inference_ms;
      confidenceSum += resB.assessment_confidence;
      imagesProcessed++;
    }

    // Final Assessment
    const avgConfidence = confidenceSum / imagesProcessed;
    const sevOrder = { low: 1, medium: 2, high: 3, critical: 4 };
    const maxSev = finalDamages.reduce((acc, d) => (sevOrder[d.severity] > sevOrder[acc] ? d.severity : acc), 'low');

    // Compute Dynamic Costs ASYNC
    const costData = await estimateTotalCost(detectSt.brand, finalDamages, detectSt.model);

    detectSt.result = {
      id: Date.now().toString(),
      brand: detectSt.brand,
      model: detectSt.model,
      damages: finalDamages,
      overall_severity: maxSev,
      assessment_confidence: avgConfidence,
      inference_ms: combinedInference,
      repair_status: maxSev === 'critical' ? 'urgent' : 'pending',
      image_url: detectSt.preview,
      image_url_back: detectSt.previewBack,
      estimated_repair_cost: costData,
      aiTip: costData?.breakdown?.[0]?.aiTip || '',
      repairOrReplace: costData?.breakdown?.[0]?.repairOrReplace || null
    };

    detectSt.status = 'done';
    
    if (S.user) {
      await saveScan(S.user.uid, detectSt.result);
      S.scans.unshift(detectSt.result);
      await addLog(S.user.uid, 'scan_complete', { damages: finalDamages.length });
    }
    
    render();
    toast(t('analysis_complete'), 'success');
  } catch (e) {
    detectSt.status = 'idle';
    render();
    toast('AI analysis failed: ' + e.message, 'error');
  }
}

function resetDetect() {
  detectSt = { brand:'', model:'', file:null, preview:null, fileBack:null, previewBack:null, status:'idle', result:null };
  render();
}

// ── Live Logic ─────────────────────────────────────────────
let liveInterval = null;
async function bindLive() {
  document.getElementById('preload-model-btn')?.addEventListener('click', async () => {
    await initModel();
    render();
  });
  document.getElementById('start-cam')?.addEventListener('click', startCamera);
  document.getElementById('stop-cam')?.addEventListener('click', stopCamera);
  
  const sens = document.getElementById('sensitivity');
  if (sens) sens.oninput = e => {
    document.getElementById('sens-label').textContent = `Sensitivity (${e.target.value}%)`;
  };
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
    
    // Phase 3: Robust RAF Inference Loop
    let lastTime = 0;
    const process = async (now) => {
      if (!S.camActive) return;
      
      // Control FPS: Throttle to ~2-3 FPS for performance on lower-end devices
      if (now - lastTime > 400) {
        lastTime = now;
        if (!isModelLoaded()) {
           toast('Warming up AI engine...', 'info');
           await initModel();
        }
        if (isModelLoaded()) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const start = performance.now();
          const res = await analyzeImage(video);
          const end = performance.now();
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          res.damages.forEach(d => {
             if (d.bbox) {
               ctx.strokeStyle = '#00e5ff';
               ctx.lineWidth = 3;
               ctx.strokeRect(d.bbox[0]*canvas.width, d.bbox[1]*canvas.height, d.bbox[2]*canvas.width, d.bbox[3]*canvas.height);
             }
          });
          
          const perf = Math.round(end - start);
          document.getElementById('stat-det').textContent = res.damages.length;
          document.getElementById('stat-inf').textContent = perf + 'ms';
          document.getElementById('stat-fps').textContent = Math.round(1000/(now - lastTime)) || '—';
        }
      }
      requestAnimationFrame(process);
    };
    requestAnimationFrame(process);
    
  } catch (e) {
    toast('Camera failed: ' + e.message, 'error');
    console.error(e);
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
  document.getElementById('save-pricing-btn')?.addEventListener('click', async () => {
    const list = {};
    document.querySelectorAll('.vnd-price').forEach(inp => {
      if (inp.value) list[inp.dataset.damage] = parseInt(inp.value);
    });
    await updateVendorPricing(S.user.uid, list);
    toast('Pricing updated', 'success');
  });

  document.querySelectorAll('.vnd-accept-btn').forEach(btn => {
    btn.onclick = async () => {
      await updateBookingStatus(btn.dataset.id, 'accepted', 'Vendor accepted your request');
      refreshData();
    };
  });
  document.querySelectorAll('.vnd-progress-btn').forEach(btn => {
    btn.onclick = async () => {
      await updateBookingStatus(btn.dataset.id, 'in_progress', 'Repairs started');
      refreshData();
    };
  });
  document.querySelectorAll('.vnd-complete-btn').forEach(btn => {
    btn.onclick = async () => {
      await updateBookingStatus(btn.dataset.id, 'completed', 'Device ready for pickup');
      refreshData();
    };
  });
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
  
  if (prof && prof.role === 'admin') {
     // Fetch Global Stats for Admin
     const { collection, getDocs, orderBy, limit, query } = await import('firebase/firestore');
     const { db } = await import('./firebase/config.js');
     try {
       const [uSnap, vSnap, sSnap, lSnap] = await Promise.all([
         getDocs(collection(db, 'users')),
         getDocs(collection(db, 'vendors')),
         getDocs(collection(db, 'scans')),
         getDocs(query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(50)))
       ]);
       S.adminData = {
         users: uSnap.docs.map(d => ({id:d.id, ...d.data()})),
         vendors: vSnap.docs.map(d => ({id:d.id, ...d.data()})),
         scans: sSnap.docs.map(d => ({id:d.id, ...d.data()})),
         logs: lSnap.docs.map(d => ({id:d.id, ...d.data()}))
       };
     } catch (e) {
       console.error('Admin data fetch error:', e);
     }
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
    initModel(); // Background load
    
    // Auto-seed devices if admin
    if (profile?.role === 'admin') {
      import('./utils/data.js').then(d => {
        import('./utils/firestore-helpers.js').then(f => {
          f.seedDevices(d.DEVICE_DATA);
        });
      });
    }
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
