import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ChevronDown, ChevronRight, Mail, Phone, MessageSquare, Book, Smartphone, CreditCard, Building2, Wrench, ArrowRight } from 'lucide-react';
import LandingShell from '../components/LandingShell';

const PAGE_CSS = `
/* FAQ accordion */
.faq-item{background:#fff;border-radius:14px;border:1px solid rgba(0,0,0,.06);margin-bottom:10px;overflow:hidden;transition:box-shadow .2s,transform .2s}
.faq-item:hover{box-shadow:0 6px 22px rgba(27,67,50,.08);transform:translateY(-1px)}
.faq-btn{width:100%;display:flex;align-items:center;gap:14px;padding:18px 22px;background:none;border:none;cursor:pointer;text-align:left;font-family:'DM Sans',sans-serif}
.faq-q{flex:1;font-size:15px;font-weight:600;color:var(--td);line-height:1.45}
.faq-cat{font-size:11px;font-weight:700;padding:3px 9px;border-radius:5px;flex-shrink:0}
.faq-body{padding:0 22px 20px;font-size:15px;color:var(--tm);line-height:1.8;border-top:1px solid var(--cream-mid);padding-top:18px}

/* Quick help cards (dark, like Home .fc) */
.qh-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.07);border-radius:20px;overflow:hidden;margin-top:52px}

/* Contact cards */
.contact-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-bottom:36px}
.contact-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:20px;display:flex;gap:14px;align-items:flex-start;transition:background .2s}
.contact-card:hover{background:rgba(255,255,255,.09)}
.contact-icon{width:40px;height:40px;background:rgba(82,183,136,.15);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--sage);flex-shrink:0}
.contact-label{font-size:11px;color:var(--tl);text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:4px}
.contact-val{font-size:14px;font-weight:600;color:#fff}
.contact-val a{color:var(--sage);text-decoration:none}
.contact-val a:hover{text-decoration:underline}

/* Contact form on dark bg */
.cf-label{font-size:13px;font-weight:600;color:rgba(255,255,255,.7);margin-bottom:7px;display:block}
.cf-input{width:100%;padding:12px 16px;border-radius:10px;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);font-size:14px;color:#fff;outline:none;transition:border .2s;font-family:'DM Sans',sans-serif;box-sizing:border-box}
.cf-input:focus{border-color:var(--sage)}
.cf-input::placeholder{color:rgba(255,255,255,.3)}
.cf-input option{background:var(--charcoal);color:#fff}

/* Category filter pills */
.cat-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:28px;justify-content:center}
.cat-pill{padding:7px 18px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;border:1.5px solid;font-family:'DM Sans',sans-serif}
.cat-pill-off{background:var(--cream-mid);color:var(--tm);border-color:rgba(0,0,0,.1)}
.cat-pill-off:hover{background:#fff;border-color:rgba(27,67,50,.2)}
.cat-pill-on{background:var(--forest);color:#fff;border-color:var(--forest)}

/* Success state */
.sent-box{text-align:center;padding:48px 24px;background:rgba(82,183,136,.1);border:1px solid rgba(82,183,136,.25);border-radius:18px}

@media(max-width:900px){
  .qh-grid{grid-template-columns:repeat(2,1fr)}
  .contact-cards{grid-template-columns:1fr 1fr}
}
@media(max-width:600px){
  .qh-grid{grid-template-columns:1fr}
  .contact-cards{grid-template-columns:1fr}
}
`;

const QUICK_HELP = [
  { Icon: CreditCard, title: 'Payment Issues', desc: 'M-Pesa failures, receipts, overdue rent, and transaction disputes.', href: '#faq' },
  { Icon: Building2, title: 'Property Listings', desc: 'Add, edit, or remove your rental properties from the platform.', href: '/properties' },
  { Icon: Smartphone, title: 'Mobile App', desc: 'Download guides and troubleshooting for iOS and Android.', href: '/get-app' },
  { Icon: Book, title: 'API Reference', desc: 'Integrate RentEase into your own systems and workflows.', href: '/api-docs' },
  { Icon: Wrench, title: 'Maintenance', desc: 'Submit, track, and resolve maintenance requests for your unit.', href: '#faq' },
  { Icon: MessageSquare, title: 'Live Chat', desc: 'Chat with our support team Monday–Friday, 8am–6pm EAT.', href: 'mailto:support@rentease.co.tz' },
];

