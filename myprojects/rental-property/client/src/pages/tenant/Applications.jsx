import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Bed, Calendar, Clock, CheckCircle, XCircle, Search, ArrowRight, Home } from 'lucide-react';
import { BRAND, STATUS_COLORS } from '../../theme';
import api from '../../services/api';

const TABS = ['all', 'pending', 'approved', 'rejected'];

function EmptyState({ tab }) {
  const msg = {
    all: { title: 'No applications yet', sub: 'Browse available properties and submit your first application.' },
    pending: { title: 'No pending applications', sub: 'Your pending applications will appear here.' },
    approved: { title: 'No approved applications', sub: 'Approved applications will appear here.' },
    rejected: { title: 'No rejected applications', sub: '' },
  }[tab];
  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: BRAND.bg, border: `2px solid ${BRAND.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Search size={26} color={BRAND.muted} />
      </div>
      <p style={{ fontSize: 15, fontWeight: 600, color: BRAND.text, marginBottom: 6 }}>{msg.title}</p>
      {msg.sub && <p style={{ fontSize: 13, color: BRAND.muted, marginBottom: 20 }}>{msg.sub}</p>}
      {tab === 'all' && (
        <Link to="/properties" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '10px 22px', borderRadius: 9, background: BRAND.primary,
          color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none',
          transition: 'background .15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = BRAND.primaryMid}
          onMouseLeave={e => e.currentTarget.style.background = BRAND.primary}>
          Browse Properties <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}

function ApplicationCard({ app, hasActiveLease }) {
  const sc = STATUS_COLORS[app.status] || STATUS_COLORS.pending;
  const prop = app.property;
  const addr = [prop?.address?.area, prop?.address?.city].filter(Boolean).join(', ');
  const submittedAt = new Date(app.createdAt).toLocaleDateString();
  const moveIn = app.moveInDate ? new Date(app.moveInDate).toLocaleDateString() : null;

  return (
    <div style={{
      background: BRAND.surface, borderRadius: BRAND.radius,
      border: `1px solid ${BRAND.border}`, overflow: 'hidden',
      transition: 'box-shadow .18s, transform .18s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = BRAND.shadowMd; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = ''; }}>

      <div style={{ display: 'flex', gap: 0 }}>
        {/* Property image */}
        <div style={{ width: 120, minHeight: 110, flexShrink: 0, background: BRAND.bg, overflow: 'hidden' }}>
          {prop?.images?.[0]
            ? <img src={prop.images[0]} alt={prop.title} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 110 }} />
            : <div style={{ width: '100%', minHeight: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', color: BRAND.muted, fontSize: 12 }}>No image</div>
          }
        </div>

        {/* Main info */}
        <div style={{ flex: 1, padding: '14px 18px', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {prop?.title || 'Property'}
              </h3>
              {addr && (
                <p style={{ fontSize: 12, color: BRAND.muted, display: 'flex', alignItems: 'center', gap: 3, marginBottom: 8 }}>
                  <MapPin size={11} />{addr}
                </p>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: BRAND.muted }}>
                {prop?.bedrooms && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Bed size={11} />{prop.bedrooms} bed
                  </span>
                )}
                {prop?.rent?.amount && (
                  <span style={{ fontWeight: 600, color: BRAND.primary }}>
                    TZS {prop.rent.amount.toLocaleString()}/{prop.rent.period === 'yearly' ? 'yr' : 'mo'}
                  </span>
                )}
              </div>
            </div>
            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.text, flexShrink: 0 }}>
              {app.status}
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 10, fontSize: 12, color: BRAND.muted }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} />Applied {submittedAt}
            </span>
            {moveIn && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={11} />Move-in {moveIn}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Status-specific footer */}
      {app.status === 'approved' && hasActiveLease && (
        <div style={{ padding: '10px 18px', background: '#ECFDF5', borderTop: '1px solid #A7F3D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#065F46', fontWeight: 600 }}>
            <CheckCircle size={14} />Application approved — your lease is active
          </span>
          <Link to="/tenant/lease" style={{ fontSize: 13, color: '#065F46', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            View Lease <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {app.status === 'approved' && !hasActiveLease && (
        <div style={{ padding: '10px 18px', background: '#F9FAFB', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: BRAND.muted, fontWeight: 500 }}>
            <Home size={14} />Previously approved — lease has since ended
          </span>
          <Link to="/properties" style={{ fontSize: 13, color: BRAND.primary, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            Apply again <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {app.status === 'rejected' && (
        <div style={{ padding: '10px 18px', background: '#FFF1F2', borderTop: '1px solid #FECDD3', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9F1239', fontWeight: 500 }}>
            <XCircle size={14} />
            {app.rejectionReason ? `Reason: ${app.rejectionReason}` : 'Application was not accepted'}
          </span>
          <Link to="/properties" style={{ fontSize: 13, color: '#9F1239', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            Browse more <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {app.status === 'pending' && (
        <div style={{ padding: '10px 18px', background: '#FFFBEB', borderTop: '1px solid #FDE68A' }}>
          <p style={{ fontSize: 12, color: '#92400E' }}>
            Under review — the landlord will respond to your application soon.
          </p>
        </div>
      )}
    </div>
  );
}

export default function TenantApplications() {
  const [applications, setApplications] = useState([]);
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    Promise.all([
      api.get('/applications/sent'),
      api.get('/leases/my').catch(() => ({ data: { data: null } })),
    ]).then(([a, l]) => {
      setApplications(a.data.data || []);
      setLease(l.data.data || null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const hasActiveLease = lease?.status === 'active';

  const counts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  const filtered = tab === 'all' ? applications : applications.filter(a => a.status === tab);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>My Applications</h1>
          <p style={{ color: BRAND.muted, fontSize: 13, marginTop: 2 }}>{counts.all} total · {counts.pending} pending</p>
        </div>
        <Link to="/properties" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '9px 18px', borderRadius: 9, background: BRAND.primary,
          color: '#fff', fontWeight: 600, fontSize: 13, textDecoration: 'none',
          transition: 'background .15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = BRAND.primaryMid}
          onMouseLeave={e => e.currentTarget.style.background = BRAND.primary}>
          Browse Properties <ArrowRight size={14} />
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: BRAND.bg, borderRadius: 10, padding: 4, marginBottom: 20, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600,
            border: 'none', cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
            background: tab === t ? BRAND.surface : 'transparent',
            color: tab === t ? BRAND.text : BRAND.muted,
            boxShadow: tab === t ? BRAND.shadow : 'none',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {counts[t] > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 10,
                background: tab === t ? BRAND.primary : BRAND.muted,
                color: '#fff',
              }}>{counts[t]}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: BRAND.muted, textAlign: 'center', padding: 40 }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(app => <ApplicationCard key={app._id} app={app} hasActiveLease={hasActiveLease} />)}
        </div>
      )}
    </div>
  );
}
