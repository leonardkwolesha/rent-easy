import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Menu, X } from 'lucide-react';

// Full design system shared with Home.jsx — same variables, same classes
export const CSS = `
:root{--forest:#1B4332;--emerald:#2D6A4F;--sage:#52B788;--mint:#B7E4C7;--cream:#F5F0E8;--cream-mid:#EDE8DF;--charcoal:#0D1F15;--td:#111827;--tm:#4B5563;--tl:#9CA3AF;--gold:#D4A853}
html{scroll-behavior:smooth}
body{margin:0;overflow-x:hidden}
*{box-sizing:border-box}

/* ── Nav ── */
.lnav{position:fixed;top:0;left:0;right:0;z-index:1000;display:flex;align-items:center;justify-content:space-between;padding:0 5%;height:68px;background:rgba(13,31,21,0.96);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.08)}
.llogo{display:flex;align-items:center;gap:10px;font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#fff;text-decoration:none;letter-spacing:-0.5px}
.llogo-i{width:36px;height:36px;background:var(--sage);border-radius:8px;display:grid;place-items:center;color:var(--forest)}
.lnav-links{display:flex;align-items:center;gap:28px}
.lnav-links a{color:rgba(255,255,255,.7);text-decoration:none;font-size:14px;font-weight:400;transition:color .2s}
.lnav-links a:hover,.lnav-links a.lnav-active{color:#fff}
.lnav-btns{display:flex;gap:12px}
.btn-o{padding:9px 20px;border-radius:8px;font-size:14px;font-weight:500;border:1px solid rgba(255,255,255,.3);color:#fff;cursor:pointer;background:transparent;transition:all .2s;font-family:'DM Sans',sans-serif}
.btn-o:hover{background:rgba(255,255,255,.1)}
.btn-p{padding:9px 22px;border-radius:8px;font-size:14px;font-weight:600;border:none;background:var(--sage);color:var(--forest);cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif}
.btn-p:hover{background:var(--mint);transform:translateY(-1px)}
.nav-ham{display:none;background:none;border:none;cursor:pointer;color:#fff;padding:6px;align-items:center;justify-content:center}

/* ── Mobile drawer ── */
.mob-drawer{position:fixed;top:68px;left:0;right:0;bottom:0;z-index:999;background:rgba(0,0,0,.55);backdrop-filter:blur(4px)}
.mob-panel{background:var(--charcoal);border-bottom:1px solid rgba(255,255,255,.08);padding:12px}
.mob-panel a{display:block;color:rgba(255,255,255,.78);text-decoration:none;font-size:15px;font-weight:500;padding:12px 16px;border-radius:10px;transition:background .15s}
.mob-panel a:hover{background:rgba(255,255,255,.07);color:#fff}
.mob-divider{height:1px;background:rgba(255,255,255,.08);margin:8px 0}
.mob-btn-p{display:block;width:100%;padding:13px;border-radius:10px;background:var(--sage);color:var(--forest);font-size:15px;font-weight:700;border:none;cursor:pointer;margin-top:4px;font-family:'DM Sans',sans-serif;transition:background .2s}
.mob-btn-p:hover{background:var(--mint)}

/* ── Animations ── */
@keyframes fadeDown{from{opacity:0;transform:translateY(-16px)}to{opacity:1;transform:none}}
@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes lpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}

/* ── Page hero (subpages — shorter than Home full-height hero) ── */
.phero{background:var(--charcoal);position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:100px 5% 80px}
.phero-bg{position:absolute;inset:0;background:url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=80') center/cover no-repeat;opacity:.1}
.phero-ov{position:absolute;inset:0;background:linear-gradient(160deg,rgba(13,31,21,.94) 0%,rgba(27,67,50,.87) 50%,rgba(13,31,21,.96) 100%)}
.phero-c{position:relative;z-index:2;max-width:720px;animation:fadeUp .65s ease both}

/* ── Hero badge (reuse from Home) ── */
.hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(82,183,136,.15);border:1px solid rgba(82,183,136,.3);color:var(--sage);font-size:13px;font-weight:500;padding:6px 16px;border-radius:40px;margin-bottom:24px}
.hbdot{width:6px;height:6px;background:var(--sage);border-radius:50%;display:inline-block;animation:lpulse 2s infinite}

/* ── Page title / subtitle (reuse from Home) ── */
.hero-title{font-family:'Syne',sans-serif;font-size:clamp(34px,5.5vw,68px);font-weight:800;color:#fff;line-height:1.05;letter-spacing:-2px;margin-bottom:16px}
.hero-title em{font-style:normal;color:var(--sage)}
.hero-sub{font-size:clamp(15px,2vw,18px);color:rgba(255,255,255,.58);max-width:560px;margin:0 auto;font-weight:300;line-height:1.75}
.hero-ctas{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:32px}

/* ── Shared section labels ── */
.eyebrow{font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--emerald);margin-bottom:12px}
.stitle{font-family:'Syne',sans-serif;font-size:clamp(26px,4vw,46px);font-weight:800;color:var(--td);letter-spacing:-1.5px;line-height:1.1;margin-bottom:16px}
.ssub{font-size:16px;color:var(--tm);max-width:520px;margin:0 auto 52px;line-height:1.7}

/* ── Buttons ── */
.hbtnp{padding:14px 32px;border-radius:10px;font-size:16px;font-weight:600;background:var(--sage);color:var(--forest);border:none;cursor:pointer;transition:all .2s;letter-spacing:-.2px;display:inline-flex;align-items:center;gap:8px;font-family:'DM Sans',sans-serif}
.hbtnp:hover{background:#6fcf97;transform:translateY(-2px);box-shadow:0 8px 24px rgba(82,183,136,.4)}
.hbtns{padding:14px 32px;border-radius:10px;font-size:16px;font-weight:500;background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.2);cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif}
.hbtns:hover{background:rgba(255,255,255,.14)}
.hbtnsd{padding:13px 28px;border-radius:10px;font-size:15px;font-weight:500;background:transparent;color:var(--charcoal);border:1.5px solid rgba(13,31,21,.3);cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:8px;font-family:'DM Sans',sans-serif}
.hbtnsd:hover{border-color:var(--charcoal);background:rgba(13,31,21,.04)}

/* ── Dark feature grid (same as .feats in Home) ── */
.feats{padding:90px 5%;background:var(--forest)}
.fg{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.07);border-radius:20px;overflow:hidden;margin-top:52px}
.fc{background:var(--forest);padding:36px 28px;transition:background .25s;cursor:default}
.fc:hover{background:var(--emerald)}
.fi{width:48px;height:48px;background:rgba(82,183,136,.15);border-radius:12px;display:flex;align-items:center;justify-content:center;color:var(--sage);margin-bottom:18px;transition:background .25s}
.fc:hover .fi{background:rgba(82,183,136,.25)}
.fn{font-family:'Syne',sans-serif;font-size:19px;font-weight:700;color:#fff;margin-bottom:10px}
.fd{font-size:14px;color:rgba(255,255,255,.5);line-height:1.65}

/* ── Cream steps grid (same as .how-sec in Home) ── */
.how-sec{padding:90px 5%;background:var(--cream)}
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-top:56px}
.step{position:relative;padding:28px;background:#fff;border-radius:16px;border:1px solid rgba(0,0,0,.06);transition:box-shadow .25s,transform .25s}
.step:hover{box-shadow:0 8px 28px rgba(27,67,50,.1);transform:translateY(-3px)}
.step-n{font-family:'Syne',sans-serif;font-size:52px;font-weight:800;color:var(--cream-mid);line-height:1;margin-bottom:12px}
.step-icon{width:44px;height:44px;background:rgba(27,67,50,.08);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--forest);margin-bottom:14px}
.snm{font-family:'Syne',sans-serif;font-size:17px;font-weight:700;color:var(--td);margin-bottom:8px}
.sd2{font-size:13px;color:var(--tm);line-height:1.65}

/* ── Dark testimonial grid (same as .testi in Home) ── */
.testi{padding:90px 5%;background:var(--charcoal)}
.tg{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:52px}
.tc{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:28px;transition:background .25s,transform .25s}
.tc:hover{background:rgba(255,255,255,.07);transform:translateY(-2px)}

/* ── Stats bar ── */
.hstat-bar{display:flex;justify-content:center;flex-wrap:wrap;border:1px solid rgba(255,255,255,.08);border-radius:16px;overflow:hidden;backdrop-filter:blur(8px);margin-top:52px}
.hstat{padding:20px 40px;border-right:1px solid rgba(255,255,255,.1);text-align:center;flex:1;min-width:140px}
.hstat:last-child{border-right:none}
.hstat-n{font-family:'Syne',sans-serif;font-size:32px;font-weight:800;color:#fff;line-height:1}
.hstat-n span{color:var(--sage)}
.hstat-l{font-size:12px;color:rgba(255,255,255,.4);margin-top:4px;text-transform:uppercase;letter-spacing:.5px}

/* ── CTA box (same as Home) ── */
.cta-sec{padding:110px 5%;text-align:center;background:var(--cream)}
.ctabox{background:var(--forest);border-radius:28px;padding:72px 5%;max-width:860px;margin:0 auto;position:relative;overflow:hidden}
.ctabox::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 70% 50%,rgba(82,183,136,.15) 0%,transparent 60%)}
.ctit{font-family:'Syne',sans-serif;font-size:clamp(26px,4vw,48px);font-weight:800;color:#fff;letter-spacing:-1.5px;position:relative;margin-bottom:16px}
.csub{font-size:16px;color:rgba(255,255,255,.55);position:relative;margin-bottom:32px}
.cbtns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;position:relative}

/* ── Footer (same as Home) ── */
.lfoot{background:var(--charcoal);border-top:1px solid rgba(255,255,255,.06);padding:40px 5%;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px}
.fband{font-family:'Syne',sans-serif;font-size:18px;font-weight:700;color:#fff;display:flex;align-items:center;gap:10px}
.flinks{display:flex;gap:24px;flex-wrap:wrap}
.flinks a{font-size:13px;color:rgba(255,255,255,.4);text-decoration:none;transition:color .2s}
.flinks a:hover{color:#fff}
.fcopy{font-size:12px;color:rgba(255,255,255,.25)}

/* ── Responsive (same breakpoints as Home) ── */
@media(max-width:900px){
  .fg{grid-template-columns:repeat(2,1fr)}
  .tg{grid-template-columns:1fr}
  .steps{grid-template-columns:repeat(2,1fr)}
  .lnav-links,.lnav-btns{display:none}
  .nav-ham{display:flex}
  .hstat{padding:14px 24px}
  .phero{padding:88px 5% 64px}
}
@media(max-width:600px){
  .fg{grid-template-columns:1fr}
  .steps{grid-template-columns:1fr}
  .hstat{padding:12px 16px}
  .hstat-n{font-size:24px}
  .hero-ctas,.cbtns{flex-direction:column;align-items:center}
  .lfoot{flex-direction:column;text-align:center}
  .flinks{justify-content:center}
}
`;

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/properties', label: 'Properties' },
  { href: '/get-app', label: 'Get App' },
  { href: '/support', label: 'Support' },
  { href: '/api-docs', label: 'API' },
];