const FAQS = [
  { cat: 'Payments', q: 'Why did my M-Pesa payment fail?', a: 'The most common causes are insufficient balance, entering the wrong PIN, or the STK push timing out before approval. Check your balance and try again. If the amount was deducted but shows as pending in RentEase, contact us with your M-Pesa transaction reference — we reconcile manually within 24 hours.' },
  { cat: 'Payments', q: 'Which payment networks are supported?', a: 'RentEase supports M-Pesa, Airtel Money, Tigopesa (mixx by Yas), and Halopesa through our AzamPay integration. Select your network when initiating payment from the app or web dashboard.' },
  { cat: 'Payments', q: 'How do I download a payment receipt?', a: 'Web: Dashboard → Payments → find the paid entry → Download Receipt. Mobile app: Payments → tap the paid record → tap the download icon. Receipts are generated as PDFs.' },
  { cat: 'Leases', q: 'My application was approved — where is my lease?', a: 'Leases are created automatically upon approval. On mobile, go to the "My Lease" tab. On web, Dashboard → My Lease. If it\'s missing after a few minutes, pull-to-refresh or contact your landlord to confirm the approval was processed.' },
  { cat: 'Leases', q: 'Can I renew my lease through RentEase?', a: 'Lease renewal requires the landlord to terminate the current lease and run a new application and approval cycle. Contact your landlord at least 60 days before your lease ends. Automated renewal is a planned feature.' },
  { cat: 'Applications', q: 'How many properties can I apply to at once?', a: 'You can apply to multiple available properties simultaneously. Once a landlord approves one of your applications, your other pending applications for that property are automatically withdrawn — but applications for other properties remain active.' },
  { cat: 'Applications', q: 'Why was my application rejected?', a: 'Landlords may reject applications for any reason, including selecting another applicant or income requirements. The rejection notice may include a reason from the landlord. Contact the landlord directly for clarification if needed.' },
  { cat: 'Account', q: 'How do I change my password?', a: 'Click "Forgot Password?" on the login screen, enter your registered email, and we\'ll send a reset link valid for 30 minutes. Password changes cannot be made from within the app while logged in — log out first.' },
  { cat: 'Account', q: 'I\'m an agent — why can\'t I access all features?', a: 'Agent accounts require administrator approval before gaining full access. After registering, wait for an admin to approve your account — you\'ll receive an email notification. If it\'s been more than 48 hours, email support@rentease.co.tz.' },
  { cat: 'Maintenance', q: 'How do I track my maintenance request?', a: 'Your landlord updates the status from "Open" → "In Progress" → "Resolved" as work progresses. Check the Maintenance section in the app or web dashboard. You\'ll receive a push notification (mobile) or email when the status changes.' },
];

const CATS = ['All', 'Payments', 'Leases', 'Applications', 'Account', 'Maintenance'];
const CAT_COLORS = { Payments: ['rgba(27,67,50,.1)','var(--forest)'], Leases: ['rgba(82,183,136,.15)','#0d5c2e'], Applications: ['rgba(212,168,83,.15)','#92400E'], Account: ['rgba(100,100,200,.12)','#4338ca'], Maintenance: ['rgba(239,100,50,.1)','#c2410c'] };

