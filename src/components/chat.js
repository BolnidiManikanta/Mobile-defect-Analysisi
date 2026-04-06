import { ico } from '../utils/icons.js';
import { t } from '../utils/i18n.js';

export function renderChatWidget(booking, messages, currentUser) {
  if (!booking) return '';
  
  const otherParty = currentUser.uid === booking.uid ? (booking.vendorName || 'Vendor') : (booking.userName || 'User');
  
  return `
  <div class="chat-widget open" id="chat-widget">
    <div class="chat-header">
      <div style="display:flex;align-items:center;gap:10px">
        <div class="chat-avatar">${otherParty[0].toUpperCase()}</div>
        <div>
          <div class="chat-name">${otherParty}</div>
          <div class="chat-status"><div class="live-dot" style="width:6px;height:6px"></div> Online</div>
        </div>
      </div>
      <button class="icon-btn" id="close-chat">${ico('x', 14, 'white')}</button>
    </div>
    
    <div class="chat-messages" id="chat-messages">
      <div class="chat-notice">
        ${ico('shield', 12)} Chat is end-to-end encrypted
      </div>
      
      ${messages.map(msg => {
        const isMe = msg.from === currentUser.uid;
        
        if (msg.type === 'ai_suggestion') {
          return `
            <div class="msg-row" style="justify-content:center">
              <div style="background:var(--ink-3);padding:10px 14px;border-radius:10px;font-size:12px;color:var(--text-2);text-align:center;max-width:85%;border:1px solid rgba(0,229,255,0.2)">
                <div style="color:var(--cyan);font-weight:700;margin-bottom:4px">${ico('zap',12)} AI Suggestion</div>
                ${msg.text}
              </div>
            </div>`;
        }

        if (msg.type === 'bid') {
          return `
            <div class="msg-row ${isMe ? 'msg-me' : 'msg-them'}">
              <div class="msg-bubble" style="background:var(--ink-2);border:1px solid var(--rim)">
                <div style="font-size:11px;color:var(--text-3);margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">Vendor Quote</div>
                <div style="font-size:24px;font-weight:800;font-family:'Syne',sans-serif;color:var(--green);margin-bottom:4px">₹${msg.amount}</div>
                <div style="font-size:13px;color:var(--text-2);margin-bottom:10px">${msg.text}</div>
                ${!isMe ? `<button class="btn btn-primary btn-sm accept-bid-btn" data-amount="${msg.amount}" style="width:100%">${ico('check',12,'#050608')} Accept Quote</button>` : ''}
                <div class="msg-time">${formatTime(msg.timestamp)}</div>
              </div>
            </div>`;
        }

        return `
          <div class="msg-row ${isMe ? 'msg-me' : 'msg-them'}">
            <div class="msg-bubble">
              ${msg.text}
              <div class="msg-time">${formatTime(msg.timestamp)}</div>
            </div>
          </div>
        `;
      }).join('')}
      
      ${messages.length === 0 ? `
        <div style="text-align:center;padding:40px 20px;color:var(--text-3);font-size:12px">
          No messages yet. Send a message to start the conversation.
        </div>
      ` : ''}
    </div>
    
    <div class="chat-input-area" style="flex-direction:column;gap:8px">
      ${currentUser.role === 'vendor' ? `
        <div style="display:flex;gap:6px;width:100%">
          <input type="number" class="inp" id="chat-bid-amount" placeholder="₹ Amount" style="width:100px;flex-shrink:0" />
          <button class="btn btn-ghost" id="chat-send-bid" style="flex:1;font-size:12px;padding:6px">Send Quote</button>
        </div>
      ` : ''}
      <div style="display:flex;gap:6px;width:100%;align-items:center">
        <textarea class="chat-input" id="chat-input" placeholder="${t('chat_placeholder')}" rows="1"></textarea>
        <button class="chat-send-btn" id="chat-send-btn">
          ${ico('ar', 14, '#050608')}
        </button>
      </div>
    </div>
  </div>`;
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
