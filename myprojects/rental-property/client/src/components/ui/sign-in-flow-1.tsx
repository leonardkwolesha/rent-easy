import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Building2, ArrowLeft, Eye, EyeOff, Mail, Lock, CheckCircle, ArrowRight } from "lucide-react";

const AUTH_CSS = `
.auth-input{width:100%;padding:13px 16px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;font-size:15px;outline:none;font-family:'DM Sans',sans-serif;transition:border-color .2s,box-shadow .2s;box-sizing:border-box}
.auth-input:focus{border-color:#52B788;box-shadow:0 0 0 3px rgba(82,183,136,.15)}
.auth-input::placeholder{color:rgba(255,255,255,.25)}
.auth-btn-p{width:100%;padding:14px;border-radius:10px;background:#52B788;color:#1B4332;font-weight:700;font-size:16px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;letter-spacing:-.2px;display:flex;align-items:center;justify-content:center;gap:8px}
.auth-btn-p:hover:not(:disabled){background:#6fcf97;transform:translateY(-1px)}
.auth-btn-p:disabled{opacity:.6;cursor:not-allowed;transform:none}
.auth-btn-s{padding:14px;border-radius:10px;background:transparent;color:#fff;font-weight:500;font-size:15px;border:1px solid rgba(255,255,255,.2);cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:6px}
.auth-btn-s:hover{background:rgba(255,255,255,.08)}
.auth-divider{height:1px;background:rgba(255,255,255,.1);flex:1}
.auth-link{color:#52B788;text-decoration:none;font-weight:500;transition:color .2s}
.auth-link:hover{color:#B7E4C7}
.auth-legal a{color:rgba(255,255,255,.35);text-decoration:underline;transition:color .2s}
.auth-legal a:hover{color:rgba(255,255,255,.6)}
.auth-social-btn{display:flex;align-items:center;justify-content:center;gap:10px;padding:13px 20px;border-radius:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#fff;cursor:pointer;font-size:14px;font-family:'DM Sans',sans-serif;transition:all .2s;width:100%}
.auth-social-btn:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.2)}
`;

const BG: React.CSSProperties = {
  minHeight: '100vh',
  background: '#0D1F15',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: "'DM Sans', sans-serif",
  overflow: 'hidden',
};

function AuthNav() {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 5%', height: 68,
      background: 'rgba(13,31,21,0.92)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', textDecoration: 'none' }}>
        <div style={{ width: 32, height: 32, background: '#52B788', borderRadius: 7, display: 'grid', placeItems: 'center' }}>
          <Building2 size={17} color="#1B4332" strokeWidth={2.5} />
        </div>
        RentEase
      </Link>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'rgba(255,255,255,.45)', textDecoration: 'none', transition: 'color .2s' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.8)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.45)'}>
        <ArrowLeft size={14} />Back to home
      </Link>
    </nav>
  );
}

export function MiniNavbar() { return <AuthNav />; }
export const CanvasRevealEffect = () => null;

interface SignInPageProps { className?: string }

