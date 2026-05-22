import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import RestaurantSidebar from '../../components/RestaurantSidebar';

const RESTAURANT_CANCEL_REASONS = [
  'Item out of stock',
  'Restaurant closing early',
  'Unable to fulfill this order',
  'Ingredient unavailable',
  'Customer request',
  'Other',
];

const GRADIENT = 'linear-gradient(135deg, #ff6b00, #e63946)';
const DARK = '#1a1a2e';

const STATUS_COLORS = {
  placed:     { bg: '#fff3e0', color: '#ff6b00',  label: 'Pending' },
  confirmed:  { bg: '#e8f5e9', color: '#2e7d32',  label: 'Confirmed' },
  preparing:  { bg: '#fff8e1', color: '#f57f17',  label: 'Preparing' },
  ready:      { bg: '#e3f2fd', color: '#185FA5',  label: 'Ready' },
  on_the_way: { bg: '#f3e5f5', color: '#7b1fa2',  label: 'On the Way' },
  delivered:  { bg: '#e8f5e9', color: '#1b5e20',  label: 'Delivered' },
  cancelled:  { bg: '#ffebee', color: '#c62828',  label: 'Cancelled' },
};

const TABS = [
  { label: 'All',       value: 'all' },
  { label: 'Pending',   value: 'pending' },
  { label: 'Preparing', value: 'preparing' },
  { label: 'Completed', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short' });
}

export default function RestaurantOrders() {
  const [activeTab, setActiveTab]           = useState('all');
  const [orders, setOrders]                 = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [updatingOrder, setUpdatingOrder]   = useState(null);
  const [cancelTarget, setCancelTarget]     = useState(null);
  const [cancelReason, setCancelReason]     = useState('');
  const [cancelling, setCancelling]         = useState(false);
  const [cancelError, setCancelError]       = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = activeTab !== 'all' ? `?status=${activeTab}` : '';
      const res = await api.get(`/restaurant/me/orders${params}`);
      setOrders(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load orders');
    } finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function updateStatus(orderId, status) {
    setUpdatingOrder(orderId);
    try {
      await api.put(`/restaurant/me/orders/${orderId}`, { status });
      fetchOrders();
    } catch {}
    finally { setUpdatingOrder(null); }
  }

  function getNextAction(order) {
    if (order.status === 'placed')    return { label: 'Accept',       status: 'confirmed', bg: '#22c55e' };
    if (order.status === 'confirmed') return { label: 'Start Prep',   status: 'preparing', bg: '#ff6b00' };
    if (order.status === 'preparing') return { label: 'Mark Ready',   status: 'ready',     bg: '#185FA5' };
    return null;
  }

  function canCancelOrder(order) {
    return ['placed', 'confirmed', 'preparing'].includes(order.status);
  }

  async function confirmRestaurantCancel() {
    if (!cancelReason) { setCancelError('Please select a reason.'); return; }
    setCancelling(true); setCancelError('');
    try {
      await api.put(`/restaurant/me/orders/${cancelTarget._id}`, { status: 'cancelled', reason: cancelReason });
      setOrders(prev => prev.map(o => o._id === cancelTarget._id ? { ...o, status: 'cancelled' } : o));
      setCancelTarget(null);
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Cancellation failed. Try again.');
    } finally { setCancelling(false); }
  }

  return (
    <>
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <RestaurantSidebar />

      <div className="rs-content" style={{ paddingTop: '56px', minHeight: '100vh', background: '#f8f8f8' }}>
        <div style={{ background: GRADIENT, padding: '1.5rem 1.5rem 3rem' }}>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem' }}>Orders</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginTop: '4px' }}>Manage all restaurant orders</div>
        </div>

        <div style={{ padding: '0 1rem', marginTop: '-1.5rem' }}>
          {/* Status tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '1rem', background: '#fff', borderRadius: '18px', padding: '0.75rem', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
            {TABS.map((tab) => (
              <button key={tab.value} onClick={() => setActiveTab(tab.value)}
                style={{ padding: '0.45rem 1.1rem', borderRadius: '999px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap', background: activeTab === tab.value ? GRADIENT : '#f8f8f8', color: activeTab === tab.value ? '#fff' : '#888', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                {tab.label}
              </button>
            ))}
          </div>

          {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Loading orders…</div>}
          {error && <div style={{ background: '#fff5f5', border: '1px solid #fcc', borderRadius: '18px', padding: '1.5rem', textAlign: 'center', color: '#c1121f' }}>{error}</div>}
          {!loading && !error && orders.length === 0 && (
            <div style={{ background: '#fff', borderRadius: '18px', padding: '3rem', textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</div>
              <div style={{ fontWeight: 700, color: '#555' }}>No orders found</div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '2rem' }}>
            {orders.map((order) => {
              const st = STATUS_COLORS[order.status] || STATUS_COLORS.placed;
              const action = getNextAction(order);
              return (
                <motion.div key={order._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#fff', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 900, color: DARK, fontSize: '1rem' }}>#{order._id.slice(-6).toUpperCase()}</div>
                      {order.userId?.name && <div style={{ fontSize: '0.82rem', color: '#888', marginTop: '2px' }}>👤 {order.userId.name}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span style={{ background: st.bg, color: st.color, borderRadius: '999px', padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700 }}>{st.label}</span>
                      <span style={{ fontSize: '0.75rem', color: '#aaa' }}>{timeAgo(order.createdAt)}</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    {order.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#444', padding: '2px 0' }}>
                        <span>{item.quantity || 1}× {item.name}</span>
                        <span style={{ color: '#888' }}>TSh {((item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #f0f0f0', gap: '0.5rem' }}>
                    <div style={{ fontWeight: 900, color: '#ff6b00' }}>TSh {order.total?.toLocaleString()}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {canCancelOrder(order) && (
                        <button
                          onClick={() => { setCancelTarget(order); setCancelReason(''); setCancelError(''); }}
                          disabled={updatingOrder === order._id}
                          style={{ background: '#fff', color: '#e63946', border: '1.5px solid #e63946', borderRadius: '999px', padding: '0.4rem 1rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                          Cancel
                        </button>
                      )}
                      {action && (
                        <button onClick={() => updateStatus(order._id, action.status)} disabled={updatingOrder === order._id}
                          style={{ background: action.bg, color: '#fff', border: 'none', borderRadius: '999px', padding: '0.4rem 1.1rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', opacity: updatingOrder === order._id ? 0.7 : 1, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                          {updatingOrder === order._id ? '…' : action.label}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>

    {/* Cancel order modal */}

    <AnimatePresence>
      {cancelTarget && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => { if (!cancelling) setCancelTarget(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1100, display: 'flex', alignItems: 'flex-end' }}>
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', background: '#fff', borderRadius: '24px 24px 0 0', padding: '1.5rem 1.25rem 2rem', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ width: '36px', height: '4px', background: '#e0e0e0', borderRadius: '99px', margin: '0 auto 1.25rem' }} />
            <div style={{ fontWeight: 900, fontSize: '1.1rem', color: DARK, marginBottom: '0.25rem' }}>Cancel Order</div>
            <div style={{ fontSize: '0.83rem', color: '#888', marginBottom: '1.25rem' }}>
              #{cancelTarget._id.slice(-6).toUpperCase()} — Select a reason
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
              {RESTAURANT_CANCEL_REASONS.map(r => (
                <button key={r} onClick={() => setCancelReason(r)}
                  style={{ textAlign: 'left', background: cancelReason === r ? '#fff3e0' : '#f8f8f8', color: cancelReason === r ? '#ff6b00' : '#444', border: cancelReason === r ? '1.5px solid #ff6b00' : '1.5px solid #f0f0f0', borderRadius: '12px', padding: '0.65rem 1rem', fontWeight: cancelReason === r ? 700 : 500, fontSize: '0.88rem', cursor: 'pointer', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                  {r}
                </button>
              ))}
            </div>
            {cancelError && <div style={{ color: '#e63946', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{cancelError}</div>}
            <button onClick={confirmRestaurantCancel} disabled={cancelling}
              style={{ width: '100%', background: 'linear-gradient(135deg,#e63946,#c62828)', color: '#fff', border: 'none', borderRadius: '999px', padding: '0.85rem', fontWeight: 800, fontSize: '0.95rem', cursor: cancelling ? 'not-allowed' : 'pointer', opacity: cancelling ? 0.7 : 1, marginBottom: '0.6rem', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
              {cancelling ? 'Cancelling…' : 'Confirm Cancellation'}
            </button>
            <button onClick={() => setCancelTarget(null)} disabled={cancelling}
              style={{ width: '100%', background: '#f8f8f8', color: '#555', border: 'none', borderRadius: '999px', padding: '0.75rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
              Keep Order
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
