import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import PageWrapper from '../components/PageWrapper';
import { useToast } from '../components/Toast';
import { fadeUp, stagger, staggerFast, scaleIn, cardHover, popIn } from '../animations/variants';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

const CUISINE_EMOJI = { Biryani: '🍛', Burgers: '🍔', Pizza: '🍕', 'Nyama Choma': '🥩', Pilau: '🥘', default: '🍽️' };
function getEmoji(restaurant) {
  const cuisines = restaurant?.cuisine || [];
  for (const c of cuisines) if (CUISINE_EMOJI[c]) return CUISINE_EMOJI[c];
  return CUISINE_EMOJI.default;
}

const ACTIVE_STATUSES = ['placed', 'confirmed', 'preparing', 'ready', 'on_the_way'];
const STATUS_META = {
  placed:     { bg: '#fff3e0', color: '#e65100', label: 'Placed' },
  confirmed:  { bg: '#fff3e0', color: '#e65100', label: 'Confirmed' },
  preparing:  { bg: '#fff3e0', color: '#e65100', label: 'Preparing' },
  ready:      { bg: '#e3f2fd', color: '#1565c0', label: 'Ready' },
  on_the_way: { bg: '#e3f2fd', color: '#1565c0', label: 'On the way' },
  delivered:  { bg: '#d4f7e0', color: '#1a7a45', label: 'Delivered' },
  cancelled:  { bg: '#f0f0f0', color: '#999',    label: 'Cancelled' },
};
const FILTERS = ['all', 'active', 'delivered', 'cancelled'];
const EMPTY_STATES = {
  all:       { emoji: '🍽️', title: 'No orders yet', sub: 'Your order history will appear here.', btnLabel: 'Browse Restaurants →', btnPath: '/restaurants' },
  active:    { emoji: '🛵', title: 'No active orders', sub: 'Hungry? Place an order and track it live.', btnLabel: 'Order Now →', btnPath: '/restaurants' },
  delivered: { emoji: '✅', title: 'No delivered orders yet', sub: 'Your completed orders will show here.', btnLabel: null },
  cancelled: { emoji: '❌', title: 'No cancelled orders', sub: 'Good news — nothing was cancelled!', btnLabel: null },
};

