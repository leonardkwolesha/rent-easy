import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import KebiteLogo from '../../components/KebiteLogo';

const GRADIENT = 'linear-gradient(135deg, #ff6b00, #e63946)';
const DARK = '#1a1a2e';

/* ── Sidebar SVG icons ────────────────────────── */
const OverviewIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const RestaurantIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const RidersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 8v4l3 3"/>
  </svg>
);
const CustomersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const OrdersAdminIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
    <rect x="9" y="3" width="6" height="4" rx="1"/>
    <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
  </svg>
);
const SignOutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

/* ── Stat card icons ─────────────────────────── */
const IcoRestaurant = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IcoRider     = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>;
const IcoCustomers = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IcoOrders    = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7b1fa2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>;
const IcoCoin      = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M14.8 9A2 2 0 0 0 13 8h-2a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-2a2 2 0 0 1-1.8-1"/><path d="M12 7v1m0 8v1"/></svg>;
const IcoAlert     = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#e63946" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

/* ── Role / status color maps ────────────────── */
const ROLE_COLORS = {
  customer:   { bg: '#e3f2fd', color: '#185FA5' },
  restaurant: { bg: '#e8f5e9', color: '#0F6E56' },
  rider:      { bg: '#fff3e0', color: '#ff6b00' },
  admin:      { bg: '#f3e5f5', color: '#7b1fa2' },
};
const STATUS_COLORS = {
  placed:     { bg: '#fff3e0', color: '#ff6b00' },
  confirmed:  { bg: '#e8f5e9', color: '#2e7d32' },
  preparing:  { bg: '#fff8e1', color: '#f57f17' },
  ready:      { bg: '#e3f2fd', color: '#185FA5' },
  on_the_way: { bg: '#f3e5f5', color: '#7b1fa2' },
  delivered:  { bg: '#e8f5e9', color: '#1b5e20' },
  cancelled:  { bg: '#ffebee', color: '#c62828' },
};

const NAV = [
  { label: 'Overview',    Icon: OverviewIcon,    section: 'overview' },
  { label: 'Restaurants', Icon: RestaurantIcon,  section: 'restaurants' },
  { label: 'Riders',      Icon: RidersIcon,      section: 'riders' },
  { label: 'Customers',   Icon: CustomersIcon,   section: 'customers' },
  { label: 'All Orders',  Icon: OrdersAdminIcon, section: 'orders' },
];

function StatCard({ icon, label, value, color, urgent }) {
  return (
    <div style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', flex: '1 1 140px', border: urgent ? '2px solid #e63946' : 'none' }}>
      <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center' }}>{icon}</div>
      <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '1.45rem', fontWeight: 900, color: color || DARK, marginTop: '2px' }}>{value ?? '—'}</div>
    </div>
  );
}

function Sidebar({ activeSection, onSelect }) {
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleSignOut() {
    logout();
    window.location.href = '/login';
  }

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <KebiteLogo variant="white" size="sm" />
        <div style={{ marginTop: '0.75rem', display: 'inline-block', background: 'rgba(255,107,0,0.3)', color: '#ffcba4', borderRadius: '999px', padding: '2px 10px', fontSize: '0.7rem', fontWeight: 700 }}>Admin Panel</div>
      </div>
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {NAV.map(({ label, Icon, section }) => (
          <button key={section} onClick={() => { onSelect(section); setMobileOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.65rem 1rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', fontFamily: "'Segoe UI', system-ui, sans-serif", background: activeSection === section ? GRADIENT : 'transparent', color: activeSection === section ? '#fff' : 'rgba(255,255,255,0.65)', width: '100%', textAlign: 'left', transition: 'all 0.15s' }}>
            <Icon />{label}
          </button>
        ))}
      </nav>
      <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={handleSignOut}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.65rem 1rem', borderRadius: '10px', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', background: 'transparent', width: '100%', fontSize: '0.88rem', fontFamily: "'Segoe UI', system-ui, sans-serif" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}>
          <SignOutIcon />Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div style={{ width: '220px', background: DARK, height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 100, display: 'none', flexDirection: 'column' }} className="admin-sidebar">{content}</div>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '56px', background: DARK, zIndex: 200, display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '1rem' }}>
        <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }} aria-label="Open menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <KebiteLogo variant="white" size="sm" />
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', marginLeft: '4px' }}>Admin</span>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300 }} />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', stiffness: 400, damping: 35 }} style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: '260px', background: DARK, zIndex: 400 }}>{content}</motion.div>
          </>
        )}
      </AnimatePresence>
      <style>{`@media(min-width:768px){.admin-sidebar{display:flex!important}.admin-content{margin-left:220px!important;padding-top:0!important}}`}</style>
    </>
  );
}

