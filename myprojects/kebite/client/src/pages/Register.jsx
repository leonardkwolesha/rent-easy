import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import KebiteLogo from '../components/KebiteLogo';
import PageWrapper from '../components/PageWrapper';
import { stagger, slideInLeft } from '../animations/variants';

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
const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);
const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e63946" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CustomerSvg = ({ selected }) => {
  const fill = selected ? 'white' : '#ff6b00';
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="10" r="6" fill={fill}/>
      <path d="M8 32c0-6.627 5.373-12 12-12s12 5.373 12 12" fill={fill} opacity="0.85"/>
      <line x1="14" y1="18" x2="14" y2="26" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="18" x2="12" y2="21" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="16" y1="18" x2="16" y2="21" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="21" x2="16" y2="21" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <ellipse cx="27" cy="19.5" rx="2" ry="3" fill="none" stroke="white" strokeWidth="1.8"/>
      <line x1="27" y1="22.5" x2="27" y2="27" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
};

const RestaurantSvg = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <path d="M4 16 L20 6 L36 16 Z" fill="#e63946"/>
    <path d="M4 16 L36 16 L36 20 L4 20 Z" fill="#c1121f"/>
    <rect x="6" y="20" width="28" height="14" rx="1" fill="#ff6b00" opacity="0.9"/>
    <rect x="16" y="26" width="8" height="8" rx="2" fill="white" opacity="0.9"/>
    <circle cx="22.5" cy="30" r="1" fill="#ff6b00"/>
    <rect x="8" y="23" width="6" height="5" rx="1" fill="white" opacity="0.85"/>
    <rect x="26" y="23" width="6" height="5" rx="1" fill="white" opacity="0.85"/>
    <rect x="14" y="16" width="12" height="5" rx="1" fill="white" opacity="0.95"/>
    <line x1="16" y1="18" x2="22" y2="18" stroke="#ff6b00" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="16" y1="20" x2="20" y2="20" stroke="#ff6b00" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const RiderSvg = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <path d="M8 22 C8 12 32 12 32 22 L32 26 C32 28 30 30 28 30 L12 30 C10 30 8 28 8 26 Z" fill="#ff6b00"/>
    <path d="M10 22 C10 18 30 18 30 22 L30 24 C30 25 29 26 28 26 L12 26 C11 26 10 25 10 24 Z" fill="#1a1a2e" opacity="0.85"/>
    <path d="M13 20 Q20 18 27 20" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
    <rect x="13" y="28" width="14" height="4" rx="2" fill="#c1121f"/>
    <line x1="2" y1="20" x2="7" y2="20" stroke="#ff6b00" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    <line x1="2" y1="24" x2="6" y2="24" stroke="#ff6b00" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <line x1="33" y1="20" x2="38" y2="20" stroke="#ff6b00" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    <line x1="34" y1="24" x2="38" y2="24" stroke="#ff6b00" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
  </svg>
);

