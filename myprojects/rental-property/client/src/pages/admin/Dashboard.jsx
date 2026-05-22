import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Users, Wallet, Building2, FileText,
  ClipboardList, Wrench, CheckCircle, Shield, TrendingUp,
  AlertTriangle, Search, ChevronLeft, ChevronRight,
  Star, StarOff, Ban, UserCheck, RefreshCw,
  Percent, Settings, BarChart2, ArrowUpRight, Banknote,
} from 'lucide-react';
import { BRAND, STATUS_COLORS } from '../../theme';
import { toast } from '../../components/Toast';
import api from '../../services/api';

/* ─── shared helpers ──────────────────────────────────────────────────── */
const fmt = n => (n ?? 0).toLocaleString();
const fmtTZS = n => `TZS ${fmt(n)}`;
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtPct = r => `${(r ?? 0).toFixed(1)}%`;

function Badge({ status, label }) {
  const c = STATUS_COLORS[status] || { bg: '#F1F5F9', text: '#475569' };
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: c.bg, color: c.text, textTransform: 'capitalize', whiteSpace: 'nowrap',
    }}>{label || status?.replace('_', ' ')}</span>
  );
}

function Pill({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 13px', borderRadius: 7, fontSize: 12, fontWeight: 500,
      border: `1px solid ${active ? BRAND.primary : BRAND.border}`,
      background: active ? BRAND.primary : BRAND.surface,
      color: active ? '#fff' : BRAND.text, cursor: 'pointer', transition: 'all .15s',
    }}>{label}</button>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: BRAND.surface, borderRadius: BRAND.radius,
      border: `1px solid ${BRAND.border}`, boxShadow: BRAND.shadow,
      ...style,
    }}>{children}</div>
  );
}

function Paginator({ page, total, limit, onChange }) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', padding: '12px 18px', borderTop: `1px solid ${BRAND.border}` }}>
      <span style={{ fontSize: 12, color: BRAND.muted }}>{(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {fmt(total)}</span>
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${BRAND.border}`, background: BRAND.surface, cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
        <ChevronLeft size={14} />
      </button>
      <button onClick={() => onChange(page + 1)} disabled={page === pages}
        style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${BRAND.border}`, background: BRAND.surface, cursor: page === pages ? 'default' : 'pointer', opacity: page === pages ? 0.4 : 1 }}>
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

const ROW_STYLE = (i, len) => ({
  padding: '13px 18px', borderBottom: i < len - 1 ? `1px solid ${BRAND.border}` : 'none',
  display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
  transition: 'background .12s',
});

const METHOD_LABELS = { mpesa: 'M-Pesa', airtel: 'Airtel', mixx: 'Mixx', halotel: 'Halotel', bank: 'Bank', cash: 'Cash', card: 'Card' };

