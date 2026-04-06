import { ico } from '../utils/icons.js';

export function renderPayment() {
  const plans = [
    {
      name: 'Free', price: '₹0', period: 'forever',
      features: [
        '5 AI scans per month',
        'Basic damage detection',
        'Scan history (30 days)',
        'Email support',
        'Repair shop directory',
      ],
      cta: 'Current Plan', ctaClass: 'btn-ghost',
    },
    {
      name: 'Pro', price: '₹499', period: '/ month', featured: true,
      features: [
        'Unlimited AI scans',
        'Priority detection queue',
        'Live camera detection',
        'Export PDF reports',
        'Full scan history',
        'WhatsApp scan alerts',
        'Advanced damage heatmap',
      ],
      cta: 'Upgrade to Pro', ctaClass: 'btn-primary',
    },
    {
      name: 'Business', price: '₹1,499', period: '/ month',
      features: [
        'Everything in Pro',
        'Team dashboard (5 users)',
        'API access & webhooks',
        'Custom branding',
        'SLA support (4hr response)',
        'Bulk CSV export',
        'Dedicated account manager',
      ],
      cta: 'Contact Sales', ctaClass: 'btn-ghost',
    },
  ];

  const faqs = [
    { q: 'What counts as one scan?', a: 'Each image upload or live capture that generates an AI damage report counts as one scan. Re-analyzing the same image does not count again.' },
    { q: 'Can I cancel anytime?', a: 'Yes — cancel from Settings at any time. You keep all Pro features until the end of the billing period. No lock-in, no questions asked.' },
    { q: 'Is my data secure?', a: 'All scans are encrypted at rest and in transit. Firebase Security Rules ensure only you can access your data. We never sell or share your images.' },
    { q: 'Do you offer refunds?', a: 'Full refund within 7 days if you are not satisfied, no questions asked. After 7 days, refunds are at our discretion.' },
    { q: 'Can I use SmartSep AI offline?', a: 'The AI detection requires an internet connection. Past scan results are cached locally and viewable offline.' },
  ];

  return `<div class="page fade-up">
    <div class="ph" style="text-align:center;max-width:580px;margin:0 auto 28px">
      <div class="ph-title">Simple, Transparent Pricing</div>
      <div class="ph-sub">Start free · upgrade anytime · cancel whenever you want · no hidden fees</div>
    </div>

    <div class="plan-grid">
      ${plans.map(p => `
        <div class="plan-card ${p.featured ? 'featured' : ''}">
          ${p.featured ? `<div class="plan-featured-badge">MOST POPULAR</div>` : ''}
          <div style="font-family:'JetBrains Mono',monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);margin-bottom:6px">${p.name}</div>
          <div class="plan-price" style="color:${p.featured?'var(--cyan)':'var(--text)'}">
            ${p.price}<span style="font-size:14px;font-weight:400;color:var(--text-3);margin-left:2px">${p.period}</span>
          </div>
          <div style="height:1px;background:var(--rim);margin:16px 0"></div>
          ${p.features.map(f => `
            <div class="plan-feature">
              <div class="pf-check">${ico('check',8,'var(--green)')}</div>
              <span>${f}</span>
            </div>`).join('')}
          <div style="margin-top:20px">
            <button class="btn ${p.ctaClass}" style="width:100%">${p.cta}</button>
          </div>
        </div>`).join('')}
    </div>

    <div class="card" style="margin-top:22px;max-width:640px">
      <div class="card-title">Frequently Asked Questions</div>
      ${faqs.map((faq, i) => `
        <div style="padding:13px 0;border-bottom:${i < faqs.length-1 ? '1px solid var(--rim)' : 'none'}">
          <div style="font-size:13px;font-weight:600;margin-bottom:4px">${faq.q}</div>
          <div style="font-size:12px;color:var(--text-2);line-height:1.65">${faq.a}</div>
        </div>`).join('')}
    </div>
  </div>`;
}
