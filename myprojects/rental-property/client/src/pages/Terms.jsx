import { useState } from 'react';
import { FileText } from 'lucide-react';
import LandingShell from '../components/LandingShell';

const PAGE_CSS = `
.legal-wrap{display:grid;grid-template-columns:220px 1fr;gap:40px;max-width:1060px;margin:0 auto;padding:72px 5% 96px;align-items:flex-start}
.legal-toc{position:sticky;top:88px}
.toc-label{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--tl);margin-bottom:14px}
.toc-link{display:block;font-size:13px;color:var(--tm);text-decoration:none;padding:7px 12px;border-left:2px solid transparent;transition:all .15s;line-height:1.4}
.toc-link:hover{color:var(--forest);border-left-color:var(--sage)}
.toc-link.tl-active{color:var(--forest);border-left-color:var(--forest);font-weight:600}
.legal-sec{margin-bottom:56px;scroll-margin-top:88px}
.legal-sec-title{font-family:'Syne',sans-serif;font-size:20px;font-weight:700;color:var(--td);margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--cream-mid)}
.legal-p{font-size:15px;color:#374151;line-height:1.85;margin-bottom:12px}
.legal-bullet{display:flex;gap:10px;margin-bottom:10px;font-size:15px;color:#374151;line-height:1.7}
.legal-bullet-dot{color:var(--sage);font-weight:700;flex-shrink:0;margin-top:2px}
.legal-strong{color:var(--td);font-weight:600}
.terms-warn{display:flex;gap:12px;background:rgba(212,168,83,.08);border:1px solid rgba(212,168,83,.25);border-radius:12px;padding:16px 18px;margin-bottom:32px;font-size:14px;color:var(--tm);line-height:1.65}
@media(max-width:820px){
  .legal-wrap{grid-template-columns:1fr}
  .legal-toc{display:none}
}
`;

const SECTIONS = [
  { id: 'acceptance', num: '01', title: 'Acceptance of Terms',
    content: [
      { type: 'p', text: 'By accessing or using RentEase ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to all of these Terms, do not use the Platform.' },
      { type: 'p', text: 'These Terms constitute a legally binding agreement between you and RentEase Ltd, a company registered in Tanzania. We reserve the right to update these Terms at any time. Material changes will be communicated via email. Continued use after changes are effective constitutes acceptance.' },
    ]
  },
  { id: 'description', num: '02', title: 'Service Description',
    content: [
      { type: 'p', text: 'RentEase is a software-as-a-service (SaaS) property management platform that enables:' },
      { type: 'bullets', items: [
        ['Landlords and agents', 'List properties, manage tenant applications, create leases, track rent payments, and handle maintenance requests.'],
        ['Tenants', 'Search for properties, submit applications, pay rent via mobile money, and submit maintenance requests.'],
        ['Admins', 'Oversee platform users, approve agent accounts, and access aggregate statistics.'],
      ]},
      { type: 'p', text: 'RentEase is a technology platform only. We are not a real estate agent, property manager, or party to any lease agreement between landlords and tenants.' },
    ]
  },
  { id: 'accounts', num: '03', title: 'User Accounts',
    content: [
      { type: 'p', text: 'To access most features, you must create an account. When registering, you agree to:' },
      { type: 'bullets', items: [
        ['Accurate information', 'Provide current and complete information and keep it up to date.'],
        ['Account security', 'Maintain the security of your password and accept responsibility for all activity under your account.'],
        ['Breach notification', 'Notify us immediately at support@rentease.co.tz if you suspect unauthorised use.'],
        ['Single account', 'Not create multiple accounts to circumvent restrictions or bans.'],
      ]},
      { type: 'p', text: 'Agent accounts require administrator approval before gaining full access. We reserve the right to suspend or terminate accounts that violate these Terms.' },
    ]
  },
  { id: 'use', num: '04', title: 'Acceptable Use',
    content: [
      { type: 'p', text: 'You may not use RentEase to:' },
      { type: 'bullets', items: [
        ['False listings', 'Post false, misleading, or fraudulent property listings.'],
        ['Off-platform payments', 'Collect payments outside the Platform to circumvent our audit trail.'],
        ['Illegal content', 'Upload content that is illegal, defamatory, harassing, or infringes third-party rights.'],
        ['Unauthorised access', 'Attempt to access other users\' accounts or our server infrastructure.'],
        ['Automation', 'Use bots or scrapers to extract data without written consent.'],
        ['Reselling', 'Resell or white-label the Platform without a separate commercial agreement.'],
      ]},
    ]
  },
  { id: 'payments', num: '05', title: 'Payments & Fees',
    content: [
      { type: 'bullets', items: [
        ['Tenant payments', 'Processed by AzamPay, Flutterwave, or Safaricom M-Pesa. Transaction fees, if any, are displayed before confirmation.'],
        ['Platform fees', 'Landlord subscriptions (if applicable) are billed monthly in TZS.'],
        ['Refunds', 'Rent payments are not refundable through RentEase. Disputes must be resolved directly between landlord and tenant.'],
        ['Failed payments', 'RentEase is not liable for failed mobile money transactions caused by network issues, insufficient balance, or incorrect details.'],
      ]},
    ]
  },
  { id: 'ip', num: '06', title: 'Intellectual Property',
    content: [
      { type: 'p', text: 'All content, software, designs, and trademarks displayed on RentEase are the exclusive property of RentEase Ltd or its licensors.' },
      { type: 'p', text: 'You retain ownership of content you upload. By uploading, you grant RentEase a non-exclusive, royalty-free licence to store, display, and process that content solely to provide the Platform\'s services.' },
    ]
  },
  { id: 'liability', num: '07', title: 'Limitation of Liability',
    content: [
      { type: 'p', text: 'To the maximum extent permitted by Tanzanian law, RentEase Ltd shall not be liable for:' },
      { type: 'bullets', items: [
        ['Indirect damages', 'Indirect, incidental, special, or consequential damages from use of or inability to use the Platform.'],
        ['Landlord/tenant disputes', 'Disputes regarding rent, property condition, lease terms, or eviction.'],
        ['Data loss', 'Loss of data due to circumstances outside our reasonable control.'],
        ['Payment failures', 'Failed or delayed mobile money transactions processed by third-party providers.'],
      ]},
      { type: 'p', text: 'Our total liability to you for any claim shall not exceed the total fees paid by you to RentEase in the 12 months preceding the claim.' },
    ]
  },
  { id: 'termination', num: '08', title: 'Termination',
    content: [
      { type: 'bullets', items: [
        ['By you', 'Delete your account at any time by contacting support@rentease.co.tz. Active lease obligations are not automatically cancelled.'],
        ['By us', 'We may suspend or terminate your account immediately if you materially breach these Terms or engage in fraudulent activity.'],
        ['After termination', 'Your right to use the Platform ceases immediately. Data is retained as described in our Privacy Policy.'],
      ]},
    ]
  },
  { id: 'law', num: '09', title: 'Governing Law',
    content: [
      { type: 'p', text: 'These Terms are governed by the laws of the United Republic of Tanzania. Any dispute arising from or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of Dar es Salaam, Tanzania.' },
      { type: 'p', text: 'We encourage you to contact us first at legal@rentease.co.tz before initiating formal legal proceedings. Many disputes can be resolved quickly through direct communication.' },
    ]
  },
  { id: 'contact', num: '10', title: 'Contact',
    content: [
      { type: 'bullets', items: [
        ['Email', 'legal@rentease.co.tz'],
        ['Postal', 'RentEase Ltd, Plot 123, Haile Selassie Road, Dar es Salaam, Tanzania'],
        ['Phone', '+255 762 000 000'],
      ]},
    ]
  },
];

