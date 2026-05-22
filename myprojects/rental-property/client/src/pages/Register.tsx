import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Building2, ArrowLeft, ArrowRight, Eye, EyeOff,
  Home, Briefcase, CheckCircle, User, Mail, Phone, Lock,
} from "lucide-react";

const AUTH_CSS = `
.auth-input{width:100%;padding:13px 16px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;font-size:15px;outline:none;font-family:'DM Sans',sans-serif;transition:border-color .2s,box-shadow .2s;box-sizing:border-box}
.auth-input:focus{border-color:#52B788;box-shadow:0 0 0 3px rgba(82,183,136,.15)}
.auth-input::placeholder{color:rgba(255,255,255,.25)}
.auth-btn-p{width:100%;padding:14px;border-radius:10px;background:#52B788;color:#1B4332;font-weight:700;font-size:16px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;letter-spacing:-.2px;display:flex;align-items:center;justify-content:center;gap:8px}
.auth-btn-p:hover:not(:disabled){background:#6fcf97;transform:translateY(-1px)}
.auth-btn-p:disabled{opacity:.5;cursor:not-allowed;transform:none}
.auth-btn-s{padding:14px;border-radius:10px;background:transparent;color:#fff;font-weight:500;font-size:15px;border:1px solid rgba(255,255,255,.2);cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:6px}
.auth-btn-s:hover{background:rgba(255,255,255,.08)}
.auth-role-card{display:flex;align-items:center;gap:16px;width:100%;padding:16px 20px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);cursor:pointer;text-align:left;transition:all .2s;font-family:'DM Sans',sans-serif}
.auth-role-card:hover{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.2)}
.auth-role-card.selected{background:rgba(82,183,136,.1);border-color:rgba(82,183,136,.5)}
.auth-link{color:#52B788;text-decoration:none;font-weight:500;transition:color .2s}
.auth-link:hover{color:#B7E4C7}
.auth-legal a{color:rgba(255,255,255,.35);text-decoration:underline;transition:color .2s}
.auth-legal a:hover{color:rgba(255,255,255,.6)}
.input-icon-wrap{position:relative}
.input-icon-wrap svg.input-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);pointer-events:none;color:rgba(255,255,255,.3)}
.input-icon-wrap .auth-input{padding-left:42px}
`;

const ROLES = [
  {
    value: "tenant",
    label: "Tenant",
    desc: "I'm looking to rent a property",
    Icon: Home,
  },
  {
    value: "landlord",
    label: "Landlord",
    desc: "I own properties to rent out",
    Icon: Building2,
  },
  {
    value: "agent",
    label: "Agent",
    desc: "I manage properties for landlords",
    Icon: Briefcase,
  },
];

type Step = "role" | "details" | "password" | "success";

function strengthColor(len: number) {
  if (len < 6) return '#F87171';
  if (len < 10) return '#FCD34D';
  return '#52B788';
}

function strengthLabel(len: number) {
  if (len === 0) return '';
  if (len < 6) return 'Too short';
  if (len < 10) return 'Fair';
  return 'Strong';
}

