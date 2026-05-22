import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import KebiteLogo from '../components/KebiteLogo';
import PageWrapper from '../components/PageWrapper';
import { useToast } from '../components/Toast';

const FONT = "'Segoe UI', system-ui, sans-serif";
const GRADIENT = 'linear-gradient(135deg, #ff6b00, #e63946)';

/* ── Inline SVG icons (Lucide-style strokes) ── */
const svgBase = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const Svg = ({ size = 24, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...svgBase} aria-hidden="true">{children}</svg>
);

const MailIcon = (p) => <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Svg>;
const LifeRingIcon = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" /><path d="m4.9 4.9 4.6 4.6M14.5 14.5l4.6 4.6M19.1 4.9l-4.6 4.6M9.5 14.5l-4.6 4.6" /></Svg>;
const StoreIcon = (p) => <Svg {...p}><path d="M3 9 4.5 4h15L21 9" /><path d="M4 9v11h16V9" /><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M10 20v-6h4v6" /></Svg>;
const BikeIcon = (p) => <Svg {...p}><circle cx="5.5" cy="17.5" r="3.5" /><circle cx="18.5" cy="17.5" r="3.5" /><path d="M15 6h3l1.5 4.5L15 13l-2-3-3 7" /><path d="M9 6h2l-2 7" /></Svg>;
const NewsIcon = (p) => <Svg {...p}><rect x="3" y="5" width="14" height="14" rx="2" /><path d="M17 9h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-3" /><path d="M7 9h6M7 13h6M7 17h4" /></Svg>;
const ScaleIcon = (p) => <Svg {...p}><path d="M12 3v18" /><path d="M5 21h14" /><path d="M5 7h14" /><path d="m5 7-3 6a3 3 0 0 0 6 0Z" /><path d="m19 7-3 6a3 3 0 0 0 6 0Z" /></Svg>;
const PhoneIcon = (p) => <Svg {...p}><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></Svg>;
const PinIcon = (p) => <Svg {...p}><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" /><circle cx="12" cy="9" r="2.5" /></Svg>;
const ClockIcon = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>;
const ChatIcon = (p) => <Svg {...p}><path d="M21 15a3 3 0 0 1-3 3H8l-4 3v-3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3Z" /></Svg>;

const CONTACT_METHODS = [
  {
    Icon: MailIcon,
    title: 'General enquiries',
    primary: 'hello@kebite.co.tz',
    href: 'mailto:hello@kebite.co.tz',
    note: 'Replies within 1 business day',
  },
  {
    Icon: LifeRingIcon,
    title: 'Customer support',
    primary: 'support@kebite.co.tz',
    href: 'mailto:support@kebite.co.tz',
    note: 'Order issues, refunds, missing items',
  },
  {
    Icon: StoreIcon,
    title: 'Restaurant partners',
    primary: 'partners@kebite.co.tz',
    href: 'mailto:partners@kebite.co.tz',
    note: 'Join Kebite as a restaurant',
  },
  {
    Icon: BikeIcon,
    title: 'Riders',
    primary: 'riders@kebite.co.tz',
    href: 'mailto:riders@kebite.co.tz',
    note: 'Apply to ride · payouts · gear',
  },
  {
    Icon: NewsIcon,
    title: 'Press & media',
    primary: 'press@kebite.co.tz',
    href: 'mailto:press@kebite.co.tz',
    note: 'Interviews, brand assets, statements',
  },
  {
    Icon: ScaleIcon,
    title: 'Legal & privacy',
    primary: 'legal@kebite.co.tz',
    href: 'mailto:legal@kebite.co.tz',
    note: 'Data requests, takedowns, compliance',
  },
];

const PHONE_LINES = [
  { label: 'Customer hotline', value: '+255 700 000 000', href: 'tel:+255700000000' },
  { label: 'WhatsApp support', value: '+255 712 000 000', href: 'https://wa.me/255712000000' },
  { label: 'Restaurant sales', value: '+255 754 000 000', href: 'tel:+255754000000' },
];

const HOURS = [
  { day: 'Monday – Friday', hrs: '08:00 – 23:00' },
  { day: 'Saturday', hrs: '09:00 – 23:00' },
  { day: 'Sunday & holidays', hrs: '10:00 – 22:00' },
];

/* ── Brand glyphs (filled, official-style paths) ── */
const InstagramIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const XIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M18.244 2H21l-6.52 7.45L22 22h-6.844l-4.79-6.26L4.8 22H2.04l6.97-7.96L2 2h6.91l4.34 5.74L18.244 2Zm-1.2 18h1.69L7.05 4H5.27l11.774 16Z" />
  </svg>
);
const FacebookIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
  </svg>
);
const TikTokIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.83a8.16 8.16 0 0 0 4.77 1.52V6.92a4.85 4.85 0 0 1-1.84-.23Z" />
  </svg>
);

