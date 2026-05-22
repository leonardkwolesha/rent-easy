import { useState, useEffect, useMemo } from 'react';
import {
  CreditCard, CheckCircle, Wallet, AlertTriangle, Loader,
  RefreshCw, ChevronDown, ChevronUp, Calendar, TrendingUp, Clock,
  Home, Zap,
} from 'lucide-react';
import { BRAND, STATUS_COLORS } from '../../theme';
import { toast } from '../../components/Toast';
import api from '../../services/api';
import PayModal, { PROVIDERS } from '../../components/PayModal';

function fmt(n) { return n?.toLocaleString() ?? '—'; }

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

function periodLabel(period) {
  if (!period) return '—';
  const [y, m] = period.split('-');
  return new Date(+y, +m - 1).toLocaleDateString('en-TZ', { month: 'long', year: 'numeric' });
}

function daysUntilLabel(date) {
  if (!date) return null;
  const diff = Math.ceil((new Date(date) - Date.now()) / 86400000);
  if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, urgent: true };
  if (diff === 0) return { text: 'Due today', urgent: true };
  if (diff === 1) return { text: 'Due tomorrow', urgent: true };
  return { text: `Due in ${diff} days`, urgent: false };
}

/* ─── Lease hero card ────────────────────────────────────────── */
function LeaseHero({ lease, pending, overdue, ensuring, onPay }) {
  const nextDue = useMemo(() => {
    if (!lease) return null;
    const now = new Date();
    const day = lease.paymentDay || 1;
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), day);
    return thisMonth > now ? thisMonth : new Date(now.getFullYear(), now.getMonth() + 1, day);
  }, [lease]);

  const dueMeta = daysUntilLabel(nextDue);

  if (!lease) return null;

  const hasDue = pending.length > 0;

  return (
    <div style={{ borderRadius: 16, background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryMid} 100%)`, padding: '22px 24px', marginBottom: 24, boxShadow: `0 8px 32px ${BRAND.primary}40`, position: 'relative', overflow: 'hidden' }}>
      {/* background decoration */}
      <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
      <div style={{ position: 'absolute', bottom: -20, right: 40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <Home size={14} color="rgba(255,255,255,0.7)" />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
              {lease.property?.title || 'Active Lease'}
            </span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>
            TZS {fmt(lease.rentAmount)}
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
            per month · due on day {lease.paymentDay || 1}
          </p>
          {nextDue && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10, padding: '4px 10px', borderRadius: 20, background: dueMeta?.urgent ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.12)', border: `1px solid ${dueMeta?.urgent ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.2)'}` }}>
              <Clock size={11} color={dueMeta?.urgent ? '#FCA5A5' : 'rgba(255,255,255,0.8)'} />
              <span style={{ fontSize: 12, fontWeight: 600, color: dueMeta?.urgent ? '#FCA5A5' : 'rgba(255,255,255,0.85)' }}>
                Next: {fmtDate(nextDue)} · {dueMeta?.text}
              </span>
            </div>
          )}
        </div>

        {/* Pay button — shown when no current-month pending record */}
        {!hasDue && (
          <button disabled={ensuring} onClick={onPay}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 20px', borderRadius: 12, background: ensuring ? 'rgba(255,255,255,0.2)' : '#fff', color: ensuring ? 'rgba(255,255,255,0.7)' : BRAND.primary, fontWeight: 700, fontSize: 14, border: 'none', cursor: ensuring ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', transition: 'all 0.18s', flexShrink: 0 }}>
            {ensuring
              ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />Preparing…</>
              : <><Zap size={14} />Pay This Month</>
            }
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── 6-month mini calendar ──────────────────────────────────── */
function MonthCalendar({ payments }) {
  const [hovered, setHovered] = useState(null);

  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const pmt = payments.find(p => p.period === period);
      const isFuture = d > now;
      return { period, date: d, pmt, isFuture };
    });
  }, [payments]);

  const statusStyle = (m) => {
    if (m.isFuture) return { bg: '#F3F4F6', text: '#9CA3AF', dot: '#D1D5DB' };
    if (!m.pmt) return { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' };
    if (m.pmt.status === 'paid') return { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' };
    if (m.pmt.status === 'overdue') return { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' };
    return { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' };
  };

  const statusText = (m) => {
    if (m.isFuture) return 'future';
    if (!m.pmt) return 'no record';
    return m.pmt.status;
  };

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${BRAND.border}`, padding: '16px 18px', marginBottom: 24, boxShadow: BRAND.shadow }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 }}>
        <Calendar size={12} style={{ marginRight: 5, verticalAlign: 'middle' }} />6-Month History
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
        {months.map(m => {
          const st = statusStyle(m);
          const isHov = hovered === m.period;
          return (
            <div key={m.period}
              onMouseEnter={() => setHovered(m.period)}
              onMouseLeave={() => setHovered(null)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '8px 4px', borderRadius: 9, background: isHov ? st.bg : 'transparent', border: `1px solid ${isHov ? st.dot + '60' : 'transparent'}`, cursor: 'default', transition: 'all 0.15s', position: 'relative' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>
                {m.date.toLocaleDateString('en', { month: 'short' })}
              </span>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: st.dot }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: st.text, whiteSpace: 'nowrap' }}>
                {statusText(m)}
              </span>
              {/* Hover tooltip */}
              {isHov && m.pmt && (
                <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6, background: '#111827', color: '#fff', fontSize: 11, padding: '5px 9px', borderRadius: 7, whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                  TZS {fmt(m.pmt.amount)}
                  <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #111827' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Stat card ──────────────────────────────────────────────── */
function StatCard({ label, value, sub, color, icon }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: `1px solid ${BRAND.border}`, boxShadow: hover ? BRAND.shadowMd : BRAND.shadow, transform: hover ? 'translateY(-2px)' : 'none', transition: 'all 0.18s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <p style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{value}</p>
        {icon && <div style={{ color, opacity: 0.7 }}>{icon}</div>}
      </div>
      <p style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{label}</p>
      {sub && <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

/* ─── Payment row ────────────────────────────────────────────── */
function PaymentRow({ p, onPay, expanded, onToggle }) {
  const sc = STATUS_COLORS[p.status] || {};
  const isOverdue = p.status === 'overdue';
  const isPending = p.status === 'pending';
  const isPaid = p.status === 'paid';
  const prov = PROVIDERS.find(x => x.id === p.paymentMethod);
  const [hover, setHover] = useState(false);

  return (
    <div
      style={{ background: '#fff', borderRadius: 12, border: `1px solid ${isOverdue ? '#FECACA' : expanded ? BRAND.primary + '30' : '#E5E7EB'}`, overflow: 'hidden', boxShadow: expanded ? BRAND.shadowMd : hover ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}>
      {/* Status accent bar */}
      {(isOverdue || isPending) && (
        <div style={{ height: 3, background: isOverdue ? '#EF4444' : '#F59E0B', borderRadius: '12px 12px 0 0' }} />
      )}

      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12, cursor: 'pointer' }}
        onClick={onToggle}>
        {/* Status icon */}
        <div style={{ width: 38, height: 38, borderRadius: 10, background: sc.bg || '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {isPaid ? <CheckCircle size={18} color="#059669" /> :
            isOverdue ? <AlertTriangle size={18} color="#DC2626" /> :
              <Clock size={18} color="#D97706" />
          }
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <p style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{periodLabel(p.period)}</p>
            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.text }}>
              {p.status}
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
            {isPaid ? `Paid ${fmtDate(p.paidDate)}` : `Due ${fmtDate(p.dueDate)}`}
            {prov && isPaid && <span style={{ color: prov.color, fontWeight: 600 }}> · {prov.label}</span>}
          </p>
        </div>

        {/* Amount + action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <p style={{ fontWeight: 800, fontSize: 15, color: isOverdue ? '#DC2626' : '#111827', textAlign: 'right' }}>
            TZS {fmt(p.amount)}
          </p>
          {!isPaid && (
            <button
              onClick={e => { e.stopPropagation(); onPay(p); }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 9, background: isOverdue ? '#DC2626' : BRAND.primary, color: '#fff', fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'opacity 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              <CreditCard size={12} />Pay
            </button>
          )}
          <div style={{ color: '#9CA3AF', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* Expanded details panel */}
      {expanded && (
        <div style={{ borderTop: '1px solid #F3F4F6', padding: '14px 16px', background: '#FAFAFA', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px 20px' }}>
          {[
            { label: 'Period', value: p.period },
            { label: 'Amount', value: `TZS ${fmt(p.amount)}` },
            { label: 'Due Date', value: fmtDate(p.dueDate) },
            isPaid && { label: 'Paid Date', value: fmtDate(p.paidDate) },
            isPaid && prov && { label: 'Method', value: prov.label },
            (p.transactionId) && { label: 'Transaction Ref', value: p.transactionId },
            p.property?.title && { label: 'Property', value: p.property.title },
          ].filter(Boolean).map(item => (
            <div key={item.label}>
              <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 2 }}>{item.label}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', fontFamily: item.label === 'Transaction Ref' ? 'monospace' : 'inherit' }}>{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────── */
export default function PayRent() {
  const [payments, setPayments] = useState([]);
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(null);
  const [ensuring, setEnsuring] = useState(false);
  const [tab, setTab] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [pmtRes, leaseRes] = await Promise.all([
        api.get('/payments/my'),
        api.get('/leases/my').catch(() => ({ data: { data: null } })),
      ]);
      setPayments(pmtRes.data.data);
      setLease(leaseRes.data.data);
    } catch { /* ignore */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handlePaid = () => {
    load(true);
    toast.success('Payment recorded successfully!');
    setModal(null);
  };

  const handlePayCurrentMonth = async () => {
    setEnsuring(true);
    try {
      const { data } = await api.post('/payments/ensure-current');
      await load(true);
      setModal(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not prepare payment. Try again.');
    } finally {
      setEnsuring(false);
    }
  };

  const handlePay = (payment) => setModal(payment);

  // Computed
  const pending = payments.filter(p => p.status !== 'paid' && p.status !== 'waived');
  const overdue = pending.filter(p => p.status === 'overdue');
  const paid = payments.filter(p => p.status === 'paid');
  const total = paid.reduce((s, p) => s + p.amount, 0);
  const totalOverdue = overdue.reduce((s, p) => s + p.amount, 0);
  const hasActiveLease = lease?.status === 'active';

  // Streak calculation
  const streak = useMemo(() => {
    const sorted = [...paid].sort((a, b) => b.period.localeCompare(a.period));
    let count = 0, expected = null;
    for (const p of sorted) {
      if (!expected) { expected = p.period; count = 1; continue; }
      const [ey, em] = expected.split('-').map(Number);
      const prev = em === 1 ? `${ey - 1}-12` : `${ey}-${String(em - 1).padStart(2, '0')}`;
      if (p.period === prev) { count++; expected = p.period; } else break;
    }
    return count;
  }, [paid]);

  // Filtered list
  const filteredPayments = useMemo(() => {
    const all = [...payments].sort((a, b) => b.period.localeCompare(a.period));
    if (tab === 'due') return all.filter(p => p.status !== 'paid' && p.status !== 'waived');
    if (tab === 'paid') return all.filter(p => p.status === 'paid');
    return all;
  }, [payments, tab]);

  const tabs = [
    { id: 'all', label: 'All', count: payments.length },
    { id: 'due', label: 'Due', count: pending.length },
    { id: 'paid', label: 'Paid', count: paid.length },
  ];

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 24px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: '#111827' }}>Rent Payments</h1>
        <button onClick={() => load(true)} disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: '#F3F4F6', border: 'none', cursor: refreshing ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, color: '#374151', transition: 'background 0.15s' }}
          onMouseEnter={e => { if (!refreshing) e.currentTarget.style.background = '#E5E7EB'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#F3F4F6'; }}>
          <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Overdue alert banner */}
      {overdue.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, padding: '14px 18px', borderRadius: 14, background: '#FEF2F2', border: '1px solid #FECACA', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={18} color="#DC2626" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#991B1B' }}>
                {overdue.length} overdue payment{overdue.length > 1 ? 's' : ''} totalling TZS {fmt(totalOverdue)}
              </p>
              <p style={{ fontSize: 12, color: '#B91C1C', marginTop: 2 }}>
                Overdue payments may affect your tenancy status. Please settle them promptly.
              </p>
            </div>
          </div>
          <button onClick={() => setModal(overdue[0])}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 9, background: '#DC2626', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(220,38,38,0.3)' }}>
            <CreditCard size={13} />Pay Overdue Now
          </button>
        </div>
      )}

      {/* Lease hero */}
      {hasActiveLease && (
        <LeaseHero lease={lease} pending={pending} overdue={overdue} ensuring={ensuring} onPay={handlePayCurrentMonth} />
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="Total Paid" value={`TZS ${fmt(total)}`} color={BRAND.secondary} icon={<TrendingUp size={18} />} />
        <StatCard label="Months Paid" value={paid.length} sub="completed" color={BRAND.primary} icon={<CheckCircle size={18} />} />
        <StatCard label="Due Now" value={pending.length} sub={pending.length > 0 ? 'action needed' : 'all clear'} color={pending.length > 0 ? BRAND.danger : BRAND.muted} icon={<Clock size={18} />} />
        <StatCard label="Pay Streak" value={streak > 0 ? `${streak}mo` : '—'} sub={streak > 1 ? `${streak} months in a row` : 'no streak yet'} color={streak >= 3 ? BRAND.accent : BRAND.muted} icon={<Zap size={18} />} />
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Loader size={24} color={BRAND.muted} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ color: BRAND.muted, fontSize: 14 }}>Loading payments…</p>
        </div>
      )}

      {!loading && payments.length > 0 && (
        <>
          {/* 6-month calendar */}
          <MonthCalendar payments={payments} />

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: '#F3F4F6', padding: 4, borderRadius: 11, width: 'fit-content' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: tab === t.id ? 700 : 500, fontSize: 13, color: tab === t.id ? '#111827' : '#6B7280', background: tab === t.id ? '#fff' : 'transparent', boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                {t.label}
                {t.count > 0 && (
                  <span style={{ padding: '1px 7px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: tab === t.id ? (t.id === 'due' ? '#FEE2E2' : '#DCFCE7') : '#E5E7EB', color: tab === t.id ? (t.id === 'due' ? '#991B1B' : '#166534') : '#6B7280' }}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Payment list */}
          {filteredPayments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredPayments.map(p => (
                <PaymentRow
                  key={p._id}
                  p={p}
                  onPay={handlePay}
                  expanded={expanded === p._id}
                  onToggle={() => setExpanded(expanded === p._id ? null : p._id)}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: BRAND.muted }}>
              <p style={{ fontSize: 14 }}>No {tab === 'due' ? 'due' : tab === 'paid' ? 'paid' : ''} payments found</p>
            </div>
          )}
        </>
      )}

      {/* Empty state — no records, no active lease */}
      {!loading && payments.length === 0 && !hasActiveLease && (
        <div style={{ textAlign: 'center', padding: '64px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={30} color="#D1D5DB" />
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>No payment records yet</p>
          <p style={{ fontSize: 13, color: '#9CA3AF', maxWidth: 280 }}>
            Your payments will appear here once your lease is approved and activated.
          </p>
        </div>
      )}

      {/* Empty state — no records but lease is active */}
      {!loading && payments.length === 0 && hasActiveLease && (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: '#fff', borderRadius: 16, border: `1px solid ${BRAND.border}` }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F0FDF4', border: '2px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CreditCard size={28} color={BRAND.secondary} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Ready to Pay</p>
          <p style={{ fontSize: 13, color: '#6B7280', maxWidth: 280, margin: '0 auto 20px' }}>
            Your lease is active. Use the button above to pay this month's rent.
          </p>
        </div>
      )}

      {modal && (
        <PayModal payment={modal} onClose={() => setModal(null)} onPaid={handlePaid} />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
