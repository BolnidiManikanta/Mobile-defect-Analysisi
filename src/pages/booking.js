import { ico } from '../utils/icons.js';
import { t } from '../utils/i18n.js';
import { DAMAGE_TYPES, TIME_SLOTS, BOOKING_STATUSES, MOCK_SHOPS } from '../utils/data.js';
import {  loadNotifications, markNotificationsRead, subscribeToChat, sendChatMessage,
  cancelBooking, rescheduleBooking, saveReview
} from '../utils/firestore-helpers.js';

export function renderBooking(S) {
  const bookings = S.bookings || [];
  const shops    = S.vendors?.length ? S.vendors : MOCK_SHOPS;

  return `<div class="page fade-up">
    <div class="ph">
      <div class="ph-title">${t('my_bookings')}</div>
      <div class="ph-sub">${t('booking_sub')}</div>
    </div>

    <div style="display:grid;grid-template-columns:1.1fr 1fr;gap:12px;align-items:start">
      <!-- Booking Form -->
      <div>
        <div class="card" style="margin-bottom:12px">
          <div class="card-title">${t('book_repair_title')}</div>

          <div class="field">
            <label class="lbl">${t('select_vendor')}</label>
            <select class="inp sel" id="bk-vendor">
              <option value="">${t('select_vendor')}…</option>
              ${shops.map(sh => `<option value="${sh.id}">${sh.name} · ${sh.distance} · ★${sh.rating}</option>`).join('')}
            </select>
          </div>

          <div class="field">
            <label class="lbl">Device Brand & Model</label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <input class="inp" id="bk-brand" placeholder="e.g. Apple" value="${S.lastScan?.brand||''}"/>
              <input class="inp" id="bk-model" placeholder="e.g. iPhone 15" value="${S.lastScan?.model||''}"/>
            </div>
          </div>

          <div class="field">
            <label class="lbl">${t('damage_type')}</label>
            <select class="inp sel" id="bk-damage">
              <option value="">Select damage type…</option>
              ${Object.entries(DAMAGE_TYPES).map(([k,v]) => `<option value="${k}">${v.icon} ${v.label}</option>`).join('')}
            </select>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div class="field" style="margin-bottom:0">
              <label class="lbl">${t('select_date')}</label>
              <input class="inp" id="bk-date" type="date" min="${new Date().toISOString().split('T')[0]}"/>
            </div>
            <div class="field" style="margin-bottom:0">
              <label class="lbl">${t('select_time')}</label>
              <select class="inp sel" id="bk-time">
                <option value="">Select time…</option>
                ${TIME_SLOTS.map(ts => `<option value="${ts}">${ts}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="field">
            <label class="lbl">Additional Notes</label>
            <textarea class="inp" id="bk-notes" rows="2" placeholder="Describe the issue briefly…" style="resize:vertical"></textarea>
          </div>

          <div style="padding:12px;background:var(--ink-3);border-radius:10px;margin-bottom:14px">
            <div style="font-size:11px;color:var(--text-3);margin-bottom:6px">BOOKING SUMMARY</div>
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
              <span style="color:var(--text-2)">Advance Token</span>
              <span style="color:var(--cyan);font-weight:700">₹200</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:12px">
              <span style="color:var(--text-2)">Balance Due at Shop</span>
              <span style="color:var(--text-2)">As per quote</span>
            </div>
          </div>

          <button class="btn btn-primary" id="confirm-booking-btn" style="width:100%">
            ${ico('check',13,'#050608')} ${t('confirm_booking')} · Pay ₹200 Advance
          </button>
          <div style="font-size:10.5px;color:var(--text-3);text-align:center;margin-top:8px">
            Secure advance payment · Refundable if vendor rejects
          </div>
        </div>
      </div>

      <!-- Bookings List -->
      <div>
        <div class="card">
          <div class="card-title">${t('booking_status')}</div>
          ${bookings.length === 0
            ? `<div class="empty" style="padding:20px 0">
                <div class="empty-ico">${ico('check',20,'var(--text-3)')}</div>
                <div class="empty-title">${t('no_bookings')}</div>
                <div class="empty-sub">${t('book_your_first')}</div>
              </div>`
            : bookings.map(bk => renderBookingCard(bk)).join('')}
        </div>
      </div>
    </div>

    <!-- Payment success modal -->
    <div id="payment-success-modal" class="modal-overlay" style="display:none">
      <div class="modal-box" style="text-align:center;max-width:360px">
        <div style="font-size:48px;margin-bottom:12px">✅</div>
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:18px;margin-bottom:8px">Booking Confirmed!</div>
        <div style="font-size:13px;color:var(--text-2);line-height:1.65;margin-bottom:16px">
          Your repair slot has been booked. The vendor will confirm shortly. You'll receive a notification.
        </div>
        <button class="btn btn-primary" id="close-payment-modal" style="width:100%">Got it</button>
      </div>
    </div>
  </div>`;
}

export function renderBookingCard(bk) {
  const statusColors = {
    requested:   'var(--amber)',
    accepted:    'var(--cyan)',
    in_progress: 'var(--violet)',
    completed:   'var(--green)',
  };
  const currentIdx = BOOKING_STATUSES.indexOf(bk.status);

  return `<div class="booking-card" style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--rim)">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px">
      <div>
        <div style="font-size:13px;font-weight:700">${bk.deviceBrand} ${bk.deviceModel}</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:2px;font-family:'JetBrains Mono',monospace">
          ${bk.vendorName || 'Vendor'} · ${bk.slotDate || ''} ${bk.slotTime || ''}
        </div>
      </div>
      <span class="badge" style="background:${statusColors[bk.status]}22;color:${statusColors[bk.status]};border:1px solid ${statusColors[bk.status]}44">
        ${bk.status.replace('_',' ')}
      </span>
    </div>

    <!-- Status Timeline -->
    <div class="timeline-wrap" style="margin-bottom:12px">
      <div class="tl-track"></div>
      ${BOOKING_STATUSES.map((st, i) => {
        const isDone = i <= currentIdx;
        const isNow  = i === currentIdx;
        return `
        <div class="tl-step ${isDone ? 'done' : ''} ${isNow ? 'active' : ''}">
          <div class="tl-dot">${isDone ? ico('check',8,'#050608') : ''}</div>
          <div class="tl-label">${t('status_'+st)}</div>
        </div>`;
      }).join('')}
    </div>

    <div style="display:flex;gap:6px;flex-wrap:wrap">
      ${bk.paymentStatus === 'paid'
        ? `<span style="font-size:10.5px;color:var(--green);font-family:'JetBrains Mono',monospace">${ico('check',10,'var(--green)')} ₹${bk.paidAmount||200} paid</span>`
        : `<span style="font-size:10.5px;color:var(--amber);font-family:'JetBrains Mono',monospace">Payment pending</span>`}
      <button class="btn btn-ghost btn-sm chat-btn" data-booking-id="${bk.id}" style="font-size:11px">
        ${ico('chat',10)} ${t('chat_with_user')}
      </button>
      ${bk.status !== 'completed' && bk.status !== 'cancelled' ? `
        <button class="btn btn-ghost btn-sm bk-reschedule-btn" data-id="${bk.id}" style="font-size:11px">
          ${ico('clock',10)} Reschedule
        </button>
        <button class="btn btn-danger btn-sm bk-cancel-btn" data-id="${bk.id}" style="font-size:11px">
          ${ico('x',10)} ${t('cancel')}
        </button>` : ''}
      ${bk.status === 'completed' && !bk.userReviewed ? `
        <button class="btn btn-primary btn-sm bk-review-btn" data-id="${bk.id}" data-vendor-id="${bk.vendorId}" style="font-size:11px">
          ${ico('star',10,'#050608')} Leave Feedback
        </button>` : ''}
    </div>
  </div>`;
}

export function renderReviewModal(bookingId, vendorId) {
  return `<div class="modal-box" id="review-form-box">
    <div class="ph-title" style="font-size:18px">Rate Your Experience</div>
    <div class="ph-sub" style="margin-bottom:16px">How was the service at the shop?</div>
    <div style="display:flex;justify-content:center;gap:12px;margin-bottom:20px">
      ${[1,2,3,4,5].map(n => `<div class="star-input" data-val="${n}" style="cursor:pointer;font-size:28px;opacity:.3">${ico('star',28)}</div>`).join('')}
    </div>
    <textarea class="inp" id="review-text" placeholder="Tell us more about the repair quality..." style="height:100px;margin-bottom:16px"></textarea>
    <div style="display:flex;gap:10px">
      <button class="btn btn-ghost" style="flex:1" id="close-review">Cancel</button>
      <button class="btn btn-primary" style="flex:1" id="submit-review-btn">Post Review</button>
    </div>
  </div>`;
}

export function renderRescheduleModal(bookingId) {
  return `<div class="modal-box" id="reschedule-form-box">
    <div class="ph-title" style="font-size:18px">Reschedule Booking</div>
    <div class="ph-sub" style="margin-bottom:16px">Pick a new date and time for your repair.</div>
    <div class="field">
      <label class="lbl">New Date</label>
      <input class="inp" type="date" id="reschedule-date" />
    </div>
    <div class="field">
      <label class="lbl">New Time</label>
      <input class="inp" type="time" id="reschedule-time" />
    </div>
    <div style="display:flex;gap:10px;margin-top:20px">
      <button class="btn btn-ghost" style="flex:1" id="close-reschedule">Cancel</button>
      <button class="btn btn-primary" style="flex:1" id="submit-reschedule-btn">Confirm Change</button>
    </div>
  </div>`;
}
