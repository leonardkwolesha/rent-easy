import { useNavigate } from 'react-router-dom';
import { Smartphone, Users, Building2, Wrench, CreditCard, Bell, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import LandingShell from '../components/LandingShell';

const PAGE_CSS = `
/* App store badge buttons */
.store-btn{display:inline-block;text-decoration:none;transition:transform .25s,box-shadow .25s;border-radius:10px;overflow:hidden;cursor:pointer}
.store-btn:hover{transform:translateY(-3px);box-shadow:0 14px 36px rgba(0,0,0,.45)}
.store-btn img{display:block;height:56px;width:auto}

/* Two-col feature layout */
.app-feat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.07);border-radius:20px;overflow:hidden;margin-top:52px}
.app-feat-col{background:var(--forest);padding:36px 28px;transition:background .25s}
.app-feat-col:hover{background:var(--emerald)}
.app-feat-head{display:flex;align-items:center;gap:14px;margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.08)}
.app-feat-rows{display:flex;flex-direction:column;gap:14px}
.app-feat-row{display:flex;align-items:flex-start;gap:12px}
.app-feat-dot{width:32px;height:32px;background:rgba(82,183,136,.15);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--sage);flex-shrink:0;margin-top:1px;transition:background .25s}
.app-feat-col:hover .app-feat-dot{background:rgba(82,183,136,.25)}
.app-feat-txt{font-size:14px;color:rgba(255,255,255,.65);line-height:1.6}

/* Stats bar variant */
.app-stats{display:flex;justify-content:center;flex-wrap:wrap;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;margin-top:40px;overflow:hidden}

@media(max-width:760px){
  .app-feat-grid{grid-template-columns:1fr}
}
@media(max-width:600px){
  .store-btn{min-width:160px;padding:11px 20px}
}
`;

const AppStoreBadge = () => (
  <img
    src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
    alt="Download on the App Store"
  />
);

const GooglePlayBadge = () => (
  <img
    src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
    alt="Get it on Google Play"
  />
);

const TENANT_FEATS = [
  { Icon: CreditCard, t: 'Pay rent via M-Pesa, Airtel Money, or Tigopesa' },
  { Icon: FileText, t: 'View and download your lease agreement' },
  { Icon: Wrench, t: 'Submit maintenance requests with photos' },
  { Icon: Bell, t: 'Push notifications for due dates and updates' },
  { Icon: Building2, t: 'Browse and apply for available properties' },
  { Icon: CheckCircle2, t: 'Download payment receipts in PDF' },
];

const LANDLORD_FEATS = [
  { Icon: Building2, t: 'Manage all properties from one dashboard' },
  { Icon: Users, t: 'Review and approve tenant applications instantly' },
  { Icon: CreditCard, t: 'Track payments and overdue rent in real time' },
  { Icon: Wrench, t: 'Handle maintenance requests on the go' },
  { Icon: FileText, t: 'Create leases and generate monthly invoices' },
  { Icon: Bell, t: 'Real-time alerts for payments and applications' },
];

const STEPS = [
  { num: '01', Icon: Smartphone, title: 'Download the App', desc: 'Search "RentEase" on the App Store or Google Play. It\'s free — no credit card required.' },
  { num: '02', Icon: Users, title: 'Create Your Account', desc: 'Sign up as a tenant or landlord/agent. Verification takes under 2 minutes.' },
  { num: '03', Icon: Building2, title: 'Link Your Property', desc: 'Tenants enter their lease code; landlords add their first property in 60 seconds.' },
  { num: '04', Icon: CheckCircle2, title: 'Start Managing', desc: 'Pay rent, approve applications, and track everything in real time.' },
];

export default function GetApp() {
  const navigate = useNavigate();

  return (
    <LandingShell animateSelectors=".fc,.step,.tc,.app-feat-col">
      <style>{PAGE_CSS}</style>

      {/* HERO */}
      <section className="phero">
        <div className="phero-bg" />
        <div className="phero-ov" />
        <div className="phero-c">
          <div className="hero-badge"><span className="hbdot" />Free for iOS &amp; Android</div>
          <h1 className="hero-title">RentEase in<br /><em>Your Pocket</em></h1>
          <p className="hero-sub">Pay rent, track leases, and manage properties from anywhere in East Africa. One tap — done.</p>
          <div className="hero-ctas">
            <a className="store-btn" href="#download">
              <AppStoreBadge />
            </a>
            <a className="store-btn" href="#download">
              <GooglePlayBadge />
            </a>
          </div>
          <div className="app-stats hstat-bar">
            <div className="hstat"><div className="hstat-n">4.8<span>★</span></div><div className="hstat-l">App Store Rating</div></div>
            <div className="hstat"><div className="hstat-n">50<span>K+</span></div><div className="hstat-l">Downloads</div></div>
            <div className="hstat"><div className="hstat-n">99<span>%</span></div><div className="hstat-l">Uptime</div></div>
            <div className="hstat"><div className="hstat-n"><span>Free</span></div><div className="hstat-l">Always</div></div>
          </div>
        </div>
      </section>

      {/* FEATURE GRID — dark forest (same as Home .feats) */}
      <section className="feats">
        <div style={{ textAlign: 'center' }}>
          <div className="eyebrow" style={{ color: 'var(--mint)' }}>Two Apps, One Platform</div>
          <h2 className="stitle" style={{ color: '#fff' }}>Built for every role</h2>
          <p className="ssub" style={{ color: 'rgba(255,255,255,.45)', marginBottom: 0 }}>Separate apps optimised for what tenants and landlords each need to do daily.</p>
        </div>
        <div className="app-feat-grid">
          {/* Tenant column */}
          <div className="app-feat-col">
            <div className="app-feat-head">
              <div className="fi" style={{ marginBottom: 0, flexShrink: 0 }}><Users size={22} /></div>
              <div>
                <div className="fn" style={{ marginBottom: 0 }}>Tenant App</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>For renters &amp; residents</div>
              </div>
            </div>
            <div className="app-feat-rows">
              {TENANT_FEATS.map(({ Icon, t }) => (
                <div className="app-feat-row" key={t}>
                  <div className="app-feat-dot"><Icon size={15} /></div>
                  <span className="app-feat-txt">{t}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Landlord column */}
          <div className="app-feat-col">
            <div className="app-feat-head">
              <div className="fi" style={{ marginBottom: 0, flexShrink: 0 }}><Building2 size={22} /></div>
              <div>
                <div className="fn" style={{ marginBottom: 0 }}>Landlord App</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>For landlords, agents &amp; admins</div>
              </div>
            </div>
            <div className="app-feat-rows">
              {LANDLORD_FEATS.map(({ Icon, t }) => (
                <div className="app-feat-row" key={t}>
                  <div className="app-feat-dot"><Icon size={15} /></div>
                  <span className="app-feat-txt">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW TO GET — cream steps (same as Home .how-sec) */}
      <section className="how-sec">
        <div style={{ textAlign: 'center' }}>
          <div className="eyebrow">Getting Started</div>
          <h2 className="stitle">Up and running in minutes</h2>
          <p className="ssub">From download to first rent payment in under 5 minutes.</p>
        </div>
        <div className="steps">
          {STEPS.map(({ num, Icon, title, desc }) => (
            <div className="step" key={num}>
              <div className="step-n">{num}</div>
              <div className="step-icon"><Icon size={20} /></div>
              <div className="snm">{title}</div>
              <div className="sd2">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DOWNLOAD CTA — dark charcoal (same as Home .testi) */}
      <section id="download" className="testi">
        <div style={{ textAlign: 'center' }}>
          <div className="eyebrow" style={{ color: 'var(--mint)' }}>Download Now</div>
          <h2 className="stitle" style={{ color: '#fff' }}>Ready to get started?</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.45)', marginBottom: 40 }}>Join 50,000+ landlords and tenants across East Africa.</p>
          <div className="hero-ctas">
            <a className="store-btn" href="#">
              <AppStoreBadge />
            </a>
            <a className="store-btn" href="#">
              <GooglePlayBadge />
            </a>
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,.25)' }}>Requires iOS 14+ or Android 8+ · Tanzania, Kenya &amp; Uganda</p>
        </div>
      </section>

      {/* CTA box — cream (same as Home .cta-sec) */}
      <section className="cta-sec">
        <div className="ctabox">
          <h2 className="ctit">Prefer the web dashboard?</h2>
          <p className="csub">Everything available on mobile is also on the web — with richer reports and bulk tools.</p>
          <div className="cbtns">
            <button className="hbtnp" onClick={() => navigate('/register')}>Create Free Account <ArrowRight size={16} /></button>
            <button className="hbtns" onClick={() => navigate('/login')}>Sign In</button>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
