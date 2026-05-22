import { useState, useEffect } from 'react';
import { Phone, Mail, Calendar, AlertTriangle, X } from 'lucide-react';
import { BRAND } from '../../theme';
import { toast } from '../../components/Toast';
import api from '../../services/api';

export default function Tenants() {
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [terminatingId, setTerminatingId] = useState(null);
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    api.get('/leases/landlord')
      .then(r => setLeases(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const startTerminate = (id) => { setTerminatingId(id); setReason(''); };
  const cancelTerminate = () => { setTerminatingId(null); setReason(''); };

  const confirmTerminate = async () => {
    if (!reason.trim()) { toast.error('Please enter a reason for termination'); return; }
    setProcessing(true);
    try {
      await api.put(`/leases/${terminatingId}/terminate`, { reason });
      toast.success('Lease terminated');
      setLeases(l => l.map(x => x._id === terminatingId ? { ...x, status: 'terminated' } : x));
      cancelTerminate();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to terminate'); }
    setProcessing(false);
  };

  const active = leases.filter(l => l.status === 'active');
  const past = leases.filter(l => l.status !== 'active');

  const avatar = (name, size = 44) => (
    <div style={{ width: size, height: size, borderRadius: '50%', background: BRAND.primary + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: BRAND.primary, fontSize: size * 0.36, flexShrink: 0, fontFamily: "'Syne', sans-serif" }}>
      {name?.[0]?.toUpperCase()}
    </div>
  );

  const LeaseRow = ({ lease }) => {
    const isTerminating = terminatingId === lease._id;
    return (
      <div style={{ background: BRAND.surface, borderRadius: BRAND.radius, border: `1px solid ${BRAND.border}`, overflow: 'hidden', transition: 'box-shadow .2s' }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = BRAND.shadowMd}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {avatar(lease.tenant?.name)}
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{lease.tenant?.name}</p>
              <p style={{ fontSize: 12, color: BRAND.muted, marginBottom: 4 }}>{lease.property?.title}</p>
              <div style={{ display: 'flex', gap: 14, fontSize: 12, color: BRAND.muted, flexWrap: 'wrap' }}>
                {lease.tenant?.email && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Mail size={11} />{lease.tenant.email}</span>}
                {lease.tenant?.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Phone size={11} />{lease.tenant.phone}</span>}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontSize: 12, color: BRAND.muted, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginBottom: 4 }}>
              <Calendar size={12} />{new Date(lease.startDate).toLocaleDateString()} — {new Date(lease.endDate).toLocaleDateString()}
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, color: BRAND.primary, marginBottom: lease.status === 'active' ? 8 : 0 }}>
              TZS {lease.rentAmount?.toLocaleString()}<span style={{ fontSize: 12, fontWeight: 400, color: BRAND.muted }}>/mo</span>
            </p>
            {lease.status === 'active' && !isTerminating && (
              <button onClick={() => startTerminate(lease._id)}
                style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, background: '#FEF2F2', border: `1px solid #FECACA`, color: '#DC2626', fontWeight: 600, cursor: 'pointer', transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}>
                Terminate Lease
              </button>
            )}
          </div>
        </div>

        {/* Inline termination form */}
        {isTerminating && (
          <div style={{ padding: '14px 20px', borderTop: `1px solid #FECACA`, background: '#FEF2F2' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
              <AlertTriangle size={16} color="#DC2626" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: '#DC2626', fontWeight: 500 }}>This will immediately terminate the lease. This action cannot be undone.</p>
            </div>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Reason for termination (required)…"
              rows={2}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid #FECACA`, fontSize: 13, outline: 'none', resize: 'vertical', background: '#fff', boxSizing: 'border-box', marginBottom: 10 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={confirmTerminate} disabled={processing}
                style={{ padding: '8px 16px', borderRadius: 8, background: '#DC2626', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: processing ? 0.7 : 1, border: 'none', transition: 'opacity .15s' }}>
                {processing ? 'Terminating…' : 'Confirm Termination'}
              </button>
              <button onClick={cancelTerminate}
                style={{ padding: '8px 14px', borderRadius: 8, background: '#fff', border: `1px solid #FECACA`, fontSize: 13, color: BRAND.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <X size={13} />Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const Section = ({ title, items, dim }) => (
    <>
      <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: dim ? BRAND.muted : BRAND.text, textTransform: 'uppercase', letterSpacing: '.5px' }}>
        {title} <span style={{ fontWeight: 400, color: BRAND.muted }}>({items.length})</span>
      </h2>
      {items.length === 0
        ? <p style={{ color: BRAND.muted, fontSize: 14, marginBottom: 24 }}>None.</p>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32, opacity: dim ? 0.65 : 1 }}>
            {items.map(l => <LeaseRow key={l._id} lease={l} />)}
          </div>
      }
    </>
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, fontFamily: "'Syne', sans-serif" }}>Tenants</h1>
      {loading
        ? <p style={{ color: BRAND.muted, textAlign: 'center', padding: 40 }}>Loading…</p>
        : <>
            <Section title="Active" items={active} dim={false} />
            {past.length > 0 && <Section title="Past Tenants" items={past} dim={true} />}
          </>
      }
    </div>
  );
}