export default function Register() {
  const [step, setStep] = useState<Step>("role");
  const [dir, setDir] = useState(1);
  const [role, setRole] = useState("tenant");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth() as {
    register: (data: { name: string; email: string; phone: string; password: string; role: string }) => Promise<{ name: string }>;
  };
  const navigate = useNavigate();

  useEffect(() => {
    const s = document.createElement('style');
    s.dataset.id = 'auth-styles-reg';
    s.textContent = AUTH_CSS;
    document.head.appendChild(s);
    return () => { document.head.removeChild(s); };
  }, []);

  const advance = (next: Step) => { setDir(1); setError(""); setStep(next); };
  const back = (prev: Step) => { setDir(-1); setError(""); setStep(prev); };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Full name is required."); return; }
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    advance("password");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    setError("");
    try {
      await register({ name, email, phone, password, role });
      setStep("success");
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const slide = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 55 : -55 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -55 : 55 }),
  };

  const legalLinks = (
    <p className="auth-legal" style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', textAlign: 'center' }}>
      By signing up you agree to our{" "}
      <Link to="/properties">Terms</Link>,{" "}
      <Link to="/properties">Privacy</Link>, and{" "}
      <Link to="/properties">Cookie Policy</Link>.
    </p>
  );

  const ErrorBox = ({ msg }: { msg: string }) => (
    <div style={{ fontSize: 13, color: '#FCA5A5', background: 'rgba(220,38,38,.12)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 9, padding: '11px 16px', textAlign: 'center' }}>
      {msg}
    </div>
  );

  /* ── Step indicator dots ── */
  const steps: Step[] = ["role", "details", "password"];
  const currentIdx = steps.indexOf(step);

  return (
    <div style={{ minHeight: '100vh', background: '#0D1F15', position: 'relative', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden' }}>
      {/* bg gradients */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 30% 60%, rgba(27,67,50,0.55), transparent 65%)' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', pointerEvents: 'none', background: 'linear-gradient(to bottom, rgba(13,31,21,0.7), transparent)' }} />

      {/* nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 5%', height: 68, background: 'rgba(13,31,21,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
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

      {/* content */}
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 24px 48px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* step dots */}
          {step !== "success" && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
              {steps.map((s, i) => (
                <div key={s} style={{
                  height: 4, borderRadius: 2, transition: 'all .3s',
                  width: i === currentIdx ? 24 : 8,
                  background: i <= currentIdx ? '#52B788' : 'rgba(255,255,255,.15)',
                }} />
              ))}
            </div>
          )}

          <AnimatePresence mode="wait" custom={dir}>

            {/* ── STEP 1: Role ── */}
            {step === "role" && (
              <motion.div key="role" custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ textAlign: 'center' }}>
                  <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(32px,5vw,44px)', fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 8 }}>
                    Join RentEase
                  </h1>
                  <p style={{ fontSize: 16, color: 'rgba(255,255,255,.5)', fontWeight: 300 }}>I am a…</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {ROLES.map(r => {
                    const selected = role === r.value;
                    return (
                      <button key={r.value} type="button" onClick={() => setRole(r.value)}
                        className={`auth-role-card${selected ? ' selected' : ''}`}>
                        {/* icon bubble */}
                        <div style={{
                          width: 44, height: 44, borderRadius: 11, flexShrink: 0,
                          background: selected ? 'rgba(82,183,136,.18)' : 'rgba(255,255,255,.06)',
                          border: `1px solid ${selected ? 'rgba(82,183,136,.4)' : 'rgba(255,255,255,.08)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all .2s',
                        }}>
                          <r.Icon size={20} color={selected ? '#52B788' : 'rgba(255,255,255,.4)'} strokeWidth={1.7} />
                        </div>
                        {/* text */}
                        <span style={{ flex: 1 }}>
                          <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: selected ? '#fff' : 'rgba(255,255,255,.7)' }}>{r.label}</span>
                          <span style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,.35)', marginTop: 2 }}>{r.desc}</span>
                        </span>
                        {/* radio dot */}
                        <span style={{
                          width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                          border: `2px solid ${selected ? '#52B788' : 'rgba(255,255,255,.2)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'border-color .2s',
                        }}>
                          {selected && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#52B788' }} />}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button className="auth-btn-p" onClick={() => advance("details")}>
                  Continue <ArrowRight size={16} />
                </button>

                <p style={{ textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,.4)' }}>
                  Already have an account?{" "}
                  <Link to="/login" className="auth-link">Sign in</Link>
                </p>
                {legalLinks}
              </motion.div>
            )}

            {/* ── STEP 2: Details ── */}
            {step === "details" && (
              <motion.div key="details" custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ textAlign: 'center' }}>
                  <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(28px,5vw,40px)', fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: '-1px', marginBottom: 8 }}>
                    About you
                  </h1>
                  <p style={{ fontSize: 15, color: 'rgba(255,255,255,.45)' }}>
                    Signing up as a{" "}
                    <span style={{ color: '#52B788', fontWeight: 600, textTransform: 'capitalize' }}>{role}</span>
                  </p>
                </div>

                {error && <ErrorBox msg={error} />}

                <form onSubmit={handleDetailsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Full name */}
                  <div className="input-icon-wrap">
                    <User size={15} className="input-icon" />
                    <input type="text" className="auth-input" placeholder="Full name"
                      value={name} onChange={e => setName(e.target.value)} autoFocus />
                  </div>
                  {/* Email */}
                  <div className="input-icon-wrap">
                    <Mail size={15} className="input-icon" />
                    <input type="email" className="auth-input" placeholder="Email address"
                      value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  {/* Phone */}
                  <div className="input-icon-wrap">
                    <Phone size={15} className="input-icon" />
                    <input type="tel" className="auth-input" placeholder="Phone number (optional)"
                      value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button type="button" className="auth-btn-s" style={{ width: '32%' }}
                      onClick={() => back("role")}>
                      <ArrowLeft size={14} />Back
                    </button>
                    <button type="submit" className="auth-btn-p" style={{ flex: 1 }}>
                      Continue <ArrowRight size={16} />
                    </button>
                  </div>
                </form>

                {legalLinks}
              </motion.div>
            )}

            {/* ── STEP 3: Password ── */}
            {step === "password" && (
              <motion.div key="password" custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ textAlign: 'center' }}>
                  <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(28px,5vw,40px)', fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: '-1px', marginBottom: 8 }}>
                    Set password
                  </h1>
                  <p style={{ fontSize: 15, color: 'rgba(255,255,255,.45)' }}>
                    Almost there, {name.split(" ")[0]} 👋
                  </p>
                </div>

                {error && <ErrorBox msg={error} />}

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.3)', pointerEvents: 'none' }} />
                    <input
                      type={showPw ? "text" : "password"}
                      className="auth-input"
                      placeholder="Create a password (min. 6 chars)"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoFocus
                      style={{ paddingLeft: 42, paddingRight: 48 }}
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.35)', padding: 4, display: 'flex', alignItems: 'center' }}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {password.length > 0 && (
                    <div>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                        {[...Array(4)].map((_, i) => (
                          <div key={i} style={{
                            height: 3, flex: 1, borderRadius: 2, transition: 'background .3s',
                            background: password.length >= (i + 1) * 3
                              ? strengthColor(password.length)
                              : 'rgba(255,255,255,.1)',
                          }} />
                        ))}
                      </div>
                      <p style={{ fontSize: 11, color: strengthColor(password.length), fontWeight: 500 }}>
                        {strengthLabel(password.length)}
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" className="auth-btn-s" style={{ width: '32%' }}
                      onClick={() => back("details")}>
                      <ArrowLeft size={14} />Back
                    </button>
                    <button type="submit" className="auth-btn-p" style={{ flex: 1 }}
                      disabled={loading || password.length < 6}>
                      {loading ? "Creating account…" : "Create Account"}
                    </button>
                  </div>
                </form>

                {legalLinks}
              </motion.div>
            )}

            {/* ── STEP 4: Success ── */}
            {step === "success" && (
              <motion.div key="success"
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'center', alignItems: 'center' }}>
                <div>
                  <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: '-1px', marginBottom: 8 }}>
                    You're in!
                  </h1>
                  <p style={{ fontSize: 16, color: 'rgba(255,255,255,.5)' }}>
                    Welcome to RentEase, {name.split(" ")[0]}
                  </p>
                </div>

                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.35, duration: 0.45, type: 'spring', stiffness: 200 }}
                  style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(82,183,136,.15)', border: '2px solid #52B788', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={36} color="#52B788" strokeWidth={2} />
                </motion.div>

                {role === 'agent' && (
                  <div style={{ background: 'rgba(255,193,7,.08)', border: '1px solid rgba(255,193,7,.2)', borderRadius: 10, padding: '12px 16px', maxWidth: 340 }}>
                    <p style={{ fontSize: 13, color: '#FCD34D', lineHeight: 1.6 }}>
                      Agent accounts require admin approval before you can list properties. You'll be notified once approved.
                    </p>
                  </div>
                )}

                <p style={{ fontSize: 14, color: 'rgba(255,255,255,.4)' }}>
                  Redirecting to your dashboard…
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
