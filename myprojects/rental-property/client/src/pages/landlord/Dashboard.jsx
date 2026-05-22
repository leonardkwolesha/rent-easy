import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, FileText, Users, Wallet, Plus, ArrowRight } from 'lucide-react';
import { BRAND, STATUS_COLORS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function LandlordDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ properties: 0, applications: 0, tenants: 0, revenue: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/properties/my'),
      api.get('/applications/received'),
      api.get('/leases/landlord'),
      api.get('/payments/landlord'),
    ]).then(([p, a, l, pay]) => {
      const paid = pay.data.data.filter(x => x.status === 'paid').reduce((s, x) => s + x.amount, 0);
      setStats({
        properties: p.data.data.length,
        applications: a.data.data.filter(x => x.status === 'pending').length,
        tenants: l.data.data.filter(x => x.status === 'active').length,
        revenue: paid,
      });
      setRecent(a.data.data.slice(0, 5));
    }).catch(() => {});
  }, []);

  const cards = [
    { icon: <Building2 size={22} />, label: 'My Properties', value: stats.properties, path: '/landlord/properties', color: BRAND.primary },
    { icon: <FileText size={22} />, label: 'Pending Applications', value: stats.applications, path: '/landlord/applications', color: BRAND.accent },
    { icon: <Users size={22} />, label: 'Active Tenants', value: stats.tenants, path: '/landlord/tenants', color: BRAND.secondary },
    { icon: <Wallet size={22} />, label: 'Total Revenue', value: `TZS ${stats.revenue.toLocaleString()}`, path: '/landlord/payments', color: '#8B5CF6' },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>
            Welcome, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: BRAND.muted, fontSize: 14, marginTop: 2 }}>Here's your property overview</p>
        </div>
        <Link to="/landlord/properties" style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
          borderRadius: 10, background: BRAND.primary, color: '#fff',
          fontWeight: 600, fontSize: 14, textDecoration: 'none', transition: 'background .15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = BRAND.primaryMid}
          onMouseLeave={e => e.currentTarget.style.background = BRAND.primary}>
          <Plus size={16} />Add Property
        </Link>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 28 }}>
        {cards.map(({ icon, label, value, path, color }) => (
          <Link key={label} to={path} style={{
            background: BRAND.surface, borderRadius: BRAND.radius, padding: '20px 22px',
            border: `1px solid ${BRAND.border}`, boxShadow: BRAND.shadow,
            display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none',
            transition: 'transform .18s, box-shadow .18s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = BRAND.shadowMd; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = BRAND.shadow; }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{icon}</div>
            <div>
              <p style={{ fontSize: 24, fontWeight: 800, color: BRAND.text, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: 13, color: BRAND.muted, marginTop: 4 }}>{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent applications */}
      <div style={{ background: BRAND.surface, borderRadius: BRAND.radius, border: `1px solid ${BRAND.border}`, overflow: 'hidden', boxShadow: BRAND.shadow }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BRAND.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontWeight: 700, fontSize: 15, fontFamily: "'Syne', sans-serif" }}>Recent Applications</h2>
          <Link to="/landlord/applications" style={{ fontSize: 13, color: BRAND.primary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
            View all <ArrowRight size={13} />
          </Link>
        </div>
        {recent.length === 0 ? (
          <p style={{ padding: '24px 20px', color: BRAND.muted, fontSize: 14, textAlign: 'center' }}>No applications yet.</p>
        ) : recent.map(app => {
          const s = STATUS_COLORS[app.status] || STATUS_COLORS.pending;
          return (
            <div key={app._id} style={{
              padding: '14px 20px', borderBottom: `1px solid ${BRAND.border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              transition: 'background .15s', cursor: 'default',
            }}
              onMouseEnter={e => e.currentTarget.style.background = BRAND.bg}
              onMouseLeave={e => e.currentTarget.style.background = ''}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{app.tenant?.name}</p>
                <p style={{ fontSize: 12, color: BRAND.muted, marginTop: 2 }}>{app.property?.title} · {new Date(app.createdAt).toLocaleDateString()}</p>
              </div>
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: s.bg, color: s.text, textTransform: 'capitalize',
              }}>{app.status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
