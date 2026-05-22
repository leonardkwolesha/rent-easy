import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import KebiteLogo from '../components/KebiteLogo';
import PageWrapper from '../components/PageWrapper';
import { fadeUp, stagger, staggerFast, scaleIn } from '../animations/variants';

const CATEGORIES = [
  { label: 'Biryani', emoji: '🍛' }, { label: 'Burgers', emoji: '🍔' },
  { label: 'Pizza', emoji: '🍕' },   { label: 'Nyama Choma', emoji: '🥩' },
  { label: 'Pilau', emoji: '🥘' },   { label: 'Sushi', emoji: '🍱' },
  { label: 'Samosas', emoji: '🥟' }, { label: 'Desserts', emoji: '🍰' },
];

const FEATURES = [
  { emoji: '⚡', title: '30-Min Delivery', desc: 'Hot food from your favourite restaurant to your door, fast.' },
  { emoji: '🏪', title: '100+ Restaurants', desc: 'From local Tanzanian kitchens to international favourites.' },
  { emoji: '📍', title: 'Live Tracking', desc: 'Watch your rider on the map from kitchen to your door.' },
  { emoji: '💳', title: 'M-Pesa & More', desc: 'Pay with M-Pesa, Airtel Money, Mixx by Yas, or card.' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Choose a Restaurant', desc: 'Browse restaurants near you and pick your favourites.' },
  { step: '02', title: 'Place Your Order', desc: 'Add items to your cart and checkout in seconds.' },
  { step: '03', title: 'Track & Enjoy', desc: 'Watch your order arrive live on the map, then eat!' },
];

const BUBBLES = [
  { size: '500px', top: '-150px', left: '-150px', opacity: 0.07, delay: 0 },
  { size: '300px', top: 'auto',   left: 'auto',   opacity: 0.07, delay: 1 },
  { size: '200px', top: '60%',    left: '75%',     opacity: 0.10, delay: 0.5 },
];

const PhoneIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="6" y="2" width="12" height="20" rx="2.5" stroke={color} strokeWidth="2" />
    <line x1="10" y1="18.5" x2="14" y2="18.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const AppleIcon = ({ size = 28, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

const GooglePlayIcon = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <defs>
      <linearGradient id="gp1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#00C3FF" /><stop offset="100%" stopColor="#1A73E8" />
      </linearGradient>
      <linearGradient id="gp2" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#FFD400" /><stop offset="100%" stopColor="#FF8A00" />
      </linearGradient>
      <linearGradient id="gp3" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FF3A44" /><stop offset="100%" stopColor="#C31162" />
      </linearGradient>
      <linearGradient id="gp4" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#00A971" /><stop offset="100%" stopColor="#00873E" />
      </linearGradient>
    </defs>
    <path d="M3.6 2.3c-.3.3-.5.7-.5 1.2v17c0 .5.2.9.5 1.2l9.6-9.7L3.6 2.3z" fill="url(#gp1)" />
    <path d="M16.7 8.6 13.2 12l3.5 3.5 4.3-2.5c1.3-.7 1.3-2.6 0-3.4l-4.3-2.5z" fill="url(#gp2)" />
    <path d="M3.6 21.7c.4.4 1 .5 1.7.1l11.4-6.3-3.5-3.5-9.6 9.7z" fill="url(#gp3)" />
    <path d="m13.2 12 3.5-3.4L5.3 2.2C4.6 1.8 4 1.9 3.6 2.3L13.2 12z" fill="url(#gp4)" />
  </svg>
);