export const SignInPage = ({ className }: SignInPageProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [step, setStep] = useState<"email" | "password" | "success">("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pwRef = useRef<HTMLInputElement | null>(null);

  const { login } = useAuth() as { login: (e: string, p: string) => Promise<{ name: string }> };
  const navigate = useNavigate();

  useEffect(() => {
    const s = document.createElement('style');
    s.dataset.id = 'auth-styles';
    s.textContent = AUTH_CSS;
    document.head.appendChild(s);
    return () => { document.head.removeChild(s); };
  }, []);

  useEffect(() => {
    if (step === "password") setTimeout(() => pwRef.current?.focus(), 300);
  }, [step]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) { setError(""); setStep("password"); }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      setStep("success");
      setTimeout(() => navigate("/dashboard"), 1400);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const legalLinks = (
    <p className="auth-legal" style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', textAlign: 'center' }}>
      By signing in you agree to our{" "}
      <Link to="/properties">Terms</Link>,{" "}
      <Link to="/properties">Privacy</Link>, and{" "}
      <Link to="/properties">Cookie Policy</Link>.
    </p>
  );

  return (
    <div style={BG} className={className}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 65% 35%, rgba(27,67,50,0.55), transparent 65%)' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', pointerEvents: 'none', background: 'linear-gradient(to bottom, rgba(13,31,21,0.7), transparent)' }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <AuthNav />

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 24px 48px' }}>
          <div style={{ width: '100%', maxWidth: 400 }}>
            <AnimatePresence mode="wait">

              {/* ── Step 1: Email ── */}
              {step === "email" && (
                <motion.div key="email"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.32 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

                  <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(32px,5vw,44px)', fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 8 }}>
                      Welcome back
                    </h1>
                    <p style={{ fontSize: 16, color: 'rgba(255,255,255,.5)', fontWeight: 300 }}>Sign in to your RentEase account</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Google OAuth (placeholder — not wired) */}
                    <button className="auth-social-btn" type="button">
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Continue with Google
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="auth-divider" />
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,.3)', whiteSpace: 'nowrap' }}>or with email</span>
                      <div className="auth-divider" />
                    </div>

                    <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ position: 'relative' }}>
                        <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.3)', pointerEvents: 'none' }} />
                        <input
                          type="email" className="auth-input"
                          placeholder="your@email.com"
                          value={email} onChange={e => setEmail(e.target.value)}
                          required style={{ paddingLeft: 42 }}
                        />
                      </div>
                      <button type="submit" className="auth-btn-p">
                        Continue <ArrowRight size={16} />
                      </button>
                    </form>
                  </div>

                  <p style={{ textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,.4)' }}>
                    No account?{" "}<Link to="/register" className="auth-link">Create one free</Link>
                  </p>
                  {legalLinks}
                </motion.div>
              )}

              {/* ── Step 2: Password ── */}
              {step === "password" && (
                <motion.div key="password"
                  initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.32 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

                  <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(28px,5vw,40px)', fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: '-1px', marginBottom: 8 }}>
                      Enter password
                    </h1>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,.4)' }}>
                      Signing in as{" "}
                      <span style={{ color: '#52B788', fontWeight: 500 }}>{email}</span>
                    </p>
                  </div>

                  {error && (
                    <div style={{ fontSize: 13, color: '#FCA5A5', background: 'rgba(220,38,38,.12)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 9, padding: '11px 16px', textAlign: 'center' }}>
                      {error}
                    </div>
                  )}

                  <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                      <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.3)', pointerEvents: 'none' }} />
                      <input
                        ref={pwRef}
                        type={showPw ? "text" : "password"}
                        className="auth-input"
                        placeholder="Your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        style={{ paddingLeft: 42, paddingRight: 48 }}
                      />
                      <button
                        type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                        style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.4)', padding: 4, display: 'flex', alignItems: 'center' }}>
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="button" className="auth-btn-s" style={{ width: '32%' }}
                        onClick={() => { setStep("email"); setPassword(""); setError(""); }}>
                        <ArrowLeft size={14} />Back
                      </button>
                      <button
                        type="submit" className="auth-btn-p" style={{ flex: 1 }}
                        disabled={!password || loading}>
                        {loading ? "Signing in…" : "Sign In"}
                      </button>
                    </div>
                  </form>

                  {legalLinks}
                </motion.div>
              )}

              {/* ── Step 3: Success ── */}
              {step === "success" && (
                <motion.div key="success"
                  initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'center', alignItems: 'center' }}>
                  <div>
                    <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: '-1px', marginBottom: 8 }}>
                      You're in!
                    </h1>
                    <p style={{ fontSize: 16, color: 'rgba(255,255,255,.5)' }}>Welcome back to RentEase</p>
                  </div>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.35, duration: 0.4, type: 'spring' }}
                    style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(82,183,136,.15)', border: '2px solid #52B788', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={32} color="#52B788" strokeWidth={2} />
                  </motion.div>
                  <button className="auth-btn-p" onClick={() => navigate("/dashboard")} style={{ maxWidth: 280 }}>
                    Go to Dashboard <ArrowRight size={16} />
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
