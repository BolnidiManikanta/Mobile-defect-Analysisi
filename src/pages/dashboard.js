import { ico } from '../utils/icons.js';
import { t } from '../utils/i18n.js';

export function renderDashboard(S) {
  const scans    = S.scans || [];
  const bookings = S.bookings || [];
  const pendingBookings = bookings.filter(b => ['requested','accepted','in_progress'].includes(b.status)).length;

  // Advanced Stats Calculation
  const totalScans = scans.length;
  const pendingRepairs = bookings.filter(b => b.status !== 'completed').length;
  const completedRepairs = bookings.filter(b => b.status === 'completed').length;
  
  // Real Revenue Tracking (completed and paid bookings)
  const totalRevenue = bookings
    .filter(b => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + (b.paidAmount || 0), 0);

  // Build monthly chart from real timestamps
  const chart = buildMonthlyChart(scans);
  const maxC  = Math.max(...chart.map(c => c.v), 1);

  // Severity breakdown from real data
  const sevMap = { critical: 0, high: 0, medium: 0, low: 0 };
  scans.forEach(s => { if (sevMap[s.overall_severity] !== undefined) sevMap[s.overall_severity]++; });

  // Recent activity (last 5 scans)
  const recent = scans.slice(0, 5);

  const hour      = new Date().getHours();
  const greetKey  = hour < 12 ? 'greeting_morning' : hour < 17 ? 'greeting_afternoon' : 'greeting_evening';
  const firstName = (S.user?.displayName || 'there').split(' ')[0];

  const statCards = [
    { key: 'total_scans',      val: totalScans,      delta: `+${Math.min(totalScans,3)} ${t('this_week')}`, color: 'var(--cyan)',   icon: 'zap',  subColor: 'var(--cyan)' },
    { key: 'pending_repairs',  val: pendingRepairs,   delta: pendingBookings + ' active slots', color: 'var(--rose)',   icon: 'alert', subColor: 'var(--rose)' },
    { key: 'completed_repairs',val: completedRepairs, delta: totalScans ? Math.round(completedRepairs/Math.max(bookings.length,1)*100)+'% rate' : '—', color: 'var(--green)', icon: 'check', subColor: 'var(--green)' },
    { key: 'revenue',          val: `₹${totalRevenue.toLocaleString('en-IN')}`, delta: t('net_earnings'), color: 'var(--amber)', icon: 'trend', subColor: 'var(--amber)' },
  ];

  return `<div class="page fade-up">
    <div class="ph" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px">
      <div>
        <div class="ph-title">${t(greetKey)}, ${firstName} 👋</div>
        <div class="ph-sub">${new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
      </div>
      <button class="btn btn-lime btn-sm" data-page="detect">${ico('zap',12,'#050608')} ${t('new_scan')}</button>
    </div>

    <div class="stat-grid">
      ${statCards.map(s => `
        <div class="stat-card">
          <div class="stat-lbl">${t(s.key)}</div>
          <div class="stat-val" style="color:${s.color}">${s.val}</div>
          <div class="stat-delta">${s.delta}</div>
          <div class="stat-bg-icon">${ico(s.icon,32,s.subColor)}</div>
        </div>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1.6fr 1fr;gap:10px;margin-bottom:12px">
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div>
            <div class="card-title" style="margin-bottom:0">${t('scan_activity')}</div>
            <div style="font-size:10.5px;color:var(--text-3);font-family:'JetBrains Mono',monospace;margin-top:2px">${t('last_12_months')}</div>
          </div>
          <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:var(--cyan)">${totalScans}</div>
        </div>
        <div class="bar-chart">
          ${chart.map((c,i) => `<div class="bar ${i===chart.length-1?'active':''}" style="height:${Math.max(Math.round(c.v/maxC*100),4)}%" title="${c.v} scans · ${c.label}"></div>`).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:9.5px;color:var(--text-3);font-family:'JetBrains Mono',monospace">
          ${chart.map(c => `<span>${c.short}</span>`).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-title">${t('severity_breakdown')}</div>
        ${[
          { label:'Critical', key:'critical', color:'var(--violet)', count: sevMap.critical },
          { label:'High',     key:'high',     color:'var(--rose)',   count: sevMap.high     },
          { label:'Medium',   key:'medium',   color:'var(--amber)',  count: sevMap.medium   },
          { label:'Low',      key:'low',      color:'var(--green)',  count: sevMap.low      },
        ].map(it => {
          const pct = totalScans ? Math.round(it.count/totalScans*100) : 0;
          return `<div style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:11.5px">
              <span style="color:var(--text-2)">${it.label}</span>
              <span style="color:${it.color};font-family:'JetBrains Mono',monospace;font-size:10.5px">${it.count} · ${pct}%</span>
            </div>
            <div class="sev-bar"><div class="sev-fill" style="width:${pct}%;background:${it.color}"></div></div>
          </div>`;
        }).join('')}

        ${pendingBookings > 0 ? `
        <div style="margin-top:12px;padding:10px;background:rgba(255,184,0,.08);border:1px solid rgba(255,184,0,.2);border-radius:8px">
          <div style="font-size:11.5px;font-weight:600;color:var(--amber);margin-bottom:2px">
            ${ico('bell',11,'var(--amber)')} ${pendingBookings} active booking${pendingBookings>1?'s':''}
          </div>
          <div style="font-size:10.5px;color:var(--text-3)">Tap Bookings to track status</div>
        </div>` : ''}
      </div>
    </div>

    <div class="card" style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div class="card-title" style="margin-bottom:0">${t('recent_scans')}</div>
        <button class="btn btn-ghost btn-sm" data-page="history">${t('view_all')} ${ico('ar',12)}</button>
      </div>
      ${recent.length === 0
        ? `<div class="empty">
            <div class="empty-ico">${ico('zap',20,'var(--text-3)')}</div>
            <div class="empty-title">${t('no_scans_yet')}</div>
          </div>`
        : recent.map(s => `
          <div class="t-row">
            ${s.image_url
              ? `<div class="dev-icon" style="background:none;padding:0;overflow:hidden;border-radius:8px;flex-shrink:0">
                   <img src="${s.image_url}" alt="scan" style="width:36px;height:36px;object-fit:cover;border-radius:8px"/>
                 </div>`
              : `<div class="dev-icon">${ico('phone',15,'var(--text-3)')}</div>`}
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.brand} ${s.model}</div>
              <div style="font-size:10.5px;color:var(--text-3);font-family:'JetBrains Mono',monospace;margin-top:1px">
                ${new Date(s.created_at||Date.now()).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                · ${s.damages?.length||0} issue(s)
              </div>
            </div>
            <span class="badge b-${s.overall_severity}">${s.overall_severity}</span>
            <span class="badge b-${s.repair_status}">${s.repair_status}</span>
            <span class="cost-tag">₹${s.estimated_repair_cost?.min?.toLocaleString('en-IN')||'—'}</span>
          </div>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
      ${[
        { icon:'zap',   title:t('new_scan'),    sub:'Upload photo · AI analysis',      page:'detect',  color:'var(--cyan)'  },
        { icon:'video', title:t('live_scan'),   sub:'Real-time camera detection',       page:'live',    color:'var(--lime)'  },
        { icon:'map',   title:t('find_shops'),  sub:'Repair centers near you',          page:'shops',   color:'var(--green)' },
      ].map(a => `
        <div class="qa-card" data-page="${a.page}">
          <div class="qa-ico">${ico(a.icon,16,a.color)}</div>
          <div>
            <div style="font-size:12.5px;font-weight:700">${a.title}</div>
            <div style="font-size:11px;color:var(--text-3);margin-top:2px">${a.sub}</div>
          </div>
        </div>`).join('')}
    </div>
  </div>`;
}

function buildMonthlyChart(scans) {
  const months = [];
  const now  = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(), month: d.getMonth(),
      label: d.toLocaleString('en-IN',{month:'long'}),
      short: d.toLocaleString('en-IN',{month:'narrow'}),
      v: 0,
    });
  }
  scans.forEach(s => {
    const d = new Date(s.created_at || s.createdAt || Date.now());
    const bucket = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
    if (bucket) bucket.v++;
  });
  // Seed a minimum visible chart if empty
  if (months.every(m => m.v === 0) && scans.length > 0) {
    months[months.length-1].v = scans.length;
  }
  return months;
}