const FOOT_LINKS = [
  ['/get-app', 'Get App'],
  ['/privacy', 'Privacy'],
  ['/terms', 'Terms'],
  ['/api-docs', 'API Docs'],
  ['/support', 'Support'],
];

export default function LandingShell({ children, animateSelectors = '.fc,.step,.tc' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mOpen, setMOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflowX = 'hidden';
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; }
      });
    }, { threshold: 0.08 });

    setTimeout(() => {
      document.querySelectorAll(animateSelectors).forEach(el => {
        el.style.opacity = '0'; el.style.transform = 'translateY(22px)';
        el.style.transition = 'opacity .5s ease,transform .5s ease';
        obs.observe(el);
      });
    }, 50);

    return () => { document.body.style.overflowX = ''; obs.disconnect(); };
  }, [animateSelectors]);

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: 'var(--cream)' }}>
      <style>{CSS}</style>

      {/* Fixed nav */}
      <nav className="lnav">
        <a className="llogo" href="/">
          <div className="llogo-i"><HomeIcon size={18} /></div>RentEase
        </a>
        <div className="lnav-links">
          {NAV_LINKS.map(({ href, label }) => (
            <a key={href} href={href} className={location.pathname === href ? 'lnav-active' : ''}>{label}</a>
          ))}
        </div>
        <div className="lnav-btns">
          <button className="btn-o" onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn-p" onClick={() => navigate('/register')}>Start Free</button>
        </div>
        <button className="nav-ham" onClick={() => setMOpen(o => !o)} aria-label="Menu">
          {mOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {mOpen && (
        <div className="mob-drawer" onClick={() => setMOpen(false)}>
          <div className="mob-panel" onClick={e => e.stopPropagation()}>
            {NAV_LINKS.map(({ href, label }) => (
              <a key={href} href={href} onClick={() => setMOpen(false)}>{label}</a>
            ))}
            <div className="mob-divider" />
            <a href="/login" onClick={() => setMOpen(false)} style={{ color: 'rgba(255,255,255,.6)', fontSize: 15, display: 'block', padding: '12px 16px', borderRadius: 10, textDecoration: 'none' }}>Sign In</a>
            <button className="mob-btn-p" onClick={() => { navigate('/register'); setMOpen(false); }}>Start Free →</button>
          </div>
        </div>
      )}

      {/* Page content — offset for fixed nav */}
      <div style={{ paddingTop: 68 }}>
        {children}
      </div>

      {/* Footer */}
      <footer className="lfoot">
        <div>
          <div className="fband">
            <div style={{ width: 30, height: 30, background: '#52B788', borderRadius: 7, display: 'grid', placeItems: 'center', color: '#1B4332' }}>
              <HomeIcon size={16} />
            </div>
            RentEase
            <small style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,.3)', fontWeight: 400, marginTop: 2, fontFamily: "'DM Sans',sans-serif" }}>© 2026 RentEase Ltd.</small>
          </div>
        </div>
        <div className="flinks">
          {FOOT_LINKS.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
        </div>
        <div className="fcopy">Built for East Africa</div>
      </footer>
    </div>
  );
}
