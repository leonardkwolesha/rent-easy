import { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, LayoutList } from 'lucide-react';
import { BRAND, STATUS_COLORS } from '../../theme';
import api from '../../services/api';

export default function LandlordPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/payments/landlord')
      .then(r => setPayments(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter);
  const total = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const overdue = payments.filter(p => p.status === 'overdue').length;

  const statCards = [
    { label: 'Total Collected', value: `TZS ${total.toLocaleString()}`, color: BRAND.secondary, icon: <TrendingUp size={18} /> },
    { label: 'Overdue Payments', value: overdue, color: '#EF4444', icon: <AlertCircle size={18} /> },
    { label: 'Total Records', value: payments.length, color: BRAND.primary, icon: <LayoutList size={18} /> },
  ];

  const FILTERS = ['all', 'pending', 'paid', 'overdue'];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, fontFamily: "'Syne', sans-serif" }}>Payments</h1>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        {statCards.map(s => (
          <div key={s.label} style={{
            background: BRAND.surface, borderRadius: BRAND.radius, padding: '16px 20px',
            border: `1px solid ${BRAND.border}`, boxShadow: BRAND.shadow, transition: 'transform .18s, box-shadow .18s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = BRAND.shadowMd; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = BRAND.shadow; }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ color: s.color }}>{s.icon}</div>
              <p style={{ fontSize: 12, color: BRAND.muted, fontWeight: 500 }}>{s.label}</p>
            </div>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            border: `1px solid ${filter === f ? BRAND.primary : BRAND.border}`,
            background: filter === f ? BRAND.primary : BRAND.surface,
            color: filter === f ? '#fff' : BRAND.text,
            cursor: 'pointer', transition: 'all .15s',
          }}
            onMouseEnter={e => { if (filter !== f) e.currentTarget.style.background = BRAND.bg; }}
            onMouseLeave={e => { if (filter !== f) e.currentTarget.style.background = BRAND.surface; }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && (
              <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>
                ({payments.filter(p => f === 'all' || p.status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: BRAND.surface, borderRadius: BRAND.radius, border: `1px solid ${BRAND.border}`, overflow: 'hidden', boxShadow: BRAND.shadow }}>
        {loading ? (
          <p style={{ padding: 32, color: BRAND.muted, textAlign: 'center' }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: 32, color: BRAND.muted, textAlign: 'center' }}>No payments found.</p>
        ) : filtered.map((p, i) => {
          const s = STATUS_COLORS[p.status] || STATUS_COLORS.pending;
          return (
            <div key={p._id} style={{
              padding: '13px 20px',
              borderBottom: i < filtered.length - 1 ? `1px solid ${BRAND.border}` : 'none',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              transition: 'background .15s', flexWrap: 'wrap', gap: 8,
            }}
              onMouseEnter={e => e.currentTarget.style.background = BRAND.bg}
              onMouseLeave={e => e.currentTarget.style.background = ''}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{p.tenant?.name}</p>
                <p style={{ fontSize: 12, color: BRAND.muted, marginTop: 2 }}>
                  {p.property?.title} · {p.period} · Due {new Date(p.dueDate).toLocaleDateString()}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: BRAND.text }}>TZS {p.amount?.toLocaleString()}</p>
                <span style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: s.bg, color: s.text, textTransform: 'capitalize',
                }}>{p.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
