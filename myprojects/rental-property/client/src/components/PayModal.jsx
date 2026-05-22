import { useState, useEffect, useRef, useMemo } from 'react';
import {
  CheckCircle, X, Loader, ArrowRight, ArrowLeft,
  Phone, Hash, AlertCircle, Clock, Copy, Check, Shield,
} from 'lucide-react';
import { BRAND } from '../theme';
import api from '../services/api';

/* ─── Real gateway brand logos (60×38 landscape badge) ──────── */
const MpesaLogo = () => (
  <svg viewBox="0 0 64 40" width="64" height="40" style={{ display: 'block', borderRadius: 9, flexShrink: 0 }}>
    <rect width="64" height="40" rx="9" fill="#CC0000" />
    <rect x="0.5" y="0.5" width="63" height="39" rx="8.5" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
    {/* Stylized M glyph */}
    <path d="M8 29V13l8 9 8-9v16" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <line x1="30" y1="11" x2="30" y2="31" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
    {/* PESA wordmark */}
    <text x="47" y="22" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif" letterSpacing="0.5">PESA</text>
    <text x="47" y="33" textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize="6.5" fontFamily="Arial, sans-serif" letterSpacing="1.5">VODACOM</text>
  </svg>
);

const AirtelLogo = () => (
  <svg viewBox="0 0 64 40" width="64" height="40" style={{ display: 'block', borderRadius: 9, flexShrink: 0 }}>
    <rect width="64" height="40" rx="9" fill="#E00000" />
    <rect x="0.5" y="0.5" width="63" height="39" rx="8.5" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
    {/* Airtel italic wordmark */}
    <text x="32" y="19" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="900" fontFamily="Arial, sans-serif" fontStyle="italic" letterSpacing="-0.3">airtel</text>
    {/* Signature swoosh */}
    <path d="M12 26 Q32 34 52 26" stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none" strokeLinecap="round" />
    <text x="32" y="35" textAnchor="middle" fill="rgba(255,255,255,0.72)" fontSize="7" fontFamily="Arial, sans-serif" letterSpacing="1.5">MONEY</text>
  </svg>
);

const MixxLogo = () => (
  <svg viewBox="0 0 64 40" width="64" height="40" style={{ display: 'block', borderRadius: 9, flexShrink: 0 }}>
    <rect width="64" height="40" rx="9" fill="#0055FF" />
    <rect x="0.5" y="0.5" width="63" height="39" rx="8.5" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
    {/* X crosslines accent */}
    <path d="M10 14 L20 26 M20 14 L10 26" stroke="rgba(255,255,255,0.22)" strokeWidth="3" strokeLinecap="round" />
    <text x="40" y="21" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif" letterSpacing="1">MIXX</text>
    <text x="40" y="33" textAnchor="middle" fill="rgba(255,255,255,0.72)" fontSize="7.5" fontFamily="Arial, sans-serif" letterSpacing="0.3">by Yas</text>
  </svg>
);

const HalopesaLogo = () => (
  <svg viewBox="0 0 64 40" width="64" height="40" style={{ display: 'block', borderRadius: 9, flexShrink: 0 }}>
    <rect width="64" height="40" rx="9" fill="#F97316" />
    <rect x="0.5" y="0.5" width="63" height="39" rx="8.5" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
    {/* Halo ring icon on left */}
    <ellipse cx="16" cy="20" rx="9" ry="5.5" fill="none" stroke="#fff" strokeWidth="2.5" opacity="0.9" />
    <ellipse cx="16" cy="20" rx="4" ry="2.8" fill="rgba(255,255,255,0.35)" />
    <circle cx="16" cy="20" r="1.5" fill="#fff" opacity="0.9" />
    <line x1="29" y1="10" x2="29" y2="31" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
    {/* HALO wordmark */}
    <text x="47" y="21" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif">HALO</text>
    <text x="47" y="33" textAnchor="middle" fill="rgba(255,255,255,0.72)" fontSize="8" fontFamily="Arial, sans-serif" letterSpacing="1">PESA</text>
  </svg>
);

