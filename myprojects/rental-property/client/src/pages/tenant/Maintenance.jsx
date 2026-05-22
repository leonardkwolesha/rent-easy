import { useState, useEffect } from 'react';
import { Plus, Wrench, ChevronDown, X } from 'lucide-react';
import { BRAND, STATUS_COLORS } from '../../theme';
import { toast } from '../../components/Toast';
import api from '../../services/api';

const CATEGORIES = ['plumbing', 'electrical', 'structural', 'appliance', 'pest', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const empty = { title: '', description: '', category: 'other', priority: 'medium' };

const PRIORITY_COLORS = {
  low: { bg: '#D1FAE5', text: '#065F46' },
  medium: { bg: '#FEF3C7', text: '#92400E' },
  high: { bg: '#FFEDD5', text: '#9A3412' },
  urgent: { bg: '#FEE2E2', text: '#991B1B' },
};

const CSS = `
.maint-input{width:100%;padding:9px 12px;border-radius:8px;border:1px solid ${BRAND.border};font-size:13px;outline:none;transition:border-color .15s,box-shadow .15s;box-sizing:border-box;font-family:inherit}
.maint-input:focus{border-color:${BRAND.primary};box-shadow:0 0 0 3px ${BRAND.primary}18}
.maint-select{width:100%;padding:9px 12px;border-radius:8px;border:1px solid ${BRAND.border};font-size:13px;outline:none;cursor:pointer;font-family:inherit;transition:border-color .15s}
.maint-select:focus{border-color:${BRAND.primary}}
`;

export default function Maintenance() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const style = document.createElement('style');
    style.dataset.id = 'maint-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const load = () =>
    api.get('/maintenance/my')
      .then(r => setRequests(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/maintenance', form);
      toast.success('Maintenance request submitted');
      setForm(empty);
      setShowForm(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit'); }
    setSubmitting(false);
  };

  const open = requests.filter(r => r.status === 'open' || r.status === 'in_progress');
  const closed = requests.filter(r => r.status === 'resolved' || r.status === 'closed');

  const RequestCard = ({ r }) => {
    const s = STATUS_COLORS[r.status];
    const pc = PRIORITY_COLORS[r.priority] || PRIORITY_COLORS.medium;
    return (
      <div style={{
        background: BRAND.surface, borderRadius: BRAND.radius,
        border: `1px solid ${BRAND.border}`, overflow: 'hidden',
        transition: 'box-shadow .2s',
      }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = BRAND.shadowMd}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{r.title}</p>
                <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s?.bg, color: s?.text }}>{r.status.replace('_', ' ')}</span>
                <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: pc.bg, color: pc.text }}>{r.priority}</span>
              </div>
              <p style={{ fontSize: 13, color: BRAND.muted, marginBottom: 6, lineHeight: 1.5 }}>{r.description}</p>
              <p style={{ fontSize: 11, color: BRAND.muted }}>
                {r.category.charAt(0).toUpperCase() + r.category.slice(1)} · {new Date(r.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        {r.landlordNote && (
          <div style={{ padding: '10px 20px 14px', borderTop: `1px solid ${BRAND.border}`, background: BRAND.primary + '06' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: BRAND.primary, marginBottom: 2 }}>Landlord Note</p>
            <p style={{ fontSize: 13, color: BRAND.text }}>{r.landlordNote}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>Maintenance</h1>
          <p style={{ color: BRAND.muted, fontSize: 13, marginTop: 2 }}>{open.length} open request{open.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
          borderRadius: 9, background: showForm ? BRAND.bg : BRAND.primary,
          color: showForm ? BRAND.text : '#fff',
          border: showForm ? `1px solid ${BRAND.border}` : 'none',
          fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all .15s',
        }}
          onMouseEnter={e => { if (!showForm) e.currentTarget.style.background = BRAND.primaryMid; }}
          onMouseLeave={e => { if (!showForm) e.currentTarget.style.background = BRAND.primary; }}>
          {showForm ? <><X size={15} />Cancel</> : <><Plus size={15} />New Request</>}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: BRAND.surface, borderRadius: BRAND.radius, padding: 22,
          border: `1px solid ${BRAND.border}`, marginBottom: 24, boxShadow: BRAND.shadowMd,
        }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, fontFamily: "'Syne', sans-serif" }}>New Maintenance Request</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '.4px' }}>Title *</label>
              <input className="maint-input" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                placeholder="e.g. Leaking bathroom tap" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '.4px' }}>Category</label>
              <select className="maint-select" value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '.4px' }}>Priority</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {PRIORITIES.map(p => {
                  const pc = PRIORITY_COLORS[p];
                  const selected = form.priority === p;
                  return (
                    <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority: p }))} style={{
                      padding: '7px 4px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', transition: 'all .15s', textTransform: 'capitalize',
                      background: selected ? pc.bg : BRAND.bg,
                      border: `2px solid ${selected ? pc.text + '50' : BRAND.border}`,
                      color: selected ? pc.text : BRAND.muted,
                    }}>
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '.4px' }}>Description *</label>
              <textarea className="maint-input" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                required rows={3}
                placeholder="Describe the issue in detail…"
                style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="submit" disabled={submitting} style={{
              padding: '10px 22px', borderRadius: 9, background: BRAND.primary, color: '#fff',
              fontWeight: 600, fontSize: 13, border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
              transition: 'background .15s',
            }}
              onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = BRAND.primaryMid; }}
              onMouseLeave={e => e.currentTarget.style.background = BRAND.primary}>
              {submitting ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p style={{ color: BRAND.muted, textAlign: 'center', padding: 40 }}>Loading…</p>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: BRAND.muted }}>
          <Wrench size={40} color={BRAND.border} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>No maintenance requests</p>
          <p style={{ fontSize: 13 }}>Submit a request if something needs fixing</p>
        </div>
      ) : (
        <>
          {open.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: BRAND.text, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>
                Open <span style={{ fontWeight: 400, color: BRAND.muted }}>({open.length})</span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {open.map(r => <RequestCard key={r._id} r={r} />)}
              </div>
            </div>
          )}
          {closed.length > 0 && (
            <div style={{ opacity: 0.7 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>
                Resolved <span style={{ fontWeight: 400 }}>({closed.length})</span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {closed.map(r => <RequestCard key={r._id} r={r} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
