import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  Building2, TrendingUp, Smartphone, Bell, BedDouble, BarChart3,
  Home as HomeIcon, UserPlus, Wallet, Zap, ArrowRight,
} from 'lucide-react';

const CSS = `
:root{--forest:#1B4332;--emerald:#2D6A4F;--sage:#52B788;--mint:#B7E4C7;--cream:#F5F0E8;--cream-mid:#EDE8DF;--charcoal:#0D1F15;--td:#111827;--tm:#4B5563;--tl:#9CA3AF;--gold:#D4A853}
html{scroll-behavior:smooth}
.lnav{position:fixed;top:0;left:0;right:0;z-index:1000;display:flex;align-items:center;justify-content:space-between;padding:0 5%;height:68px;background:rgba(13,31,21,0.96);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.08)}
.llogo{display:flex;align-items:center;gap:10px;font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#fff;text-decoration:none;letter-spacing:-0.5px}
.llogo-i{width:36px;height:36px;background:var(--sage);border-radius:8px;display:grid;place-items:center;color:var(--forest)}
.lnav-links{display:flex;align-items:center;gap:32px}
.lnav-links a{color:rgba(255,255,255,.7);text-decoration:none;font-size:15px;font-weight:400;transition:color .2s}
.lnav-links a:hover{color:#fff}
.btn-o{padding:9px 20px;border-radius:8px;font-size:14px;font-weight:500;border:1px solid rgba(255,255,255,.3);color:#fff;cursor:pointer;background:transparent;transition:all .2s}
.btn-o:hover{background:rgba(255,255,255,.1)}
.btn-p{padding:9px 22px;border-radius:8px;font-size:14px;font-weight:600;border:none;background:var(--sage);color:var(--forest);cursor:pointer;transition:all .2s}
.btn-p:hover{background:var(--mint);transform:translateY(-1px)}
.hero{min-height:100vh;background:var(--charcoal);position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:120px 5% 80px}
.hero-bg{position:absolute;inset:0;background:url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=80') center/cover no-repeat;opacity:.12}
.hero-ov{position:absolute;inset:0;background:linear-gradient(160deg,rgba(13,31,21,.92) 0%,rgba(27,67,50,.85) 50%,rgba(13,31,21,.95) 100%)}
.hero-c{position:relative;z-index:2;max-width:860px}
.hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(82,183,136,.15);border:1px solid rgba(82,183,136,.3);color:var(--sage);font-size:13px;font-weight:500;padding:6px 16px;border-radius:40px;margin-bottom:28px;animation:fadeDown .6s ease both}
.hbdot{width:6px;height:6px;background:var(--sage);border-radius:50%;display:inline-block;animation:lpulse 2s infinite}
@keyframes lpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}
@keyframes fadeDown{from{opacity:0;transform:translateY(-16px)}to{opacity:1;transform:none}}
@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
.hero-title{font-family:'Syne',sans-serif;font-size:clamp(40px,7vw,80px);font-weight:800;color:#fff;line-height:1.05;letter-spacing:-2px;margin-bottom:22px;animation:fadeUp .7s .1s ease both}
.hero-title em{font-style:normal;color:var(--sage)}
.hero-sub{font-size:clamp(15px,2vw,19px);color:rgba(255,255,255,.6);max-width:580px;margin:0 auto 40px;font-weight:300;line-height:1.7;animation:fadeUp .7s .2s ease both}
.hero-ctas{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;animation:fadeUp .7s .3s ease both}
.hbtnp{padding:14px 32px;border-radius:10px;font-size:16px;font-weight:600;background:var(--sage);color:var(--forest);border:none;cursor:pointer;transition:all .2s;letter-spacing:-.2px;display:inline-flex;align-items:center;gap:8px}
.hbtnp:hover{background:#6fcf97;transform:translateY(-2px);box-shadow:0 8px 24px rgba(82,183,136,.4)}
.hbtns{padding:14px 32px;border-radius:10px;font-size:16px;font-weight:500;background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.2);cursor:pointer;transition:all .2s}
.hbtns:hover{background:rgba(255,255,255,.14)}
.hero-stats{display:flex;justify-content:center;flex-wrap:wrap;margin-top:70px;animation:fadeUp .7s .5s ease both;border:1px solid rgba(255,255,255,.08);border-radius:16px;overflow:hidden;backdrop-filter:blur(8px)}
.hstat{padding:20px 40px;border-right:1px solid rgba(255,255,255,.1);text-align:center;flex:1;min-width:160px}
.hstat:last-child{border-right:none}
.hstat-n{font-family:'Syne',sans-serif;font-size:34px;font-weight:800;color:#fff;line-height:1}
.hstat-n span{color:var(--sage)}
.hstat-l{font-size:12px;color:rgba(255,255,255,.4);margin-top:4px;text-transform:uppercase;letter-spacing:.5px}
.eyebrow{font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--emerald);margin-bottom:12px}
.stitle{font-family:'Syne',sans-serif;font-size:clamp(26px,4vw,46px);font-weight:800;color:var(--td);letter-spacing:-1.5px;line-height:1.1;margin-bottom:16px}
.ssub{font-size:16px;color:var(--tm);max-width:520px;margin:0 auto 52px;line-height:1.7}
.feats{padding:90px 5%;background:var(--forest)}
.fg{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.07);border-radius:20px;overflow:hidden;margin-top:52px}
.fc{background:var(--forest);padding:36px 28px;transition:background .25s;cursor:default}
.fc:hover{background:var(--emerald)}
.fi{width:48px;height:48px;background:rgba(82,183,136,.15);border-radius:12px;display:flex;align-items:center;justify-content:center;color:var(--sage);margin-bottom:18px;transition:background .25s}
.fc:hover .fi{background:rgba(82,183,136,.25)}
.fn{font-family:'Syne',sans-serif;font-size:19px;font-weight:700;color:#fff;margin-bottom:10px}
.fd{font-size:14px;color:rgba(255,255,255,.5);line-height:1.65}
.how-sec{padding:90px 5%;background:var(--cream)}
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-top:56px}
.step{position:relative;padding:28px;background:#fff;border-radius:16px;border:1px solid rgba(0,0,0,.06);transition:box-shadow .25s,transform .25s}
.step:hover{box-shadow:0 8px 28px rgba(27,67,50,.1);transform:translateY(-3px)}
.step-n{font-family:'Syne',sans-serif;font-size:52px;font-weight:800;color:var(--cream-mid);line-height:1;margin-bottom:12px}
.step-icon{width:44px;height:44px;background:rgba(27,67,50,.08);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--forest);margin-bottom:14px}
.snm{font-family:'Syne',sans-serif;font-size:17px;font-weight:700;color:var(--td);margin-bottom:8px}
.sd2{font-size:13px;color:var(--tm);line-height:1.65}
.testi{padding:90px 5%;background:var(--charcoal)}
.tg{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:52px}
.tc{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:28px;transition:background .25s,transform .25s}
.tc:hover{background:rgba(255,255,255,.07);transform:translateY(-2px)}
.tst{color:var(--gold);font-size:14px;margin-bottom:16px;letter-spacing:2px}
.tq{font-size:15px;color:rgba(255,255,255,.7);line-height:1.7;margin-bottom:20px;font-style:italic}
.ta{display:flex;align-items:center;gap:12px}
.tav{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-size:14px;font-weight:700;color:#fff;font-family:'Syne',sans-serif}
.tnm{font-size:14px;font-weight:600;color:#fff}
.trl{font-size:12px;color:rgba(255,255,255,.35)}
.cta-sec{padding:110px 5%;text-align:center;background:var(--cream)}
.ctabox{background:var(--forest);border-radius:28px;padding:72px 5%;max-width:860px;margin:0 auto;position:relative;overflow:hidden}
.ctabox::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 70% 50%,rgba(82,183,136,.15) 0%,transparent 60%)}
.ctit{font-family:'Syne',sans-serif;font-size:clamp(26px,4vw,48px);font-weight:800;color:#fff;letter-spacing:-1.5px;position:relative;margin-bottom:16px}
.csub{font-size:16px;color:rgba(255,255,255,.55);position:relative;margin-bottom:32px}
.cbtns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;position:relative}
.lfoot{background:var(--charcoal);border-top:1px solid rgba(255,255,255,.06);padding:40px 5%;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px}
.fband{font-family:'Syne',sans-serif;font-size:18px;font-weight:700;color:#fff;display:flex;align-items:center;gap:10px}
.fband small{display:block;font-size:12px;color:rgba(255,255,255,.3);font-weight:400;margin-top:2px;font-family:'DM Sans',sans-serif}
.flinks{display:flex;gap:24px;flex-wrap:wrap}
.flinks a{font-size:13px;color:rgba(255,255,255,.4);text-decoration:none;transition:color .2s}
.flinks a:hover{color:#fff}
.fcopy{font-size:12px;color:rgba(255,255,255,.25)}
@media(max-width:900px){
  .fg{grid-template-columns:repeat(2,1fr)}
  .tg{grid-template-columns:1fr}
  .steps{grid-template-columns:repeat(2,1fr)}
  .lnav-links{display:none}
  .hero-stats{max-width:480px}
}
@media(max-width:600px){
  .fg{grid-template-columns:1fr}
  .steps{grid-template-columns:1fr}
  .hstat{padding:14px 20px}
  .hstat-n{font-size:26px}
  .hero-ctas{flex-direction:column;align-items:center}
  .cbtns{flex-direction:column;align-items:center}
  .lfoot{flex-direction:column;text-align:center}
  .flinks{justify-content:center}
}
`;

