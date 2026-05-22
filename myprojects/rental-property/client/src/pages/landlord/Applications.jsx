import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { BRAND, STATUS_COLORS } from '../../theme';
import { toast } from '../../components/Toast';
import api from '../../services/api';

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  // Per-application lease dates: { [appId]: { startDate, endDate } }
  const [leaseForms, setLeaseForms] = useState({});
  // Per-application rejection flow: null | appId
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(null);

  const load = () =>
    api.get('/applications/received')
      .then(r => setApplications(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const getLeaseForm = (id) => leaseForms[id] || { startDate: '', endDate: '' };
  const setLeaseField = (id, key, val) =>
    setLeaseForms(f => ({ ...f, [id]: { ...getLeaseForm(id), [key]: val } }));

  const approve = async (id) => {
    const form = getLeaseForm(id);
    if (!form.startDate || !form.endDate) {
      toast.error('Please set both lease start and end dates');
      return;
    }
    setProcessing(id);
    try {
      await api.put(`/applications/${id}/approve`, form);
      toast.success('Application approved — lease created');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setProcessing(null);
  };

  const startReject = (id) => { setRejectingId(id); setRejectReason(''); };
  const cancelReject = () => { setRejectingId(null); setRejectReason(''); };

  const confirmReject = async (id) => {
    setProcessing(id);
    try {
      await api.put(`/applications/${id}/reject`, { reason: rejectReason });
      toast.success('Application rejected');
      setRejectingId(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setProcessing(null);
  };

  const s = STATUS_COLORS;
  const btn = { padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'opacity .15s' };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, fontFamily: "'Syne', sans-serif" }}>Received Applications</h1>
      <p style={{ color: BRAND.muted, fontSize: 14, marginBottom: 24 }}>{applications.length} total</p>

      {loading
        ? <p style={{ color: BRAND.muted, textAlign: 'center', padding: 40 }}>Loading…</p>
        : applications.length === 0
          ? <p style={{ color: BRAND.muted, textAlign: 'center', padding: 40 }}>No applications yet.</p>
          : applications.map(app => {
            const leaseForm = getLeaseForm(app._id);
            const isRejecting = rejectingId === app._id;
            return (
              <div key={app._id} style={{ background: BRAND.surface, borderRadius: BRAND.radius, border: `1px solid ${BRAND.border}`, marginBottom: 10, overflow: 'hidden', transition: 'box-shadow .2s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = BRAND.shadowMd}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                {/* Header row */}
                <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setExpanded(expanded === app._id ? null : app._id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: BRAND.primary + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: BRAND.primary, fontSize: 15, fontFamily: "'Syne', sans-serif", flexShrink: 0 }}>
                      {app.tenant?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{app.tenant?.name}</p>
                      <p style={{ fontSize: 12, color: BRAND.muted }}>{app.property?.title} · {new Date(app.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s[app.status]?.bg, color: s[app.status]?.text, textTransform: 'capitalize' }}>{app.status}</span>
                    {expanded === app._id ? <ChevronUp size={16} color={BRAND.muted} /> : <ChevronDown size={16} color={BRAND.muted} />}
                  </div>
                </div>

                {/* Expanded body */}
                {expanded === app._id && (
                  <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${BRAND.border}` }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14, fontSize: 13 }}>
                      <p><span style={{ color: BRAND.muted }}>Email: </span>{app.tenant?.email}</p>
                      <p><span style={{ color: BRAND.muted }}>Phone: </span>{app.tenant?.phone || '—'}</p>
                      <p><span style={{ color: BRAND.muted }}>Employment: </span>{app.employmentStatus || '—'}</p>
                      <p><span style={{ color: BRAND.muted }}>Monthly Income: </span>{app.monthlyIncome ? `TZS ${app.monthlyIncome.toLocaleString()}` : '—'}</p>
                      {app.moveInDate && <p><span style={{ color: BRAND.muted }}>Move-in: </span>{new Date(app.moveInDate).toLocaleDateString()}</p>}
                      {app.message && <p style={{ gridColumn: '1/-1' }}><span style={{ color: BRAND.muted }}>Message: </span>{app.message}</p>}
                    </div>

                    {app.status === 'pending' && !isRejecting && (
                      <div style={{ marginTop: 16 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: BRAND.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>Set Lease Dates</p>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                          <div>
                            <label style={{ fontSize: 11, color: BRAND.muted, display: 'block', marginBottom: 3 }}>Start Date</label>
                            <input type="date" value={leaseForm.startDate}
                              onChange={e => setLeaseField(app._id, 'startDate', e.target.value)}
                              style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${BRAND.border}`, fontSize: 13, outline: 'none', cursor: 'pointer' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: BRAND.muted, display: 'block', marginBottom: 3 }}>End Date</label>
                            <input type="date" value={leaseForm.endDate}
                              onChange={e => setLeaseField(app._id, 'endDate', e.target.value)}
                              style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${BRAND.border}`, fontSize: 13, outline: 'none', cursor: 'pointer' }} />
                          </div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                            <button onClick={() => approve(app._id)} disabled={processing === app._id}
                              style={{ ...btn, background: BRAND.secondary, color: '#fff', opacity: processing === app._id ? 0.7 : 1 }}>
                              <CheckCircle size={14} />Approve
                            </button>
                            <button onClick={() => startReject(app._id)} disabled={processing === app._id}
                              style={{ ...btn, background: '#FEF2F2', border: `1px solid #FECACA`, color: BRAND.danger }}>
                              <XCircle size={14} />Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Inline rejection form */}
                    {app.status === 'pending' && isRejecting && (
                      <div style={{ marginTop: 16, background: '#FEF2F2', borderRadius: 10, padding: 16, border: `1px solid #FECACA` }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: BRAND.danger, marginBottom: 10 }}>Confirm Rejection</p>
                        <textarea
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          placeholder="Reason for rejection (optional)…"
                          rows={2}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid #FECACA`, fontSize: 13, outline: 'none', resize: 'vertical', background: '#fff', boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                          <button onClick={() => confirmReject(app._id)} disabled={processing === app._id}
                            style={{ ...btn, background: BRAND.danger, color: '#fff', opacity: processing === app._id ? 0.7 : 1 }}>
                            <XCircle size={14} />Confirm Reject
                          </button>
                          <button onClick={cancelReject}
                            style={{ ...btn, background: '#fff', border: `1px solid #FECACA`, color: BRAND.muted }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
      }
    </div>
  );
}