const s = {
  root: { fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#1a1a2e', overflowX: 'hidden', width: '100%', margin: 0, padding: 0 },
  hero: { background: 'linear-gradient(135deg, #ff6b00 0%, #e63946 60%, #c1121f 100%)', minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(4rem, 10vw, 6rem) clamp(1rem, 4vw, 2rem) clamp(2rem, 5vw, 3rem)', position: 'relative', overflow: 'hidden', margin: 0, boxSizing: 'border-box' },
  nav: { position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'clamp(0.85rem, 3vw, 1.25rem) clamp(1rem, 4vw, 2rem)', flexWrap: 'wrap', gap: '0.75rem', zIndex: 2 },
  navLinks: { display: 'flex', gap: 'clamp(0.4rem, 2vw, 1rem)', flexWrap: 'wrap', alignItems: 'center' },
  navBtn: (primary) => ({ padding: 'clamp(0.4rem, 1.6vw, 0.5rem) clamp(0.7rem, 3vw, 1.25rem)', borderRadius: '999px', border: primary ? 'none' : '2px solid rgba(255,255,255,0.7)', background: primary ? '#fff' : 'transparent', color: primary ? '#e63946' : '#fff', fontWeight: 700, fontSize: 'clamp(0.78rem, 2.2vw, 0.9rem)', cursor: 'pointer', textDecoration: 'none', display: 'inline-block', whiteSpace: 'nowrap' }),
  heroContent: { textAlign: 'center', zIndex: 1, maxWidth: '680px', width: '100%' },
  badge: { display: 'inline-block', background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '999px', padding: '0.35rem 1rem', fontSize: 'clamp(0.75rem, 2.2vw, 0.85rem)', fontWeight: 600, marginBottom: '1.25rem', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.3)' },
  heroTitle: { fontSize: 'clamp(2rem, 6vw, 3.8rem)', fontWeight: 900, color: '#fff', lineHeight: 1.1, margin: '0 0 1rem', textShadow: '0 2px 20px rgba(0,0,0,0.15)' },
  heroSub: { fontSize: 'clamp(0.95rem, 2.6vw, 1.15rem)', color: 'rgba(255,255,255,0.9)', marginBottom: '2rem', lineHeight: 1.6 },
  searchBar: { display: 'flex', background: '#fff', borderRadius: '999px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxWidth: '520px', margin: '0 auto', width: '100%' },
  searchInput: { flex: 1, minWidth: 0, border: 'none', outline: 'none', padding: 'clamp(0.85rem, 3vw, 1rem) clamp(0.9rem, 4vw, 1.5rem)', fontSize: 'clamp(0.9rem, 2.5vw, 1rem)', color: '#1a1a2e', background: 'transparent' },
  searchBtn: { background: 'linear-gradient(135deg, #ff6b00, #e63946)', border: 'none', color: '#fff', padding: '0 clamp(1rem, 4vw, 1.75rem)', fontSize: 'clamp(0.85rem, 2.5vw, 1rem)', fontWeight: 700, cursor: 'pointer', borderRadius: '999px', margin: '6px', whiteSpace: 'nowrap' },
  statsRow: { display: 'flex', gap: 'clamp(0.9rem, 4vw, 2rem)', justifyContent: 'center', marginTop: '2.5rem', flexWrap: 'wrap' },
  stat: { textAlign: 'center', color: '#fff' },
  statNum: { fontSize: 'clamp(1.4rem, 4vw, 1.75rem)', fontWeight: 900, display: 'block' },
  statLabel: { fontSize: 'clamp(0.7rem, 2vw, 0.8rem)', opacity: 0.85, letterSpacing: '0.5px', textTransform: 'uppercase' },
  section: { padding: 'clamp(3rem, 8vw, 5rem) clamp(1rem, 4vw, 2rem)', maxWidth: '1100px', margin: '0 auto' },
  sectionTitle: { fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 900, marginBottom: '0.5rem', textAlign: 'center' },
  sectionSub: { color: '#666', textAlign: 'center', marginBottom: '2.5rem', fontSize: 'clamp(0.92rem, 2.4vw, 1.05rem)', paddingInline: '0.5rem' },
  categoryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'clamp(0.6rem, 2.5vw, 1rem)', justifyContent: 'center' },
  categoryBase: { background: '#fff', color: '#1a1a2e', border: '2px solid #f0f0f0', borderRadius: '16px', padding: 'clamp(0.85rem, 3vw, 1rem) clamp(0.75rem, 3vw, 1.5rem)', cursor: 'pointer', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  categoryEmoji: { fontSize: 'clamp(1.6rem, 5vw, 2rem)', display: 'block', marginBottom: '0.4rem' },
  categoryLabel: { fontSize: 'clamp(0.78rem, 2.2vw, 0.85rem)', fontWeight: 700 },
  featuresBg: { background: 'linear-gradient(180deg, #fff8f5 0%, #fff 100%)' },
  featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 'clamp(1rem, 3vw, 1.5rem)' },
  featureCard: { background: '#fff', borderRadius: '20px', padding: 'clamp(1.25rem, 4vw, 2rem)', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '1px solid #f0f0f0' },
  howItWorksBg: { background: '#1a1a2e', color: '#fff' },
  stepsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 'clamp(1rem, 3vw, 2rem)' },
  stepCard: { textAlign: 'center', padding: 'clamp(1rem, 3vw, 1.5rem)' },
  stepNum: { fontSize: 'clamp(2.4rem, 7vw, 3rem)', fontWeight: 900, background: 'linear-gradient(135deg, #ff6b00, #e63946)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'block', marginBottom: '0.75rem' },
  stepTitle: { fontWeight: 800, fontSize: 'clamp(1rem, 2.6vw, 1.1rem)', marginBottom: '0.5rem', color: '#fff' },
  stepDesc: { color: 'rgba(255,255,255,0.65)', fontSize: 'clamp(0.85rem, 2.3vw, 0.9rem)', lineHeight: 1.6 },
  ctaBg: { background: 'linear-gradient(135deg, #ff6b00 0%, #e63946 100%)', padding: 'clamp(3rem, 8vw, 5rem) clamp(1rem, 4vw, 2rem)', textAlign: 'center' },
  ctaTitle: { fontSize: 'clamp(1.6rem, 5vw, 2.8rem)', fontWeight: 900, color: '#fff', marginBottom: '1rem' },
  ctaSub: { color: 'rgba(255,255,255,0.9)', fontSize: 'clamp(0.95rem, 2.6vw, 1.1rem)', marginBottom: '2rem' },
  footer: { background: '#111', color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '1.5rem', fontSize: '0.85rem' },
};

export default function Home() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const featuresRef = useRef(null);
  const stepsRef = useRef(null);
  const statsRef = useRef(null);
  const categoriesRef = useRef(null);

  const featuresInView  = useInView(featuresRef,  { once: true, margin: '-80px' });
  const stepsInView     = useInView(stepsRef,     { once: true, margin: '-80px' });
  const statsInView     = useInView(statsRef,     { once: true, margin: '-50px' });
  const categoriesInView = useInView(categoriesRef, { once: true, margin: '-60px' });

  function handleSearch(e) {
    e.preventDefault();
    navigate(`/restaurants${search ? `?q=${encodeURIComponent(search)}` : ''}`);
  }

  return (
    <PageWrapper>
      <div style={s.root}>
        {/* ── Hero ── */}
        <section style={s.hero}>
          {/* Floating bubbles */}
          {BUBBLES.map((b, i) => (
            <motion.div
              key={i}
              style={{ position: 'absolute', width: b.size, height: b.size, borderRadius: '50%', background: `rgba(255,255,255,${b.opacity})`, top: b.top, left: b.left, pointerEvents: 'none', willChange: 'transform' }}
              animate={{ y: [0, -18, 0], scale: [1, 1.04, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: b.delay }}
            />
          ))}

          {/* Nav */}
          <nav style={s.nav}>
            <KebiteLogo variant="white" size="md" />
            <div style={s.navLinks}>
              <a href="#get-app" onClick={(e) => { e.preventDefault(); document.getElementById('get-app')?.scrollIntoView({ behavior: 'smooth' }); }}
                style={{ ...s.navBtn(false), display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <PhoneIcon size={15} /> Get App
              </a>
              <a href="/login" style={s.navBtn(false)}>Sign In</a>
              <a href="/register" style={s.navBtn(true)}>Get Started</a>
            </div>
          </nav>

          {/* Hero content */}
          <motion.div
            style={s.heroContent}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 500, damping: 25 }}
            >
              <div style={s.badge}>🇹🇿 Tanzania's #1 Food Delivery</div>
            </motion.div>

            {/* Title lines */}
            <h1 style={s.heroTitle}>
              {['Hungry?', "We've got you", 'covered.'].map((line, i) => (
                <motion.span
                  key={line}
                  style={{ display: 'block' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  {line}
                </motion.span>
              ))}
            </h1>

            <motion.p
              style={s.heroSub}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
            >
              Karibu! Order from 100+ restaurants in Dar es Salaam<br />
              and get hot food at your door in 30 minutes or less.
            </motion.p>

            {/* Search bar */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <form onSubmit={handleSearch} style={s.searchBar}>
                <input
                  style={s.searchInput}
                  placeholder="📍 Enter your area or search for food..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <motion.button
                  type="submit"
                  style={s.searchBtn}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  Search
                </motion.button>
              </form>
            </motion.div>

            {/* Stats */}
            <motion.div
              ref={statsRef}
              style={s.statsRow}
              variants={stagger}
              initial="hidden"
              animate={statsInView ? 'visible' : 'hidden'}
            >
              {[['100+', 'Restaurants'], ['30 min', 'Avg. Delivery'], ['50k+', 'Happy Customers'], ['4.8★', 'App Rating']].map(([num, label]) => (
                <motion.div key={label} style={s.stat} variants={fadeUp}>
                  <span style={s.statNum}>{num}</span>
                  <span style={s.statLabel}>{label}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ── Categories ── */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>What are you craving?</h2>
          <p style={s.sectionSub}>Explore by cuisine and find your next favourite meal.</p>
          <motion.div
            ref={categoriesRef}
            style={s.categoryGrid}
            variants={stagger}
            initial="hidden"
            animate={categoriesInView ? 'visible' : 'hidden'}
          >
            {CATEGORIES.map((cat) => (
              <motion.div
                key={cat.label}
                style={s.categoryBase}
                variants={fadeUp}
                whileHover={{ scale: 1.08, y: -8, background: 'linear-gradient(135deg, #ff6b00, #e63946)', color: '#fff', boxShadow: '0 8px 30px rgba(230,57,70,0.3)', transition: { type: 'spring', stiffness: 500, damping: 25 } }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/restaurants?cuisine=${encodeURIComponent(cat.label)}`)}
              >
                <span style={s.categoryEmoji}>{cat.emoji}</span>
                <span style={s.categoryLabel}>{cat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Features ── */}
        <div style={s.featuresBg}>
          <section style={s.section}>
            <h2 style={s.sectionTitle}>Why choose Kebite?</h2>
            <p style={s.sectionSub}>Fast, reliable, and built for Tanzania.</p>
            <motion.div
              ref={featuresRef}
              style={s.featuresGrid}
              variants={stagger}
              initial="hidden"
              animate={featuresInView ? 'visible' : 'hidden'}
            >
              {FEATURES.map((f) => (
                <motion.div
                  key={f.title}
                  style={s.featureCard}
                  variants={fadeUp}
                  whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.12)', transition: { type: 'spring', stiffness: 400, damping: 25 } }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{f.emoji}</div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.4rem' }}>{f.title}</div>
                  <div style={{ color: '#777', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</div>
                </motion.div>
              ))}
            </motion.div>
          </section>
        </div>

        {/* ── How It Works ── */}
        <div style={s.howItWorksBg}>
          <section ref={stepsRef} style={{ ...s.section, color: '#fff' }}>
            <h2 style={{ ...s.sectionTitle, color: '#fff' }}>How it works</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: '2.5rem', fontSize: '1.05rem' }}>
              Three simple steps to great food.
            </p>
            <div style={s.stepsRow}>
              {HOW_IT_WORKS.map((step, i) => (
                <div key={step.step} style={s.stepCard}>
                  <motion.span
                    style={s.stepNum}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={stepsInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 20, delay: i * 0.15 }}
                  >
                    {step.step}
                  </motion.span>
                  <div style={s.stepTitle}>{step.title}</div>
                  <div style={s.stepDesc}>{step.desc}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── CTA ── */}
        <div style={s.ctaBg}>
          <h2 style={s.ctaTitle}>Ready to order? 🚀</h2>
          <p style={s.ctaSub}>Join 50,000+ customers already enjoying Kebite delivery.</p>
          <motion.a
            href="/restaurants"
            style={{ display: 'inline-block', background: '#fff', color: '#e63946', padding: '1rem 2.5rem', borderRadius: '999px', fontWeight: 800, fontSize: '1.05rem', cursor: 'pointer', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.2)', textDecoration: 'none' }}
            whileHover={{ scale: 1.05, boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}
            whileTap={{ scale: 0.97 }}
          >
            Browse Restaurants →
          </motion.a>
        </div>

        {/* ── Get the App ── */}
        <section id="get-app" style={{ background: '#fff', padding: 'clamp(3rem, 8vw, 5rem) clamp(1rem, 4vw, 2rem)', textAlign: 'center', borderTop: '1px solid #f0f0f0' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #ff6b00, #e63946)', marginBottom: '0.75rem', boxShadow: '0 8px 24px rgba(230,57,70,0.25)' }}>
              <PhoneIcon size={36} color="#fff" />
            </div>
            <h2 style={{ ...s.sectionTitle, marginBottom: '0.5rem' }}>Get the Kebite App</h2>
            <p style={{ ...s.sectionSub, marginBottom: '2rem' }}>
              Order faster, track live, and unlock app-only deals. Coming soon to iPhone and Android.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginBottom: '1.25rem' }}>
              {[
                { store: 'App Store', sub: 'Download on the', Icon: AppleIcon },
                { store: 'Google Play', sub: 'Get it on', Icon: GooglePlayIcon },
              ].map(({ store, sub, Icon }) => (
                <motion.a
                  key={store}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: '#1a1a2e', color: '#fff', padding: '0.85rem 1.5rem', borderRadius: 14, textDecoration: 'none', minWidth: 200 }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Icon size={28} />
                  <span style={{ textAlign: 'left' }}>
                    <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.8 }}>{sub}</span>
                    <span style={{ display: 'block', fontWeight: 800, fontSize: '1.05rem' }}>{store}</span>
                  </span>
                </motion.a>
              ))}
            </div>
            <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>
              In the meantime, the full Kebite experience works in your browser.
            </p>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ background: '#111', color: 'rgba(255,255,255,0.6)', padding: 'clamp(2rem, 6vw, 2.5rem) clamp(1rem, 4vw, 1.5rem) 1.5rem' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'clamp(1rem, 3vw, 1.5rem)', marginBottom: '1.5rem' }}>
            <div style={{ flex: '1 1 220px' }}>
              <div style={{ marginBottom: '0.75rem' }}><KebiteLogo variant="white" size="sm" /></div>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.6, margin: 0, color: 'rgba(255,255,255,0.55)' }}>
                Tanzania's homegrown food delivery platform — fast, fair, and built in Dar es Salaam.
              </p>
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <div style={{ fontWeight: 800, color: '#fff', marginBottom: '0.6rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Company</div>
              <Link to="/about" style={{ display: 'block', color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem', padding: '0.25rem 0', textDecoration: 'none' }}>About</Link>
              <Link to="/contact" style={{ display: 'block', color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem', padding: '0.25rem 0', textDecoration: 'none' }}>Contact</Link>
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <div style={{ fontWeight: 800, color: '#fff', marginBottom: '0.6rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Legal</div>
              <Link to="/privacy" style={{ display: 'block', color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem', padding: '0.25rem 0', textDecoration: 'none' }}>Privacy</Link>
              <Link to="/cookies" style={{ display: 'block', color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem', padding: '0.25rem 0', textDecoration: 'none' }}>Cookies</Link>
              <Link to="/security" style={{ display: 'block', color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem', padding: '0.25rem 0', textDecoration: 'none' }}>Security</Link>
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <div style={{ fontWeight: 800, color: '#fff', marginBottom: '0.6rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Get the app</div>
              <a href="#get-app" onClick={(e) => { e.preventDefault(); document.getElementById('get-app')?.scrollIntoView({ behavior: 'smooth' }); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #ff6b00, #e63946)', color: '#fff', padding: '0.55rem 1rem', borderRadius: 999, fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none' }}>
                <PhoneIcon size={14} color="#fff" /> Get App
              </a>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', textAlign: 'center', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
            © 2026 Kebite · Asante kwa kutumia Kebite!
          </div>
        </footer>
      </div>
    </PageWrapper>
  );
}
