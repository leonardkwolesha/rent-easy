import { useState } from 'react';
import { Shield, ChevronRight } from 'lucide-react';
import LandingShell from '../components/LandingShell';

const PAGE_CSS = `
/* Legal doc layout */
.legal-wrap{display:grid;grid-template-columns:220px 1fr;gap:40px;max-width:1060px;margin:0 auto;padding:72px 5% 96px;align-items:flex-start}
.legal-toc{position:sticky;top:88px}
.toc-label{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--tl);margin-bottom:14px}
.toc-link{display:block;font-size:13px;color:var(--tm);text-decoration:none;padding:7px 12px;border-left:2px solid transparent;transition:all .15s;line-height:1.4}
.toc-link:hover{color:var(--forest);border-left-color:var(--sage)}
.toc-link.tl-active{color:var(--forest);border-left-color:var(--forest);font-weight:600}
.legal-body{}
.legal-sec{margin-bottom:56px;scroll-margin-top:88px}
.legal-sec-title{font-family:'Syne',sans-serif;font-size:20px;font-weight:700;color:var(--td);margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--cream-mid)}
.legal-p{font-size:15px;color:#374151;line-height:1.85;margin-bottom:12px}
.legal-bullet{display:flex;gap:10px;margin-bottom:10px;font-size:15px;color:#374151;line-height:1.7}
.legal-bullet-dot{color:var(--sage);font-weight:700;flex-shrink:0;margin-top:2px}
.legal-strong{color:var(--td);font-weight:600}

/* Info card */
.legal-notice{display:flex;gap:12px;background:rgba(82,183,136,.08);border:1px solid rgba(82,183,136,.2);border-radius:12px;padding:16px 18px;margin-bottom:32px}
.legal-notice p{font-size:14px;color:var(--tm);line-height:1.65;margin:0}

@media(max-width:820px){
  .legal-wrap{grid-template-columns:1fr}
  .legal-toc{display:none}
}
`;

