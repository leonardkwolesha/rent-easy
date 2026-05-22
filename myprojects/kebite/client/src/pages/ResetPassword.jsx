import { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import KebiteLogo from '../components/KebiteLogo';
import PageWrapper from '../components/PageWrapper';
import { useToast } from '../components/Toast';

const FONT = "'Segoe UI', system-ui, sans-serif";
const GRADIENT = 'linear-gradient(135deg, #ff6b00, #e63946)';

const EyeOpen = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOff = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const s = {
  page: { fontFamily: FONT, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(1rem, 4vw, 2rem)', background: 'linear-gradient(135deg, #fff5ef 0%, #ffe5dd 100%)' },
  card: { background: '#fff', borderRadius: 18, boxShadow: '0 12px 40px rgba(0,0,0,0.08)', padding: 'clamp(1.5rem, 5vw, 2.5rem)', width: '100%', maxWidth: 440, boxSizing: 'border-box' },
  topRow: { display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' },
  logoBadge: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.6rem 1rem', borderRadius: 14, background: GRADIENT },
  iconWrap: { display: 'flex', justifyContent: 'center', marginBottom: '1rem' },
  iconCircle: { width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #fff5ef, #ffe0d3)', color: '#e63946', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 'clamp(1.4rem, 4.5vw, 1.75rem)', fontWeight: 900, color: '#1a1a2e', margin: '0 0 0.35rem', textAlign: 'center' },
  sub: { color: '#666', fontSize: '0.9rem', textAlign: 'center', margin: '0 0 1.5rem', lineHeight: 1.5 },
  errorBanner: { display: 'flex', alignItems: 'center', gap: '0.65rem', background: '#fff5f5', border: '1px solid #fcc', borderRadius: 14, padding: '0.7rem 1rem', marginBottom: '1rem', color: '#c1121f', fontSize: '0.88rem' },
  fieldGroup: { marginBottom: '1rem' },
  label: { display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#444', marginBottom: '0.35rem' },
  inputWrap: { position: 'relative' },
  passwordInput: (invalid) => ({ width: '100%', padding: '0.8rem 3rem 0.8rem 1.2rem', borderRadius: 999, border: `1.5px solid ${invalid ? '#e63946' : '#e0e0e0'}`, fontSize: '0.95rem', outline: 'none', color: '#1a1a2e', background: '#fafafa', boxSizing: 'border-box', fontFamily: FONT }),
  eyeBtn: { position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 0, display: 'flex', alignItems: 'center' },
  fieldError: { color: '#e63946', fontSize: '0.78rem', marginTop: '0.3rem', fontWeight: 600 },
  meterWrap: { height: 6, background: '#f0f0f0', borderRadius: 99, overflow: 'hidden', marginTop: '0.5rem' },
  meterBar: (pct, color) => ({ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.25s ease' }),
  meterLabel: { fontSize: '0.74rem', color: '#888', marginTop: '0.3rem' },
  submitBtn: (loading) => ({ width: '100%', padding: '0.95rem', borderRadius: 999, border: 'none', background: loading ? 'linear-gradient(135deg, #ffaa66, #e8808a)' : GRADIENT, color: '#fff', fontWeight: 800, fontSize: '0.98rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginTop: '1rem', boxShadow: '0 8px 24px rgba(230,57,70,0.25)', fontFamily: FONT }),
  spinner: { width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 },
  bottomRow: { textAlign: 'center', marginTop: '1.25rem', fontSize: '0.86rem', color: '#888' },
  bottomLink: { color: '#ff6b00', fontWeight: 700, textDecoration: 'none' },
  successWrap: { textAlign: 'center' },
  successCircle: { width: 84, height: 84, borderRadius: '50%', background: '#d4f7e0', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' },
};

const KEYFRAMES = '@keyframes spin { from { transform: rotate(0) } to { transform: rotate(360deg) } }';

const LockIcon = ({ size = 28, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);
const CheckIcon = ({ size = 38 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

function strengthOf(pw) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}
const STRENGTH = [
  { label: 'Too short', color: '#e63946', pct: 10 },
  { label: 'Weak', color: '#e63946', pct: 25 },
  { label: 'Fair', color: '#f59e0b', pct: 50 },
  { label: 'Good', color: '#10b981', pct: 75 },
  { label: 'Strong', color: '#16a34a', pct: 90 },
  { label: 'Excellent', color: '#16a34a', pct: 100 },
];

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const showToast = useToast();

  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const strength = useMemo(() => STRENGTH[strengthOf(pw)] ?? STRENGTH[0], [pw]);
  const pwInvalid = pw.length > 0 && pw.length < 6;
  const confirmInvalid = confirm.length > 0 && confirm !== pw;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!token) { setError('This reset link is missing or invalid.'); return; }
    if (pw.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (pw !== confirm) { setError('Passwords do not match.'); return; }

    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: pw });
      setDone(true);
      showToast?.('Password updated. You can sign in now.', 'success');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset password. The link may have expired.');
    } finally {
      setSubmitting(false);
    }
  }

  // No token in URL — bail out cleanly
  if (!token) {
    return (
      <PageWrapper>
        <style>{KEYFRAMES}</style>
        <div style={s.page}>
          <div style={s.card}>
            <div style={s.topRow}><Link to="/" style={{ textDecoration: 'none' }}><KebiteLogo size="md" /></Link></div>
            <div style={s.iconWrap}>
              <div style={{ ...s.iconCircle, background: '#fff5f5', color: '#e63946' }}><LockIcon size={28} /></div>
            </div>
            <h1 style={s.title}>Invalid reset link</h1>
            <p style={s.sub}>This link is missing the reset token. Please request a new one from the sign-in page.</p>
            <Link to="/login" style={{ ...s.submitBtn(false), textDecoration: 'none' }}>Back to sign in</Link>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <style>{KEYFRAMES}</style>
      <div style={s.page}>
        <motion.div
          style={s.card}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        >
          <div style={s.topRow}>
            <Link to="/" style={{ textDecoration: 'none' }}><KebiteLogo size="md" /></Link>
          </div>

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                style={s.successWrap}
              >
                <motion.div
                  style={s.successCircle}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 480, damping: 18 }}
                >
                  <CheckIcon />
                </motion.div>
                <h1 style={s.title}>Password updated!</h1>
                <p style={s.sub}>Redirecting you to sign in…</p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={s.iconWrap}>
                  <div style={s.iconCircle}><LockIcon /></div>
                </div>
                <h1 style={s.title}>Set a new password</h1>
                <p style={s.sub}>Choose a strong password you haven't used before. At least 6 characters.</p>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={s.errorBanner}
                    >
                      <span aria-hidden>⚠</span><span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} noValidate>
                  <div style={s.fieldGroup}>
                    <label htmlFor="rp-pw" style={s.label}>New password</label>
                    <div style={s.inputWrap}>
                      <input
                        id="rp-pw"
                        type={showPw ? 'text' : 'password'}
                        value={pw}
                        onChange={(e) => setPw(e.target.value)}
                        style={s.passwordInput(pwInvalid)}
                        autoComplete="new-password"
                        autoFocus
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                        style={s.eyeBtn}
                      >
                        {showPw ? <EyeOff /> : <EyeOpen />}
                      </button>
                    </div>
                    {pwInvalid && <div style={s.fieldError}>At least 6 characters.</div>}
                    {pw && (
                      <>
                        <div style={s.meterWrap}>
                          <div style={s.meterBar(strength.pct, strength.color)} />
                        </div>
                        <div style={{ ...s.meterLabel, color: strength.color, fontWeight: 600 }}>
                          {strength.label}
                        </div>
                      </>
                    )}
                  </div>

                  <div style={s.fieldGroup}>
                    <label htmlFor="rp-confirm" style={s.label}>Confirm password</label>
                    <div style={s.inputWrap}>
                      <input
                        id="rp-confirm"
                        type={showConfirm ? 'text' : 'password'}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        style={s.passwordInput(confirmInvalid)}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        style={s.eyeBtn}
                      >
                        {showConfirm ? <EyeOff /> : <EyeOpen />}
                      </button>
                    </div>
                    {confirmInvalid && <div style={s.fieldError}>Passwords do not match.</div>}
                  </div>

                  <motion.button
                    type="submit"
                    disabled={submitting}
                    style={s.submitBtn(submitting)}
                    whileHover={!submitting ? { scale: 1.02 } : {}}
                    whileTap={!submitting ? { scale: 0.97 } : {}}
                  >
                    {submitting && <span style={s.spinner} />}
                    {submitting ? 'Updating…' : 'Update password'}
                  </motion.button>
                </form>

                <div style={s.bottomRow}>
                  Remembered it? <Link to="/login" style={s.bottomLink}>Back to sign in</Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