const MotorcycleSvg = () => (
  <svg width="80" height="56" viewBox="0 0 80 56" fill="none">
    <defs>
      <linearGradient id="motoBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ff6b00"/><stop offset="100%" stopColor="#c1121f"/>
      </linearGradient>
      <linearGradient id="motoWheel" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#444"/><stop offset="100%" stopColor="#111"/>
      </linearGradient>
      <linearGradient id="motoShine" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity="0.6"/><stop offset="100%" stopColor="white" stopOpacity="0"/>
      </linearGradient>
      <filter id="motoShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="rgba(0,0,0,0.25)"/>
      </filter>
    </defs>
    <circle cx="18" cy="40" r="13" fill="url(#motoWheel)" filter="url(#motoShadow)"/>
    <circle cx="18" cy="40" r="9" fill="none" stroke="#666" strokeWidth="2"/>
    <circle cx="18" cy="40" r="3" fill="#888"/>
    <path d="M10 34 A10 10 0 0 1 20 32" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <circle cx="62" cy="40" r="13" fill="url(#motoWheel)" filter="url(#motoShadow)"/>
    <circle cx="62" cy="40" r="9" fill="none" stroke="#666" strokeWidth="2"/>
    <circle cx="62" cy="40" r="3" fill="#888"/>
    <path d="M54 34 A10 10 0 0 1 64 32" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <path d="M18 40 L62 40" stroke="#333" strokeWidth="3" strokeLinecap="round"/>
    <path d="M22 38 L24 24 L46 20 L58 26 L60 38 Z" fill="url(#motoBody)" filter="url(#motoShadow)"/>
    <path d="M26 24 L44 21 L52 24" stroke="url(#motoShine)" strokeWidth="4" strokeLinecap="round" opacity="0.7"/>
    <path d="M28 26 Q38 22 50 24 L50 28 Q38 26 28 30 Z" fill="#1a1a2e" opacity="0.9"/>
    <path d="M56 22 L62 18 L64 20 L60 24" stroke="#333" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <ellipse cx="64" cy="28" rx="4" ry="3" fill="#fff" opacity="0.95"/>
    <ellipse cx="64" cy="28" rx="2.5" ry="1.8" fill="#ffdd77" opacity="0.8"/>
    <path d="M22 36 L14 38 L12 40 L16 42 L22 40" fill="#888" opacity="0.7"/>
    <line x1="2" y1="36" x2="10" y2="36" stroke="#ff6b00" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    <line x1="2" y1="40" x2="8" y2="40" stroke="#ff6b00" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
    <line x1="2" y1="44" x2="9" y2="44" stroke="#ff6b00" strokeWidth="1" strokeLinecap="round" opacity="0.25"/>
    <ellipse cx="40" cy="53" rx="28" ry="3" fill="rgba(0,0,0,0.12)"/>
  </svg>
);