/* ─── OVERVIEW tab ───────────────────────────────────────────────────── */
function OverviewTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/overview')
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Failed to load overview'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: BRAND.muted, padding: 24 }}>Loading…</p>;
  if (!data) return null;

  const { users, properties, leases, payments, revenue, pendingApplications, openMaintenance, urgentMaintenance } = data;

  const bigStats = [
    { label: 'Total Users',      value: fmt(users.total),                                 sub: `${fmt(users.tenants)} tenants · ${fmt(users.landlords)} landlords`,           color: BRAND.primary,  icon: <Users size={20} /> },
    { label: 'Platform Earnings', value: fmtTZS(revenue?.platformFees ?? 0),              sub: `${fmtPct(revenue?.feeRate)} fee · ${fmtTZS(revenue?.totalVolume)} volume`,    color: '#8B5CF6',      icon: <TrendingUp size={20} /> },
    { label: 'Properties',        value: fmt(properties.total),                            sub: `${fmt(properties.available)} available · ${fmt(properties.occupied)} occupied`, color: BRAND.secondary, icon: <Building2 size={20} /> },
    { label: 'Active Leases',     value: fmt(leases.active),                              sub: `${fmt(leases.total)} total · ${fmt(leases.expired)} expired`,                  color: BRAND.accent,   icon: <FileText size={20} /> },
  ];

  const alerts = [
    users.pendingAgents > 0      && { level: 'warn',   icon: <Shield size={14} />,        msg: `${users.pendingAgents} agent${users.pendingAgents !== 1 ? 's' : ''} awaiting approval` },
    pendingApplications > 0      && { level: 'warn',   icon: <ClipboardList size={14} />, msg: `${pendingApplications} application${pendingApplications !== 1 ? 's' : ''} pending review` },
    urgentMaintenance > 0        && { level: 'danger', icon: <AlertTriangle size={14} />, msg: `${urgentMaintenance} urgent maintenance request${urgentMaintenance !== 1 ? 's' : ''} open` },
    payments.overdue > 0         && { level: 'danger', icon: <Wallet size={14} />,        msg: `${payments.overdue} overdue payment${payments.overdue !== 1 ? 's' : ''}` },
  ].filter(Boolean);

  const miniStats = [
    { label: 'Pending Payments', value: fmt(payments.pending),  color: '#D97706' },
    { label: 'Overdue Payments', value: fmt(payments.overdue),  color: BRAND.danger },
    { label: 'Open Maintenance', value: fmt(openMaintenance),   color: '#1D4ED8' },
    { label: 'Terminated Leases', value: fmt(leases.terminated), color: BRAND.muted },
  ];

  return (
    <div>
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {alerts.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
              borderRadius: 10, fontSize: 13, fontWeight: 500,
              background: a.level === 'danger' ? '#FEF2F2' : '#FFFBEB',
              border: `1px solid ${a.level === 'danger' ? '#FECACA' : '#FDE68A'}`,
              color: a.level === 'danger' ? '#991B1B' : '#92400E',
            }}>
              {a.icon}{a.msg}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14, marginBottom: 20 }}>
        {bigStats.map(s => (
          <Card key={s.label} style={{ padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
              <p style={{ fontSize: 13, color: BRAND.muted }}>{s.label}</p>
            </div>
            <p style={{ fontSize: 26, fontWeight: 800, color: BRAND.text, fontFamily: "'Syne',sans-serif", lineHeight: 1, marginBottom: 6 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: BRAND.muted }}>{s.sub}</p>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
        {miniStats.map(s => (
          <Card key={s.label} style={{ padding: '14px 18px' }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Syne',sans-serif", marginBottom: 4 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: BRAND.muted }}>{s.label}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── REVENUE tab ────────────────────────────────────────────────────── */
function MonthlyChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: BRAND.muted, fontSize: 13 }}>
        No transaction data yet
      </div>
    );
  }
  const maxFees = Math.max(...data.map(d => d.fees), 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, paddingBottom: 28, position: 'relative' }}>
      {data.map(d => {
        const pct = Math.max(3, (d.fees / maxFees) * 100);
        const monthLabel = d._id?.slice(5) || ''; // "01"–"12"
        return (
          <div key={d._id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div
              title={`${d._id} · Fees: ${fmtTZS(d.fees)} · Volume: ${fmtTZS(d.volume)} · ${d.count} payments`}
              style={{
                width: '100%', height: `${pct}%`, borderRadius: '4px 4px 0 0',
                background: `linear-gradient(to top, ${BRAND.primary}, ${BRAND.primary}bb)`,
                cursor: 'help', transition: 'opacity .15s, height .3s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            />
            <span style={{
              position: 'absolute', bottom: -22, fontSize: 9, color: BRAND.muted,
              transform: 'rotate(-35deg)', transformOrigin: 'top center', whiteSpace: 'nowrap',
            }}>{monthLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

function RevenueTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feeInput, setFeeInput] = useState('');
  const [savingFee, setSavingFee] = useState(false);
  const [settingsData, setSettingsData] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/revenue'),
      api.get('/admin/platform-settings'),
    ])
      .then(([rev, sett]) => {
        setData(rev.data.data);
        setSettingsData(sett.data.data);
        setFeeInput(String(sett.data.data.transactionFeeRate ?? 2.5));
      })
      .catch(() => toast.error('Failed to load revenue data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const saveFeeRate = async () => {
    const rate = parseFloat(feeInput);
    if (isNaN(rate) || rate < 0 || rate > 20) {
      toast.error('Fee rate must be between 0% and 20%');
      return;
    }
    setSavingFee(true);
    try {
      const r = await api.put('/admin/platform-settings', { transactionFeeRate: rate });
      setSettingsData(r.data.data);
      toast.success(`Fee rate updated to ${rate}%`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update fee rate');
    } finally { setSavingFee(false); }
  };

  if (loading) return <p style={{ color: BRAND.muted, padding: 24 }}>Loading revenue data…</p>;
  if (!data) return null;

  const { summary, monthly, topLandlords, recent } = data;

  const kpis = [
    { label: 'Total Earnings',      value: fmtTZS(summary.totalFees),        sub: `from ${fmt(summary.totalCount)} payments`, color: '#8B5CF6',      icon: <TrendingUp size={20} /> },
    { label: 'Gross Rent Volume',   value: fmtTZS(summary.totalVolume),       sub: 'total rent processed',                     color: BRAND.primary,  icon: <Banknote size={20} /> },
    { label: 'This Month Earnings', value: fmtTZS(summary.thisMonthFees),     sub: `from ${fmt(summary.thisMonthCount)} payments`, color: '#059669',  icon: <ArrowUpRight size={20} /> },
    { label: 'Active Fee Rate',     value: fmtPct(summary.feeRate),           sub: 'of each rent payment',                     color: '#D97706',      icon: <Percent size={20} /> },
  ];

  return (
    <div>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 14, marginBottom: 20 }}>
        {kpis.map(s => (
          <Card key={s.label} style={{ padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
              <p style={{ fontSize: 13, color: BRAND.muted }}>{s.label}</p>
            </div>
            <p style={{ fontSize: 26, fontWeight: 800, color: BRAND.text, fontFamily: "'Syne',sans-serif", lineHeight: 1, marginBottom: 5 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: BRAND.muted }}>{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Chart + Fee settings */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 14, marginBottom: 20 }}>

        {/* Monthly earnings chart */}
        <Card style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart2 size={15} color={BRAND.muted} />
              <p style={{ fontSize: 14, fontWeight: 700, color: BRAND.text }}>Monthly Platform Earnings</p>
            </div>
            <p style={{ fontSize: 12, color: BRAND.muted }}>Last 12 months</p>
          </div>
          <MonthlyChart data={monthly} />
          <p style={{ fontSize: 11, color: BRAND.muted, marginTop: 8, textAlign: 'center' }}>Hover each bar for details</p>
        </Card>

        {/* Fee rate settings */}
        <Card style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Settings size={15} color={BRAND.muted} />
            <p style={{ fontSize: 14, fontWeight: 700, color: BRAND.text }}>Transaction Fee Rate</p>
          </div>
          <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: '#5B21B6', lineHeight: 1.6 }}>
              This percentage is deducted from every rent payment as platform revenue.
              The landlord receives the remainder. <strong>Changes apply to new payments only.</strong>
            </p>
          </div>
          <p style={{ fontSize: 11, fontWeight: 700, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Fee Rate (0–20%)</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="number" step="0.1" min="0" max="20"
                value={feeInput}
                onChange={e => setFeeInput(e.target.value)}
                style={{ width: '100%', padding: '10px 36px 10px 12px', borderRadius: 8, border: `1.5px solid ${BRAND.border}`, fontSize: 15, fontWeight: 700, color: BRAND.text, background: BRAND.surface, outline: 'none', boxSizing: 'border-box' }}
              />
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 700, color: BRAND.muted }}>%</span>
            </div>
            <button onClick={saveFeeRate} disabled={savingFee} style={{
              padding: '10px 18px', borderRadius: 8, background: BRAND.primary, color: '#fff',
              fontWeight: 700, fontSize: 13, border: 'none', cursor: savingFee ? 'not-allowed' : 'pointer',
              opacity: savingFee ? 0.7 : 1, whiteSpace: 'nowrap',
            }}>
              {savingFee ? 'Saving…' : 'Save'}
            </button>
          </div>
          {settingsData?.updatedBy && (
            <p style={{ fontSize: 11, color: BRAND.muted }}>
              Last updated by <strong>{settingsData.updatedBy.name}</strong> on {fmtDate(settingsData.updatedAt)}
            </p>
          )}
          <div style={{ marginTop: 14, padding: '12px 14px', background: BRAND.bg, borderRadius: 9, border: `1px solid ${BRAND.border}` }}>
            <p style={{ fontSize: 12, color: BRAND.muted, lineHeight: 1.6 }}>
              <strong>Example:</strong> Rent of TZS 500,000 at {fmtPct(parseFloat(feeInput) || 0)} → platform earns <strong style={{ color: '#8B5CF6' }}>{fmtTZS(Math.round(500000 * (parseFloat(feeInput) || 0) / 100))}</strong>, landlord receives <strong>{fmtTZS(500000 - Math.round(500000 * (parseFloat(feeInput) || 0) / 100))}</strong>.
            </p>
          </div>
        </Card>
      </div>

      {/* Top landlords + recent transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 14, marginBottom: 0 }}>

        {/* Top landlords by volume */}
        <Card>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BRAND.border}` }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: BRAND.text }}>Top Landlords by Volume</p>
            <p style={{ fontSize: 12, color: BRAND.muted, marginTop: 2 }}>Generating most platform revenue</p>
          </div>
          {topLandlords.length === 0 ? (
            <p style={{ padding: '20px 18px', color: BRAND.muted, fontSize: 13 }}>No paid transactions yet.</p>
          ) : topLandlords.map((l, i) => (
            <div key={l._id} style={{ ...ROW_STYLE(i, topLandlords.length), justifyContent: 'space-between' }}
              onMouseEnter={e => e.currentTarget.style.background = BRAND.bg}
              onMouseLeave={e => e.currentTarget.style.background = ''}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: BRAND.primary + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: BRAND.primary, flexShrink: 0 }}>{i + 1}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.landlord?.name || 'Unknown'}</p>
                  <p style={{ fontSize: 11, color: BRAND.muted }}>{l.count} payments</p>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: BRAND.text }}>{fmtTZS(l.volume)}</p>
                <p style={{ fontSize: 11, color: '#8B5CF6', fontWeight: 600 }}>+{fmtTZS(l.fees)} fees</p>
              </div>
            </div>
          ))}
        </Card>

        {/* Recent fee-generating transactions */}
        <Card>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BRAND.border}` }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: BRAND.text }}>Recent Transactions</p>
            <p style={{ fontSize: 12, color: BRAND.muted, marginTop: 2 }}>Last 15 paid rent payments</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                  {['Tenant', 'Amount', 'Fee', 'Period', 'Method'].map(h => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 600, color: BRAND.muted, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: BRAND.muted }}>No paid transactions yet.</td></tr>
                ) : recent.map((p, i) => (
                  <tr key={p._id} style={{ borderBottom: i < recent.length - 1 ? `1px solid ${BRAND.border}` : 'none', transition: 'background .12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = BRAND.bg}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '9px 12px' }}>
                      <p style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{p.tenant?.name || '—'}</p>
                      <p style={{ fontSize: 10, color: BRAND.muted }}>{p.property?.title}</p>
                    </td>
                    <td style={{ padding: '9px 12px', fontWeight: 700, color: BRAND.text, whiteSpace: 'nowrap' }}>{fmtTZS(p.amount)}</td>
                    <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                      {p.platformFee > 0 ? (
                        <span style={{ fontWeight: 700, color: '#8B5CF6' }}>{fmtTZS(p.platformFee)}</span>
                      ) : <span style={{ color: BRAND.muted }}>—</span>}
                    </td>
                    <td style={{ padding: '9px 12px', color: BRAND.muted }}>{p.period || '—'}</td>
                    <td style={{ padding: '9px 12px' }}>
                      {p.paymentMethod
                        ? <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: '#DBEAFE', color: '#1D4ED8' }}>{METHOD_LABELS[p.paymentMethod] || p.paymentMethod}</span>
                        : <span style={{ color: BRAND.muted }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ─── USERS tab ──────────────────────────────────────────────────────── */
const ROLE_COLORS = {
  tenant: { bg: '#DBEAFE', text: '#1D4ED8' },
  landlord: { bg: '#D1FAE5', text: '#065F46' },
  agent: { bg: '#FEF3C7', text: '#92400E' },
  admin: { bg: '#EDE9FE', text: '#6D28D9' },
};

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: LIMIT };
    if (roleFilter) params.role = roleFilter;
    if (search) params.search = search;
    api.get('/admin/users', { params })
      .then(r => { setUsers(r.data.data); setTotal(r.data.total); })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, [page, roleFilter, search]);

  useEffect(() => { load(); }, [load]);

  const approveAgent = async (id) => {
    try {
      await api.put(`/admin/users/${id}/approve`);
      toast.success('Agent approved');
      setUsers(u => u.map(x => x._id === id ? { ...x, isApproved: true } : x));
    } catch { toast.error('Failed'); }
  };

  const toggleUser = async (id) => {
    try {
      const r = await api.put(`/admin/users/${id}/toggle`);
      toast.success(r.data.data.isVerified ? 'User restored' : 'User suspended');
      setUsers(u => u.map(x => x._id === id ? { ...x, isVerified: r.data.data.isVerified } : x));
    } catch { toast.error('Failed'); }
  };

  const ROLE_FILTERS = ['', 'tenant', 'landlord', 'agent', 'admin'];

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: BRAND.muted, pointerEvents: 'none' }} />
          <input
            value={searchInput} onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
            placeholder="Search name or email… (Enter)"
            style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 8, border: `1px solid ${BRAND.border}`, fontSize: 13, background: BRAND.surface, color: BRAND.text, boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ROLE_FILTERS.map(f => (
            <Pill key={f || 'all'} label={f ? f.charAt(0).toUpperCase() + f.slice(1) : 'All'} active={roleFilter === f} onClick={() => { setRoleFilter(f); setPage(1); }} />
          ))}
        </div>
        <button onClick={load} style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${BRAND.border}`, background: BRAND.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', color: BRAND.muted }}>
          <RefreshCw size={14} />
        </button>
      </div>

      <Card>
        {loading ? <p style={{ padding: 24, color: BRAND.muted }}>Loading…</p>
          : users.length === 0 ? <p style={{ padding: 24, color: BRAND.muted, textAlign: 'center' }}>No users found.</p>
          : users.map((u, i) => {
            const rc = ROLE_COLORS[u.role] || ROLE_COLORS.tenant;
            return (
              <div key={u._id} style={ROW_STYLE(i, users.length)}
                onMouseEnter={e => e.currentTarget.style.background = BRAND.bg}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: BRAND.primary + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: BRAND.primary, fontSize: 14, flexShrink: 0, fontFamily: "'Syne',sans-serif" }}>
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</p>
                  <p style={{ fontSize: 12, color: BRAND.muted, marginTop: 1 }}>{u.email} · Joined {fmtDate(u.createdAt)}</p>
                  {u.agencyName && <p style={{ fontSize: 11, color: BRAND.muted }}>{u.agencyName}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: rc.bg, color: rc.text, textTransform: 'capitalize' }}>{u.role}</span>
                  {!u.isVerified && <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#FEE2E2', color: '#991B1B' }}>Suspended</span>}
                  {u.role === 'agent' && u.isApproved && (
                    <span style={{ fontSize: 12, color: BRAND.secondary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><CheckCircle size={12} />Approved</span>
                  )}
                  {u.role === 'agent' && !u.isApproved && (
                    <button onClick={() => approveAgent(u._id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', borderRadius: 7, background: BRAND.secondary, color: '#fff', fontWeight: 600, fontSize: 12, border: 'none', cursor: 'pointer' }}>
                      <CheckCircle size={12} />Approve
                    </button>
                  )}
                  <button onClick={() => toggleUser(u._id)}
                    title={u.isVerified ? 'Suspend user' : 'Restore user'}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', borderRadius: 7, background: u.isVerified ? '#FEF2F2' : '#F0FDF4', color: u.isVerified ? BRAND.danger : BRAND.success, fontWeight: 600, fontSize: 12, border: `1px solid ${u.isVerified ? '#FECACA' : '#BBF7D0'}`, cursor: 'pointer' }}>
                    {u.isVerified ? <><Ban size={12} />Suspend</> : <><UserCheck size={12} />Restore</>}
                  </button>
                </div>
              </div>
            );
          })}
        <Paginator page={page} total={total} limit={LIMIT} onChange={p => setPage(p)} />
      </Card>
    </div>
  );
}

/* ─── PAYMENTS tab ───────────────────────────────────────────────────── */
function PaymentsTab() {
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: LIMIT };
    if (statusFilter) params.status = statusFilter;
    if (methodFilter) params.method = methodFilter;
    api.get('/admin/payments', { params })
      .then(r => { setPayments(r.data.data); setTotal(r.data.total); })
      .catch(() => toast.error('Failed to load payments'))
      .finally(() => setLoading(false));
  }, [page, statusFilter, methodFilter]);

  useEffect(() => { load(); }, [load]);

  const STATUS_FILTERS = ['', 'pending', 'paid', 'overdue', 'waived'];
  const METHOD_FILTERS = ['', 'mpesa', 'airtel', 'bank', 'cash', 'card'];

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          <span style={{ fontSize: 12, color: BRAND.muted, alignSelf: 'center', marginRight: 2 }}>Status:</span>
          {STATUS_FILTERS.map(f => <Pill key={f || 'all'} label={f || 'All'} active={statusFilter === f} onClick={() => { setStatusFilter(f); setPage(1); }} />)}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: BRAND.muted, alignSelf: 'center', marginRight: 2 }}>Method:</span>
          {METHOD_FILTERS.map(f => <Pill key={f || 'all'} label={f ? (METHOD_LABELS[f] || f) : 'All'} active={methodFilter === f} onClick={() => { setMethodFilter(f); setPage(1); }} />)}
        </div>
        <button onClick={load} style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${BRAND.border}`, background: BRAND.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', color: BRAND.muted }}>
          <RefreshCw size={14} />
        </button>
      </div>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                {['Tenant', 'Property', 'Amount', 'Fee', 'Period', 'Due Date', 'Paid Date', 'Method', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: BRAND.muted, fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: BRAND.muted }}>Loading…</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: BRAND.muted }}>No payments found.</td></tr>
              ) : payments.map((p, i) => (
                <tr key={p._id} style={{ borderBottom: i < payments.length - 1 ? `1px solid ${BRAND.border}` : 'none', transition: 'background .12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = BRAND.bg}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                    <p style={{ fontWeight: 600 }}>{p.tenant?.name || '—'}</p>
                    <p style={{ fontSize: 11, color: BRAND.muted }}>{p.tenant?.email}</p>
                  </td>
                  <td style={{ padding: '11px 14px', color: BRAND.muted, fontSize: 12 }}>{p.property?.title || '—'}</td>
                  <td style={{ padding: '11px 14px', fontWeight: 700, color: BRAND.text, whiteSpace: 'nowrap' }}>{fmtTZS(p.amount)}</td>
                  <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                    {p.platformFee > 0
                      ? <span style={{ fontWeight: 600, color: '#8B5CF6' }}>{fmtTZS(p.platformFee)}</span>
                      : <span style={{ color: BRAND.muted }}>—</span>}
                  </td>
                  <td style={{ padding: '11px 14px', color: BRAND.muted, fontSize: 12 }}>{p.period || '—'}</td>
                  <td style={{ padding: '11px 14px', color: BRAND.muted, fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(p.dueDate)}</td>
                  <td style={{ padding: '11px 14px', color: BRAND.muted, fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(p.paidDate)}</td>
                  <td style={{ padding: '11px 14px' }}>
                    {p.paymentMethod
                      ? <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#DBEAFE', color: '#1D4ED8' }}>{METHOD_LABELS[p.paymentMethod] || p.paymentMethod}</span>
                      : <span style={{ color: BRAND.muted }}>—</span>}
                  </td>
                  <td style={{ padding: '11px 14px' }}><Badge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Paginator page={page} total={total} limit={LIMIT} onChange={p => setPage(p)} />
      </Card>
    </div>
  );
}

/* ─── PROPERTIES tab ─────────────────────────────────────────────────── */
function PropertiesTab() {
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: LIMIT };
    if (statusFilter) params.status = statusFilter;
    if (typeFilter) params.type = typeFilter;
    api.get('/admin/properties', { params })
      .then(r => { setProperties(r.data.data); setTotal(r.data.total); })
      .catch(() => toast.error('Failed to load properties'))
      .finally(() => setLoading(false));
  }, [page, statusFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const toggleFeatured = async (id) => {
    try {
      const r = await api.put(`/admin/properties/${id}/featured`);
      setProperties(ps => ps.map(p => p._id === id ? { ...p, featured: r.data.data.featured } : p));
      toast.success(r.data.data.featured ? 'Marked as featured' : 'Removed from featured');
    } catch { toast.error('Failed'); }
  };

  const STATUS_FILTERS = ['', 'available', 'occupied', 'unavailable'];
  const TYPE_FILTERS = ['', 'apartment', 'house', 'studio', 'villa', 'room', 'commercial'];

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          <span style={{ fontSize: 12, color: BRAND.muted, alignSelf: 'center' }}>Status:</span>
          {STATUS_FILTERS.map(f => <Pill key={f || 'all'} label={f || 'All'} active={statusFilter === f} onClick={() => { setStatusFilter(f); setPage(1); }} />)}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: BRAND.muted, alignSelf: 'center' }}>Type:</span>
          {TYPE_FILTERS.map(f => <Pill key={f || 'all'} label={f ? f.charAt(0).toUpperCase() + f.slice(1) : 'All'} active={typeFilter === f} onClick={() => { setTypeFilter(f); setPage(1); }} />)}
        </div>
        <button onClick={load} style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${BRAND.border}`, background: BRAND.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', color: BRAND.muted }}>
          <RefreshCw size={14} />
        </button>
      </div>

      <Card>
        {loading ? <p style={{ padding: 24, color: BRAND.muted }}>Loading…</p>
          : properties.length === 0 ? <p style={{ padding: 24, textAlign: 'center', color: BRAND.muted }}>No properties found.</p>
          : properties.map((p, i) => (
            <div key={p._id} style={{ ...ROW_STYLE(i, properties.length), justifyContent: 'space-between' }}
              onMouseEnter={e => e.currentTarget.style.background = BRAND.bg}
              onMouseLeave={e => e.currentTarget.style.background = ''}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                {p.images?.[0]
                  ? <img src={p.images[0]} alt="" style={{ width: 52, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 52, height: 44, borderRadius: 8, background: BRAND.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Building2 size={18} color={BRAND.muted} /></div>}
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                  <p style={{ fontSize: 12, color: BRAND.muted, marginTop: 1 }}>{p.address?.city} · {p.type} · {p.bedrooms}bd</p>
                  <p style={{ fontSize: 12, color: BRAND.muted }}>{p.landlord?.name}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: BRAND.text, whiteSpace: 'nowrap' }}>{fmtTZS(p.rent?.amount)}<span style={{ fontWeight: 400, color: BRAND.muted, fontSize: 11 }}>/mo</span></p>
                <Badge status={p.status} />
                <button onClick={() => toggleFeatured(p._id)}
                  title={p.featured ? 'Remove from featured' : 'Mark as featured'}
                  style={{ padding: '5px 10px', borderRadius: 7, border: `1px solid ${p.featured ? '#FDE68A' : BRAND.border}`, background: p.featured ? '#FFFBEB' : BRAND.surface, color: p.featured ? '#D97706' : BRAND.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500 }}>
                  {p.featured ? <><Star size={12} fill="#D97706" />Featured</> : <><StarOff size={12} />Feature</>}
                </button>
              </div>
            </div>
          ))}
        <Paginator page={page} total={total} limit={LIMIT} onChange={p => setPage(p)} />
      </Card>
    </div>
  );
}

/* ─── LEASES tab ─────────────────────────────────────────────────────── */
function LeasesTab() {
  const [leases, setLeases] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: LIMIT };
    if (statusFilter) params.status = statusFilter;
    api.get('/admin/leases', { params })
      .then(r => { setLeases(r.data.data); setTotal(r.data.total); })
      .catch(() => toast.error('Failed to load leases'))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const STATUS_FILTERS = ['', 'active', 'expired', 'terminated'];

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {STATUS_FILTERS.map(f => <Pill key={f || 'all'} label={f ? f.charAt(0).toUpperCase() + f.slice(1) : 'All'} active={statusFilter === f} onClick={() => { setStatusFilter(f); setPage(1); }} />)}
        <button onClick={load} style={{ marginLeft: 'auto', padding: '7px 10px', borderRadius: 8, border: `1px solid ${BRAND.border}`, background: BRAND.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', color: BRAND.muted }}>
          <RefreshCw size={14} />
        </button>
      </div>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                {['Tenant', 'Property', 'Landlord', 'Start', 'End', 'Rent/mo', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: BRAND.muted, fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: BRAND.muted }}>Loading…</td></tr>
              ) : leases.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: BRAND.muted }}>No leases found.</td></tr>
              ) : leases.map((l, i) => (
                <tr key={l._id} style={{ borderBottom: i < leases.length - 1 ? `1px solid ${BRAND.border}` : 'none', transition: 'background .12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = BRAND.bg}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                    <p style={{ fontWeight: 600 }}>{l.tenant?.name || '—'}</p>
                    <p style={{ fontSize: 11, color: BRAND.muted }}>{l.tenant?.email}</p>
                  </td>
                  <td style={{ padding: '11px 14px', color: BRAND.muted, fontSize: 12 }}>{l.property?.title || '—'}<br /><span style={{ fontSize: 11 }}>{l.property?.address?.city}</span></td>
                  <td style={{ padding: '11px 14px', color: BRAND.muted, fontSize: 12 }}>{l.landlord?.name || '—'}</td>
                  <td style={{ padding: '11px 14px', color: BRAND.muted, fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(l.startDate)}</td>
                  <td style={{ padding: '11px 14px', color: BRAND.muted, fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(l.endDate)}</td>
                  <td style={{ padding: '11px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>{fmtTZS(l.rentAmount)}</td>
                  <td style={{ padding: '11px 14px' }}><Badge status={l.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Paginator page={page} total={total} limit={LIMIT} onChange={p => setPage(p)} />
      </Card>
    </div>
  );
}

/* ─── APPLICATIONS tab ───────────────────────────────────────────────── */
function ApplicationsTab() {
  const [apps, setApps] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: LIMIT };
    if (statusFilter) params.status = statusFilter;
    api.get('/admin/applications', { params })
      .then(r => { setApps(r.data.data); setTotal(r.data.total); })
      .catch(() => toast.error('Failed to load applications'))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const STATUS_FILTERS = ['', 'pending', 'approved', 'rejected'];

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {STATUS_FILTERS.map(f => <Pill key={f || 'all'} label={f ? f.charAt(0).toUpperCase() + f.slice(1) : 'All'} active={statusFilter === f} onClick={() => { setStatusFilter(f); setPage(1); }} />)}
        <button onClick={load} style={{ marginLeft: 'auto', padding: '7px 10px', borderRadius: 8, border: `1px solid ${BRAND.border}`, background: BRAND.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', color: BRAND.muted }}>
          <RefreshCw size={14} />
        </button>
      </div>

      <Card>
        {loading ? <p style={{ padding: 24, color: BRAND.muted }}>Loading…</p>
          : apps.length === 0 ? <p style={{ padding: 24, textAlign: 'center', color: BRAND.muted }}>No applications found.</p>
          : apps.map((a, i) => (
            <div key={a._id} style={{ ...ROW_STYLE(i, apps.length), justifyContent: 'space-between' }}
              onMouseEnter={e => e.currentTarget.style.background = BRAND.bg}
              onMouseLeave={e => e.currentTarget.style.background = ''}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{a.tenant?.name || '—'}</p>
                <p style={{ fontSize: 12, color: BRAND.muted, marginTop: 1 }}>{a.tenant?.email} · Applied {fmtDate(a.createdAt)}</p>
              </div>
              <div style={{ flex: 1, minWidth: 0, padding: '0 12px' }}>
                <p style={{ fontWeight: 500, fontSize: 13 }}>{a.property?.title || '—'}</p>
                <p style={{ fontSize: 12, color: BRAND.muted }}>{fmtTZS(a.property?.rent?.amount)}/mo · Move-in {fmtDate(a.moveInDate)}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {a.employmentStatus && <span style={{ fontSize: 12, color: BRAND.muted, textTransform: 'capitalize' }}>{a.employmentStatus}</span>}
                {a.monthlyIncome && <span style={{ fontSize: 12, color: BRAND.muted }}>{fmtTZS(a.monthlyIncome)}/mo</span>}
                <Badge status={a.status} />
              </div>
            </div>
          ))}
        <Paginator page={page} total={total} limit={LIMIT} onChange={p => setPage(p)} />
      </Card>
    </div>
  );
}

/* ─── MAINTENANCE tab ────────────────────────────────────────────────── */
const PRIORITY_COLORS = {
  low: { bg: '#F1F5F9', text: '#475569' },
  medium: { bg: '#FEF3C7', text: '#92400E' },
  high: { bg: '#FEE2E2', text: '#991B1B' },
  urgent: { bg: '#7F1D1D', text: '#FECACA' },
};

function MaintenanceTab() {
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: LIMIT };
    if (statusFilter) params.status = statusFilter;
    if (priorityFilter) params.priority = priorityFilter;
    api.get('/admin/maintenance', { params })
      .then(r => { setRequests(r.data.data); setTotal(r.data.total); })
      .catch(() => toast.error('Failed to load maintenance requests'))
      .finally(() => setLoading(false));
  }, [page, statusFilter, priorityFilter]);

  useEffect(() => { load(); }, [load]);

  const STATUS_FILTERS = ['', 'open', 'in_progress', 'resolved', 'closed'];
  const PRIORITY_FILTERS = ['', 'urgent', 'high', 'medium', 'low'];

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          <span style={{ fontSize: 12, color: BRAND.muted, alignSelf: 'center' }}>Status:</span>
          {STATUS_FILTERS.map(f => <Pill key={f || 'all'} label={f ? f.replace('_', ' ') : 'All'} active={statusFilter === f} onClick={() => { setStatusFilter(f); setPage(1); }} />)}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: BRAND.muted, alignSelf: 'center' }}>Priority:</span>
          {PRIORITY_FILTERS.map(f => <Pill key={f || 'all'} label={f ? f.charAt(0).toUpperCase() + f.slice(1) : 'All'} active={priorityFilter === f} onClick={() => { setPriorityFilter(f); setPage(1); }} />)}
        </div>
        <button onClick={load} style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${BRAND.border}`, background: BRAND.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', color: BRAND.muted }}>
          <RefreshCw size={14} />
        </button>
      </div>

      <Card>
        {loading ? <p style={{ padding: 24, color: BRAND.muted }}>Loading…</p>
          : requests.length === 0 ? <p style={{ padding: 24, textAlign: 'center', color: BRAND.muted }}>No maintenance requests found.</p>
          : requests.map((r, i) => {
            const pc = PRIORITY_COLORS[r.priority] || PRIORITY_COLORS.medium;
            return (
              <div key={r._id} style={{ ...ROW_STYLE(i, requests.length), justifyContent: 'space-between' }}
                onMouseEnter={e => e.currentTarget.style.background = BRAND.bg}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{r.title}</p>
                  <p style={{ fontSize: 12, color: BRAND.muted, marginTop: 1 }}>{r.property?.title || '—'} · {r.category}</p>
                  <p style={{ fontSize: 12, color: BRAND.muted }}>Tenant: {r.tenant?.name}</p>
                </div>
                <div style={{ fontSize: 12, color: BRAND.muted, padding: '0 12px', flexShrink: 0 }}>
                  {fmtDate(r.createdAt)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: pc.bg, color: pc.text, textTransform: 'capitalize' }}>{r.priority}</span>
                  <Badge status={r.status} />
                </div>
              </div>
            );
          })}
        <Paginator page={page} total={total} limit={LIMIT} onChange={p => setPage(p)} />
      </Card>
    </div>
  );
}

/* ─── ROOT COMPONENT ─────────────────────────────────────────────────── */
const TABS = [
  { id: 'overview',     label: 'Overview',     icon: <LayoutDashboard size={15} /> },
  { id: 'revenue',      label: 'Revenue',      icon: <TrendingUp size={15} /> },
  { id: 'users',        label: 'Users',        icon: <Users size={15} /> },
  { id: 'payments',     label: 'Payments',     icon: <Wallet size={15} /> },
  { id: 'properties',   label: 'Properties',   icon: <Building2 size={15} /> },
  { id: 'leases',       label: 'Leases',       icon: <FileText size={15} /> },
  { id: 'applications', label: 'Applications', icon: <ClipboardList size={15} /> },
  { id: 'maintenance',  label: 'Maintenance',  icon: <Wrench size={15} /> },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');

  const CONTENT = {
    overview:     <OverviewTab />,
    revenue:      <RevenueTab />,
    users:        <UsersTab />,
    payments:     <PaymentsTab />,
    properties:   <PropertiesTab />,
    leases:       <LeasesTab />,
    applications: <ApplicationsTab />,
    maintenance:  <MaintenanceTab />,
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Syne',sans-serif", color: BRAND.text }}>Admin Dashboard</h1>
        <p style={{ fontSize: 13, color: BRAND.muted, marginTop: 3 }}>Full platform oversight — revenue, users, payments, properties, leases, applications, and maintenance.</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, overflowX: 'auto', marginBottom: 22, background: BRAND.surface, borderRadius: BRAND.radius, border: `1px solid ${BRAND.border}`, padding: 4, boxShadow: BRAND.shadow }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
            borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            whiteSpace: 'nowrap', transition: 'all .15s',
            background: tab === t.id ? BRAND.primary : 'transparent',
            color: tab === t.id ? '#fff' : BRAND.muted,
          }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {CONTENT[tab]}
    </div>
  );
}
