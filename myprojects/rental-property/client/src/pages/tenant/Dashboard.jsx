import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Wallet, Wrench, Building2, ClipboardList,
  Search, ArrowRight, CheckCircle, CreditCard, AlertTriangle,
  Loader, TrendingUp,
} from 'lucide-react';
import { BRAND, STATUS_COLORS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/Toast';
import PayModal from '../../components/PayModal';
import api from '../../services/api';

export default function TenantDashboard() {
  const { user } = useAuth();
  const [lease, setLease] = useState(null);
  const [payments, setPayments] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(null);
  const [ensuringPayment, setEnsuringPayment] = useState(false);

  const loadAll = () =>
    Promise.all([
      api.get('/leases/my'),
      api.get('/payments/my'),
      api.get('/maintenance/my'),
      api.get('/applications/sent'),
    ]).then(([l, p, m, a]) => {
      setLease(l.data.data);
      setPayments(p.data.data);
      setMaintenance(m.data.data);
      setApplications(a.data.data);
    }).catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { loadAll(); }, []);

  const pending    = payments.filter(p => p.status === 'pending' || p.status === 'overdue');
  const overdue    = payments.filter(p => p.status === 'overdue');
  const paidTotal  = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const openMaint  = maintenance.filter(m => m.status === 'open' || m.status === 'in_progress');
  const pendingApps = applications.filter(a => a.status === 'pending');
  const approvedApps = applications.filter(a => a.status === 'approved');
  const overdueAmt = overdue.reduce((s, p) => s + p.amount, 0);

  /* Open the payment modal — if no records yet, create one first */
  const handlePayNow = async (existingPayment = null) => {
    if (existingPayment) { setPayModal(existingPayment); return; }
    setEnsuringPayment(true);
    try {
      const { data } = await api.post('/payments/ensure-current');
      await loadAll();          // refresh so the new record appears everywhere
      setPayModal(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not prepare payment. Try again.');
    } finally {
      setEnsuringPayment(false);
    }
  };

  const handlePaid = async () => {
    await loadAll();
    setPayModal(null);
    toast.success('Payment recorded successfully!');
  };

  const daysLeft = lease
    ? Math.max(0, Math.ceil((new Date(lease.endDate) - new Date()) / 86400000))
    : null;

  /* Current-month due date from lease */
  const now = new Date();
  const currentDueDate = lease
    ? new Date(now.getFullYear(), now.getMonth(), lease.paymentDay || 1)
        .toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
    : null;

  const card = (icon, title, value, desc, path, color = BRAND.primary) => (
    <Link to={path} style={{
      background: BRAND.surface, borderRadius: BRAND.radius, padding: '20px 22px',
      border: `1px solid ${BRAND.border}`, boxShadow: BRAND.shadow, textDecoration: 'none',
      display: 'block', transition: 'transform .18s, box-shadow .18s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = BRAND.shadowMd; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = BRAND.shadow; }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
        <p style={{ fontWeight: 600, fontSize: 14, color: BRAND.text }}>{title}</p>
      </div>
      <p style={{ fontSize: 24, fontWeight: 800, color, marginBottom: 4, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 12, color: BRAND.muted }}>{desc}</p>
    </Link>
  );

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>

      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>
          Hello, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: BRAND.muted, fontSize: 14, marginTop: 4 }}>Your tenancy overview</p>
      </div>

      {/* ── Overdue alert banner ── */}
      {overdue.length > 0 && !loading && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: BRAND.radius,
          padding: '16px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={20} color="#DC2626" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#991B1B' }}>
                {overdue.length} overdue payment{overdue.length > 1 ? 's' : ''}
              </p>
              <p style={{ fontSize: 13, color: '#DC2626', marginTop: 2 }}>
                TZS {overdueAmt.toLocaleString()} past due — pay now to avoid penalties
              </p>
            </div>
          </div>
          <button
            onClick={() => handlePayNow(overdue[0])}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 9, background: '#DC2626', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', transition: 'background .15s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.background = '#B91C1C'}
            onMouseLeave={e => e.currentTarget.style.background = '#DC2626'}>
            <CreditCard size={15} /> Pay Overdue Now
          </button>
        </div>
      )}

      {/* ── Onboarding guide (no lease yet) ── */}
      {!lease && !loading && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ background: BRAND.surface, borderRadius: BRAND.radius, border: `1px solid ${BRAND.border}`, padding: '22px 24px', marginBottom: 16, boxShadow: BRAND.shadow }}>
            <p style={{ fontWeight: 700, fontSize: 15, fontFamily: "'Syne', sans-serif", marginBottom: 18 }}>How to rent a property</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                {
                  step: 1, done: true,
                  icon: <CheckCircle size={18} color="#059669" />,
                  title: 'Create your account',
                  desc: 'You\'re signed in — you\'re ready to go.',
                  link: null,
                },
                {
                  step: 2, done: applications.length > 0,
                  icon: applications.length > 0 ? <CheckCircle size={18} color="#059669" /> : <Search size={18} color={BRAND.primary} />,
                  title: 'Browse & apply for a property',
                  desc: 'Find a property you like and submit a rental application.',
                  link: { to: '/properties', label: 'Browse Properties' },
                },
                {
                  step: 3,
                  done: approvedApps.length > 0 && pendingApps.length === 0,
                  icon: approvedApps.length > 0 && pendingApps.length === 0
                    ? <CheckCircle size={18} color="#059669" />
                    : <ClipboardList size={18} color={pendingApps.length > 0 ? BRAND.primary : BRAND.muted} />,
                  title: 'Get your application approved',
                  desc: pendingApps.length > 0
                    ? `${pendingApps.length} application${pendingApps.length > 1 ? 's' : ''} under review — the landlord will respond soon.`
                    : approvedApps.length > 0
                      ? 'Your previous lease has ended. Apply to a new property to start again.'
                      : 'The landlord will review your application and approve or reject it.',
                  link: applications.length > 0
                    ? { to: '/tenant/applications', label: 'View Applications' }
                    : { to: '/properties', label: 'Browse Properties' },
                },
                {
                  step: 4, done: false,
                  icon: <FileText size={18} color={BRAND.muted} />,
                  title: 'Your lease is activated',
                  desc: 'Once approved, your lease and full payment schedule are created automatically.',
                  link: null,
                },
              ].map((s, i, arr) => (
                <div key={s.step} style={{ display: 'flex', gap: 16, position: 'relative', paddingBottom: i < arr.length - 1 ? 20 : 0 }}>
                  {i < arr.length - 1 && (
                    <div style={{ position: 'absolute', left: 17, top: 28, bottom: 0, width: 2, background: s.done ? '#059669' : BRAND.border }} />
                  )}
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: s.done ? '#ECFDF5' : BRAND.bg, border: `2px solid ${s.done ? '#059669' : BRAND.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                    {s.icon}
                  </div>
                  <div style={{ flex: 1, paddingTop: 6 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: s.done ? '#059669' : BRAND.text }}>{s.title}</p>
                    <p style={{ fontSize: 13, color: BRAND.muted, marginTop: 2, lineHeight: 1.5 }}>{s.desc}</p>
                    {s.link && (
                      <Link to={s.link.to} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 13, fontWeight: 600, color: BRAND.primary, textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                        {s.link.label} <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {pendingApps.length > 0 && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: BRAND.radius, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <p style={{ fontSize: 14, color: '#92400E', fontWeight: 500 }}>
                <strong>{pendingApps.length}</strong> application{pendingApps.length > 1 ? 's are' : ' is'} under review
              </p>
              <Link to="/tenant/applications" style={{ padding: '8px 16px', borderRadius: 8, background: '#92400E', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                Track Applications →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── KPI cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
        {card(<Building2 size={18} />, 'My Lease', lease ? 'Active' : 'None', lease?.property?.title || 'No active lease', '/tenant/lease', BRAND.primary)}
        {card(<ClipboardList size={18} />, 'Applications', applications.length, `${pendingApps.length} pending · ${approvedApps.length} approved`, '/tenant/applications', pendingApps.length > 0 ? BRAND.warn : BRAND.secondary)}
        {card(<Wallet size={18} />, 'Due Payments', pending.length, `${overdue.length} overdue · TZS ${pending.reduce((s, p) => s + p.amount, 0).toLocaleString()}`, '/tenant/payments', overdue.length > 0 ? BRAND.danger : pending.length > 0 ? BRAND.warn : BRAND.success)}
        {card(<Wrench size={18} />, 'Maintenance', openMaint.length, `${openMaint.length} open request${openMaint.length !== 1 ? 's' : ''}`, '/tenant/maintenance', BRAND.secondary)}
      </div>

      {/* ── Current lease detail ── */}
      {lease && (
        <div style={{ background: BRAND.surface, borderRadius: BRAND.radius, padding: '20px 24px', border: `1px solid ${BRAND.border}`, marginBottom: 20, boxShadow: BRAND.shadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ fontWeight: 700, fontSize: 15, fontFamily: "'Syne', sans-serif" }}>Current Lease</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {daysLeft !== null && (
                <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: daysLeft < 30 ? '#FEF3C7' : '#DCFCE7', color: daysLeft < 30 ? '#92400E' : '#166534' }}>
                  {daysLeft} days remaining
                </span>
              )}
              {/* Pay This Month button — shows when no pending records exist yet */}
              {pending.length === 0 && (
                <button
                  disabled={ensuringPayment}
                  onClick={() => handlePayNow(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, background: BRAND.primary, color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', cursor: ensuringPayment ? 'not-allowed' : 'pointer', transition: 'background .15s', opacity: ensuringPayment ? 0.7 : 1 }}
                  onMouseEnter={e => { if (!ensuringPayment) e.currentTarget.style.background = BRAND.primaryMid; }}
                  onMouseLeave={e => e.currentTarget.style.background = BRAND.primary}>
                  {ensuringPayment
                    ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />Loading…</>
                    : <><CreditCard size={13} />Pay This Month's Rent</>}
                </button>
              )}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
            {[
              ['Property', lease.property?.title],
              ['Monthly Rent', `TZS ${lease.rentAmount?.toLocaleString()}`],
              ['Payment Due', `${lease.paymentDay || 1}${ordinal(lease.paymentDay || 1)} of each month`],
              ['Lease Ends', new Date(lease.endDate).toLocaleDateString()],
            ].map(([label, val]) => (
              <div key={label} style={{ padding: '12px 14px', borderRadius: 9, background: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                <p style={{ fontSize: 11, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>{label}</p>
                <p style={{ fontWeight: 600, fontSize: 14, color: BRAND.text }}>{val}</p>
              </div>
            ))}
          </div>

          {/* Paid-total summary */}
          {paidTotal > 0 && (
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 9, background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={15} color="#059669" />
              <p style={{ fontSize: 13, color: '#065F46' }}>
                <strong>TZS {paidTotal.toLocaleString()}</strong> total paid since lease start
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Upcoming / due payments with inline Pay Now buttons ── */}
      {pending.length > 0 && (
        <div style={{ background: BRAND.surface, borderRadius: BRAND.radius, border: `1px solid ${BRAND.border}`, overflow: 'hidden', boxShadow: BRAND.shadow }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${BRAND.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontWeight: 700, fontSize: 15, fontFamily: "'Syne', sans-serif" }}>Due Payments</h2>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: overdue.length > 0 ? '#FEE2E2' : '#FEF3C7', color: overdue.length > 0 ? '#991B1B' : '#92400E' }}>
              {pending.length} due · TZS {pending.reduce((s, p) => s + p.amount, 0).toLocaleString()}
            </span>
          </div>
          {pending.map((p, i) => {
            const sc = STATUS_COLORS[p.status] || {};
            const isOverdue = p.status === 'overdue';
            return (
              <div key={p._id} style={{
                padding: '14px 20px',
                borderBottom: i < pending.length - 1 ? `1px solid ${BRAND.border}` : 'none',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: isOverdue ? '#FFF5F5' : '#fff',
                borderLeft: isOverdue ? '3px solid #EF4444' : '3px solid transparent',
                transition: 'background .15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = isOverdue ? '#FEF2F2' : BRAND.bg}
                onMouseLeave={e => e.currentTarget.style.background = isOverdue ? '#FFF5F5' : '#fff'}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: BRAND.text }}>{p.period} Rent</p>
                  <p style={{ fontSize: 12, color: BRAND.muted, marginTop: 2 }}>
                    Due {new Date(p.dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: isOverdue ? BRAND.danger : BRAND.text }}>
                      TZS {p.amount?.toLocaleString()}
                    </p>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: sc.bg, color: sc.text, fontWeight: 600 }}>
                      {p.status}
                    </span>
                  </div>
                  <button
                    onClick={() => handlePayNow(p)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, background: isOverdue ? '#DC2626' : BRAND.primary, color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'background .15s', whiteSpace: 'nowrap' }}
                    onMouseEnter={e => e.currentTarget.style.background = isOverdue ? '#B91C1C' : BRAND.primaryMid}
                    onMouseLeave={e => e.currentTarget.style.background = isOverdue ? '#DC2626' : BRAND.primary}>
                    <CreditCard size={13} />Pay Now
                  </button>
                </div>
              </div>
            );
          })}
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${BRAND.border}`, background: BRAND.bg, display: 'flex', justifyContent: 'flex-end' }}>
            <Link to="/tenant/payments" style={{ fontSize: 13, color: BRAND.primary, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
              View full payment history <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {payModal && (
        <PayModal payment={payModal} onClose={() => setPayModal(null)} onPaid={handlePaid} />
      )}

      {/* CSS for spinner */}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function ordinal(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