const CarSvg = () => (
  <svg width="80" height="56" viewBox="0 0 80 56" fill="none">
    <defs>
      <linearGradient id="carBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ff6b00"/><stop offset="100%" stopColor="#c1121f"/>
      </linearGradient>
      <linearGradient id="carRoof" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#e63946"/><stop offset="100%" stopColor="#a0131e"/>
      </linearGradient>
      <linearGradient id="carWheel" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#555"/><stop offset="100%" stopColor="#111"/>
      </linearGradient>
      <linearGradient id="carGlass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#a8d8f0" stopOpacity="0.95"/><stop offset="100%" stopColor="#5bb8e8" stopOpacity="0.7"/>
      </linearGradient>
      <filter id="carShadow" x="-10%" y="-10%" width="120%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="rgba(0,0,0,0.3)"/>
      </filter>
    </defs>
    <path d="M6 34 L6 42 Q6 46 10 46 L70 46 Q74 46 74 42 L74 34 Z" fill="url(#carBody)" filter="url(#carShadow)"/>
    <path d="M18 34 L22 20 Q24 16 28 16 L52 16 Q56 16 58 20 L62 34 Z" fill="url(#carRoof)"/>
    <path d="M24 20 Q40 14 56 20" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.35"/>
    <path d="M52 16 L58 20 L60 32 L48 32 Z" fill="url(#carGlass)" opacity="0.9"/>
    <path d="M53 17 L57 21" stroke="white" strokeWidth="1" opacity="0.5" strokeLinecap="round"/>
    <path d="M28 16 L22 20 L20 32 L32 32 Z" fill="url(#carGlass)" opacity="0.9"/>
    <path d="M32 16 L48 16 L48 32 L32 32 Z" fill="url(#carGlass)" opacity="0.85"/>
    <line x1="40" y1="16" x2="40" y2="32" stroke="white" strokeWidth="1.5" opacity="0.4"/>
    <path d="M34 18 L46 18" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    <line x1="32" y1="32" x2="32" y2="44" stroke="#c1121f" strokeWidth="1" opacity="0.5"/>
    <path d="M8 38 L72 38" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.2"/>
    <circle cx="58" cy="46" r="10" fill="url(#carWheel)"/>
    <circle cx="58" cy="46" r="6" fill="#333"/>
    <circle cx="58" cy="46" r="3" fill="#777"/>
    <line x1="58" y1="40" x2="58" y2="52" stroke="#999" strokeWidth="1.2"/>
    <line x1="52" y1="46" x2="64" y2="46" stroke="#999" strokeWidth="1.2"/>
    <line x1="53.7" y1="41.7" x2="62.3" y2="50.3" stroke="#999" strokeWidth="1"/>
    <line x1="62.3" y1="41.7" x2="53.7" y2="50.3" stroke="#999" strokeWidth="1"/>
    <path d="M52 42 A8 8 0 0 1 60 40" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
    <circle cx="22" cy="46" r="10" fill="url(#carWheel)"/>
    <circle cx="22" cy="46" r="6" fill="#333"/>
    <circle cx="22" cy="46" r="3" fill="#777"/>
    <line x1="22" y1="40" x2="22" y2="52" stroke="#999" strokeWidth="1.2"/>
    <line x1="16" y1="46" x2="28" y2="46" stroke="#999" strokeWidth="1.2"/>
    <line x1="17.7" y1="41.7" x2="26.3" y2="50.3" stroke="#999" strokeWidth="1"/>
    <line x1="26.3" y1="41.7" x2="17.7" y2="50.3" stroke="#999" strokeWidth="1"/>
    <path d="M16 42 A8 8 0 0 1 24 40" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
    <path d="M70 30 L74 32 L74 38 L70 38 Z" fill="#fff" opacity="0.95"/>
    <path d="M71 31 L74 33 L74 37 L71 37 Z" fill="#ffdd77" opacity="0.7"/>
    <rect x="6" y="32" width="4" height="8" rx="1" fill="#ff0000" opacity="0.85"/>
    <rect x="6" y="32" width="4" height="4" rx="1" fill="#ff6666" opacity="0.6"/>
    <rect x="55" y="38" width="6" height="2" rx="1" fill="#c1121f" opacity="0.6"/>
    <rect x="33" y="38" width="6" height="2" rx="1" fill="#c1121f" opacity="0.6"/>
    <ellipse cx="40" cy="56" rx="32" ry="3" fill="rgba(0,0,0,0.15)"/>
  </svg>
);

function getRoleCircleBg(value, selected) {
  if (!selected) return { customer: '#fff3ec', restaurant: '#fff0f0', rider: '#fff5ec' }[value];
  return { customer: '#ff6b00', restaurant: '#e63946', rider: 'linear-gradient(135deg,#ff6b00,#e63946)' }[value];
}

const BENEFITS = [
  { icon: '🎁', text: 'Free to join — no signup fees, ever' },
  { icon: '🏷️', text: 'Exclusive deals only for Kebite members' },
  { icon: '⚡', text: 'Fast 30-min delivery across Tanzania 🇹🇿' },
];

const ROLES = [
  { value: 'customer', icon: '👤', label: "I'm a Customer", desc: 'Order food from your favourite restaurants' },
  { value: 'restaurant', icon: '🏪', label: "I'm a Restaurant Partner", desc: 'List your restaurant and receive orders' },
  { value: 'rider', icon: '🛵', label: "I'm a Rider", desc: 'Deliver orders and earn money' },
];

const VEHICLE_TYPES = [
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'car', label: 'Car' },
];