const BankLogo = () => (
  <svg viewBox="0 0 64 40" width="64" height="40" style={{ display: 'block', borderRadius: 9, flexShrink: 0 }}>
    <rect width="64" height="40" rx="9" fill="#1B3A6B" />
    <rect x="0.5" y="0.5" width="63" height="39" rx="8.5" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
    {/* Bank building */}
    <polygon points="32,7 16,15 48,15" fill="rgba(255,255,255,0.88)" />
    <rect x="19" y="16" width="3.5" height="9" rx="0.5" fill="rgba(255,255,255,0.8)" />
    <rect x="25.5" y="16" width="3.5" height="9" rx="0.5" fill="rgba(255,255,255,0.8)" />
    <rect x="32" y="16" width="3.5" height="9" rx="0.5" fill="rgba(255,255,255,0.8)" />
    <rect x="38.5" y="16" width="3.5" height="9" rx="0.5" fill="rgba(255,255,255,0.8)" />
    <rect x="45" y="16" width="3.5" height="9" rx="0.5" fill="rgba(255,255,255,0.8)" />
    <rect x="15" y="26" width="34" height="2.5" rx="1" fill="rgba(255,255,255,0.8)" />
    <text x="32" y="37" textAnchor="middle" fill="rgba(255,255,255,0.62)" fontSize="6.5" fontFamily="Arial, sans-serif" letterSpacing="0.8">BANK TRANSFER</text>
  </svg>
);

const CashLogo = () => (
  <svg viewBox="0 0 64 40" width="64" height="40" style={{ display: 'block', borderRadius: 9, flexShrink: 0 }}>
    <rect width="64" height="40" rx="9" fill="#166534" />
    <rect x="0.5" y="0.5" width="63" height="39" rx="8.5" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
    {/* Banknote outline */}
    <rect x="8" y="10" width="48" height="20" rx="2.5" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
    {/* Center circle */}
    <circle cx="32" cy="20" r="6" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
    <text x="32" y="23.5" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="700" fontFamily="Arial, sans-serif">TZS</text>
    {/* Side hatch marks */}
    <rect x="10" y="14" width="8" height="1.5" rx="0.7" fill="rgba(255,255,255,0.4)" />
    <rect x="10" y="17.5" width="8" height="1.5" rx="0.7" fill="rgba(255,255,255,0.4)" />
    <rect x="10" y="21" width="8" height="1.5" rx="0.7" fill="rgba(255,255,255,0.4)" />
    <rect x="46" y="14" width="8" height="1.5" rx="0.7" fill="rgba(255,255,255,0.4)" />
    <rect x="46" y="17.5" width="8" height="1.5" rx="0.7" fill="rgba(255,255,255,0.4)" />
    <rect x="46" y="21" width="8" height="1.5" rx="0.7" fill="rgba(255,255,255,0.4)" />
    <text x="32" y="37" textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize="6.5" fontFamily="Arial, sans-serif" letterSpacing="1">CASH PAYMENT</text>
  </svg>
);

/* ─── Provider config ────────────────────────────────────────── */
export const PROVIDERS = [
  {
    id: 'mpesa', label: 'M-Pesa', sub: 'Vodacom Tanzania',
    color: '#CC0000', bg: '#FFF0F0', border: '#FFCDD2',
    prefix: ['0741','0742','0743','0744','0745','0746','0747','0748','0749'],
    icon: <MpesaLogo />,
  },
  {
    id: 'airtel', label: 'Airtel Money', sub: 'Airtel Tanzania',
    color: '#E00000', bg: '#FEF2F2', border: '#FECACA',
    prefix: ['0680','0681','0682','0683','0684','0685','0686','0687','0688','0689','0780','0783','0784','0785','0786','0787','0788','0789'],
    icon: <AirtelLogo />,
  },
  {
    id: 'mixx', label: 'Mixx by Yas', sub: 'Formerly Tigo Pesa',
    color: '#0055FF', bg: '#EFF6FF', border: '#BFDBFE',
    prefix: ['0615','0616','0617','0618','0619','0714','0715','0716','0717','0718','0719'],
    icon: <MixxLogo />,
  },
  {
    id: 'halotel', label: 'Halopesa', sub: 'Halotel Tanzania',
    color: '#F97316', bg: '#FFF7ED', border: '#FED7AA',
    prefix: ['0621','0622','0624','0625','0626','0627','0628','0629','0723','0724'],
    icon: <HalopesaLogo />,
  },
  {
    id: 'bank', label: 'Bank Transfer', sub: 'Any local bank',
    color: '#1B3A6B', bg: '#EFF6FF', border: '#BFDBFE',
    prefix: [],
    icon: <BankLogo />,
  },
  {
    id: 'cash', label: 'Cash', sub: 'Pay to landlord directly',
    color: '#166534', bg: '#F0FDF4', border: '#BBF7D0',
    prefix: [],
    icon: <CashLogo />,
  },
];

