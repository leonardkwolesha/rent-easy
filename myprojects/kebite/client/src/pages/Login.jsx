import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import KebiteLogo from '../components/KebiteLogo';
import PageWrapper from '../components/PageWrapper';
import { stagger, slideInLeft, fadeIn } from '../animations/variants';

const EyeOpen = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOff = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const BENEFITS = [
  { icon: '⚡', text: 'Hot food delivered in 30 minutes or less' },
  { icon: '🏪', text: '100+ local restaurants at your fingertips' },
  { icon: '📱', text: 'Pay easily with M-Pesa, Airtel & Mixx by Yas' },
];

const s = {
  page: { fontFamily: "'Segoe UI', system-ui, sans-serif", display: 'flex', minHeight: '100vh', background: '#f8f8f8' },
  left: { flex: '0 0 45%', width: '45%', minHeight: '100vh', background: 'linear-gradient(135deg, #ff6b00 0%, #e63946 60%, #c1121f 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem', color: '#fff', position: 'relative', overflow: 'hidden' },
  leftBubble: (size, top, left, opacity) => ({ position: 'absolute', width: size, height: size, borderRadius: '50%', background: `rgba(255,255,255,${opacity})`, top, left, pointerEvents: 'none' }),
  leftInner: { position: 'relative', zIndex: 1, maxWidth: '400px' },
  tagline: { fontSize: '1.1rem', opacity: 0.9, marginBottom: '3rem', lineHeight: 1.5, marginTop: '0.5rem' },
  benefitsList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  benefitItem: { display: 'flex', alignItems: 'flex-start', gap: '0.85rem' },
  benefitIcon: { width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 },
  benefitText: { fontSize: '0.95rem', opacity: 0.92, lineHeight: 1.5, paddingTop: '0.5rem' },
  right: { flex: '1', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', overflowY: 'auto' },
  card: { background: '#fff', borderRadius: '18px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '2.5rem', width: '100%', maxWidth: '420px' },
  cardTitle: { fontSize: '1.75rem', fontWeight: 900, color: '#1a1a2e', margin: '0 0 0.35rem' },
  cardSub: { color: '#888', fontSize: '0.9rem', marginBottom: '2rem' },
  errorBanner: { display: 'flex', alignItems: 'center', gap: '0.65rem', background: '#fff5f5', border: '1px solid #fcc', borderRadius: '16px', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#c1121f', fontSize: '0.9rem' },
  fieldGroup: { marginBottom: '1.25rem' },
  label: { display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#444', marginBottom: '0.4rem' },
  inputWrap: { position: 'relative' },
  input: (invalid) => ({ width: '100%', padding: '0.8rem 1.25rem', borderRadius: '999px', border: `1.5px solid ${invalid ? '#e63946' : '#e0e0e0'}`, fontSize: '0.95rem', outline: 'none', color: '#1a1a2e', background: '#fafafa', boxSizing: 'border-box' }),
  passwordInput: (invalid) => ({ width: '100%', padding: '0.8rem 3rem 0.8rem 1.25rem', borderRadius: '999px', border: `1.5px solid ${invalid ? '#e63946' : '#e0e0e0'}`, fontSize: '0.95rem', outline: 'none', color: '#1a1a2e', background: '#fafafa', boxSizing: 'border-box' }),
  eyeBtn: { position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: '0', display: 'flex', alignItems: 'center' },
  fieldError: { color: '#e63946', fontSize: '0.78rem', marginTop: '0.35rem' },
  forgotBtn: { background: 'none', border: 'none', color: '#ff6b00', fontSize: '0.85rem', textAlign: 'right', cursor: 'pointer', padding: 0, marginBottom: '1rem', display: 'block', width: '100%', fontWeight: 600 },
  submitBtn: (loading) => ({ width: '100%', padding: '0.9rem', borderRadius: '999px', border: 'none', background: loading ? 'linear-gradient(135deg, #ffaa66, #e8808a)' : 'linear-gradient(135deg, #ff6b00, #e63946)', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginTop: '1.5rem' }),
  spinner: { width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 },
  registerRow: { textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: '#888' },
  registerLink: { color: '#ff6b00', fontWeight: 700, textDecoration: 'none' },
  backArrow: { background: 'none', border: 'none', color: '#ff6b00', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', padding: '0 0 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' },
  lockWrap: { display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' },
  sentCircle: (anim) => ({ width: '80px', height: '80px', borderRadius: '50%', background: '#d4f7e0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0.5rem auto 0', fontSize: '2.5rem', color: '#1a7a45', opacity: anim ? 1 : 0, transform: anim ? 'scale(1)' : 'scale(0.5)', transition: 'opacity 0.4s ease, transform 0.4s ease' }),
  resendBtn: (disabled) => ({ background: 'none', border: 'none', color: disabled ? '#aaa' : '#ff6b00', fontSize: '0.85rem', cursor: disabled ? 'default' : 'pointer', padding: '0.5rem 0', fontWeight: 600, display: 'block', margin: '0.5rem auto' }),
  backToLoginBtn: { background: 'none', border: 'none', color: '#888', fontSize: '0.85rem', cursor: 'pointer', padding: '0.25rem 0', textDecoration: 'underline', display: 'block', margin: '0.25rem auto' },
};

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path fill="#4285F4" d="M21.6 12.227c0-.708-.064-1.39-.184-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018v2.51h3.227c1.886-1.737 2.987-4.292 2.987-7.351z" />
    <path fill="#34A853" d="M12 22c2.7 0 4.964-.895 6.62-2.422l-3.227-2.51c-.895.6-2.04.955-3.393.955-2.605 0-4.81-1.76-5.595-4.123H3.067v2.59A9.997 9.997 0 0 0 12 22z" />
    <path fill="#FBBC05" d="M6.405 13.9a6.014 6.014 0 0 1 0-3.8V7.51H3.067a10.003 10.003 0 0 0 0 8.98l3.338-2.59z" />
    <path fill="#EA4335" d="M12 5.977c1.468 0 2.786.505 3.823 1.495l2.864-2.864C16.96 2.99 14.696 2 12 2A9.997 9.997 0 0 0 3.067 7.51l3.338 2.59C7.19 7.737 9.395 5.977 12 5.977z" />
  </svg>
);

export default function Login() {
  const { login, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from ?? '/';
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const isMobile = useIsMobile();
  const [view, setView] = useState('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [checkVisible, setCheckVisible] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (view !== 'sent') return;
    setCheckVisible(false); setCooldown(30);
    const t = setTimeout(() => setCheckVisible(true), 30);
    return () => clearTimeout(t);
  }, [view]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'restaurant') navigate('/restaurant/dashboard', { replace: true });
    else if (user.role === 'rider') navigate('/rider/dashboard', { replace: true });
    else if (user.role === 'admin') navigate('/admin/dashboard', { replace: true });
    else navigate(from, { replace: true });
  }, [user, navigate, from]);

  const emailInvalid = emailTouched && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const data = await login(form.email, form.password);
      const role = data.user?.role;
      if (role === 'restaurant') navigate('/restaurant/dashboard', { replace: true });
      else if (role === 'rider') navigate('/rider/dashboard', { replace: true });
      else if (role === 'admin') navigate('/admin/dashboard', { replace: true });
      else navigate(from, { replace: true });
    }
    catch (err) { setError(err.response?.data?.message || 'Invalid email or password'); }
    finally { setLoading(false); }
  };

  const handleGoogleSignIn = () => {
    setError('');
    if (!GOOGLE_CLIENT_ID) {
      setError('Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID in client/.env.');
      return;
    }
    if (!window.google?.accounts?.id) {
      setError('Google sign-in is still loading. Please try again in a moment.');
      return;
    }
    setGoogleLoading(true);
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          if (!response?.credential) throw new Error('No credential returned');
          await loginWithGoogle(response.credential);
        } catch (err) {
          setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
        } finally {
          setGoogleLoading(false);
        }
      },
    });
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
        setGoogleLoading(false);
      }
    });
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault(); setResetError('');
    if (!resetEmail || !/\S+@\S+\.\S+/.test(resetEmail)) { setResetError('Enter a valid email address'); return; }
    setResetLoading(true);
    try { await api.post('/auth/forgot-password', { email: resetEmail }); setView('sent'); }
    catch { setResetError('No account found with that email.'); }
    finally { setResetLoading(false); }
  };

  const mobileTopBar = { background: 'linear-gradient(135deg, #ff6b00, #e63946)', padding: '1.5rem 1.5rem 2.5rem', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' };
  const mobileTagline = { fontSize: '0.88rem', opacity: 0.9, margin: 0 };

  return (
    <PageWrapper>
      <div className="login-root" style={{ ...s.page, flexDirection: isMobile ? 'column' : 'row' }}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @media (max-width: 768px) {
            .login-root { flex-direction: column !important; }
            .login-left { min-height: 200px !important; width: 100% !important; flex: none !important; padding: 2rem 1.5rem !important; justify-content: flex-start !important; }
            .login-right { min-height: calc(100vh - 200px) !important; width: 100% !important; padding: 2rem 1rem !important; }
          }
        `}</style>

        {/* Desktop left panel */}
        {!isMobile && (
          <div className="login-left" style={s.left}>
            <div style={s.leftBubble('400px', '-120px', '-120px', 0.08)} />
            <div style={s.leftBubble('200px', '65%', '70%', 0.1)} />
            <motion.div style={s.leftInner} variants={stagger} initial="hidden" animate="visible">
              <motion.div variants={slideInLeft}><KebiteLogo variant="white" size="lg" /></motion.div>
              <motion.p style={s.tagline} variants={slideInLeft}>Karibu! Tanzania's #1 Food Delivery</motion.p>
              <ul style={s.benefitsList}>
                {BENEFITS.map((b) => (
                  <motion.li key={b.text} style={s.benefitItem} variants={slideInLeft}>
                    <div style={s.benefitIcon}>{b.icon}</div>
                    <span style={s.benefitText}>{b.text}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        )}

        {isMobile && (
          <div style={mobileTopBar}>
            <KebiteLogo variant="white" size="md" />
            <p style={mobileTagline}>Karibu! Tanzania's #1 Food Delivery</p>
          </div>
        )}

        {/* Right panel */}
        <div className="login-right" style={{ ...s.right, flex: isMobile ? 'unset' : '1', width: isMobile ? '100%' : 'auto', padding: isMobile ? '0' : '2rem', alignItems: isMobile ? 'flex-start' : 'center', background: isMobile ? '#f8f8f8' : 'transparent' }}>
          <motion.div
            style={{ ...s.card, maxWidth: isMobile ? '100%' : '420px', borderRadius: isMobile ? '18px 18px 0 0' : '18px', marginTop: isMobile ? '-18px' : '0', padding: isMobile ? '2rem 1.5rem' : '2.5rem', boxShadow: isMobile ? '0 -4px 24px rgba(0,0,0,0.08)' : '0 2px 16px rgba(0,0,0,0.07)', minHeight: isMobile ? 'calc(100vh - 110px)' : 'auto' }}
            initial={{ opacity: 0, x: 40, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
          >
            <AnimatePresence mode="wait">
              {/* ── LOGIN VIEW ── */}
              {view === 'login' && (
                <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
                  <h2 style={s.cardTitle}>Welcome back</h2>
                  <p style={s.cardSub}>Sign in to your Kebite account</p>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        style={s.errorBanner}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto', x: [0, -8, 8, -6, 6, -4, 4, 0] }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <span>⚠️</span><span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button type="button" onClick={handleGoogleSignIn} disabled={googleLoading || loading}
                    style={{ width: '100%', padding: '0.78rem', borderRadius: '999px', border: '1.5px solid #e0e0e0', background: '#fff', color: '#1a1a2e', fontWeight: 700, fontSize: '0.92rem', cursor: googleLoading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '1.25rem', fontFamily: "'Segoe UI', system-ui, sans-serif", opacity: googleLoading ? 0.7 : 1 }}>
                    <GoogleLogo />
                    {googleLoading ? 'Connecting…' : 'Sign in with Google'}
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 1.25rem', color: '#bbb', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.04em' }}>
                    <div style={{ flex: 1, height: '1px', background: '#eee' }} /> OR <div style={{ flex: 1, height: '1px', background: '#eee' }} />
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div style={s.fieldGroup}>
                      <label style={s.label}>Email address</label>
                      <input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} onBlur={() => setEmailTouched(true)} style={s.input(emailInvalid)} required />
                      {emailInvalid && <div style={s.fieldError}>Enter a valid email address</div>}
                    </div>
                    <div style={s.fieldGroup}>
                      <label style={s.label}>Password</label>
                      <div style={s.inputWrap}>
                        <input type={showPassword ? 'text' : 'password'} placeholder="Your password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={s.passwordInput(false)} required />
                        <button type="button" style={s.eyeBtn} onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                          {showPassword ? <EyeOff /> : <EyeOpen />}
                        </button>
                      </div>
                      <button type="button" style={s.forgotBtn} onClick={() => setView('forgot')}>Forgot password?</button>
                    </div>
                    <motion.button type="submit" style={s.submitBtn(loading)} disabled={loading} whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(230,57,70,0.4)' }} whileTap={{ scale: 0.96 }}>
                      {loading && <span style={s.spinner} />}
                      {loading ? 'Signing in…' : 'Sign in'}
                    </motion.button>
                  </form>
                  <div style={s.registerRow}>Don't have an account?{' '}<a href="/register" style={s.registerLink}>Register →</a></div>
                </motion.div>
              )}

              {/* ── FORGOT VIEW ── */}
              {view === 'forgot' && (
                <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  <button type="button" style={s.backArrow} onClick={() => setView('login')}>← Back</button>
                  <div style={s.lockWrap}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <h2 style={{ ...s.cardTitle, marginBottom: '0.5rem' }}>Reset your password</h2>
                  <p style={{ ...s.cardSub, marginBottom: '1.5rem' }}>Enter your account email and we'll send a reset link.</p>
                  <AnimatePresence>
                    {resetError && (
                      <motion.div style={s.errorBanner} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <span>⚠️</span><span>{resetError}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <form onSubmit={handleForgotSubmit}>
                    <div style={s.fieldGroup}>
                      <label style={s.label}>Email address</label>
                      <input type="email" placeholder="you@example.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} style={s.input(false)} autoFocus required />
                    </div>
                    <motion.button type="submit" style={s.submitBtn(resetLoading)} disabled={resetLoading} whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(230,57,70,0.4)' }} whileTap={{ scale: 0.96 }}>
                      {resetLoading && <span style={s.spinner} />}
                      {resetLoading ? 'Sending…' : 'Send Reset Link'}
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {/* ── SENT VIEW ── */}
              {view === 'sent' && (
                <motion.div key="sent" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ textAlign: 'center' }}>
                  <div style={s.sentCircle(checkVisible)}>✓</div>
                  <h2 style={{ ...s.cardTitle, marginTop: '1.5rem', textAlign: 'center' }}>Check your inbox!</h2>
                  <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: 1.7, margin: '0.75rem 0 1.5rem' }}>
                    We sent a reset link to{' '}<strong style={{ color: '#ff6b00' }}>{resetEmail}</strong><br />
                    Check your spam folder if you don't see it within 2 minutes.
                  </p>
                  <button type="button" style={s.resendBtn(cooldown > 0)} onClick={() => cooldown === 0 && setView('forgot')} disabled={cooldown > 0}>
                    {cooldown > 0 ? `Resend in ${cooldown}s…` : "Didn't get it? Resend →"}
                  </button>
                  <button type="button" style={s.backToLoginBtn} onClick={() => setView('login')}>Back to sign in</button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  );
}