const FEATURES = [
  { Icon: Building2, title: 'Property Management', desc: 'Manage apartments, villas, and hostel blocks. Unit-level tracking with bed inventory for dormitory properties.' },
  { Icon: TrendingUp, title: 'Rent Tracking', desc: 'Automated invoicing, grace period enforcement, late fee calculation, and real-time arrears dashboards.' },
  { Icon: Smartphone, title: 'M-Pesa Integration', desc: 'STK Push payments directly from tenant phone. Automatic receipt generation and invoice reconciliation.' },
  { Icon: Bell, title: 'Smart Notifications', desc: 'Push, SMS, and email reminders at 7d, 3d, 1d before due date. Overdue escalation at Day 1, 5, and 14.' },
  { Icon: BedDouble, title: 'Hostel Module', desc: 'Bed-level occupancy grid, daily/weekly/monthly billing, visual room map, and guest check-in/out workflows.' },
  { Icon: BarChart3, title: 'Analytics & Reports', desc: 'Revenue trends, occupancy rates, landlord statements, and one-click PDF/Excel exports for any period.' },
];

const STEPS = [
  { num: '01', Icon: Building2, title: 'Add Properties', desc: 'Import from CSV or add manually. Set units, rents, and grace periods.' },
  { num: '02', Icon: UserPlus, title: 'Onboard Tenants', desc: 'Digital KYC, e-signed lease — all in under 5 minutes on mobile.' },
  { num: '03', Icon: Wallet, title: 'Connect Payments', desc: 'Link your Safaricom Paybill or Flutterwave. Test with sandbox in minutes.' },
  { num: '04', Icon: Zap, title: 'Automate Everything', desc: 'Invoices, reminders, receipts, and reports run automatically every month.' },
];