export const MOBILE_PROVIDERS = ['mpesa', 'airtel', 'mixx', 'halotel'];

/* ─── Helpers ────────────────────────────────────────────────── */
function fmt(n) { return n?.toLocaleString() ?? '—'; }

function formatPhone(val) {
  const d = val.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 4) return d;
  if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
  return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
}

function fmtCountdown(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/* ─── Step indicator ─────────────────────────────────────────── */
const STEPS = ['Choose', 'Details', 'Confirm', 'Done'];
const STEP_IDX = { provider: 0, phone: 1, pending: 2, done: 3 };

function StepBar({ step }) {
  const cur = STEP_IDX[step] ?? 0;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', padding: '14px 28px 0' }}>
      {STEPS.map((label, i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'flex-start', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
              background: i < cur ? BRAND.secondary : i === cur ? BRAND.primary : '#E5E7EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: i === cur ? `0 0 0 3px ${BRAND.primary}22` : 'none',
              transition: 'all 0.25s',
            }}>
              {i < cur
                ? <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
                : <span style={{ fontSize: 11, fontWeight: 700, color: i === cur ? '#fff' : '#9CA3AF' }}>{i + 1}</span>
              }
            </div>
            <span style={{ fontSize: 9.5, fontWeight: i === cur ? 700 : 400, color: i === cur ? BRAND.primary : i < cur ? BRAND.secondary : '#9CA3AF', whiteSpace: 'nowrap' }}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 2, marginTop: 12, margin: '12px 6px 0', background: i < cur ? BRAND.secondary : '#E5E7EB', transition: 'background 0.3s' }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Provider card ──────────────────────────────────────────── */
function ProviderCard({ p, selected, onSelect, detected }) {
  const [hover, setHover] = useState(false);
  const isDetected = detected?.id === p.id && !selected;
  return (
    <button type="button"
      onClick={onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
        padding: '14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
        border: `2px solid ${selected ? p.color : isDetected ? p.color + '60' : '#E5E7EB'}`,
        background: selected ? p.bg : hover ? '#FAFAFA' : '#fff',
        transform: hover && !selected ? 'translateY(-1px)' : 'none',
        boxShadow: selected
          ? `0 0 0 3px ${p.color}22, 0 4px 12px ${p.color}18`
          : hover ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
        transition: 'all 0.18s', position: 'relative', width: '100%',
      }}>
      {/* Logo + check */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        {p.icon}
        {selected && (
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
          </div>
        )}
        {isDetected && !selected && (
          <span style={{ fontSize: 9, fontWeight: 700, color: p.color, background: p.bg, border: `1px solid ${p.border}`, padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap' }}>
            Detected
          </span>
        )}
      </div>
      {/* Labels */}
      <div>
        <p style={{ fontWeight: 700, fontSize: 13, color: selected ? p.color : '#111827', lineHeight: 1.2 }}>{p.label}</p>
        <p style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{p.sub}</p>
      </div>
    </button>
  );
}

/* ─── Error box ──────────────────────────────────────────────── */
function ErrBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderRadius: 9, background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: 13, marginTop: 14, alignItems: 'flex-start' }}>
      <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />{msg}
    </div>
  );
}

