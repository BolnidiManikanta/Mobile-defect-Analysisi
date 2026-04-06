import { ico } from '../utils/icons.js';
import { t } from '../utils/i18n.js';

export function renderAdmin(S) {
  const users = S.adminData?.users || [];
  const vendors = S.adminData?.vendors || [];
  const scans = S.adminData?.scans || [];
  const logs = S.adminData?.logs || [];
  
  const totalRevenue = S.bookings
    ?.filter(b => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + (b.paidAmount || 0), 0) || 0;

  const stats = [
    { label: 'Total Users', val: users.length || '—', color: 'var(--cyan)', icon: 'user' },
    { label: 'Active Vendors', val: vendors.length || '—', color: 'var(--lime)', icon: 'rf' },
    { label: 'Total Scans', val: scans.length || '—', color: 'var(--rose)', icon: 'zap' },
    { label: 'Total Revenue', val: `₹${totalRevenue.toLocaleString('en-IN')}`, color: 'var(--amber)', icon: 'trend' },
  ];

  return `<div class="page fade-up">
    <div class="ph">
      <div class="ph-title">System Administration</div>
      <div class="ph-sub">Platform-wide analytics, security logs, and entity management</div>
    </div>

    <!-- Admin Stats -->
    <div class="stat-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:12px">
      ${stats.map(s => `
        <div class="stat-card" style="padding:14px 16px">
          <div class="stat-lbl">${s.label}</div>
          <div class="stat-val" style="color:${s.color};font-size:22px">${s.val}</div>
          <div class="stat-bg-icon">${ico(s.icon,28,s.color)}</div>
        </div>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:12px;align-items:start">
      <!-- Recent System Logs -->
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin-bottom:0">Security & Activity Logs</div>
          <button class="btn btn-ghost btn-sm" id="refresh-logs-btn">${ico('rf',11)} Refresh</button>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:11.5px">
            <thead>
              <tr style="border-bottom:1px solid var(--rim);text-align:left">
                <th style="padding:8px;color:var(--text-3)">Timestamp</th>
                <th style="padding:8px;color:var(--text-3)">User</th>
                <th style="padding:8px;color:var(--text-3)">Action</th>
                <th style="padding:8px;color:var(--text-3)">Details</th>
              </tr>
            </thead>
            <tbody>
              ${logs.length === 0 
                ? `<tr><td colspan="4" style="padding:20px;text-align:center;color:var(--text-3)">No logs available</td></tr>`
                : logs.map(l => `
                <tr style="border-bottom:1px solid var(--rim)">
                  <td style="padding:8px;font-family:'JetBrains Mono',monospace;color:var(--text-2);white-space:nowrap">${new Date(l.timestamp).toLocaleTimeString()}</td>
                  <td style="padding:8px;color:var(--text-2);white-space:nowrap">${l.uid?.substring(0,6)}…</td>
                  <td style="padding:8px"><span class="badge" style="background:rgba(0,229,255,.1);color:var(--cyan)">${l.action}</span></td>
                  <td style="padding:8px;color:var(--text-3);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${JSON.stringify(l.data || {})}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Controls -->
      <div>
        <div class="card" style="margin-bottom:12px">
          <div class="card-title">Platform Controls</div>
          <div style="display:grid;gap:8px">
            <button class="btn btn-ghost btn-sm" style="justify-content:flex-start" id="admin-seed-btn">${ico('cpu',12)} Sync Price Database</button>
            <button class="btn btn-ghost btn-sm" style="justify-content:flex-start" id="admin-notify-btn">${ico('bell',12)} Broadcast Notification</button>
            <button class="btn btn-ghost btn-sm" style="justify-content:flex-start;color:var(--rose)">${ico('alert',12,'var(--rose)')} Clear System Cache</button>
          </div>
        </div>

        <div class="card">
          <div class="card-title">User Growth</div>
          <div style="height:140px;display:flex;align-items:flex-end;gap:4px;padding-top:10px">
            ${[20,40,30,60,80,90,100].map(h => `<div style="flex:1;background:var(--cyan);height:${h}%;border-radius:3px 3px 0 0;opacity:.6"></div>`).join('')}
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:9px;color:var(--text-3);font-family:'JetBrains Mono',monospace">
            <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}