export default function Support() {
  const navigate = useNavigate();
  const [cat, setCat] = useState('All');
  const [open, setOpen] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const filtered = cat === 'All' ? FAQS : FAQS.filter(f => f.cat === cat);

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 1200);
  };

  return (
    <LandingShell animateSelectors=".fc,.step,.faq-item,.contact-card">
      <style>{PAGE_CSS}</style>

      {/* HERO */}
      <section className="phero">
        <div className="phero-bg" />
        <div className="phero-ov" />
        <div className="phero-c">
          <div className="hero-badge"><span className="hbdot" />Help &amp; Support</div>
          <h1 className="hero-title">We're Here<br /><em>to Help.</em></h1>
          <p className="hero-sub">Find answers to common questions or reach our team directly. We respond within 24 hours on business days.</p>
          <div className="hero-ctas">
            <a href="#faq" className="hbtnp">Browse FAQ <ArrowRight size={16} /></a>
            <a href="#contact" className="hbtns">Contact Us</a>
          </div>
        </div>
      </section>

      {/* QUICK HELP — dark forest grid (same as Home .feats) */}
      <section className="feats">
        <div style={{ textAlign: 'center' }}>
          <div className="eyebrow" style={{ color: 'var(--mint)' }}>Quick Help</div>
          <h2 className="stitle" style={{ color: '#fff' }}>Find what you need</h2>
          <p className="ssub" style={{ color: 'rgba(255,255,255,.45)', marginBottom: 0 }}>Jump straight to the topic you need help with.</p>
        </div>
        <div className="qh-grid fg">
          {QUICK_HELP.map(({ Icon, title, desc, href }) => (
            <a key={title} href={href} className="fc" style={{ textDecoration: 'none', display: 'block' }}>
              <div className="fi"><Icon size={22} /></div>
              <div className="fn">{title}</div>
              <div className="fd">{desc}</div>
            </a>
          ))}
        </div>
      </section>

      {/* FAQ — cream steps section */}
      <section id="faq" className="how-sec">
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
          <div className="eyebrow">Frequently Asked</div>
          <h2 className="stitle">Common Questions</h2>
          <p className="ssub" style={{ marginBottom: 28 }}>Can't find your answer? Scroll down to contact us directly.</p>

          <div className="cat-pills">
            {CATS.map(c => (
              <button key={c} className={`cat-pill ${cat === c ? 'cat-pill-on' : 'cat-pill-off'}`}
                onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>

          {filtered.map(({ cat: c, q, a }) => {
            const colors = CAT_COLORS[c] || ['rgba(0,0,0,.05)', 'var(--tm)'];
            return (
              <div key={q} className="faq-item">
                <button className="faq-btn" onClick={() => setOpen(open === q ? null : q)}>
                  <span className="faq-q">{q}</span>
                  <span className="faq-cat" style={{ background: colors[0], color: colors[1] }}>{c}</span>
                  {open === q ? <ChevronDown size={16} color="var(--tl)" /> : <ChevronRight size={16} color="var(--tl)" />}
                </button>
                {open === q && <div className="faq-body">{a}</div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* CONTACT — dark charcoal (same as Home .testi) */}
      <section id="contact" className="testi">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="eyebrow" style={{ color: 'var(--mint)' }}>Get in Touch</div>
          <h2 className="stitle" style={{ color: '#fff' }}>Still need help?</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.45)', marginBottom: 0 }}>Send us a message and we'll respond within 24 hours on business days.</p>
        </div>

        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          {/* Contact info cards */}
          <div className="contact-cards">
            {[
              { Icon: Mail, label: 'Email', val: <a href="mailto:support@rentease.co.tz">support@rentease.co.tz</a> },
              { Icon: Phone, label: 'Phone', val: <a href="tel:+255762000000">+255 762 000 000</a> },
              { Icon: MessageSquare, label: 'Hours', val: 'Mon–Fri, 8am–6pm EAT' },
            ].map(({ Icon, label, val }) => (
              <div key={label} className="contact-card">
                <div className="contact-icon"><Icon size={18} /></div>
                <div>
                  <div className="contact-label">{label}</div>
                  <div className="contact-val">{val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          {sent ? (
            <div className="sent-box">
              <div style={{ fontSize: 44, marginBottom: 14 }}>✅</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Message Sent!</div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,.5)' }}>We'll get back to you within 24 hours at <strong style={{ color: 'var(--sage)' }}>{form.email}</strong>.</div>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                {[['name','Full Name','text','Your full name'],['email','Email Address','email','you@example.com']].map(([key,label,type,ph]) => (
                  <div key={key}>
                    <label className="cf-label">{label} *</label>
                    <input type={type} placeholder={ph} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required className="cf-input" />
                  </div>
                ))}
              </div>
              <div>
                <label className="cf-label">Topic</label>
                <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="cf-input">
                  <option value="">Select a topic</option>
                  <option>Payment Problem</option>
                  <option>Lease Question</option>
                  <option>Application Issue</option>
                  <option>Account &amp; Login</option>
                  <option>Mobile App Bug</option>
                  <option>Feature Request</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="cf-label">Message *</label>
                <textarea placeholder="Describe your issue in detail — include any error messages and steps you followed." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required rows={5} className="cf-input" style={{ resize: 'vertical' }} />
              </div>
              <button type="submit" disabled={sending} className="hbtnp" style={{ alignSelf: 'stretch', justifyContent: 'center', opacity: sending ? 0.7 : 1 }}>
                {sending ? 'Sending...' : <><span>Send Message</span> <ArrowRight size={16} /></>}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* CTA box */}
      <section className="cta-sec">
        <div className="ctabox">
          <h2 className="ctit">Ready to start managing<br />rent the smart way?</h2>
          <p className="csub">Join thousands of landlords and tenants across East Africa.</p>
          <div className="cbtns">
            <button className="hbtnp" onClick={() => navigate('/register')}>Get Started Free <ArrowRight size={16} /></button>
            <button className="hbtns" onClick={() => navigate('/get-app')}>Download the App</button>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