const SECTIONS = [
  { id: 'collection', num: '01', title: 'Information We Collect',
    content: [
      { type: 'p', text: 'We collect information you provide directly when you register, list a property, apply for tenancy, or contact us:' },
      { type: 'bullets', items: [['Account data', 'Full name, email, phone number, and password (hashed with bcrypt — never stored in plain text).'], ['Profile data', 'Agency name, property photos, lease documents, and other content you upload.'], ['Payment data', 'Transaction references and mobile money numbers for M-Pesa/Airtel/Tigopesa payments. We do not store PINs or full card numbers.'], ['Usage data', 'Pages visited, device type, IP address, and browser information via standard server logs.']] },
    ]
  },
  { id: 'use', num: '02', title: 'How We Use Your Information',
    content: [
      { type: 'p', text: 'We use the information we collect to:' },
      { type: 'bullets', items: [['Operate the platform', 'Process rent payments, create leases, send payment reminders, and handle maintenance requests.'], ['Communicate with you', 'Transaction receipts, lease expiry warnings, application updates, and service notices.'], ['Verify identity', 'Confirm landlord, agent, and tenant identities to prevent fraud.'], ['Comply with the law', 'We may retain financial records under Tanzanian Revenue Authority regulations.']] },
      { type: 'p', text: 'We do not sell your personal data to third parties and never will.' },
    ]
  },
  { id: 'sharing', num: '03', title: 'Information Sharing',
    content: [
      { type: 'p', text: 'We share your data only in the following limited circumstances:' },
      { type: 'bullets', items: [['Landlords & tenants', 'When you apply for a property, the landlord sees your name and contact details. When approved, you see the landlord\'s contact details.'], ['Payment processors', 'AzamPay, Flutterwave, or Safaricom (M-Pesa) receive transaction data solely to process payments.'], ['Cloud infrastructure', 'MongoDB Atlas for database hosting and Cloudinary for image storage — data is encrypted in transit and at rest.'], ['Legal obligations', 'We may disclose data if required by court order or to protect user safety.']] },
    ]
  },
  { id: 'security', num: '04', title: 'Data Security',
    content: [
      { type: 'bullets', items: [['HTTPS/TLS', 'All data is transmitted over HTTPS with TLS 1.2+.'], ['Password hashing', 'Passwords are hashed using bcrypt with a minimum cost factor of 12.'], ['JWT tokens', 'Session tokens expire within 7 days.'], ['Database access', 'Restricted to authenticated server-side code behind a VPC.'], ['Audits', 'We conduct regular security reviews and dependency audits.']] },
      { type: 'p', text: 'No system is 100% secure. If you believe your account has been compromised, contact security@rentease.co.tz immediately.' },
    ]
  },
  { id: 'cookies', num: '05', title: 'Cookies & Local Storage',
    content: [
      { type: 'p', text: 'Our web app stores a JWT authentication token in your browser\'s localStorage under the key rp_token. This is necessary to keep you logged in between sessions.' },
      { type: 'p', text: 'We use no third-party advertising cookies. Analytics data is collected using privacy-preserving tools that do not identify individual users. You can clear stored data at any time via your browser settings — doing so will log you out.' },
    ]
  },
  { id: 'rights', num: '06', title: 'Your Rights',
    content: [
      { type: 'p', text: 'Subject to applicable law, you have the right to:' },
      { type: 'bullets', items: [['Access', 'Request the personal data we hold about you.'], ['Correct', 'Update inaccurate or incomplete data via your Profile settings.'], ['Delete', 'Request account deletion by emailing support@rentease.co.tz. Financial records may be retained for up to 7 years.'], ['Export', 'Download your payment history and lease documents from the dashboard.'], ['Withdraw consent', 'Opt out of optional communications at any time.']] },
    ]
  },
  { id: 'retention', num: '07', title: 'Data Retention',
    content: [
      { type: 'bullets', items: [['Active accounts', 'We retain your account data for as long as your account is active.'], ['After deletion', 'Profile and property data deleted within 30 days.'], ['Financial records', 'Payment records and lease documents retained for 7 years as required by Tanzanian law.'], ['Analytics', 'Anonymised, aggregated data may be retained indefinitely.']] },
    ]
  },
  { id: 'contact', num: '08', title: 'Contact & Updates',
    content: [
      { type: 'p', text: 'For questions about this Privacy Policy, please contact us:' },
      { type: 'bullets', items: [['Email', 'privacy@rentease.co.tz'], ['Postal', 'RentEase Ltd, Plot 123, Haile Selassie Road, Dar es Salaam, Tanzania'], ['Phone', '+255 762 000 000']] },
      { type: 'p', text: 'We may update this policy from time to time. Material changes will be communicated via email and the "Last updated" date will be revised. Continued use after the effective date constitutes acceptance.' },
    ]
  },
];

export default function Privacy() {
  const [active, setActive] = useState('collection');

  return (
    <LandingShell animateSelectors=".legal-sec">
      <style>{PAGE_CSS}</style>

      {/* HERO */}
      <section className="phero">
        <div className="phero-bg" />
        <div className="phero-ov" />
        <div className="phero-c">
          <div className="hero-badge"><Shield size={13} /> Privacy Policy</div>
          <h1 className="hero-title">Your Data,<br /><em>Protected.</em></h1>
          <p className="hero-sub">How RentEase collects, uses, and safeguards your personal information across our platform.</p>
          <p style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,.3)' }}>Last updated: 18 May 2026 · Effective immediately</p>
        </div>
      </section>

      {/* NOTICE BAR */}
      <div style={{ background: 'var(--cream)', padding: '0 5%' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', paddingTop: 36 }}>
          <div className="legal-notice">
            <Shield size={18} color="var(--sage)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p>RentEase does not sell your personal data. All payment processing is handled by licensed third-party providers (AzamPay, M-Pesa, Flutterwave) under their own privacy policies.</p>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ background: 'var(--cream)' }}>
        <div className="legal-wrap">
          {/* Sticky TOC sidebar */}
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

          {/* Scrollable body */}
          <main className="legal-body">
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