/* ── Overview tab ─────────────────────────────── */
function OverviewTab({ analytics, pendingUsers, onApprove, onReject, actionLoading }) {
  if (!analytics) return <div style={{ padding: '2rem', color: '#888', textAlign: 'center' }}>Loading…</div>;
  return (
    <div>
      <div style={{ fontWeight: 900, fontSize: '1.3rem', color: DARK, marginBottom: '1rem' }}>Platform Overview</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <StatCard icon={<IcoRestaurant />} label="Restaurants"   value={analytics.totalRestaurants} />
        <StatCard icon={<IcoRider />}      label="Riders"        value={analytics.totalRiders} />
        <StatCard icon={<IcoCustomers />}  label="Customers"     value={analytics.totalCustomers} />
        <StatCard icon={<IcoOrders />}     label="Today Orders"  value={analytics.todayOrders} />
        <StatCard icon={<IcoCoin />}       label="Today Revenue" value={analytics.todayRevenue ? 'TSh ' + analytics.todayRevenue.toLocaleString() : '0'} color="#0F6E56" />
        <StatCard icon={<IcoAlert />}      label="Pending"       value={analytics.pendingApprovals} color="#e63946" urgent={analytics.pendingApprovals > 0} />
      </div>

      {pendingUsers.length > 0 ? (
        <div style={{ background: '#fff', borderRadius: '18px', padding: '1.5rem', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: DARK }}>Pending Approvals</div>
            <span style={{ background: '#e63946', color: '#fff', borderRadius: '999px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}>{pendingUsers.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pendingUsers.map((u) => {
              const roleStyle = ROLE_COLORS[u.role] || ROLE_COLORS.customer;
              return (
                <div key={u._id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#fafafa', borderRadius: '12px' }}>
                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <div style={{ fontWeight: 700, color: DARK, fontSize: '0.9rem' }}>{u.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#888' }}>{u.email} · {u.phone}</div>
                    <div style={{ fontSize: '0.72rem', color: '#aaa', marginTop: '2px' }}>Registered {new Date(u.createdAt).toLocaleDateString('en-TZ')}</div>
                  </div>
                  <span style={{ background: roleStyle.bg, color: roleStyle.color, borderRadius: '999px', padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize' }}>{u.role}</span>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => onApprove(u._id)} disabled={actionLoading === u._id}
                      style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: '999px', padding: '0.35rem 0.9rem', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', opacity: actionLoading === u._id ? 0.6 : 1, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                      Approve
                    </button>
                    <button onClick={() => onReject(u._id)} disabled={actionLoading === u._id}
                      style={{ background: '#e63946', color: '#fff', border: 'none', borderRadius: '999px', padding: '0.35rem 0.9rem', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', opacity: actionLoading === u._id ? 0.6 : 1, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '18px', padding: '2rem', textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', color: '#888' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
          <div style={{ fontWeight: 600 }}>No pending approvals</div>
        </div>
      )}
    </div>
  );
}

/* ── Users tab (riders / customers) ──────────── */
function UsersTab({ users, role, onApprove, onReject, actionLoading }) {
  return (
    <div>
      <div style={{ fontWeight: 900, fontSize: '1.1rem', color: DARK, marginBottom: '1rem', textTransform: 'capitalize' }}>{role} Accounts ({users.length})</div>
      {users.length === 0 && <div style={{ background: '#fff', borderRadius: '18px', padding: '2rem', textAlign: 'center', color: '#888', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>No {role}s found</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {users.map((u) => (
          <div key={u._id} style={{ background: '#fff', borderRadius: '14px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ flex: 1, minWidth: '160px' }}>
              <div style={{ fontWeight: 700, color: DARK }}>{u.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#888' }}>{u.email}</div>
              <div style={{ fontSize: '0.78rem', color: '#aaa' }}>{u.phone}</div>
              {u.vehicleType && <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px', textTransform: 'capitalize' }}>Vehicle: {u.vehicleType}</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <span style={{ background: u.isApproved ? '#e8f5e9' : '#fff3e0', color: u.isApproved ? '#0F6E56' : '#ff6b00', borderRadius: '999px', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
                {u.isApproved ? 'Approved' : 'Pending'}
              </span>
              {!u.isApproved && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => onApprove(u._id)} disabled={actionLoading === u._id} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: '999px', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>Approve</button>
                  <button onClick={() => onReject(u._id)} disabled={actionLoading === u._id} style={{ background: '#e63946', color: '#fff', border: 'none', borderRadius: '999px', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>Reject</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Restaurants tab ─────────────────────────── */
function RestaurantsTab({ restaurants, onApprove, onReject, actionLoading }) {
  const pending = restaurants.filter((r) => !r.isApproved);
  const approved = restaurants.filter((r) => r.isApproved);

  function renderCard(r) {
    const isBusy = actionLoading === 'rest_' + r._id;
    return (
      <div key={r._id} style={{ background: '#fff', borderRadius: '14px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <div style={{ fontWeight: 700, color: DARK }}>{r.name}</div>
          <div style={{ fontSize: '0.8rem', color: '#888' }}>Owner: {r.ownerId?.name || '—'} · {r.ownerId?.email}</div>
          <div style={{ fontSize: '0.75rem', color: '#aaa' }}>{r.cuisine?.join(', ') || '—'}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ background: r.isApproved ? '#e8f5e9' : '#fff3e0', color: r.isApproved ? '#0F6E56' : '#ff6b00', borderRadius: '999px', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
              {r.isApproved ? 'Approved' : 'Pending'}
            </span>
            <span style={{ background: r.isOpen ? '#e8f5e9' : '#f5f5f5', color: r.isOpen ? '#22c55e' : '#aaa', borderRadius: '999px', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
              {r.isOpen ? 'Open' : 'Closed'}
            </span>
          </div>
          {!r.isApproved && (
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => onApprove(r)} disabled={isBusy}
                style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: '999px', padding: '0.3rem 0.85rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', opacity: isBusy ? 0.6 : 1, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                {isBusy ? '…' : 'Approve'}
              </button>
              <button onClick={() => onReject(r)} disabled={isBusy}
                style={{ background: '#e63946', color: '#fff', border: 'none', borderRadius: '999px', padding: '0.3rem 0.85rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', opacity: isBusy ? 0.6 : 1, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontWeight: 900, fontSize: '1.1rem', color: DARK, marginBottom: '1rem' }}>Restaurants ({restaurants.length})</div>

      {pending.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e63946' }}>Awaiting Approval</div>
            <span style={{ background: '#e63946', color: '#fff', borderRadius: '999px', padding: '1px 8px', fontSize: '0.7rem', fontWeight: 700 }}>{pending.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pending.map(renderCard)}
          </div>
        </div>
      )}

      {approved.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F6E56', marginBottom: '0.75rem' }}>Active Restaurants ({approved.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {approved.map(renderCard)}
          </div>
        </div>
      )}

      {restaurants.length === 0 && (
        <div style={{ background: '#fff', borderRadius: '14px', padding: '2rem', textAlign: 'center', color: '#888' }}>No restaurants found</div>
      )}
    </div>
  );
}

/* ── Orders tab ───────────────────────────────── */
function OrdersTab({ orders }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const filtered = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter);
  return (
    <div>
      <div style={{ fontWeight: 900, fontSize: '1.1rem', color: DARK, marginBottom: '1rem' }}>All Orders ({orders.length})</div>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {['all', 'placed', 'preparing', 'on_the_way', 'delivered', 'cancelled'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{ padding: '0.35rem 0.9rem', borderRadius: '999px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', background: statusFilter === s ? GRADIENT : '#f0f0f0', color: statusFilter === s ? '#fff' : '#666', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>
      {filtered.length === 0 && <div style={{ background: '#fff', borderRadius: '14px', padding: '2rem', textAlign: 'center', color: '#888' }}>No orders</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {filtered.slice(0, 50).map((order) => {
          const st = STATUS_COLORS[order.status] || STATUS_COLORS.placed;
          return (
            <div key={order._id} style={{ background: '#fff', borderRadius: '14px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <div style={{ fontWeight: 700, color: DARK }}>#{order._id.slice(-6).toUpperCase()}</div>
                <div style={{ fontSize: '0.8rem', color: '#888' }}>{order.userId?.name || '—'} → {order.restaurantId?.name || '—'}</div>
                <div style={{ fontSize: '0.75rem', color: '#aaa' }}>{new Date(order.createdAt).toLocaleString('en-TZ')}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <span style={{ background: st.bg, color: st.color, borderRadius: '999px', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>{order.status.replace('_', ' ')}</span>
                <span style={{ fontWeight: 700, color: '#ff6b00', fontSize: '0.88rem' }}>TSh {order.total?.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────── */
export default function AdminDashboard() {
  const { section: urlSection } = useParams();
  const [activeSection, setActiveSection] = useState(urlSection || 'overview');
  const [analytics, setAnalytics] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, pRes, uRes, rRes, oRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/users?isApproved=false'),
        api.get('/admin/users'),
        api.get('/admin/restaurants'),
        api.get('/admin/orders?limit=100'),
      ]);
      setAnalytics(aRes.data);
      setPendingUsers(pRes.data);
      setAllUsers(uRes.data);
      setRestaurants(rRes.data);
      setOrders(oRes.data);
    } catch (err) {
      console.warn('Admin fetch error:', err.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleApprove(userId) {
    setActionLoading(userId);
    try {
      await api.put(`/admin/users/${userId}/approve`);
      fetchAll();
    } catch {}
    finally { setActionLoading(null); }
  }

  async function handleReject(userId) {
    setActionLoading(userId);
    try {
      await api.put(`/admin/users/${userId}/reject`);
      fetchAll();
    } catch {}
    finally { setActionLoading(null); }
  }

  async function handleApproveRestaurant(restaurant) {
    const key = 'rest_' + restaurant._id;
    setActionLoading(key);
    try {
      await api.put(`/admin/restaurants/${restaurant._id}`, { isApproved: true });
      if (restaurant.ownerId?._id) {
        await api.put(`/admin/users/${restaurant.ownerId._id}/approve`);
      }
      fetchAll();
    } catch {}
    finally { setActionLoading(null); }
  }

  async function handleRejectRestaurant(restaurant) {
    const key = 'rest_' + restaurant._id;
    setActionLoading(key);
    try {
      await api.put(`/admin/restaurants/${restaurant._id}`, { isApproved: false });
      fetchAll();
    } catch {}
    finally { setActionLoading(null); }
  }

  const riders = allUsers.filter((u) => u.role === 'rider');
  const customers = allUsers.filter((u) => u.role === 'customer');

  const renderContent = () => {
    if (loading && !analytics) return <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>Loading admin data…</div>;
    switch (activeSection) {
      case 'overview':     return <OverviewTab analytics={analytics} pendingUsers={pendingUsers} onApprove={handleApprove} onReject={handleReject} actionLoading={actionLoading} />;
      case 'restaurants':  return <RestaurantsTab restaurants={restaurants} onApprove={handleApproveRestaurant} onReject={handleRejectRestaurant} actionLoading={actionLoading} />;
      case 'riders':       return <UsersTab users={riders} role="rider" onApprove={handleApprove} onReject={handleReject} actionLoading={actionLoading} />;
      case 'customers':    return <UsersTab users={customers} role="customer" onApprove={handleApprove} onReject={handleReject} actionLoading={actionLoading} />;
      case 'orders':       return <OrdersTab orders={orders} />;
      default:             return null;
    }
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <Sidebar activeSection={activeSection} onSelect={setActiveSection} />
      <div className="admin-content" style={{ paddingTop: '56px', minHeight: '100vh', background: '#f8f8f8' }}>
        <div style={{ background: GRADIENT, padding: '1.5rem 1.5rem 3rem' }}>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem' }}>Admin Dashboard</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginTop: '4px' }}>Kebite Platform Control</div>
        </div>
        <div style={{ padding: '0 1rem', marginTop: '-1.5rem', paddingBottom: '2rem' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