function getStrength(pw) {
  if (!pw) return 0;
  if (pw.length < 6) return 1;
  if (pw.length < 10 || !/[!@#$%^&*]/.test(pw)) return 2;
  return 3;
}
const STRENGTH_META = {
  0: { width: '0%', color: 'transparent', label: '' },
  1: { width: '33%', color: '#e63946', label: 'Weak' },
  2: { width: '66%', color: '#f59e0b', label: 'Medium' },
  3: { width: '100%', color: '#22c55e', label: 'Strong' },
};

function formatPhone(raw) {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('255')) digits = digits.slice(3);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  digits = digits.slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

function useIsMobile(bp = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < bp);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp - 1}px)`);
    const h = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', h); return () => mq.removeEventListener('change', h);
  }, [bp]);
  return isMobile;
}

const s = {
  page: { fontFamily: "'Segoe UI', system-ui, sans-serif", display: 'flex', minHeight: '100vh', background: '#f8f8f8' },
  left: { flex: '0 0 45%', width: '45%', minHeight: '100vh', background: 'linear-gradient(135deg, #ff6b00 0%, #e63946 60%, #c1121f 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem', color: '#fff', position: 'relative', overflow: 'hidden' },
  bubble: (size, top, left, opacity) => ({ position: 'absolute', width: size, height: size, borderRadius: '50%', background: `rgba(255,255,255,${opacity})`, top, left, pointerEvents: 'none' }),
  leftInner: { position: 'relative', zIndex: 1, maxWidth: '400px' },
  tagline: { fontSize: '1.1rem', opacity: 0.9, marginBottom: '3rem', lineHeight: 1.5, marginTop: '0.5rem' },
  benefitsList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  benefitItem: { display: 'flex', alignItems: 'flex-start', gap: '0.85rem' },
  benefitIcon: { width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 },
  benefitText: { fontSize: '0.95rem', opacity: 0.92, lineHeight: 1.5, paddingTop: '0.5rem' },
  right: { flex: '1', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', overflowY: 'auto' },
  card: (visible) => ({ background: '#fff', borderRadius: '18px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '2.5rem', width: '100%', maxWidth: '440px', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.4s ease, transform 0.4s ease' }),
  cardTitle: { fontSize: '1.75rem', fontWeight: 900, color: '#1a1a2e', margin: '0 0 0.35rem' },
  cardSub: { color: '#888', fontSize: '0.9rem', marginBottom: '2rem' },
  progressRow: { display: 'flex', alignItems: 'center', marginBottom: '2rem' },
  stepCircle: (active, done) => ({ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0, background: active || done ? 'linear-gradient(135deg, #ff6b00, #e63946)' : 'transparent', border: active || done ? 'none' : '2px solid #ddd', color: active || done ? '#fff' : '#aaa' }),
  stepLine: (done) => ({ flex: 1, height: '3px', margin: '0 0.5rem', background: done ? 'linear-gradient(90deg, #ff6b00, #e63946)' : '#e8e8e8', borderRadius: '999px' }),
  stepLabel: (active) => ({ fontSize: '0.72rem', fontWeight: 600, marginTop: '0.3rem', color: active ? '#ff6b00' : '#aaa', textAlign: 'center' }),
  stepCol: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  fieldGroup: { marginBottom: '1.25rem' },
  label: { display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#444', marginBottom: '0.4rem' },
  input: (invalid) => ({ width: '100%', padding: '0.8rem 1.25rem', borderRadius: '999px', border: `1.5px solid ${invalid ? '#e63946' : '#e0e0e0'}`, fontSize: '0.95rem', outline: 'none', color: '#1a1a2e', background: '#fafafa', boxSizing: 'border-box' }),
  inputWrap: { position: 'relative' },
  trailingIcon: { position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' },
  eyeBtn: { position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 0, display: 'flex', alignItems: 'center' },
  fieldError: { color: '#e63946', fontSize: '0.78rem', marginTop: '0.35rem' },
  phoneRow: { display: 'flex', borderRadius: '999px', overflow: 'hidden', border: '1.5px solid #e0e0e0', background: '#fafafa' },
  phonePrefix: { padding: '0.8rem 1rem', background: '#f0f0f0', color: '#555', fontSize: '0.92rem', fontWeight: 600, borderRight: '1.5px solid #e0e0e0', whiteSpace: 'nowrap', flexShrink: 0, userSelect: 'none' },
  phoneInput: { flex: 1, padding: '0.8rem 1.25rem', border: 'none', outline: 'none', fontSize: '0.95rem', color: '#1a1a2e', background: 'transparent', letterSpacing: '0.5px' },
  strengthRow: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.5rem' },
  strengthTrack: { flex: 1, height: '4px', background: '#e8e8e8', borderRadius: '999px', overflow: 'hidden' },
  strengthFill: (width, color) => ({ height: '100%', width, background: color, borderRadius: '999px', transition: 'width 0.3s, background 0.3s' }),
  primaryBtn: (loading) => ({ width: '100%', padding: '0.9rem', borderRadius: '999px', border: 'none', background: loading ? 'linear-gradient(135deg, #ffaa66, #e8808a)' : 'linear-gradient(135deg, #ff6b00, #e63946)', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginTop: '1.5rem' }),
  backBtn: { background: 'none', border: 'none', color: '#ff6b00', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', padding: '0.25rem 0', marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' },
  spinner: { width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 },
  errorBanner: { display: 'flex', alignItems: 'center', gap: '0.65rem', background: '#fff5f5', border: '1px solid #fcc', borderRadius: '16px', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#c1121f', fontSize: '0.9rem' },
  infoBanner: { background: '#fff3cd', color: '#856404', borderRadius: '12px', padding: '0.75rem 1rem', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem' },
  signinRow: { textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: '#888' },
  signinLink: { color: '#ff6b00', fontWeight: 700, textDecoration: 'none' },
  mobileTopBar: { background: 'linear-gradient(135deg, #ff6b00, #e63946)', padding: '1.5rem 1.5rem 2.5rem', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' },
  mobileTagline: { fontSize: '0.88rem', opacity: 0.9, margin: 0 },
};

export default function Register() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('customer');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', restaurantName: '', restaurantAddress: '', licenseNumber: '', vehicleType: 'motorcycle' });
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [touched, setTouched] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [visible, setVisible] = useState(false);
  const [roleHover, setRoleHover] = useState(null);
  const isMobile = useIsMobile();
  const phoneInputRef = useRef(null);

  useEffect(() => { const t = setTimeout(() => setVisible(true), 30); return () => clearTimeout(t); }, []);

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const passwordStrength = getStrength(form.password);
  const sm = STRENGTH_META[passwordStrength];

  function validateStep1() {
    const e = {};
    if (!form.name.trim() || !form.name.trim().includes(' ')) e.name = 'Enter your full name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (role === 'restaurant' && !form.restaurantName.trim()) e.restaurantName = 'Restaurant name is required';
    if (role === 'restaurant' && !form.restaurantAddress.trim()) e.restaurantAddress = 'Street address is required';
    return e;
  }
  function validateStep2() {
    const e = {};
    if (form.phone.replace(/\D/g, '').length < 9) e.phone = 'Enter a valid phone number';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (confirmPassword !== form.password) e.confirm = 'Passwords do not match';
    return e;
  }

  function handleContinue() {
    const e = validateStep1();
    if (Object.keys(e).length) { setErrors(e); setTouched({ name: true, email: true, restaurantName: true, restaurantAddress: true }); return; }
    setErrors({}); setStep(2);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validateStep2();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setSubmitError(''); setLoading(true);
    try {
      const payload = {
        ...form,
        role,
        phone: '+255' + form.phone.replace(/\D/g, ''),
      };
      const data = await register(payload);
      const userRole = data.user?.role;
      if (userRole === 'restaurant') navigate('/restaurant/dashboard');
      else if (userRole === 'rider') navigate('/rider/dashboard');
      else navigate('/');
    } catch (err) { setSubmitError(err.response?.data?.message || 'Registration failed. Please try again.'); }
    finally { setLoading(false); }
  };

  function blur(field) {
    setTouched((t) => ({ ...t, [field]: true }));
    const e = field === 'name' || field === 'email' || field === 'restaurantName' || field === 'restaurantAddress' ? validateStep1() : validateStep2();
    setErrors((prev) => ({ ...prev, [field]: e[field] }));
  }

  const confirmMatch = confirmPassword === form.password;
  const totalSteps = 3;

  const getRoleCard = (r) => {
    const selected = role === r.value;
    const hovered = roleHover === r.value;
    const selectedBorder = { customer: '#ff6b00', restaurant: '#e63946', rider: '#ff6b00' }[r.value];
    return {
      background: selected
        ? 'linear-gradient(135deg, rgba(255,107,0,0.06), rgba(230,57,70,0.06))'
        : '#ffffff',
      border: `2px solid ${selected ? selectedBorder : hovered ? '#ffcba4' : '#f0f0f0'}`,
      borderRadius: '20px',
      padding: '1.5rem 1rem',
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.2s ease',
      width: '100%',
    };
  };

  return (
    <PageWrapper>
      <div className="register-root" style={{ ...s.page, flexDirection: isMobile ? 'column' : 'row' }}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes card-select-pop {
            0%   { transform: scale(1); }
            50%  { transform: scale(1.04); }
            100% { transform: scale(1); }
          }
          @media (max-width: 768px) {
            .register-root { flex-direction: column !important; }
            .register-left { min-height: 200px !important; width: 100% !important; flex: none !important; padding: 2rem 1.5rem !important; justify-content: flex-start !important; }
            .register-right { min-height: calc(100vh - 200px) !important; width: 100% !important; padding: 2rem 1rem !important; }
          }
        `}</style>

        {!isMobile && (
          <div className="register-left" style={s.left}>
            <div style={s.bubble('400px', '-120px', '-120px', 0.08)} />
            <div style={s.bubble('200px', '65%', '70%', 0.1)} />
            <motion.div style={s.leftInner} variants={stagger} initial="hidden" animate="visible">
              <motion.div variants={slideInLeft}><KebiteLogo variant="white" size="lg" /></motion.div>
              <motion.p style={s.tagline} variants={slideInLeft}>Join thousands of happy customers</motion.p>
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
          <div style={s.mobileTopBar}>
            <div style={{ display: 'flex', justifyContent: 'center' }}><KebiteLogo variant="white" size="md" /></div>
            <p style={s.mobileTagline}>Join Tanzania's #1 Food Delivery</p>
          </div>
        )}

        <div className="register-right" style={{ ...s.right, flex: isMobile ? 'unset' : '1', width: isMobile ? '100%' : 'auto', padding: isMobile ? '0' : '2rem', alignItems: isMobile ? 'flex-start' : 'center' }}>
          <motion.div
            style={{ ...s.card(visible), maxWidth: isMobile ? '100%' : '440px', borderRadius: isMobile ? '18px 18px 0 0' : '18px', marginTop: isMobile ? '-18px' : '0', padding: isMobile ? '2rem 1.5rem' : '2.5rem', boxShadow: isMobile ? '0 -4px 24px rgba(0,0,0,0.08)' : '0 2px 16px rgba(0,0,0,0.07)', minHeight: isMobile ? 'calc(100vh - 110px)' : 'auto' }}
            initial={{ opacity: 0, x: 40, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
          >
            <h2 style={s.cardTitle}>Create account</h2>
            <p style={s.cardSub}>It's free and takes under a minute</p>

            {/* Progress indicator */}
            <div style={s.progressRow}>
              {[0, 1, 2].map((i, idx) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flex: idx < 2 ? 1 : 'unset' }}>
                  <div style={s.stepCol}>
                    <div style={s.stepCircle(step === i, step > i)}>{i + 1}</div>
                    <span style={s.stepLabel(step === i)}>{['Role', 'Details', 'Account'][i]}</span>
                  </div>
                  {idx < 2 && <div style={{ ...s.stepLine(step > i), flex: 1, margin: '0 0.4rem 1.2rem' }} />}
                </div>
              ))}
            </div>

            <AnimatePresence>
              {submitError && (
                <motion.div style={s.errorBanner} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <span>⚠️</span><span>{submitError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {/* Step 0 — Role selector */}
              {step === 0 && (
                <motion.div key="step0" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                  <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: '1.25rem' }}>How will you use Kebite?</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {ROLES.map((r) => (
                      <div
                        key={r.value}
                        style={getRoleCard(r)}
                        onClick={() => setRole(r.value)}
                        onMouseEnter={() => setRoleHover(r.value)}
                        onMouseLeave={() => setRoleHover(null)}
                      >
                        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: getRoleCircleBg(r.value, role === r.value), display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                          {r.value === 'customer' && <CustomerSvg selected={role === r.value} />}
                          {r.value === 'restaurant' && <RestaurantSvg />}
                          {r.value === 'rider' && <RiderSvg />}
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1a1a2e', margin: '0 0 0.3rem' }}>{r.label}</div>
                        <p style={{ fontSize: '0.82rem', color: '#888', margin: 0, lineHeight: 1.4 }}>{r.desc}</p>
                      </div>
                    ))}
                  </div>
                  <motion.button type="button" style={s.primaryBtn(false)} onClick={() => setStep(1)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
                    Continue →
                  </motion.button>
                </motion.div>
              )}

              {/* Step 1 — Personal details */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                  {role !== 'customer' && (
                    <div style={s.infoBanner}>
                      ⏳ Restaurant and rider accounts require approval from the Kebite team within 24 hours.
                    </div>
                  )}
                  <div style={s.fieldGroup}>
                    <label style={s.label}>Full name</label>
                    <input placeholder="e.g. Amina Hassan" value={form.name} onChange={set('name')} onBlur={() => blur('name')} style={s.input(touched.name && errors.name)} required />
                    {touched.name && errors.name && <div style={s.fieldError}>{errors.name}</div>}
                  </div>
                  <div style={s.fieldGroup}>
                    <label style={s.label}>Email address</label>
                    <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} onBlur={() => blur('email')} style={s.input(touched.email && errors.email)} required />
                    {touched.email && errors.email && <div style={s.fieldError}>{errors.email}</div>}
                  </div>
                  {role === 'restaurant' && (
                    <>
                      <div style={s.fieldGroup}>
                        <label style={s.label}>Restaurant name</label>
                        <input placeholder="e.g. Mama Samia's Kitchen" value={form.restaurantName} onChange={set('restaurantName')} onBlur={() => blur('restaurantName')} style={s.input(touched.restaurantName && errors.restaurantName)} required />
                        {touched.restaurantName && errors.restaurantName && <div style={s.fieldError}>{errors.restaurantName}</div>}
                      </div>
                      <div style={s.fieldGroup}>
                        <label style={s.label}>Street address</label>
                        <input placeholder="e.g. 14 Samora Ave, Kariakoo, Dar es Salaam" value={form.restaurantAddress} onChange={set('restaurantAddress')} onBlur={() => blur('restaurantAddress')} style={s.input(touched.restaurantAddress && errors.restaurantAddress)} required />
                        {touched.restaurantAddress && errors.restaurantAddress && <div style={s.fieldError}>{errors.restaurantAddress}</div>}
                      </div>
                    </>
                  )}
                  <motion.button type="button" style={s.primaryBtn(false)} onClick={handleContinue} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
                    Continue →
                  </motion.button>
                  <button type="button" style={s.backBtn} onClick={() => setStep(0)}>← Back</button>
                </motion.div>
              )}

              {/* Step 2 — Account details */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.3 }}>
                  <form onSubmit={handleSubmit}>
                    <div style={s.fieldGroup}>
                      <label style={s.label}>Phone number</label>
                      <div style={{ ...s.phoneRow, borderColor: errors.phone ? '#e63946' : '#e0e0e0' }}>
                        <div style={s.phonePrefix} onClick={() => phoneInputRef.current?.focus()}>+255</div>
                        <input ref={phoneInputRef} style={s.phoneInput} placeholder="712 345 678" value={form.phone} inputMode="numeric" onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })} onBlur={() => blur('phone')} required />
                      </div>
                      {errors.phone && <div style={s.fieldError}>{errors.phone}</div>}
                    </div>

                    {role === 'rider' && (
                      <>
                        <div style={s.fieldGroup}>
                          <label style={s.label}>Vehicle type</label>
                          <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
                            {VEHICLE_TYPES.map((v) => {
                              const isSelected = form.vehicleType === v.value;
                              return (
                                <div
                                  key={v.value}
                                  onClick={() => setForm({ ...form, vehicleType: v.value })}
                                  style={{ flex: 1, background: isSelected ? 'linear-gradient(135deg, rgba(255,107,0,0.05), rgba(230,57,70,0.05))' : '#ffffff', borderRadius: '16px', padding: '1rem 0.75rem', textAlign: 'center', border: isSelected ? '2px solid #ff6b00' : '2px solid #f0f0f0', cursor: 'pointer', transition: 'all 0.2s', boxShadow: isSelected ? '0 4px 16px rgba(255,107,0,0.2)' : 'none' }}
                                >
                                  <div
                                    key={isSelected ? v.value + '-sel' : v.value + '-unsel'}
                                    style={{ animation: isSelected ? 'card-select-pop 0.3s ease' : 'none' }}
                                  >
                                    {v.value === 'motorcycle' ? <MotorcycleSvg /> : <CarSvg />}
                                  </div>
                                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isSelected ? '#ff6b00' : '#555', marginTop: '0.5rem' }}>{v.label}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div style={s.fieldGroup}>
                          <label style={s.label}>License number</label>
                          <input placeholder="e.g. TZ-123456" value={form.licenseNumber} onChange={set('licenseNumber')} style={s.input(false)} />
                        </div>
                      </>
                    )}

                    <div style={s.fieldGroup}>
                      <label style={s.label}>Password</label>
                      <div style={s.inputWrap}>
                        <input type={showPassword ? 'text' : 'password'} placeholder="Create a strong password" value={form.password} onChange={(e) => { set('password')(e); }} onBlur={() => blur('password')} style={{ ...s.input(errors.password), paddingRight: '3rem' }} required />
                        <button type="button" style={s.eyeBtn} onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff /> : <EyeOpen />}</button>
                      </div>
                      {form.password && (
                        <div style={s.strengthRow}>
                          <div style={s.strengthTrack}><div style={s.strengthFill(sm.width, sm.color)} /></div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: sm.color, minWidth: '42px', textAlign: 'right' }}>{sm.label}</span>
                        </div>
                      )}
                      {errors.password && <div style={s.fieldError}>{errors.password}</div>}
                    </div>
                    <div style={s.fieldGroup}>
                      <label style={s.label}>Confirm password</label>
                      <div style={s.inputWrap}>
                        <input type="password" placeholder="Repeat your password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setConfirmTouched(true); }} style={{ ...s.input(confirmTouched && !confirmMatch), paddingRight: '3rem' }} required />
                        {confirmTouched && <div style={s.trailingIcon}>{confirmMatch ? <CheckIcon /> : <XIcon />}</div>}
                      </div>
                      {confirmTouched && !confirmMatch && <div style={s.fieldError}>Passwords do not match</div>}
                    </div>
                    <motion.button type="submit" style={s.primaryBtn(loading)} disabled={loading} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
                      {loading && <span style={s.spinner} />}
                      {loading ? 'Creating account…' : 'Create Account'}
                    </motion.button>
                  </form>
                  <button type="button" style={s.backBtn} onClick={() => setStep(1)}>← Back</button>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={s.signinRow}>Already have an account?{' '}<a href="/login" style={s.signinLink}>Sign in →</a></div>
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  );
}