const s = {
  page: { fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: '100vh', background: '#f8f8f8' },
  header: { background: 'linear-gradient(135deg, #ff6b00, #e63946)', padding: '1.5rem 2rem 3rem', color: '#fff' },
  backBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '999px', padding: '0.4rem 1rem', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '1rem', display: 'inline-block' },
  headerTitle: { fontSize: '2rem', fontWeight: 900, margin: '0 0 0.25rem' },
  headerSub: { opacity: 0.85, margin: 0, fontSize: '0.95rem' },
  body: { maxWidth: '900px', margin: '0 auto', padding: '2rem' },
  filtersRow: { display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.75rem' },
  cardsList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  cardBase: { background: '#fff', borderRadius: '18px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid #f0f0f0', padding: '1.25rem 1.5rem', cursor: 'default' },
  topRow: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.6rem' },
  emojiCircle: { width: '52px', height: '52px', borderRadius: '50%', background: '#ff6b0015', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 },
  cardCenter: { flex: 1, minWidth: 0 },
  restaurantName: { fontWeight: 800, fontSize: '1rem', color: '#1a1a2e', margin: '0 0 0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  orderId: { color: '#aaa', fontSize: '0.75rem', margin: 0 },
  statusBadge: (meta) => ({ background: meta.bg, color: meta.color, fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '999px', whiteSpace: 'nowrap', flexShrink: 0 }),
  itemsSummary: { fontSize: '0.85rem', color: '#777', margin: '0.4rem 0 0.85rem' },
  bottomRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' },
  total: { fontWeight: 800, fontSize: '1rem', color: '#1a1a2e' },
  timestamp: { fontSize: '0.8rem', color: '#aaa' },
  trackBtn: { background: 'linear-gradient(135deg, #ff6b00, #e63946)', color: '#fff', border: 'none', borderRadius: '999px', padding: '0.45rem 1.1rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' },
  reorderBtn: (busy) => ({ background: busy ? '#fff8f5' : '#fff', color: '#ff6b00', border: '1.5px solid #ff6b00', borderRadius: '999px', padding: '0.4rem 1.1rem', fontWeight: 700, fontSize: '0.82rem', cursor: busy ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', opacity: busy ? 0.7 : 1 }),
  btnSpinner: { width: '13px', height: '13px', border: '2px solid #ff6b0040', borderTop: '2px solid #ff6b00', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 },
  skeletonGrid: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  skeleton: { borderRadius: '18px', height: '130px', background: 'linear-gradient(90deg, #efefef 25%, #f5f5f5 50%, #efefef 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', border: '1px solid #f0f0f0' },
  errorBox: { background: '#fff5f5', border: '1px solid #fcc', borderRadius: '18px', padding: '2.5rem 2rem', textAlign: 'center', maxWidth: '480px', margin: '4rem auto' },
  retryBtn: { background: 'linear-gradient(135deg, #ff6b00, #e63946)', color: '#fff', border: 'none', borderRadius: '999px', padding: '0.65rem 1.75rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' },
  emptyState: { textAlign: 'center', padding: '4rem 2rem' },
  emptyBtn: { background: 'linear-gradient(135deg, #ff6b00, #e63946)', color: '#fff', border: 'none', borderRadius: '999px', padding: '0.65rem 1.75rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' },
};

const PULSE_STATUSES = new Set(['placed', 'preparing', 'on_the_way']);

function StarPicker({ value, onChange, label }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#555', marginBottom: '0.35rem' }}>{label}</div>}
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            aria-label={`${s} star`}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.9rem', color: s <= value ? '#ff6b00' : '#ddd', padding: 0, lineHeight: 1, transition: 'color 0.15s, transform 0.1s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

const CUSTOMER_CANCEL_REASONS = [
  'Changed my mind',
  'Ordered by mistake',
  'Taking too long to confirm',
  'Found a better option',
  'Other',
];

function OrderCard({ order, navigate, onReorder, reordering, onCancel, onRate, isRated }) {
  const busy = reordering === order._id;
  const meta = STATUS_META[order.status] || STATUS_META.cancelled;
  const isActive = ACTIVE_STATUSES.includes(order.status);
  const isDelivered = order.status === 'delivered';
  const isPulsing = PULSE_STATUSES.has(order.status);
  const canCancel = ['placed', 'confirmed'].includes(order.status);
  const itemNames = (order.items || []).map((i) => i.name).filter(Boolean);
  const itemSummary = itemNames.length === 0 ? 'No items' : itemNames.slice(0, 2).join(' · ') + (itemNames.length > 2 ? ` +${itemNames.length - 2} more` : '');
  const shortId = 'Order #' + String(order._id).slice(-6).toUpperCase();

  return (
    <motion.div
      style={s.cardBase}
      layout
      initial="rest"
      whileHover="hover"
      whileTap={{ scale: 0.99 }}
      variants={cardHover}
      exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }}
    >
      <div style={s.topRow}>
        <div style={s.emojiCircle}>{getEmoji(order.restaurantId)}</div>
        <div style={s.cardCenter}>
          <p style={s.restaurantName}>{order.restaurantId?.name || 'Restaurant'}</p>
          <p style={s.orderId}>{shortId}</p>
        </div>
        {/* Pulsing badge for active orders */}
        <motion.span
          style={s.statusBadge(meta)}
          animate={isPulsing ? { scale: [1, 1.08, 1], opacity: [1, 0.85, 1] } : {}}
          transition={isPulsing ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
        >
          {meta.label}
        </motion.span>
      </div>
      <p style={s.itemsSummary}>{itemSummary}</p>
      <div style={s.bottomRow}>
        <span style={s.total}>TSh {order.total?.toLocaleString()}</span>
        <span style={s.timestamp}>{timeAgo(order.createdAt)}</span>
        {isActive && (
          <motion.button style={s.trackBtn} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => navigate(`/orders/${order._id}/track`)}>
            Track Order →
          </motion.button>
        )}
        {canCancel && (
          <button
            onClick={e => { e.stopPropagation(); onCancel(order); }}
            style={{ background: '#fff', color: '#e63946', border: '1.5px solid #e63946', borderRadius: '999px', padding: '0.4rem 1rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
          >
            Cancel
          </button>
        )}
        {isDelivered && (
          <button style={s.reorderBtn(busy)} onClick={() => !busy && onReorder(order)} disabled={busy}>
            {busy && <span style={s.btnSpinner} />}
            {busy ? 'Ordering…' : 'Reorder'}
          </button>
        )}
        {isDelivered && (
          isRated
            ? <span style={{ fontSize: '0.82rem', color: '#ff6b00', fontWeight: 700 }}>⭐ Rated</span>
            : <button
                onClick={e => { e.stopPropagation(); onRate(order); }}
                style={{ background: 'linear-gradient(135deg,#ff6b00,#e63946)', color: '#fff', border: 'none', borderRadius: '999px', padding: '0.4rem 1.1rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
              >
                ⭐ Rate
              </button>
        )}
      </div>
    </motion.div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [reordering, setReordering] = useState(null);
  const [cancelTarget, setCancelTarget]     = useState(null);
  const [cancelReason, setCancelReason]     = useState('');
  const [cancelling, setCancelling]         = useState(false);
  const [cancelError, setCancelError]       = useState('');
  const [ratingTarget, setRatingTarget]     = useState(null);
  const [ratingStars, setRatingStars]       = useState({ overall: 0, food: 0 });
  const [ratingComment, setRatingComment]   = useState('');
  const [ratingLoading, setRatingLoading]   = useState(false);
  const [ratingError, setRatingError]       = useState('');
  const [ratedOrders, setRatedOrders]       = useState(new Set());
  const showToast = useToast();
  const navigate = useNavigate();

  async function handleReorder(order) {
    setReordering(order._id);
    try {
      const { data } = await api.post('/orders', {
        restaurantId: order.restaurantId._id, items: order.items,
        total: order.total, deliveryFee: order.deliveryFee,
        paymentMethod: order.paymentMethod, deliveryAddress: order.deliveryAddress,
      });
      const current = parseInt(localStorage.getItem('activeOrderCount') || '0');
      localStorage.setItem('activeOrderCount', current + 1);
      navigate(`/orders/${data._id}/track`);
    } catch {
      showToast('Reorder failed — restaurant may be closed', 'error');
    } finally { setReordering(null); }
  }

  function handleRate(order) {
    setRatingTarget(order);
    setRatingStars({ overall: 0, food: 0 });
    setRatingComment('');
    setRatingError('');
  }

  async function submitRating() {
    if (!ratingStars.overall) { setRatingError('Please select an overall star rating.'); return; }
    setRatingLoading(true); setRatingError('');
    try {
      await api.post('/reviews', {
        orderId:      ratingTarget._id,
        restaurantId: ratingTarget.restaurantId._id,
        riderId:      ratingTarget.riderId || undefined,
        ratings: {
          overall:    ratingStars.overall,
          food:       ratingStars.food || undefined,
        },
        comment: ratingComment.trim() || undefined,
      });
      setRatedOrders(prev => new Set([...prev, ratingTarget._id]));
      setRatingTarget(null);
      showToast('Thank you for your rating!', 'success');
    } catch (err) {
      setRatingError(err.response?.data?.message || 'Could not submit rating. Try again.');
    } finally { setRatingLoading(false); }
  }

  async function handleCancelOrder(order) {
    setCancelTarget(order);
    setCancelReason('');
    setCancelError('');
  }

  async function confirmCancel() {
    if (!cancelReason) { setCancelError('Please select a reason.'); return; }
    setCancelling(true); setCancelError('');
    try {
      await api.put(`/orders/${cancelTarget._id}/cancel`, { reason: cancelReason });
      setOrders(prev => prev.map(o => o._id === cancelTarget._id ? { ...o, status: 'cancelled' } : o));
      const current = parseInt(localStorage.getItem('activeOrderCount') || '0');
      localStorage.setItem('activeOrderCount', Math.max(0, current - 1));
      setCancelTarget(null);
      showToast('Order cancelled.', 'info');
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Cancellation failed. Try again.');
    } finally { setCancelling(false); }
  }

  async function fetchOrders() {
    setLoading(true); setError(null);
    try {
      const res = await api.get('/orders/my');
      setOrders(res.data);
      localStorage.setItem('activeOrderCount', res.data.filter((o) => ACTIVE_STATUSES.includes(o.status)).length);
    } catch (err) { setError(err.response?.data?.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchOrders(); }, []);

  const filtered = orders
    .filter((o) => {
      if (filter === 'active') return ACTIVE_STATUSES.includes(o.status);
      if (filter === 'delivered') return o.status === 'delivered';
      if (filter === 'cancelled') return o.status === 'cancelled';
      return true;
    })
    .sort((a, b) => {
      const aA = ACTIVE_STATUSES.includes(a.status) ? 0 : 1;
      const bA = ACTIVE_STATUSES.includes(b.status) ? 0 : 1;
      if (aA !== bA) return aA - bA;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const e = EMPTY_STATES[filter] || EMPTY_STATES.all;

  return (
    <PageWrapper>
      <div style={s.page}>
        <style>{`
          @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
          @keyframes spin { to { transform: rotate(360deg) } }
        `}</style>

        <div style={s.header}>
          <button style={s.backBtn} onClick={() => navigate('/')}>← Back</button>
          <h1 style={s.headerTitle}>My Orders</h1>
          <p style={s.headerSub}>{loading ? 'Loading…' : error ? 'Oops, something went wrong' : `${orders.length} orders total`}</p>
        </div>

        <div style={s.body}>
          {/* Filter pills */}
          <motion.div style={s.filtersRow} variants={staggerFast} initial="hidden" animate="visible">
            {FILTERS.map((f) => (
              <motion.button
                key={f}
                variants={scaleIn}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setFilter(f)}
                style={{ padding: '0.45rem 1.1rem', borderRadius: '999px', border: filter === f ? 'none' : '1.5px solid #ddd', background: filter === f ? 'linear-gradient(135deg, #ff6b00, #e63946)' : '#fff', color: filter === f ? '#fff' : '#555', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', textTransform: 'capitalize' }}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </motion.button>
            ))}
          </motion.div>

          {loading && (
            <div style={s.skeletonGrid}>{[0, 1, 2, 3].map((i) => <div key={i} style={s.skeleton} />)}</div>
          )}

          {!loading && error && (
            <div style={s.errorBox}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>⚠️</div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#c1121f', marginBottom: '0.5rem' }}>Could not load orders</div>
              <div style={{ color: '#666', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>{error}</div>
              <button style={s.retryBtn} onClick={fetchOrders}>Retry</button>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <AnimatePresence mode="popLayout">
              <motion.div
                key={filter}
                style={s.cardsList}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {filtered.map((o) => (
                  <OrderCard key={o._id} order={o} navigate={navigate} onReorder={handleReorder} reordering={reordering} onCancel={handleCancelOrder} onRate={handleRate} isRated={ratedOrders.has(o._id)} />
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div style={s.emptyState}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{e.emoji}</div>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#444', margin: '0 0 0.5rem' }}>{e.title}</p>
              <p style={{ color: '#999', margin: '0 0 1.5rem' }}>{e.sub}</p>
              {e.btnLabel && (
                <motion.button style={s.emptyBtn} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => navigate(e.btnPath)}>
                  {e.btnLabel}
                </motion.button>
              )}
            </div>
          )}
        </div>
        {/* Cancel modal */}
        <AnimatePresence>
          {cancelTarget && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setCancelTarget(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: "'Segoe UI', system-ui, sans-serif" }}
            >
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                onClick={e => e.stopPropagation()}
                style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '1.5rem 1.25rem 2rem', width: '100%', maxWidth: 520 }}
              >
                <div style={{ width: 40, height: 4, background: '#e0e0e0', borderRadius: 99, margin: '0 auto 1.25rem' }} />
                <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#1a1a2e', marginBottom: '0.25rem' }}>
                  ❌ Cancel Order #{String(cancelTarget._id).slice(-6).toUpperCase()}?
                </div>
                <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  This cannot be undone. Please tell us why.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  {CUSTOMER_CANCEL_REASONS.map(r => (
                    <button key={r} onClick={() => { setCancelReason(r); setCancelError(''); }}
                      style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: 12, border: cancelReason === r ? '2px solid #e63946' : '1.5px solid #f0f0f0', background: cancelReason === r ? '#fff5f5' : '#fafafa', cursor: 'pointer', fontWeight: cancelReason === r ? 700 : 400, color: cancelReason === r ? '#e63946' : '#444', fontSize: '0.9rem', fontFamily: "'Segoe UI', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {r}
                      {cancelReason === r && <span>✓</span>}
                    </button>
                  ))}
                </div>
                {cancelError && <div style={{ color: '#e63946', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{cancelError}</div>}
                <button onClick={confirmCancel} disabled={cancelling}
                  style={{ width: '100%', background: cancelling ? '#ccc' : 'linear-gradient(135deg,#e63946,#c1121f)', color: '#fff', border: 'none', borderRadius: '999px', padding: '0.85rem', fontWeight: 800, fontSize: '0.95rem', cursor: cancelling ? 'not-allowed' : 'pointer', marginBottom: '0.65rem', fontFamily: "'Segoe UI', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {cancelling ? <><div style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', borderTop: '2.5px solid #fff', animation: 'spin 0.7s linear infinite' }} /> Cancelling…</> : 'Confirm Cancellation'}
                </button>
                <button onClick={() => setCancelTarget(null)}
                  style={{ width: '100%', background: '#fff', color: '#555', border: '1.5px solid #e0e0e0', borderRadius: '999px', padding: '0.75rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                  Keep My Order
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Rating modal ── */}
        <AnimatePresence>
          {ratingTarget && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setRatingTarget(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: "'Segoe UI', system-ui, sans-serif" }}
            >
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                onClick={e => e.stopPropagation()}
                style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '1.5rem 1.25rem 2rem', width: '100%', maxWidth: 520 }}
              >
                <div style={{ width: 40, height: 4, background: '#e0e0e0', borderRadius: 99, margin: '0 auto 1.25rem' }} />
                <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#1a1a2e', marginBottom: '0.2rem' }}>
                  Rate your order
                </div>
                <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  {ratingTarget.restaurantId?.name || 'Restaurant'} · #{String(ratingTarget._id).slice(-6).toUpperCase()}
                </div>

                <StarPicker label="Overall experience *" value={ratingStars.overall} onChange={v => setRatingStars(p => ({ ...p, overall: v }))} />
                <StarPicker label="Food quality" value={ratingStars.food} onChange={v => setRatingStars(p => ({ ...p, food: v }))} />

                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#555', marginBottom: '0.35rem' }}>Comment (optional)</div>
                  <textarea
                    value={ratingComment}
                    onChange={e => setRatingComment(e.target.value)}
                    placeholder="Tell us about your experience…"
                    rows={3}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 14, border: '1.5px solid #e0e0e0', fontSize: '0.9rem', resize: 'vertical', outline: 'none', fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#1a1a2e', background: '#fafafa', boxSizing: 'border-box' }}
                  />
                </div>

                {ratingError && <div style={{ color: '#e63946', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{ratingError}</div>}

                <button onClick={submitRating} disabled={ratingLoading}
                  style={{ width: '100%', background: ratingLoading ? '#ccc' : 'linear-gradient(135deg,#ff6b00,#e63946)', color: '#fff', border: 'none', borderRadius: '999px', padding: '0.85rem', fontWeight: 800, fontSize: '0.95rem', cursor: ratingLoading ? 'not-allowed' : 'pointer', marginBottom: '0.65rem', fontFamily: "'Segoe UI', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {ratingLoading ? <><div style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', borderTop: '2.5px solid #fff', animation: 'spin 0.7s linear infinite' }} /> Submitting…</> : 'Submit Rating'}
                </button>
                <button onClick={() => setRatingTarget(null)}
                  style={{ width: '100%', background: '#fff', color: '#555', border: '1.5px solid #e0e0e0', borderRadius: '999px', padding: '0.75rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                  Skip
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </PageWrapper>
  );
}
