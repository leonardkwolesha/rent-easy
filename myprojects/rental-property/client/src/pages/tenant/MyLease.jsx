import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, Phone, Mail, Building2, Calendar, Banknote, Clock,
  Home, AlertTriangle, X, Loader, CheckCircle, ArrowRight,
  XCircle, ChevronDown, ChevronUp, CreditCard,
} from 'lucide-react';
import { BRAND, STATUS_COLORS } from '../../theme';
import { toast } from '../../components/Toast';
import api from '../../services/api';
import PayModal from '../../components/PayModal';

// ─── CSS injected once ────────────────────────────────────────────────────────
const CSS = `
.lease-input{width:100%;padding:10px 12px;border-radius:8px;border:1.5px solid #FECACA;font-size:13px;outline:none;transition:border-color .15s;box-sizing:border-box;font-family:inherit;resize:vertical}
.lease-input:focus{border-color:#EF4444;box-shadow:0 0 0 3px rgba(239,68,68,.1)}
@keyframes spin{to{transform:rotate(360deg)}}
`;

// ─── helpers ──────────────────────────────────────────────────────────────────

function pmtCfg(status) {
  if (status === 'paid')    return { bg: '#ECFDF5', border: '#A7F3D0', color: '#059669', icon: <CheckCircle size={16} />,  label: 'Paid' };
  if (status === 'overdue') return { bg: '#FEF2F2', border: '#FECACA', color: '#DC2626', icon: <AlertTriangle size={16} />, label: 'Overdue' };
  if (status === 'setup')   return { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8', icon: <CreditCard size={16} />,   label: 'Set up' };
  return                           { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E', icon: <Clock size={16} />,          label: 'Pending' };
}

function paymentsForLease(lease, payments) {
  const lid    = String(lease._id || '');
  const propId = String(lease.property?._id || lease.property || '');
  const start  = lease.startDate ? new Date(lease.startDate).getTime() : 0;
  const end    = lease.endDate   ? new Date(lease.endDate).getTime()   : Infinity;

  return payments.filter(p => {
    // Primary: exact lease ID match
    const plid = String(p.lease?._id || p.lease || '');
    if (plid === lid) return true;
    // Fallback: same property + due date within this lease's date range.
    // Catches payments created with the wrong lease ID (e.g. before leaseId fix).
    if (!propId) return false;
    const ppid  = String(p.property?._id || p.property || '');
    if (ppid !== propId) return false;
    const dueMs = p.dueDate ? new Date(p.dueDate).getTime() : 0;
    return dueMs >= start && dueMs <= end;
  });
}

function getPeriod() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

// ─── CancelModal ──────────────────────────────────────────────────────────────

function CancelModal({ lease, onClose, onCancelled }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) { setError('Please provide a reason for termination.'); return; }
    setLoading(true); setError('');
    try {
      await api.put(`/leases/${lease._id}/terminate`, { reason: reason.trim() });
      toast.success('Lease termination request submitted.');
      onCancelled();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to terminate lease. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}
      onClick={() => !loading && onClose()}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440, boxShadow: '0 24px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ background: '#FFF1F2', borderBottom: '1px solid #FECDD3', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={20} color="#E11D48" />
            <h3 style={{ fontWeight: 700, fontSize: 16, color: '#9F1239' }}>Cancel Lease</h3>
          </div>
          <button onClick={() => !loading && onClose()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9F1239', padding: 4, display: 'flex' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '22px 24px' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: BRAND.text, marginBottom: 4 }}>
            Property: <span style={{ color: BRAND.primary }}>{lease.property?.title}</span>
          </p>
          <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 9, padding: '12px 14px', marginBottom: 18, marginTop: 10 }}>
            <p style={{ fontSize: 13, color: '#9A3412', lineHeight: 1.6 }}>
              <strong>Please note:</strong> Terminating your lease early may result in forfeiture of your security deposit. Your landlord will be notified immediately.
            </p>
          </div>
          <p style={{ fontSize: 12, fontWeight: 700, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>
            Reason for cancellation *
          </p>
          <textarea
            className="lease-input" rows={4}
            placeholder="Explain why you need to cancel this lease…"
            value={reason}
            onChange={e => { setReason(e.target.value); setError(''); }}
          />
          {error && <p style={{ fontSize: 12, color: BRAND.danger, marginTop: 6 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={handleSubmit} disabled={loading}
              style={{ flex: 1, padding: '12px', borderRadius: 9, background: loading ? BRAND.muted : '#E11D48', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} />Processing…</> : 'Confirm Cancellation'}
            </button>
            <button onClick={() => !loading && onClose()} disabled={loading}
              style={{ padding: '12px 20px', borderRadius: 9, background: BRAND.bg, color: BRAND.text, fontWeight: 500, fontSize: 14, border: `1px solid ${BRAND.border}`, cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = '#E5E7EB'}
              onMouseLeave={e => e.currentTarget.style.background = BRAND.bg}>
              Keep Lease
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LeaseCard ────────────────────────────────────────────────────────────────

function LeaseCard({ lease, payments, expanded, onToggle, onCancel, onPay }) {
  const prop = lease.property;
  const addr = [prop?.address?.street, prop?.address?.city].filter(Boolean).join(', ');
  const daysLeft = Math.ceil((new Date(lease.endDate) - new Date()) / 86400000);
  const isExpiringSoon = daysLeft > 0 && daysLeft <= 30;

  const lp           = paymentsForLease(lease, payments);
  const period       = getPeriod();
  const current      = lp.find(p => p.period === period);
  const overdueCount = lp.filter(p => p.status === 'overdue').length;
  const nextPending  = lp.filter(p => p.status === 'pending').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
  const payTarget    = current ?? nextPending ?? lp.find(p => p.status === 'overdue') ?? null;
  // 'setup' = no payment records at all; not shown as pending (which implies a payment waiting)
  const topStatus    = lp.length === 0 ? 'setup' : (current?.status ?? (overdueCount > 0 ? 'overdue' : 'pending'));
  const cfg          = pmtCfg(topStatus);

  return (
    <div style={{
      background: BRAND.surface, borderRadius: BRAND.radius,
      border: `1px solid ${BRAND.border}`, overflow: 'hidden',
      marginBottom: 16, boxShadow: BRAND.shadow, transition: 'box-shadow .18s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = BRAND.shadowMd}
      onMouseLeave={e => e.currentTarget.style.boxShadow = BRAND.shadow}>

      {/* Image hero */}
      <div style={{ position: 'relative', height: 180, background: BRAND.bg, overflow: 'hidden' }}>
        {prop?.images?.[0]
          ? <img src={prop.images[0]} alt={prop.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BRAND.primary + '0d' }}>
              <Building2 size={40} color={BRAND.primary + '60'} />
            </div>
        }
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 55%, transparent 100%)' }} />
        {/* Status badges top-right */}
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
          <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#D1FAE5', color: '#065F46' }}>active</span>
          {isExpiringSoon && (
            <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#FEF3C7', color: '#92400E' }}>Expiring soon</span>
          )}
          {prop?.type && (
            <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(0,0,0,0.5)', color: '#fff', textTransform: 'capitalize' }}>{prop.type}</span>
          )}
        </div>
        {/* Title at bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 18px' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 3, textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
            {prop?.title || 'Property'}
          </h3>
          {addr && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <MapPin size={11} />{addr}
            </p>
          )}
        </div>
      </div>

      {/* Key stats row */}
      <div style={{ padding: '12px 18px', borderBottom: `1px solid ${BRAND.border}`, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <span style={{ fontWeight: 800, fontSize: 18, color: BRAND.primary }}>
          TZS {lease.rentAmount?.toLocaleString()}
          <span style={{ fontWeight: 400, fontSize: 13, color: BRAND.muted }}>/mo</span>
        </span>
        <span style={{ fontSize: 13, color: BRAND.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={12} />{daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
        </span>
        <span style={{ fontSize: 12, color: BRAND.muted }}>{fmtDate(lease.startDate)} → {fmtDate(lease.endDate)}</span>
      </div>

      {/* Payment status bar — always clickable for pending/overdue; creates payment on demand if none exists */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => topStatus !== 'paid' && onPay(payTarget ?? null, lease._id)}
        onKeyDown={e => e.key === 'Enter' && topStatus !== 'paid' && onPay(payTarget ?? null, lease._id)}
        style={{
          background: cfg.bg, borderBottom: `1px solid ${cfg.border}`,
          padding: '11px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: topStatus !== 'paid' ? 'pointer' : 'default', transition: 'opacity .15s',
        }}
        onMouseEnter={e => { if (topStatus !== 'paid') e.currentTarget.style.opacity = '.85'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: cfg.color }}>
          <CreditCard size={14} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            {topStatus === 'setup'
              ? `${period} rent — no payment record yet`
              : current
                ? `${period} · TZS ${current.amount?.toLocaleString()} — ${cfg.label}`
                : nextPending
                  ? `Next due: TZS ${nextPending.amount?.toLocaleString()} on ${fmtDate(nextPending.dueDate)}`
                  : `Rent — ${cfg.label}`}
          </span>
          {overdueCount > 0 && (
            <span style={{ background: '#DC2626', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
              {overdueCount} overdue
            </span>
          )}
        </div>
        {topStatus !== 'paid' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: cfg.color }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{topStatus === 'setup' ? 'Set up payment' : 'Pay now'}</span>
            <ArrowRight size={13} />
          </div>
        )}
      </div>

      {/* Toggle */}
      <button onClick={onToggle} style={{
        width: '100%', padding: '10px 18px', background: BRAND.bg, border: 'none',
        borderBottom: expanded ? `1px solid ${BRAND.border}` : 'none',
        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 12, fontWeight: 600, color: BRAND.primary, transition: 'background .15s',
      }}
        onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
        onMouseLeave={e => e.currentTarget.style.background = BRAND.bg}>
        <span>{expanded ? 'Hide details' : 'Show full details'}</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Expanded */}
      {expanded && (
        <div style={{ background: '#FAFAFA' }}>
          {/* Lease details grid */}
          <div style={{ padding: '16px 18px', borderBottom: `1px solid ${BRAND.border}` }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 10 }}>Lease Details</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
              {[
                { label: 'Monthly Rent',     value: `TZS ${lease.rentAmount?.toLocaleString()}` },
                { label: 'Security Deposit', value: `TZS ${lease.depositAmount?.toLocaleString()}` },
                { label: 'Start Date',       value: fmtDate(lease.startDate) },
                { label: 'End Date',         value: fmtDate(lease.endDate) },
                { label: 'Payment Due',      value: `Day ${lease.paymentDay} of each month` },
                { label: 'Status',           value: lease.status },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: BRAND.surface, borderRadius: 8, padding: '10px 12px', border: `1px solid ${BRAND.border}` }}>
                  <p style={{ fontSize: 11, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 3 }}>{label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: BRAND.text, textTransform: 'capitalize' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Landlord */}
          {lease.landlord && (
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BRAND.border}` }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 10 }}>Landlord</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: BRAND.primary + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: BRAND.primary, fontSize: 16, flexShrink: 0 }}>
                  {lease.landlord.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{lease.landlord.name}</p>
                  <div style={{ display: 'flex', gap: 14, fontSize: 12, color: BRAND.muted, marginTop: 3, flexWrap: 'wrap' }}>
                    {lease.landlord.phone && (
                      <a href={`tel:${lease.landlord.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 3, color: BRAND.muted, textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.color = BRAND.primary}
                        onMouseLeave={e => e.currentTarget.style.color = BRAND.muted}>
                        <Phone size={11} />{lease.landlord.phone}
                      </a>
                    )}
                    {lease.landlord.email && (
                      <a href={`mailto:${lease.landlord.email}`} style={{ display: 'flex', alignItems: 'center', gap: 3, color: BRAND.muted, textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.color = BRAND.primary}
                        onMouseLeave={e => e.currentTarget.style.color = BRAND.muted}>
                        <Mail size={11} />{lease.landlord.email}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Application */}
          {lease.application && (
            <div style={{ padding: '14px 18px', background: '#ECFDF5', borderBottom: '1px solid #A7F3D0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <CheckCircle size={14} color="#059669" />
                <p style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>Application Approved</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { label: 'Applied On', value: fmtDate(lease.application.createdAt) },
                  lease.application.moveInDate && { label: 'Move-in', value: fmtDate(lease.application.moveInDate) },
                  lease.application.employmentStatus && { label: 'Employment', value: lease.application.employmentStatus },
                ].filter(Boolean).map(({ label, value }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '8px 12px', border: '1px solid #A7F3D0' }}>
                    <p style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>{label}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#065F46', textTransform: 'capitalize' }}>{value}</p>
                  </div>
                ))}
              </div>
              {lease.application.message && (
                <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.7)', border: '1px solid #A7F3D0' }}>
                  <p style={{ fontSize: 11, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.4px' }}>Your Message</p>
                  <p style={{ fontSize: 13, color: '#065F46', lineHeight: 1.6 }}>{lease.application.message}</p>
                </div>
              )}
            </div>
          )}

          {/* Terms */}
          {lease.terms && (
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BRAND.border}` }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 8 }}>Lease Terms</p>
              <p style={{ fontSize: 13, color: BRAND.text, lineHeight: 1.65 }}>{lease.terms}</p>
            </div>
          )}

          {/* Cancel */}
          <div style={{ padding: '14px 18px' }}>
            <button onClick={onCancel} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
              borderRadius: 9, background: '#FFF1F2', color: '#9F1239', fontWeight: 600,
              fontSize: 13, border: '1px solid #FECDD3', cursor: 'pointer', transition: 'opacity .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              <AlertTriangle size={14} />Request Lease Termination
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MyLease() {
  const [allLeases, setAllLeases]             = useState([]);
  const [applications, setApplications]       = useState([]);
  const [payments, setPayments]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [cancellingLease, setCancellingLease] = useState(null);
  const [expandedApps, setExpandedApps]       = useState([]);
  const [expandedLeases, setExpandedLeases]   = useState([]);
  const [payModal, setPayModal]               = useState(null);
  const [ensuring, setEnsuring]               = useState(false);

  const toggleApp   = id => setExpandedApps(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleLease = id => setExpandedLeases(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  useEffect(() => {
    const el = document.createElement('style');
    el.dataset.id = 'lease-styles';
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  const loadAll = () =>
    Promise.all([
      api.get('/leases/my/all').catch(() => ({ data: { data: [] } })),
      api.get('/applications/sent').catch(() => ({ data: { data: [] } })),
      api.get('/payments/my').catch(() => ({ data: { data: [] } })),
    ]).then(([al, a, p]) => {
      setAllLeases(al.data.data || []);
      setApplications(a.data.data || []);
      setPayments(p.data.data || []);
    }).finally(() => setLoading(false));

  useEffect(() => { loadAll(); }, []);

  const handleOpenPayment = async (payment, leaseId) => {
    // If we already have a pending/overdue payment object, open the modal directly
    if (payment && payment.status !== 'paid') { setPayModal(payment); return; }
    setEnsuring(true);
    try {
      const { data } = await api.post('/payments/ensure-current', leaseId ? { leaseId } : {});
      await loadAll();
      if (data.alreadyPaid) {
        toast.success(`${data.data.period} rent is already paid.`);
      } else {
        setPayModal(data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not prepare payment. Try again.');
    } finally { setEnsuring(false); }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: BRAND.muted, fontSize: 14 }}>Loading your leases…</div>
  );

  const activeLeases  = allLeases.filter(l => l.status === 'active');
  const leaseAppIds   = new Set(allLeases.map(l => (l.application?._id || l.application)?.toString()).filter(Boolean));
  const otherApps     = applications.filter(a => !leaseAppIds.has(a._id?.toString()));
  const anySoonExpiring = activeLeases.some(l => {
    const d = Math.ceil((new Date(l.endDate) - new Date()) / 86400000);
    return d > 0 && d <= 30;
  });

  // ── No active lease ──────────────────────────────────────────────────────────
  if (activeLeases.length === 0) return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, fontFamily: "'Syne', sans-serif" }}>My Leases</h1>

      {otherApps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: BRAND.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: `2px solid ${BRAND.border}` }}>
            <Building2 size={30} color={BRAND.muted} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No Active Lease</h2>
          <p style={{ color: BRAND.muted, marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>
            You don't have an active lease. Browse available properties and submit an application to get started.
          </p>
          <Link to="/properties" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '11px 24px', borderRadius: 10, background: BRAND.primary,
            color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none',
          }}
            onMouseEnter={e => e.currentTarget.style.background = BRAND.primaryMid}
            onMouseLeave={e => e.currentTarget.style.background = BRAND.primary}>
            <Home size={15} />Browse Properties
          </Link>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, height: 1, background: BRAND.border }} />
              <p style={{ fontSize: 11, fontWeight: 700, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '.5px', whiteSpace: 'nowrap' }}>My Applications</p>
              <div style={{ flex: 1, height: 1, background: BRAND.border }} />
            </div>
            {otherApps.map(app => {
              const sc   = STATUS_COLORS[app.status] || STATUS_COLORS.pending;
              const prop = app.property;
              const addr = [prop?.address?.area, prop?.address?.city].filter(Boolean).join(', ');
              return (
                <div key={app._id} style={{ background: BRAND.surface, borderRadius: BRAND.radius, border: `1px solid ${BRAND.border}`, overflow: 'hidden', marginBottom: 10, boxShadow: BRAND.shadow }}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ width: 100, minHeight: 95, flexShrink: 0, background: BRAND.bg, overflow: 'hidden' }}>
                      {prop?.images?.[0]
                        ? <img src={prop.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 95 }} />
                        : <div style={{ width: '100%', minHeight: 95, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={22} color={BRAND.border} /></div>
                      }
                    </div>
                    <div style={{ flex: 1, padding: '12px 14px', minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prop?.title || 'Property'}</h3>
                        <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.text, flexShrink: 0, textTransform: 'capitalize' }}>{app.status}</span>
                      </div>
                      {addr && <p style={{ fontSize: 12, color: BRAND.muted, display: 'flex', alignItems: 'center', gap: 3, marginBottom: 4 }}><MapPin size={11} />{addr}</p>}
                      {prop?.rent?.amount && <p style={{ fontSize: 13, fontWeight: 700, color: BRAND.primary, marginBottom: 4 }}>TZS {prop.rent.amount.toLocaleString()}/mo</p>}
                      <p style={{ fontSize: 12, color: BRAND.muted, display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} />Applied {fmtDate(app.createdAt)}</p>
                    </div>
                  </div>
                  {app.status === 'pending' && (
                    <div style={{ padding: '8px 14px', background: '#FFFBEB', borderTop: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={12} color="#92400E" /><p style={{ fontSize: 12, color: '#92400E' }}>Under review — awaiting landlord response.</p>
                    </div>
                  )}
                  {app.status === 'rejected' && (
                    <div style={{ padding: '8px 14px', background: '#FFF1F2', borderTop: '1px solid #FECDD3', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <XCircle size={12} color="#9F1239" /><p style={{ fontSize: 12, color: '#9F1239' }}>{app.rejectionReason ? `Reason: ${app.rejectionReason}` : 'Application was not accepted'}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <Link to="/properties" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 20px', borderRadius: 9, background: BRAND.primary,
            color: '#fff', fontWeight: 600, fontSize: 13, textDecoration: 'none',
          }}
            onMouseEnter={e => e.currentTarget.style.background = BRAND.primaryMid}
            onMouseLeave={e => e.currentTarget.style.background = BRAND.primary}>
            <Home size={14} />Browse More Properties
          </Link>
        </>
      )}

      {payModal && <PayModal payment={payModal} onClose={() => setPayModal(null)} onPaid={async () => { setPayModal(null); await loadAll(); toast.success('Payment recorded!'); }} />}
      {cancellingLease && <CancelModal lease={cancellingLease} onClose={() => setCancellingLease(null)} onCancelled={() => { setCancellingLease(null); loadAll(); }} />}
    </div>
  );

  // ── Has active leases ────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Syne', sans-serif", margin: 0 }}>My Leases</h1>
        <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
          {activeLeases.length} active
        </span>
        {ensuring && <Loader size={14} color={BRAND.muted} style={{ animation: 'spin 1s linear infinite' }} />}
      </div>

      {/* Expiry warning */}
      {anySoonExpiring && (
        <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: BRAND.radius, padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={16} color="#92400E" />
          <p style={{ fontSize: 13, color: '#92400E' }}>
            One or more leases are expiring soon. Contact your landlord about renewal.
          </p>
        </div>
      )}

      {/* All active leases — equal weight */}
      {activeLeases.map(lease => (
        <LeaseCard
          key={lease._id}
          lease={lease}
          payments={payments}
          expanded={expandedLeases.includes(lease._id)}
          onToggle={() => toggleLease(lease._id)}
          onCancel={() => setCancellingLease(lease)}
          onPay={handleOpenPayment}
        />
      ))}

      {/* Other applications (pending/rejected, no lease) */}
      {otherApps.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: BRAND.border }} />
            <p style={{ fontSize: 11, fontWeight: 700, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '.5px', whiteSpace: 'nowrap' }}>
              Other Applications
            </p>
            <div style={{ flex: 1, height: 1, background: BRAND.border }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {otherApps.map(app => {
              const sc   = STATUS_COLORS[app.status] || STATUS_COLORS.pending;
              const prop = app.property;
              const addr = [prop?.address?.area, prop?.address?.city].filter(Boolean).join(', ');
              const isExpanded = expandedApps.includes(app._id);
              const appDetails = [
                { label: 'Applied On',        value: fmtDate(app.createdAt) },
                app.moveInDate       && { label: 'Requested Move-in', value: fmtDate(app.moveInDate) },
                app.employmentStatus && { label: 'Employment',        value: app.employmentStatus },
                app.monthlyIncome    && { label: 'Monthly Income',    value: `TZS ${app.monthlyIncome.toLocaleString()}` },
              ].filter(Boolean);

              return (
                <div key={app._id} style={{
                  background: BRAND.surface, borderRadius: BRAND.radius, border: `1px solid ${BRAND.border}`,
                  overflow: 'hidden', boxShadow: BRAND.shadow, transition: 'box-shadow .18s, transform .18s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = BRAND.shadowMd; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = BRAND.shadow; e.currentTarget.style.transform = ''; }}>

                  <div style={{ display: 'flex' }}>
                    <div style={{ width: 110, minHeight: 105, flexShrink: 0, background: BRAND.bg, overflow: 'hidden', position: 'relative' }}>
                      {prop?.images?.[0]
                        ? <img src={prop.images[0]} alt={prop.title} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 105 }} />
                        : <div style={{ width: '100%', minHeight: 105, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={24} color={BRAND.border} /></div>
                      }
                      {prop?.type && (
                        <span style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10, textTransform: 'capitalize' }}>
                          {prop.type}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1, padding: '14px 16px', minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                          {prop?.title || 'Property'}
                        </h3>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.text, flexShrink: 0, textTransform: 'capitalize' }}>
                          {app.status}
                        </span>
                      </div>
                      {addr && <p style={{ fontSize: 12, color: BRAND.muted, display: 'flex', alignItems: 'center', gap: 3, marginBottom: 6 }}><MapPin size={11} />{addr}</p>}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: BRAND.muted, marginBottom: 6 }}>
                        {prop?.rent?.amount && <span style={{ fontWeight: 700, color: BRAND.primary, fontSize: 13 }}>TZS {prop.rent.amount.toLocaleString()}/mo</span>}
                        {prop?.bedrooms && <span>{prop.bedrooms} bed</span>}
                        {prop?.bathrooms && <span>{prop.bathrooms} bath</span>}
                        {prop?.area_sqm && <span>{prop.area_sqm} sqm</span>}
                      </div>
                      <p style={{ fontSize: 12, color: BRAND.muted, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={11} />Applied {fmtDate(app.createdAt)}
                      </p>
                    </div>
                  </div>

                  <button onClick={() => toggleApp(app._id)} style={{
                    width: '100%', padding: '9px 16px', background: BRAND.bg, border: 'none',
                    borderTop: `1px solid ${BRAND.border}`, cursor: 'pointer', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 600,
                    color: BRAND.primary, transition: 'background .15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
                    onMouseLeave={e => e.currentTarget.style.background = BRAND.bg}>
                    <span>{isExpanded ? 'Hide details' : 'Show full details'}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {isExpanded && (
                    <div style={{ padding: '16px 18px', borderTop: `1px solid ${BRAND.border}`, background: '#FAFAFA' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 10 }}>Application Details</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, marginBottom: 14 }}>
                        {appDetails.map(({ label, value }) => (
                          <div key={label} style={{ background: BRAND.surface, borderRadius: 8, padding: '10px 12px', border: `1px solid ${BRAND.border}` }}>
                            <p style={{ fontSize: 11, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 3 }}>{label}</p>
                            <p style={{ fontSize: 13, fontWeight: 600, color: BRAND.text, textTransform: 'capitalize' }}>{value}</p>
                          </div>
                        ))}
                      </div>
                      {app.message && (
                        <div style={{ background: BRAND.surface, borderRadius: 8, padding: '10px 14px', border: `1px solid ${BRAND.border}` }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 5 }}>Your Message</p>
                          <p style={{ fontSize: 13, color: BRAND.text, lineHeight: 1.6 }}>{app.message}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {app.status === 'pending' && (
                    <div style={{ padding: '9px 16px', background: '#FFFBEB', borderTop: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={13} color="#92400E" /><p style={{ fontSize: 12, color: '#92400E' }}>Under review — the landlord will respond soon.</p>
                    </div>
                  )}
                  {app.status === 'rejected' && (
                    <div style={{ padding: '9px 16px', background: '#FFF1F2', borderTop: '1px solid #FECDD3', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <XCircle size={13} color="#9F1239" /><p style={{ fontSize: 12, color: '#9F1239' }}>
                        {app.rejectionReason ? `Reason: ${app.rejectionReason}` : 'Application was not accepted'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {payModal && (
        <PayModal
          payment={payModal}
          onClose={() => setPayModal(null)}
          onPaid={async () => { setPayModal(null); await loadAll(); toast.success('Payment recorded!'); }}
        />
      )}

      {cancellingLease && (
        <CancelModal
          lease={cancellingLease}
          onClose={() => setCancellingLease(null)}
          onCancelled={() => { setCancellingLease(null); loadAll(); }}
        />
      )}
    </div>
  );
}