const TESTIMONIALS = [
  { stars: '★★★★★', quote: '"RentEase cut our rent collection time from 3 weeks to 3 days. The M-Pesa STK Push is a game changer for our tenants in Dar es Salaam."', initials: 'AM', name: 'Amina Mwangi', role: 'Property Manager · Dar es Salaam', bg: '#2D6A4F', color: '#fff' },
  { stars: '★★★★★', quote: '"Running a 120-bed hostel was chaos before RentEase. Now the bed grid shows me everything — who\'s in, who owes, who\'s checking out tomorrow."', initials: 'KO', name: 'Kwame Osei', role: 'Hostel Owner · Mbeya', bg: '#1B4332', color: '#fff' },
  { stars: '★★★★☆', quote: '"The automated overdue escalation recovered TZS 14M in arrears in the first month. The landlords love the monthly reports."', initials: 'FN', name: 'Fatuma Nakato', role: 'Finance Officer · Arusha', bg: '#52B788', color: '#1B4332' },
];

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const style = document.createElement('style');
    style.dataset.id = 'home-landing';
    style.textContent = CSS;
    document.head.appendChild(style);
    document.body.style.overflowX = 'hidden';

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; }
      });
    }, { threshold: 0.08 });

    document.querySelectorAll('.fc,.step,.tc').forEach(el => {
      el.style.opacity = '0'; el.style.transform = 'translateY(22px)';
      el.style.transition = 'opacity .5s ease,transform .5s ease';
      obs.observe(el);
    });

    return () => {
      document.head.removeChild(style);
      document.body.style.overflowX = '';
      obs.disconnect();
    };
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#F5F0E8' }}>
      <style>{CSS}</style>

      {/* NAV */}
      <nav className="lnav">
        <a className="llogo" href="/">
          <div className="llogo-i"><HomeIcon size={18} /></div>RentEase
        </a>
        <div className="lnav-links">
          <a href="#features">Features</a>
          <a href="/properties">Properties</a>
          <a href="#how">How It Works</a>
          <a href="/get-app">Get App</a>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-o" onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn-p" onClick={() => navigate('/register')}>Start Free</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-ov" />
        <div className="hero-c">
          <div className="hero-badge"><span className="hbdot" />Now supporting M-Pesa &amp; Flutterwave payments</div>
          <h1 className="hero-title">Manage Every<br /><em>Rental. Effortlessly.</em></h1>
          <p className="hero-sub">The all-in-one platform for real estate and hostel management. Track rent, automate payments, and keep tenants happy — on web and mobile.</p>
          <div className="hero-ctas">
            <button className="hbtnp" onClick={() => navigate('/dashboard')}>Open Dashboard <ArrowRight size={16} /></button>
            <button className="hbtns" onClick={() => navigate('/register')}>Create Free Account</button>
            <button className="hbtns" onClick={() => navigate('/get-app')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Smartphone size={15} /> Get the App
            </button>
          </div>
        </div>
        <div className="hero-stats">
          <div className="hstat"><div className="hstat-n">1,200<span>+</span></div><div className="hstat-l">Properties Managed</div></div>
          <div className="hstat"><div className="hstat-n">95<span>%</span></div><div className="hstat-l">On-time Payments</div></div>
          <div className="hstat"><div className="hstat-n">TZS 4.2<span>B</span></div><div className="hstat-l">Rent Collected</div></div>
          <div className="hstat"><div className="hstat-n">60<span>%</span></div><div className="hstat-l">Less Admin Time</div></div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="feats" id="features">
        <div style={{ textAlign: 'center' }}>
          <div className="eyebrow" style={{ color: 'var(--mint)' }}>Core Modules</div>
          <h2 className="stitle" style={{ color: '#fff' }}>Built for East Africa's<br />property landscape</h2>
          <p className="ssub" style={{ color: 'rgba(255,255,255,.45)' }}>Every feature designed around real workflows — from M-Pesa collections to hostel bed management.</p>
        </div>
        <div className="fg">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div className="fc" key={title}>
              <div className="fi"><Icon size={22} /></div>
              <div className="fn">{title}</div>
              <div className="fd">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-sec" id="how">
        <div style={{ textAlign: 'center' }}>
          <div className="eyebrow">Getting Started</div>
          <h2 className="stitle">Up and running in hours</h2>
          <p className="ssub">From onboarding to first automated rent collection.</p>
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

      {/* TESTIMONIALS */}
      <section className="testi">
        <div style={{ textAlign: 'center' }}>
          <div className="eyebrow" style={{ color: 'var(--mint)' }}>What Managers Say</div>
          <h2 className="stitle" style={{ color: '#fff' }}>Trusted across East Africa</h2>
        </div>
        <div className="tg">
          {TESTIMONIALS.map(({ stars, quote, initials, name, role, bg, color }) => (
            <div className="tc" key={name}>
              <div className="tst">{stars}</div>
              <p className="tq">{quote}</p>
              <div className="ta">
                <div className="tav" style={{ background: bg, color }}>{initials}</div>
                <div><div className="tnm">{name}</div><div className="trl">{role}</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* GET THE APP */}
      <section style={{ padding: '80px 5%', background: '#F5F0E8', textAlign: 'center' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#2D6A4F', marginBottom: 12 }}>Mobile App</div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(26px,4vw,44px)', fontWeight: 800, color: '#0D1F15', letterSpacing: -1.5, marginBottom: 14 }}>
            Manage rent from your phone
          </h2>
          <p style={{ fontSize: 16, color: '#4B5563', maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Tenants pay via M-Pesa with one tap. Landlords approve applications on the go. Available free on iOS and Android.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/get-app')} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 30px', borderRadius: 12, background: '#0D1F15', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1B4332'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#0D1F15'; e.currentTarget.style.transform = 'none'; }}>
              <Smartphone size={18} /> Download the App
            </button>
            <button onClick={() => navigate('/get-app')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, background: 'transparent', color: '#0D1F15', border: '1.5px solid rgba(13,31,21,0.3)', fontSize: 15, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#0D1F15'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(13,31,21,0.3)'}>
              iOS &amp; Android · Free →
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-sec">
        <div className="ctabox">
          <h2 className="ctit">Ready to modernise your<br />rental business?</h2>
          <p className="csub">Start your 30-day free trial. No credit card required.</p>
          <div className="cbtns">
            <button className="hbtnp" onClick={() => navigate('/register')}>Get Started Free <ArrowRight size={16} /></button>
            <button className="hbtns" onClick={() => navigate('/login')}>Sign In</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lfoot">
        <div>
          <div className="fband">
            <div style={{ width: 30, height: 30, background: '#52B788', borderRadius: 7, display: 'grid', placeItems: 'center', color: '#1B4332' }}>
              <HomeIcon size={16} />
            </div>
            RentEase
          </div>
          <small style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', marginTop: 4, display: 'block' }}>© 2026 RentEase Ltd. All rights reserved.</small>
        </div>
        <div className="flinks">
          <a href="/get-app">Get App</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/api-docs">API Docs</a>
          <a href="/support">Support</a>
        </div>
        <div className="fcopy">Built for East Africa</div>
      </footer>
    </div>
  );
}
