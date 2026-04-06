import { ico } from '../utils/icons.js';
import { t } from '../utils/i18n.js';

export function renderHelp(S) {
  const faqs = [
    { q: 'How accurate is the AI detection?', a: 'Our AI model is trained on over 50,000 images of mobile damage and has an accuracy rating of 94% for common issues like screen cracks and battery swelling.' },
    { q: 'How do I book a repair?', a: 'Once you scan your device, click "Find Shops" to see nearby verified vendors. Choose a shop and click "Book Now" to schedule your visit.' },
    { q: 'What is the "Before/After" gallery?', a: 'After a repair is completed, the vendor can upload a photo of the fixed device. You can then view the comparison in your Scan History.' },
    { q: 'Can I cancel my booking?', a: 'Yes, you can cancel any pending or accepted booking from the "Bookings" page. Please try to cancel at least 2 hours before your slot.' },
    { q: 'My camera is not loading?', a: 'Ensure you have granted camera permissions to the app. On iOS, use Safari for the best experience. On Android, Chrome is recommended.' }
  ];

  return `<div class="page fade-up">
    <div class="ph">
      <div class="ph-title">${t('help_support')}</div>
      <div class="ph-sub">Find answers to common questions or reach out to our team</div>
    </div>

    <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:12px;align-items:start">
      <!-- FAQ Section -->
      <div>
        <div class="card" style="margin-bottom:12px">
          <div class="card-title">Frequently Asked Questions</div>
          <div class="field" style="margin-bottom:16px">
            <input class="inp" id="faq-search" placeholder="Search for a topic..." style="padding-left:40px;background-image:url('data:image/svg+xml,%3Csvg width=%2214%22 height=%2214%22 fill=%22none%22 stroke=%22%236e7485%22 stroke-width=%222.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Ccircle cx=%226%22 cy=%226%22 r=%224%22/%3E%3Cpath d=%22M13 13l-3-3%22/%3E%3C/svg%3E');background-repeat:no-repeat;background-position:14px center"/>
          </div>
          <div id="faq-list">
            ${faqs.map((f, i) => `
              <div class="faq-item" style="padding:16px 0;border-bottom:${i < faqs.length-1 ? '1px solid var(--rim)' : 'none'}">
                <div style="font-size:14px;font-weight:700;margin-bottom:6px;display:flex;align-items:center;gap:10px;cursor:pointer" onclick="this.nextElementSibling.classList.toggle('open')">
                  ${ico('ar',10)} ${f.q}
                </div>
                <div class="faq-ans" style="font-size:13px;color:var(--text-2);line-height:1.6;margin-top:8px;padding-left:24px;display:none">
                  ${f.a}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Contact Section -->
      <div>
        <div class="card" style="margin-bottom:12px;background:linear-gradient(135deg, var(--bg-2), var(--ink-2))">
          <div class="card-title">Need direct help?</div>
          <div style="font-size:13px;color:var(--text-2);margin-bottom:16px;line-height:1.5">
            Our support team is available Mon-Fri, 9am - 6pm.
          </div>
          <button class="btn btn-primary" style="width:100%;margin-bottom:8px" id="open-ticket-btn">
            ${ico('chat',12,'#050608')} Create Support Ticket
          </button>
          <button class="btn btn-ghost" style="width:100%">
            ${ico('mail',12)} Email Us
          </button>
        </div>

        <div class="card">
          <div class="card-title">System Status</div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;padding:8px 0">
            <span style="color:var(--text-2)">AI Model API</span>
            <span style="color:var(--green)">● Operational</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;padding:8px 0">
            <span style="color:var(--text-2)">Database</span>
            <span style="color:var(--green)">● Operational</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;padding:8px 0;border-top:1px solid var(--rim);margin-top:8px">
            <span style="color:var(--text-2)">Your Connection</span>
            <span id="net-status-label" style="color:var(--green)">● Online</span>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}
