import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import RestaurantSidebar from '../../components/RestaurantSidebar';

const GRADIENT = 'linear-gradient(135deg, #ff6b00, #e63946)';
const DARK = '#1a1a2e';

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const IconBox = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const IconCoin = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M14.8 9A2 2 0 0 0 13 8h-2a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-2a2 2 0 0 1-1.8-1"/>
    <path d="M12 7v1m0 8v1"/>
  </svg>
);

const IconTrending = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const IconStar = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: '18px', padding: '1.25rem 1.5rem', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', flex: 1, minWidth: '140px' }}>
      <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>{icon}</div>
      <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '1.35rem', fontWeight: 900, color: color || DARK, marginTop: '2px' }}>{value}</div>
    </div>
  );
}

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openLoading, setOpenLoading] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [rRes, aRes, oRes] = await Promise.all([
        api.get('/restaurant/me'),
        api.get('/restaurant/me/analytics'),
        api.get('/restaurant/me/orders?status=pending'),
      ]);
      setRestaurant(rRes.data);
      setAnalytics(aRes.data);
      setOrders(oRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  async function toggleOpen() {
    if (!restaurant) return;
    setOpenLoading(true);
    try {
      const res = await api.put('/restaurant/me', { isOpen: !restaurant.isOpen });
      setRestaurant(res.data);
    } catch {}
    finally { setOpenLoading(false); }
  }

  async function updateOrderStatus(orderId, status) {
    setUpdatingOrder(orderId);
    try {
      await api.put(`/restaurant/me/orders/${orderId}`, { status });
      fetchAll();
    } catch {}
    finally { setUpdatingOrder(null); }
  }

  function getNextAction(order) {
    if (order.status === 'placed')    return { label: 'Accept',          status: 'confirmed', bg: '#22c55e' };
    if (order.status === 'confirmed') return { label: 'Mark Preparing',  status: 'preparing', bg: '#ff6b00' };
    if (order.status === 'preparing') return { label: 'Ready for Pickup', status: 'ready',    bg: '#185FA5' };
    return null;
  }

  const contentStyle = { paddingTop: '56px', minHeight: '100vh', background: '#f8f8f8', fontFamily: "'Segoe UI', system-ui, sans-serif" };

  if (loading) {
    return (
      <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <RestaurantSidebar restaurant={null} />
        <div className="rs-content" style={{ ...contentStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#888' }}>Loading dashboard…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <RestaurantSidebar restaurant={null} />
        <div className="rs-content" style={{ ...contentStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ background: '#fff5f5', border: '1px solid #fcc', borderRadius: '18px', padding: '2rem', textAlign: 'center', maxWidth: '360px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
            <div style={{ color: '#c1121f', fontWeight: 700 }}>{error}</div>
            <button onClick={fetchAll} style={{ marginTop: '1rem', background: GRADIENT, color: '#fff', border: 'none', borderRadius: '999px', padding: '0.6rem 1.5rem', cursor: 'pointer', fontWeight: 700, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <RestaurantSidebar restaurant={restaurant} onToggleOpen={toggleOpen} openLoading={openLoading} />

      <div className="rs-content" style={contentStyle}>
        {/* Hero header */}
        <div style={{ background: GRADIENT, padding: '2rem 2rem 3rem' }}>
          <div style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 900 }}>{getGreeting()}, {user?.name?.split(' ')[0]}! 👋</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', marginTop: '4px', fontSize: '0.9rem' }}>
            {restaurant?.name} · {new Date().toLocaleDateString('en-TZ', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div style={{ padding: '0 1rem', marginTop: '-1.5rem' }}>
          {/* Stats */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <StatCard icon={<IconBox />}      label="Today's Orders"  value={analytics?.todayOrders ?? '—'} />
            <StatCard icon={<IconCoin />}     label="Today's Revenue" value={analytics ? 'TSh ' + analytics.todayRevenue.toLocaleString() : '—'} color="#0F6E56" />
            <StatCard icon={<IconTrending />} label="Week Revenue"    value={analytics ? 'TSh ' + analytics.weekRevenue.toLocaleString() : '—'} />
            <StatCard icon={<IconStar />}     label="Avg Rating"      value={analytics ? analytics.avgRating.toFixed(1) + ' ★' : '—'} color="#f59e0b" />
          </div>

          {/* Live Orders */}
          <div style={{ background: '#fff', borderRadius: '18px', padding: '1.5rem', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: DARK }}>Live Orders</div>
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
              {orders.length > 0 && (
                <div style={{ marginLeft: 'auto', background: '#fff3e0', color: '#ff6b00', borderRadius: '999px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {orders.length} pending
                </div>
              )}
            </div>

            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
                <div style={{ fontWeight: 600 }}>No pending orders right now</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {orders.map((order) => {
                  const action = getNextAction(order);
                  return (
                    <motion.div key={order._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ border: '1.5px solid #f0f0f0', borderRadius: '14px', padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: 800, color: DARK }}>#{order._id.slice(-6).toUpperCase()}</div>
                        <div style={{ fontSize: '0.78rem', color: '#888' }}>{timeAgo(order.createdAt)}</div>
                      </div>
                      {order.userId?.name && (
                        <div style={{ fontSize: '0.85rem', color: '#555', marginBottom: '0.4rem' }}>👤 {order.userId.name}</div>
                      )}
                      <div style={{ marginBottom: '0.5rem' }}>
                        {order.items.map((item, i) => (
                          <div key={i} style={{ fontSize: '0.85rem', color: '#444' }}>{item.quantity || 1}× {item.name}</div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 800, color: '#ff6b00' }}>TSh {order.total?.toLocaleString()}</div>
                        {action && (
                          <button
                            onClick={() => updateOrderStatus(order._id, action.status)}
                            disabled={updatingOrder === order._id}
                            style={{ background: action.bg, color: '#fff', border: 'none', borderRadius: '999px', padding: '0.4rem 1rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', opacity: updatingOrder === order._id ? 0.7 : 1, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                            {updatingOrder === order._id ? '…' : action.label}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Popular Items */}
          {analytics?.popularItems?.length > 0 && (
            <div style={{ background: '#fff', borderRadius: '18px', padding: '1.5rem', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', marginBottom: '2rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: DARK, marginBottom: '1rem' }}>Top Items This Week</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #f0f0f0' }}>
                    {['Item', 'Orders', 'Revenue'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.4rem 0.5rem', fontSize: '0.75rem', color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analytics.popularItems.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f8f8f8' }}>
                      <td style={{ padding: '0.6rem 0.5rem', fontWeight: 600, fontSize: '0.88rem' }}>{item.name}</td>
                      <td style={{ padding: '0.6rem 0.5rem', fontSize: '0.88rem', color: '#555' }}>{item.orders}</td>
                      <td style={{ padding: '0.6rem 0.5rem', fontSize: '0.88rem', color: '#0F6E56', fontWeight: 700 }}>TSh {item.revenue?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