/* ─── Input ──────────────────────────────────────────────────── */
function PayInput({ inputRef, label, sublabel, placeholder, value, onChange, type = 'text', maxLength, focusColor }) {
  const [focused, setFocused] = useState(false);
  const color = focusColor || BRAND.primary;
  return (
    <div>
      {label && (
        <label style={{ fontSize: 11.5, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.6px', display: 'block', marginBottom: 6 }}>
          {label}
          {sublabel && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 4 }}>{sublabel}</span>}
        </label>
      )}
      <input ref={inputRef} type={type} placeholder={placeholder} value={value} maxLength={maxLength}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '11px 14px', borderRadius: 9, fontSize: 14,
          border: `1.5px solid ${focused ? color : '#E5E7EB'}`,
          boxShadow: focused ? `0 0 0 3px ${color}18` : 'none',
          outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#111827', background: '#fff',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }} />
    </div>
  );
}

/* ─── Main modal ─────────────────────────────────────────────── */
export default function PayModal({ payment, onClose, onPaid }) {
  const [step, setStep] = useState('provider');
  const [provider, setProvider] = useState(null);
  const [phone, setPhone] = useState('');
  const [phoneErr, setPhoneErr] = useState('');
  const [ref, setRef] = useState('');
  const [instructions, setInstructions] = useState('');
  const [txnId, setTxnId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [pollActive, setPollActive] = useState(false);
  const phoneRef = useRef(null);
  const pollRef = useRef(null);

  const prov = PROVIDERS.find(p => p.id === provider);
  const isMobile = MOBILE_PROVIDERS.includes(provider);

  // Auto-detect provider from phone prefix
  const detectedProvider = useMemo(() => {
    const d = phone.replace(/\D/g, '');
    if (d.length < 4) return null;
    return PROVIDERS.find(p => p.prefix.includes(d.slice(0, 4))) || null;
  }, [phone]);

  // Focus phone input when entering phone step
  useEffect(() => {
    if (step === 'phone') setTimeout(() => phoneRef.current?.focus(), 80);
  }, [step]);

  // Countdown timer for mobile pending step
  useEffect(() => {
    if (step !== 'pending' || !isMobile) return;
    setCountdown(300);
    const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [step, isMobile]);

  // Auto-poll payment status for mobile providers
  useEffect(() => {
    if (step !== 'pending' || !isMobile) return;
    pollRef.current = setInterval(async () => {
      try {
        setPollActive(true);
        const { data } = await api.get(`/payments/${payment._id}/status`);
        if (data.data.status === 'paid') {
          clearInterval(pollRef.current);
          setStep('done');
          onPaid();
        }
      } catch { /* ignore */ } finally {
        setPollActive(false);
      }
    }, 4000);
    return () => clearInterval(pollRef.current);
  }, [step, isMobile, payment._id, onPaid]);

  const validatePhone = (val) => {
    const d = val.replace(/\D/g, '');
    if (d.length < 10) { setPhoneErr('Enter a valid 10-digit Tanzanian number'); return false; }
    if (d.length > 10) { setPhoneErr('Must be exactly 10 digits'); return false; }
    setPhoneErr(''); return true;
  };

  const handleCopyRef = () => {
    navigator.clipboard?.writeText(ref).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Mobile: phone → /initiate → pending
  const handleSendRequest = async () => {
    if (!validatePhone(phone)) return;
    setError(''); setLoading(true);
    try {
      const { data } = await api.post(`/payments/${payment._id}/initiate`, {
        provider, phone: phone.replace(/\D/g, ''),
      });
      setRef(data.data.reference);
      setInstructions(data.data.instructions);
      setStep('pending');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send payment request. Try again.');
    } finally { setLoading(false); }
  };

  // Bank/Cash: /initiate directly → pending
  const handleContinueNonMobile = async () => {
    setError(''); setLoading(true);
    try {
      const { data } = await api.post(`/payments/${payment._id}/initiate`, { provider });
      setRef(data.data.reference);
      setInstructions(data.data.instructions);
      setStep('pending');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment. Try again.');
    } finally { setLoading(false); }
  };

  const handleConfirmPaid = async () => {
    if (!txnId.trim()) {
      setError(
        isMobile
          ? 'Please enter the confirmation code received on your phone.'
          : 'Please enter the transaction reference or receipt number to confirm payment.'
      );
      return;
    }
    setError(''); setLoading(true);
    try {
      await api.put(`/payments/${payment._id}/pay`, {
        paymentMethod: provider,
        transactionId: txnId.trim() || undefined,
        gatewayRef: ref,
      });
      setStep('done');
      onPaid();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment. Try again.');
    } finally { setLoading(false); }
  };

  const canClose = !loading && step !== 'done';

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}
      onClick={() => canClose && onClose()}>
      <div
        style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, boxShadow: '0 32px 80px rgba(0,0,0,0.22)', overflow: 'hidden', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={{ padding: '20px 24px 0', borderBottom: `1px solid #F3F4F6`, paddingBottom: step === 'done' ? 0 : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <h3 style={{ fontWeight: 800, fontSize: 17, fontFamily: "'Syne', sans-serif", color: '#111827' }}>
                {step === 'done' ? 'Payment Recorded' : 'Pay Rent'}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                <span style={{ fontSize: 13, color: '#6B7280' }}>{payment.period}</span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#D1D5DB', display: 'inline-block' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: BRAND.primary }}>TZS {fmt(payment.amount)}</span>
              </div>
            </div>
            {step !== 'done' && (
              <button onClick={() => canClose && onClose()}
                style={{ background: '#F3F4F6', border: 'none', cursor: canClose ? 'pointer' : 'not-allowed', color: '#6B7280', padding: 8, borderRadius: '50%', display: 'flex', opacity: canClose ? 1 : 0.4, transition: 'background 0.15s' }}
                onMouseEnter={e => { if (canClose) e.currentTarget.style.background = '#E5E7EB'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F3F4F6'; }}>
                <X size={16} />
              </button>
            )}
          </div>
          {step !== 'done' && <StepBar step={step} />}
        </div>

        <div style={{ padding: '22px 24px 24px' }}>

          {/* ════ STEP 1 — Choose provider ════ */}
          {step === 'provider' && (
            <>
              <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>
                Select your preferred payment method
                {detectedProvider && !provider && (
                  <span style={{ marginLeft: 6, color: detectedProvider.color, fontWeight: 600 }}>
                    — {detectedProvider.label} detected
                  </span>
                )}
              </p>

              {/* Mobile money — 2-column grid */}
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8 }}>Mobile Money</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                {PROVIDERS.filter(p => MOBILE_PROVIDERS.includes(p.id)).map(p => (
                  <ProviderCard key={p.id} p={p} selected={provider === p.id} detected={detectedProvider} onSelect={() => setProvider(p.id)} />
                ))}
              </div>

              {/* Bank + Cash — 2-column */}
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8, marginTop: 14 }}>Other Methods</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {PROVIDERS.filter(p => !MOBILE_PROVIDERS.includes(p.id)).map(p => (
                  <ProviderCard key={p.id} p={p} selected={provider === p.id} detected={detectedProvider} onSelect={() => setProvider(p.id)} />
                ))}
              </div>

              <ErrBox msg={error} />

              <button disabled={!provider || loading}
                onClick={() => {
                  if (!provider) return;
                  if (isMobile) { setStep('phone'); }
                  else { handleContinueNonMobile(); }
                }}
                style={{ marginTop: 20, width: '100%', padding: '13px', borderRadius: 11, background: provider ? prov?.color : '#D1D5DB', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: provider && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: provider && !loading ? 1 : 0.6, transition: 'all 0.15s' }}>
                {loading
                  ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />Preparing…</>
                  : <>Continue <ArrowRight size={16} /></>
                }
              </button>
            </>
          )}

          {/* ════ STEP 2 — Phone number ════ */}
          {step === 'phone' && prov && (
            <>
              <button onClick={() => { setStep('provider'); setError(''); }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 18, padding: 0, fontFamily: 'inherit' }}>
                <ArrowLeft size={14} /> Back
              </button>

              {/* Provider badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, background: prov.bg, border: `1px solid ${prov.border}`, marginBottom: 20 }}>
                {prov.icon}
                <div>
                  <p style={{ fontWeight: 800, fontSize: 15, color: prov.color }}>{prov.label}</p>
                  <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                    Sending <strong style={{ color: '#111827' }}>TZS {fmt(payment.amount)}</strong>
                  </p>
                </div>
              </div>

              <PayInput
                inputRef={phoneRef}
                label={<><Phone size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />{prov.label} Phone Number</>}
                type="tel"
                placeholder="0741 234 567"
                value={phone}
                maxLength={13}
                focusColor={prov.color}
                onChange={e => {
                  const formatted = formatPhone(e.target.value);
                  setPhone(formatted);
                  validatePhone(formatted);
                }}
              />
              {phoneErr && <p style={{ fontSize: 12, color: BRAND.danger, marginTop: 5 }}>{phoneErr}</p>}

              {/* Prefix hint */}
              {!phoneErr && phone.replace(/\D/g, '').length >= 4 && (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  {detectedProvider
                    ? <p style={{ fontSize: 12, color: detectedProvider.color, fontWeight: 600 }}>
                      ✓ Looks like a {detectedProvider.label} number
                    </p>
                    : <p style={{ fontSize: 12, color: '#9CA3AF' }}>Number prefix not recognised — double-check your network</p>
                  }
                </div>
              )}

              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>
                Enter the number registered with {prov.label}. A payment prompt will appear on your phone.
              </p>

              <ErrBox msg={error} />

              <button disabled={loading || !!phoneErr || phone.replace(/\D/g, '').length < 10}
                onClick={handleSendRequest}
                style={{ marginTop: 18, width: '100%', padding: '13px', borderRadius: 11, background: loading || phoneErr || phone.replace(/\D/g, '').length < 10 ? '#D1D5DB' : prov.color, color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: loading || phoneErr || phone.replace(/\D/g, '').length < 10 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}>
                {loading
                  ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />Sending request…</>
                  : <>Send Payment Request <ArrowRight size={15} /></>
                }
              </button>
            </>
          )}

          {/* ════ STEP 3 — Awaiting payment ════ */}
          {step === 'pending' && prov && (
            <>
              {/* Animated provider icon */}
              <div style={{ textAlign: 'center', marginBottom: 22 }}>
                <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 14px' }}>
                  {isMobile && (
                    <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: `2px solid ${prov.color}`, opacity: 0.3, animation: 'payRing 2s ease-in-out infinite' }} />
                  )}
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: prov.bg, border: `3px solid ${prov.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isMobile ? <Phone size={32} color={prov.color} /> : <svg width="32" height="32" viewBox="0 0 32 32"><rect x="2" y="10" width="28" height="18" rx="3" fill="none" stroke={prov.color} strokeWidth="2.5" /><path d="M6 10V8a10 10 0 0120 0v2" fill="none" stroke={prov.color} strokeWidth="2.5" strokeLinecap="round" /></svg>}
                  </div>
                </div>
                <p style={{ fontWeight: 800, fontSize: 16, fontFamily: "'Syne', sans-serif", color: '#111827' }}>
                  {isMobile ? `Check your phone` : `Complete your ${prov.label}`}
                </p>
                <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                  {isMobile ? `A payment prompt has been sent to ${phone || 'your phone'}` : `Follow the instructions below`}
                </p>
              </div>

              {/* Polling indicator */}
              {isMobile && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderRadius: 8, background: '#F9FAFB', border: '1px solid #F3F4F6', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    {pollActive
                      ? <Loader size={13} color={BRAND.secondary} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                      : <div style={{ width: 8, height: 8, borderRadius: '50%', background: BRAND.secondary, animation: 'payPulse 2s ease-in-out infinite' }} />
                    }
                    <span style={{ fontSize: 12, color: '#6B7280' }}>
                      {pollActive ? 'Checking payment status…' : 'Listening for payment confirmation'}
                    </span>
                  </div>
                  {countdown > 0
                    ? <span style={{ fontSize: 12, fontWeight: 700, color: countdown < 60 ? BRAND.danger : '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} />{fmtCountdown(countdown)}
                    </span>
                    : <span style={{ fontSize: 12, color: BRAND.danger, fontWeight: 600 }}>Expired</span>
                  }
                </div>
              )}

              {/* Instructions */}
              <div style={{ padding: '14px 16px', borderRadius: 11, background: prov.bg, border: `1px solid ${prov.border}`, marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>{instructions}</p>
              </div>

              {/* Reference + copy */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 9, background: '#F9FAFB', border: '1px solid #F3F4F6', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Hash size={13} color='#9CA3AF' />
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>Reference</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, fontFamily: 'monospace', color: '#111827', letterSpacing: 1 }}>{ref}</span>
                  <button onClick={handleCopyRef}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: copied ? '#D1FAE5' : '#F3F4F6', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: copied ? '#065F46' : '#6B7280', transition: 'all 0.2s' }}>
                    {copied ? <><Check size={11} />Copied</> : <><Copy size={11} />Copy</>}
                  </button>
                </div>
              </div>

              {/* Transaction ID input */}
              <PayInput
                label={isMobile ? 'Confirmation Code from your phone' : 'Transaction / Receipt Reference'}
                sublabel={undefined}
                placeholder={isMobile ? 'e.g. ABC123XYZ' : 'Required — enter bank ref or receipt no.'}
                value={txnId}
                focusColor={prov.color}
                onChange={e => { setTxnId(e.target.value); setError(''); }}
              />

              <ErrBox msg={error} />

              <button disabled={loading || !txnId.trim()} onClick={handleConfirmPaid}
                style={{ marginTop: 16, width: '100%', padding: '13px', borderRadius: 11, background: loading || !txnId.trim() ? '#D1D5DB' : BRAND.secondary, color: loading || !txnId.trim() ? '#fff' : '#1B4332', fontWeight: 700, fontSize: 15, border: 'none', cursor: loading || !txnId.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}>
                {loading
                  ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />Recording payment…</>
                  : <><CheckCircle size={16} />I've Paid — Confirm</>
                }
              </button>

              <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Shield size={11} />Only confirm after the payment has completed
              </p>
            </>
          )}

          {/* ════ STEP 4 — Done ════ */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
              <div style={{ width: 86, height: 86, borderRadius: '50%', background: '#ECFDF5', border: '3px solid #6EE7B7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'paySuccess 0.4s ease-out' }}>
                <CheckCircle size={42} color="#059669" />
              </div>
              <h4 style={{ fontWeight: 800, fontSize: 22, fontFamily: "'Syne', sans-serif", marginBottom: 6, color: '#111827' }}>
                Payment Recorded!
              </h4>
              <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>
                TZS {fmt(payment.amount)} · {payment.period}
              </p>
              {prov && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 30, background: prov.bg, border: `1px solid ${prov.border}`, margin: '8px 0' }}>
                  {prov.icon}
                  <span style={{ fontSize: 13, fontWeight: 600, color: prov.color }}>{prov.label}</span>
                </div>
              )}
              {txnId && (
                <p style={{ fontSize: 13, color: '#6B7280', marginTop: 8 }}>
                  Ref: <strong style={{ fontFamily: 'monospace', color: '#111827' }}>{txnId}</strong>
                </p>
              )}
              <button onClick={onClose}
                style={{ marginTop: 22, padding: '12px 40px', borderRadius: 11, background: BRAND.primary, color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = BRAND.primaryMid}
                onMouseLeave={e => e.currentTarget.style.background = BRAND.primary}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes payRing { 0%,100% { transform: scale(1); opacity: 0.3 } 50% { transform: scale(1.15); opacity: 0.6 } }
        @keyframes payPulse { 0%,100% { opacity: 1; transform: scale(1) } 50% { opacity: 0.4; transform: scale(0.85) } }
        @keyframes paySuccess { from { transform: scale(0.5); opacity: 0 } to { transform: scale(1); opacity: 1 } }
      `}</style>
    </div>
  );
}