const SOCIALS = [
  { label: 'Instagram', handle: '@kebite.tz', href: 'https://instagram.com/kebite.tz', Icon: InstagramIcon },
  { label: 'X / Twitter', handle: '@kebite_tz', href: 'https://twitter.com/kebite_tz', Icon: XIcon },
  { label: 'Facebook', handle: 'Kebite Tanzania', href: 'https://facebook.com/kebite.tz', Icon: FacebookIcon },
  { label: 'TikTok', handle: '@kebite.tz', href: 'https://tiktok.com/@kebite.tz', Icon: TikTokIcon },
];

const FOOTER_LINKS = [
  { to: '/about', label: 'About' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/cookies', label: 'Cookies' },
  { to: '/security', label: 'Security' },
];

const TOPICS = ['General question', 'Order issue', 'Restaurant partnership', 'Rider application', 'Press', 'Other'];

export default function Contact() {
  const showToast = useToast();
  const [form, setForm] = useState({ name: '', email: '', topic: TOPICS[0], message: '' });
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Please enter your name.';
    if (!form.email.trim()) e.email = 'Please enter your email.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Please enter a valid email.';
    if (!form.message.trim() || form.message.trim().length < 10) e.message = 'Message must be at least 10 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;
    const subject = `[Kebite · ${form.topic}] ${form.name}`;
    const body =
      `Hi Kebite team,%0D%0A%0D%0A` +
      `${encodeURIComponent(form.message)}%0D%0A%0D%0A` +
      `— ${encodeURIComponent(form.name)}%0D%0A` +
      `${encodeURIComponent(form.email)}`;
    window.location.href = `mailto:leonardsengoma07@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;
    showToast?.('Opening your email app…', 'success');
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  return (
    <PageWrapper>
      <div style={{ fontFamily: FONT, color: '#1a1a2e', background: '#f8f8f8', minHeight: '100vh' }}>
        {/* Hero */}
        <header style={{ background: GRADIENT, padding: 'clamp(2.5rem, 7vw, 4rem) clamp(1rem, 4vw, 1.5rem)', color: '#fff', textAlign: 'center' }}>
          <Link to="/" style={{ display: 'inline-block', marginBottom: '1.25rem', textDecoration: 'none' }}>
            <KebiteLogo variant="white" size="md" />
          </Link>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', fontWeight: 900, margin: '0 0 0.5rem' }}
          >
            We'd love to hear from you
          </motion.h1>
          <p style={{ opacity: 0.92, fontSize: 'clamp(0.95rem, 2.4vw, 1.05rem)', margin: 0, maxWidth: 600, marginInline: 'auto', lineHeight: 1.55 }}>
            Karibu! Pick the channel that fits — or send us a note and we'll get back within one working day.
          </p>
        </header>

        <main style={{ maxWidth: 1100, margin: '-2rem auto 3rem', padding: '0 clamp(0.75rem, 3vw, 1.25rem)' }}>
          {/* Contact methods grid */}
          <section style={{ marginBottom: '2rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
            }}>
              {CONTACT_METHODS.map((m) => (
                <motion.a
                  key={m.title}
                  href={m.href}
                  whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.13)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  style={{
                    background: '#fff', borderRadius: 18, padding: '1.25rem',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.07)', textDecoration: 'none', color: '#1a1a2e',
                    display: 'block',
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(135deg, #fff5ef, #ffe7df)',
                    color: '#e63946', marginBottom: '0.6rem',
                  }}>
                    <m.Icon size={22} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{m.title}</div>
                  <div style={{ color: '#ff6b00', fontWeight: 700, fontSize: '0.9rem', wordBreak: 'break-all' }}>{m.primary}</div>
                  <div style={{ color: '#777', fontSize: '0.78rem', marginTop: '0.35rem', lineHeight: 1.5 }}>{m.note}</div>
                </motion.a>
              ))}
            </div>
          </section>

          {/* Two-column: form + sidebar */}
          <section style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: '1.25rem',
            alignItems: 'start',
          }}>
            {/* Form */}
            <article style={{ background: '#fff', borderRadius: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: 'clamp(1.25rem, 4vw, 2rem)' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.4rem' }}>Send us a message</h2>
              <p style={{ color: '#666', fontSize: '0.88rem', margin: '0 0 1.25rem' }}>
                Fills in your default email app — no account needed.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <Field label="Your name" htmlFor="c-name" error={errors.name}>
                  <input
                    id="c-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    placeholder="Asha Mwinyi"
                    style={inp(!!errors.name)}
                  />
                </Field>

                <Field label="Email" htmlFor="c-email" error={errors.email}>
                  <input
                    id="c-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="you@example.com"
                    style={inp(!!errors.email)}
                  />
                </Field>

                <Field label="Topic" htmlFor="c-topic">
                  <select
                    id="c-topic"
                    value={form.topic}
                    onChange={(e) => update('topic', e.target.value)}
                    style={inp(false)}
                  >
                    {TOPICS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </Field>

                <Field label="Message" htmlFor="c-msg" error={errors.message}>
                  <textarea
                    id="c-msg"
                    rows={5}
                    value={form.message}
                    onChange={(e) => update('message', e.target.value)}
                    placeholder="Tell us what's on your mind…"
                    style={{ ...inp(!!errors.message), resize: 'vertical', minHeight: 120, fontFamily: FONT }}
                  />
                </Field>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    width: '100%', marginTop: '0.5rem',
                    background: GRADIENT, color: '#fff', border: 'none',
                    padding: '0.95rem 1.25rem', borderRadius: 999,
                    fontWeight: 800, fontSize: '0.98rem', cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(230,57,70,0.25)',
                  }}
                >
                  Send message →
                </motion.button>

                <p style={{ color: '#888', fontSize: '0.75rem', marginTop: '0.85rem', lineHeight: 1.55, textAlign: 'center' }}>
                  By sending, you agree to our{' '}
                  <Link to="/privacy" style={{ color: '#ff6b00', fontWeight: 700, textDecoration: 'none' }}>Privacy Policy</Link>.
                </p>
              </form>
            </article>

            {/* Sidebar */}
            <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Phone lines */}
              <div style={cardBox}>
                <div style={cardHeading}><PhoneIcon size={18} /> Call us</div>
                {PHONE_LINES.map((p) => (
                  <a key={p.value} href={p.href}
                    style={{ display: 'block', padding: '0.55rem 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: '#1a1a2e' }}>
                    <div style={{ fontSize: '0.78rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.label}</div>
                    <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#ff6b00' }}>{p.value}</div>
                  </a>
                ))}
              </div>

              {/* Office */}
              <div style={cardBox}>
                <div style={cardHeading}><PinIcon size={18} /> Head office</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>Kebite HQ</div>
                <div style={{ color: '#555', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  Plot 21, Bagamoyo Road<br />
                  Mikocheni B<br />
                  Dar es Salaam, Tanzania
                </div>
                <a
                  href="https://www.openstreetmap.org/?mlat=-6.7611&mlon=39.2300#map=16/-6.7611/39.2300"
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-block', marginTop: '0.85rem', color: '#ff6b00', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}
                >
                  Open in maps →
                </a>
              </div>

              {/* Hours */}
              <div style={cardBox}>
                <div style={cardHeading}><ClockIcon size={18} /> Support hours</div>
                {HOURS.map((h) => (
                  <div key={h.day} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed #eee', fontSize: '0.88rem' }}>
                    <span style={{ color: '#555' }}>{h.day}</span>
                    <span style={{ fontWeight: 700 }}>{h.hrs}</span>
                  </div>
                ))}
                <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.6rem' }}>Times shown in EAT (UTC+3).</div>
              </div>

              {/* Socials */}
              <div style={cardBox}>
                <div style={cardHeading}><ChatIcon size={18} /> Follow us</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {SOCIALS.map((s) => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0.5rem 0.85rem', borderRadius: 999, background: '#fff8f5', color: '#e63946', fontWeight: 700, fontSize: '0.82rem', textDecoration: 'none', border: '1px solid #ffe0d3' }}>
                      <s.Icon size={16} />
                      <span>{s.label} · {s.handle}</span>
                    </a>
                  ))}
                </div>
              </div>
            </aside>
          </section>

          {/* Quick links footer row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'center', marginTop: '2rem' }}>
            {FOOTER_LINKS.map((l) => (
              <Link key={l.to} to={l.to}
                style={{ color: '#ff6b00', fontWeight: 700, fontSize: '0.85rem', padding: '0.4rem 0.9rem', borderRadius: 999, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', textDecoration: 'none' }}>
                {l.label} →
              </Link>
            ))}
          </div>
        </main>

        <footer style={{ background: '#111', color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '1.25rem 1rem', fontSize: '0.8rem' }}>
          © 2026 Kebite · Asante kwa kutumia Kebite!
        </footer>
      </div>
    </PageWrapper>
  );
}

const cardBox = {
  background: '#fff', borderRadius: 18, padding: '1.25rem',
  boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
};

const cardHeading = {
  fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.75rem',
  color: '#1a1a2e',
  display: 'flex', alignItems: 'center', gap: 8,
};

const inp = (hasError) => ({
  width: '100%',
  padding: '0.7rem 0.85rem',
  border: `1.5px solid ${hasError ? '#e63946' : '#e5e5e5'}`,
  borderRadius: 12,
  fontSize: '0.95rem',
  fontFamily: FONT,
  outline: 'none',
  background: '#fafafa',
  color: '#1a1a2e',
  boxSizing: 'border-box',
});

function Field({ label, htmlFor, error, children }) {
  return (
    <div style={{ marginBottom: '0.95rem' }}>
      <label htmlFor={htmlFor} style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#444', marginBottom: '0.35rem' }}>
        {label}
      </label>
      {children}
      {error && (
        <div style={{ color: '#e63946', fontSize: '0.78rem', marginTop: '0.3rem', fontWeight: 600 }}>{error}</div>
      )}
    </div>
  );
}