export default function Terms() {
  const [active, setActive] = useState('acceptance');

  return (
    <LandingShell animateSelectors=".legal-sec">
      <style>{PAGE_CSS}</style>

      {/* HERO */}
      <section className="phero">
        <div className="phero-bg" />
        <div className="phero-ov" />
        <div className="phero-c">
          <div className="hero-badge"><FileText size={13} /> Terms of Service</div>
          <h1 className="hero-title">Clear Rules,<br /><em>Fair Platform.</em></h1>
          <p className="hero-sub">The terms that govern your use of RentEase — written in plain language, not legal jargon.</p>
          <p style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,.3)' }}>Last updated: 18 May 2026 · Effective immediately</p>
        </div>
      </section>

      {/* NOTICE */}
      <div style={{ background: 'var(--cream)', padding: '0 5%' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', paddingTop: 36 }}>
          <div className="terms-warn">
            <span style={{ fontSize: 18 }}>⚠️</span>
            <span>These Terms constitute a legally binding agreement. By using RentEase, you confirm you are at least 18 years old and authorised to enter into this agreement.</span>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ background: 'var(--cream)' }}>
        <div className="legal-wrap">
          <aside className="legal-toc">
            <div className="toc-label">Contents</div>
            {SECTIONS.map(({ id, num, title }) => (
              <a key={id} href={`#${id}`} className={`toc-link${active === id ? ' tl-active' : ''}`}
                onClick={() => setActive(id)}>
                <span style={{ color: 'var(--tl)', marginRight: 8, fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>{num}</span>
                {title}
              </a>
            ))}
          </aside>

          <main>
            {SECTIONS.map(({ id, num, title, content }) => (
              <section key={id} id={id} className="legal-sec step" style={{ padding: '28px 32px' }}>
                <div style={{ fontSize: 42, fontWeight: 800, color: 'var(--cream-mid)', lineHeight: 1, marginBottom: 10, fontFamily: "'Syne',sans-serif" }}>{num}</div>
                <div className="legal-sec-title">{title}</div>
                {content.map((block, i) => {
                  if (block.type === 'p') return <p key={i} className="legal-p">{block.text}</p>;
                  if (block.type === 'bullets') return (
                    <div key={i}>
                      {block.items.map(([bold, text]) => (
                        <div key={bold} className="legal-bullet">
                          <span className="legal-bullet-dot">•</span>
                          <span><span className="legal-strong">{bold}:</span> {text}</span>
                        </div>
                      ))}
                    </div>
                  );
                  return null;
                })}
              </section>
            ))}
          </main>
        </div>
      </div>
    </LandingShell>
  );
}
