import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import socket from '../services/socket';
import PageWrapper from '../components/PageWrapper';
import LiveMap from '../components/LiveMap';
import Icon from '../components/Icon';
import { stagger, slideInLeft, fadeUp } from '../animations/variants';

const STATUS_LABELS = {
  placed: 'Order placed — waiting for restaurant',
  confirmed: 'Restaurant accepted! Preparing your food.',
  preparing: 'Your food is being cooked right now.',
  ready: 'Food ready! Rider is heading to collect it.',
  on_the_way: 'Your rider is on the way!',
  delivered: 'Delivered! Enjoy your meal.',
  cancelled: 'Order cancelled.',
};

const STEPS = [
  { key: 'placed',     icon: 'clipboard', label: 'Order Placed',  desc: 'Waiting for restaurant to confirm' },
  { key: 'confirmed',  icon: 'check',     label: 'Confirmed',     desc: 'Restaurant accepted your order' },
  { key: 'preparing',  icon: 'chef',      label: 'Preparing',     desc: 'Your food is being cooked' },
  { key: 'ready',      icon: 'box',       label: 'Ready',         desc: 'Packed and waiting for rider' },
  { key: 'on_the_way', icon: 'scooter',   label: 'On the Way',    desc: 'Rider is heading to you' },
  { key: 'delivered',  icon: 'party',     label: 'Delivered',     desc: 'Enjoy your meal!' },
];

const CONFETTI_COLORS = ['#ff6b00', '#e63946', '#ffd700', '#1D9E75', '#fff'];
const GRADIENT = 'linear-gradient(135deg, #ff6b00, #e63946)';
const SHIMMER = { background: 'linear-gradient(90deg, #efefef 25%, #f5f5f5 50%, #efefef 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: '8px' };
const KEYFRAMES = `@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`;

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animatingStep, setAnimatingStep] = useState(null);
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [confetti, setConfetti] = useState([]);
  const [showCancelModal, setShowCancelModal]   = useState(false);
  const [cancelReason, setCancelReason]         = useState('');
  const [cancelling, setCancelling]             = useState(false);
  const [cancelError, setCancelError]           = useState('');

  async function fetchOrder() {
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data); setStatus(res.data.status || '');
    } catch { setError('Could not load order.'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    fetchOrder();
    socket.connect();
    socket.on('order:statusUpdate', ({ orderId, status: s }) => {
      if (orderId !== id) return;
      setStatus(s); setAnimatingStep(s);
      setTimeout(() => setAnimatingStep(null), 1500);
      if (s === 'delivered' || s === 'cancelled') {
        const current = parseInt(localStorage.getItem('activeOrderCount') || '0');
        localStorage.setItem('activeOrderCount', Math.max(0, current - 1));
      }
    });
    return () => socket.disconnect();
  }, [id]);

  // Framer Motion confetti
  useEffect(() => {
    if (status !== 'delivered') return;
    const items = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      startX: Math.random() * window.innerWidth,
      endX: (Math.random() - 0.5) * 400,
      delay: Math.random() * 0.8,
      duration: 2 + Math.random() * 1.5,
      rotate: Math.random() * 720,
      isRect: Math.random() > 0.5,
    }));
    setConfetti(items);
    const t = setTimeout(() => setConfetti([]), 5000);
    return () => clearTimeout(t);
  }, [status]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f8f8', fontFamily: "'Segoe UI', system-ui, sans-serif", paddingBottom: '96px' }}>
        <style>{KEYFRAMES}</style>
        <div style={{ background: GRADIENT, padding: '1.5rem 2rem 2.5rem' }}>
          <div style={{ ...SHIMMER, width: '60px', height: '18px', marginBottom: '1rem', opacity: 0.4 }} />
          <div style={{ ...SHIMMER, width: '180px', height: '28px', marginBottom: '0.5rem', opacity: 0.4 }} />
          <div style={{ ...SHIMMER, width: '90px', height: '14px', opacity: 0.3 }} />
        </div>
        <div style={{ background: '#fff', borderRadius: '18px', margin: '-1.25rem 1rem 0', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: '1.25rem', position: 'relative', zIndex: 1 }}>
          <div style={{ ...SHIMMER, height: '64px', borderRadius: '12px' }} />
        </div>
        <div style={{ background: '#fff', borderRadius: '18px', margin: '1.5rem 1rem 0', padding: '1.25rem', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: i < 4 ? '1.25rem' : 0 }}>
              <div style={{ ...SHIMMER, width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ ...SHIMMER, height: '16px', width: '60%' }} />
            </div>
          ))}
        </div>
        <div style={{ ...SHIMMER, height: '180px', borderRadius: '18px', margin: '1rem' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f8f8', fontFamily: "'Segoe UI', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ background: '#fff5f5', border: '1px solid #fcc', borderRadius: '18px', padding: '2.5rem 2rem', textAlign: 'center', maxWidth: '480px', width: '100%' }}>
          <div style={{ marginBottom: '0.75rem' }}><Icon name="warning" size={48} color="#c1121f" strokeWidth={2} /></div>
          <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#c1121f', marginBottom: '0.5rem' }}>Could not load order</div>
          <div style={{ color: '#666', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>{error}</div>
          <motion.button onClick={fetchOrder} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{ background: GRADIENT, color: '#fff', border: 'none', borderRadius: '999px', padding: '0.65rem 1.75rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
            Retry
          </motion.button>
        </div>
      </div>
    );
  }

  const canCancel = ['placed', 'confirmed'].includes(status);

  const CANCEL_REASONS = [
    'Changed my mind',
    'Ordered by mistake',
    'Taking too long to confirm',
    'Found a better option',
    'Other',
  ];

  async function handleCancel() {
    if (!cancelReason) { setCancelError('Please select a reason.'); return; }
    setCancelling(true); setCancelError('');
    try {
      await api.put(`/orders/${id}/cancel`, { reason: cancelReason });
      setStatus('cancelled');
      setShowCancelModal(false);
      setCancelReason('');
      const current = parseInt(localStorage.getItem('activeOrderCount') || '0');
      localStorage.setItem('activeOrderCount', Math.max(0, current - 1));
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Cancellation failed. Try again.');
    } finally { setCancelling(false); }
  }

  const displaySteps = status === 'cancelled'
    ? [...STEPS.slice(0, -1), { key: 'cancelled', icon: 'x', label: 'Cancelled', desc: 'Order was cancelled' }]
    : STEPS;

  const currentStepIndex = displaySteps.findIndex((s) => s.key === status);
  const shortId = id.slice(-6).toUpperCase();

  const getBannerContent = () => {
    switch (status) {
      case 'on_the_way': return { icon: 'scooter',   title: 'Almost there!',      sub: 'Your rider is on the way', showRider: true };
      case 'preparing':  return { icon: 'chef',      title: 'Being prepared...',  sub: order?.restaurantId?.name || 'Restaurant is cooking your order' };
      case 'placed':     return { icon: 'clipboard', title: 'Order received!',    sub: 'Waiting for restaurant confirmation' };
      case 'confirmed':  return { icon: 'check',     title: 'Order confirmed!',   sub: 'Restaurant is getting started' };
      case 'ready':      return { icon: 'box',       title: 'Food is ready!',     sub: 'A rider is about to pick it up' };
      case 'delivered':  return { icon: 'party',     title: 'Delivered!',         sub: 'Enjoy your meal. Asante!' };
      case 'cancelled':  return { icon: 'x',         title: 'Order Cancelled',    sub: 'See refund details below' };
      default:           return { icon: 'clock',     title: STATUS_LABELS[status] || 'Processing…', sub: '' };
    }
  };

  const banner = getBannerContent();

  return (
    <PageWrapper>
      <div style={{ minHeight: '100vh', background: '#f8f8f8', fontFamily: "'Segoe UI', system-ui, sans-serif", paddingBottom: '96px', color: '#1a1a2e' }}>
        <style>{KEYFRAMES}</style>

        {/* Framer Motion Confetti */}
        <AnimatePresence>
          {confetti.map((c) => (
            <motion.div
              key={c.id}
              style={{ position: 'fixed', top: '-20px', left: c.startX, width: c.isRect ? '4px' : '8px', height: c.isRect ? '16px' : '8px', background: c.color, borderRadius: c.isRect ? '2px' : '50%', pointerEvents: 'none', zIndex: 9999, willChange: 'transform' }}
              initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
              animate={{ y: window.innerHeight + 50, x: c.endX, opacity: [1, 1, 0], rotate: c.rotate }}
              transition={{ duration: c.duration, ease: [0.25, 0.46, 0.45, 0.94], delay: c.delay }}
            />
          ))}
        </AnimatePresence>

        {/* Header */}
        <div style={{ background: GRADIENT, padding: '1.5rem 2rem 2.5rem' }}>
          <button onClick={() => navigate('/orders')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '999px', padding: '0.4rem 1rem', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '1rem', display: 'inline-block', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
            ← Back
          </button>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.75rem', lineHeight: 1.2 }}>Tracking Order</div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', marginTop: '0.25rem' }}>#{shortId}</div>
        </div>

        {/* ETA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 30 }}
          style={{ background: '#fff', borderRadius: '18px', margin: '-1.25rem 1rem 0', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: '1.25rem 1.5rem', position: 'relative', zIndex: 1 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: GRADIENT, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={banner.icon} size={30} color="#fff" strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1a1a2e' }}>{banner.title}</div>
              <div style={{ color: '#888', fontSize: '0.85rem', marginTop: '2px' }}>{banner.sub}</div>
              {status === 'on_the_way' && order?.rider?.name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.85rem', color: '#555' }}>
                  <span>Rider: <strong>{order.rider.name}</strong></span>
                  <span style={{ color: '#ff6b00', fontWeight: 700 }}>★ 4.9</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Rating card */}
        <AnimatePresence>
          {status === 'delivered' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.2 }}
              style={{ background: '#fff', borderRadius: '18px', margin: '1.5rem 1rem 0', padding: '1.5rem', textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}
            >
              <div style={{ display: 'inline-flex', width: 64, height: 64, borderRadius: 16, background: GRADIENT, color: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <Icon name="party" size={36} color="#fff" strokeWidth={2.2} />
              </div>
              <div style={{ fontWeight: 900, fontSize: '1.25rem', marginBottom: '0.25rem' }}>Delivered! Enjoy your meal.</div>
              <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem' }}>How was your experience?</div>
              {rated ? (
                <div style={{ color: '#1a7a45', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="check" size={18} color="#1a7a45" strokeWidth={2.4} /> Thanks for your feedback! Asante.
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '0.75rem' }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.span
                        key={i}
                        onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
                        onClick={() => setRating(i)}
                        whileHover={{ scale: 1.3, rotate: 15, transition: { type: 'spring', stiffness: 600 } }}
                        whileTap={{ scale: 0.9 }}
                        animate={rating === i ? { scale: [1, 1.4, 1], transition: { type: 'spring', stiffness: 600 } } : {}}
                        style={{ fontSize: '2rem', cursor: 'pointer', color: i <= (hover || rating) ? '#ff6b00' : '#ddd', display: 'inline-block' }}
                      >
                        {i <= (hover || rating) ? '★' : '☆'}
                      </motion.span>
                    ))}
                  </div>
                  {rating > 0 && (
                    <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tell us more (optional)..." rows={3}
                      style={{ width: '100%', borderRadius: '12px', border: '1.5px solid #e0e0e0', padding: '0.75rem', fontSize: '0.9rem', resize: 'none', fontFamily: "'Segoe UI', system-ui, sans-serif", outline: 'none', boxSizing: 'border-box', marginBottom: '0.75rem' }}
                    />
                  )}
                  {rating > 0 && (
                    <motion.button
                      onClick={async () => { try { await api.post(`/orders/${id}/rating`, { rating, comment }); } catch {} setRated(true); }}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      style={{ width: '100%', background: GRADIENT, color: '#fff', border: 'none', borderRadius: '999px', padding: '0.75rem', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: "'Segoe UI', system-ui, sans-serif" }}
                    >
                      Submit Review
                    </motion.button>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline */}
        <motion.div
          style={{ background: '#fff', borderRadius: '18px', margin: '1rem', padding: '1.25rem', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#888', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '1rem' }}>Order Progress</div>
          {displaySteps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isActive    = step.key === status;
            const isLast      = idx === displaySteps.length - 1;
            const isAnimating = animatingStep === step.key;

            return (
              <motion.div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }} variants={slideInLeft}>
                <div style={{ width: '32px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    {/* Active pulse ring */}
                    {isActive && (
                      <motion.div
                        style={{ position: 'absolute', inset: '-6px', borderRadius: '50%', border: '2px solid #ff6b00', pointerEvents: 'none', willChange: 'transform' }}
                        animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}
                    <motion.div
                      style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: isCompleted ? GRADIENT : isActive ? '#fff' : '#f0f0f0', border: isActive ? '2.5px solid #ff6b00' : 'none', boxSizing: 'border-box' }}
                      animate={isAnimating ? { backgroundColor: ['#fff3e0', '#ffffff', '#fff3e0', '#ffffff'] } : {}}
                      transition={isAnimating ? { duration: 0.6 } : {}}
                    >
                      {isCompleted ? (
                        <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 600, damping: 20 }} style={{ display: 'inline-flex' }}>
                          <Icon name="check" size={16} color="#fff" strokeWidth={3} />
                        </motion.span>
                      ) : (
                        <Icon name={step.icon} size={16} color={isActive ? '#ff6b00' : '#aaa'} strokeWidth={2} />
                      )}
                    </motion.div>
                  </div>
                  {!isLast && <div style={{ width: '2px', flex: 1, minHeight: '24px', margin: '4px 0', background: isCompleted ? '#ff6b00' : '#e0e0e0', transition: 'background 0.3s' }} />}
                </div>
                <div style={{ flex: 1, paddingBottom: isLast ? 0 : '20px' }}>
                  {isActive ? (
                    <div style={{ background: '#fff3e0', borderRadius: '12px', padding: '8px 12px', borderLeft: '3px solid #ff6b00' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a1a2e' }}>{step.label}</div>
                      <div style={{ fontSize: '0.82rem', color: '#aaa', marginTop: '2px' }}>{step.desc}</div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontWeight: isCompleted ? 500 : 400, fontSize: '0.95rem', color: isCompleted ? '#555' : '#aaa' }}>{step.label}</div>
                      <div style={{ fontSize: '0.82rem', color: '#aaa', marginTop: '2px' }}>{step.desc}</div>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Live tracking map — shown once a rider is assigned */}
        {(status === 'ready' || status === 'on_the_way' || status === 'preparing') && order?.riderId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ margin: '0 1rem' }}>
            <LiveMap
              riderId={order.riderId?._id || order.riderId}
              initialRiderPosition={
                order.riderId?.currentLocation?.lat != null && order.riderId?.currentLocation?.lng != null
                  ? [order.riderId.currentLocation.lat, order.riderId.currentLocation.lng]
                  : null
              }
              restaurantPosition={
                order.restaurantId?.location?.lat != null && order.restaurantId?.location?.lng != null
                  ? [order.restaurantId.location.lat, order.restaurantId.location.lng]
                  : null
              }
              height={220}
            />
          </motion.div>
        )}

        {/* Order summary */}
        <div style={{ background: '#fff', borderRadius: '18px', margin: '1rem', padding: '1.25rem', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.75rem' }}>Your Order</div>
          {order ? (
            <>
              {order.restaurantId?.name && <div style={{ fontWeight: 700, color: '#ff6b00', marginBottom: '0.75rem', fontSize: '0.95rem' }}>{order.restaurantId.name}</div>}
              {order.items?.length > 0 && (
                <>
                  {order.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <span>{item.qty ?? item.quantity ?? 1}× {item.name}</span>
                      <span style={{ color: '#555' }}>TSh {((item.price ?? 0) * (item.qty ?? item.quantity ?? 1)).toLocaleString()}</span>
                    </div>
                  ))}
                  <div style={{ height: '1px', background: '#f0f0f0', margin: '0.75rem 0' }} />
                </>
              )}
              {order.deliveryFee != null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                  <span>Delivery</span><span>TSh {order.deliveryFee.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', color: '#1a1a2e' }}>
                <span>Total</span><span>TSh {order.total?.toLocaleString()}</span>
              </div>
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f0f0f0', fontSize: '0.85rem', color: '#888' }}>Paid via {order.paymentMethod ?? 'M-Pesa'}</div>
            </>
          ) : <div style={{ color: '#aaa', fontSize: '0.9rem' }}>Order details unavailable.</div>}
        </div>

        {/* Cancel order button — only while cancellable */}
        {canCancel && (
          <div style={{ margin: '1rem 1rem 0' }}>
            <button
              onClick={() => { setShowCancelModal(true); setCancelReason(''); setCancelError(''); }}
              style={{ width: '100%', background: '#fff', color: '#e63946', border: '1.5px solid #e63946', borderRadius: '999px', padding: '0.7rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: "'Segoe UI', system-ui, sans-serif" }}
            >
              Cancel Order
            </button>
          </div>
        )}

        {/* Support row */}
        <div style={{ display: 'flex', gap: '0.75rem', margin: '1rem 1rem 0' }}>
          <a href={`https://wa.me/255700000000?text=Hi%2C%20my%20order%20is%20%23${shortId}`} target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, background: '#25D366', color: '#fff', borderRadius: '999px', padding: '0.65rem', fontWeight: 700, fontSize: '0.875rem', textAlign: 'center', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
            <Icon name="chat" size={16} color="#fff" strokeWidth={2.2} /> WhatsApp Support
          </a>
          {order?.rider?.phone && (
            <a href={`tel:${order.rider.phone}`}
              style={{ flex: 1, background: '#fff', color: '#555', border: '1.5px solid #ddd', borderRadius: '999px', padding: '0.65rem', fontWeight: 700, fontSize: '0.875rem', textAlign: 'center', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
              <Icon name="phone" size={16} color="#555" strokeWidth={2.2} /> Call Rider
            </a>
          )}
        </div>
        {/* Cancel modal */}
        <AnimatePresence>
          {showCancelModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCancelModal(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: "'Segoe UI', system-ui, sans-serif" }}
            >
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                onClick={e => e.stopPropagation()}
                style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '1.5rem 1.25rem 2rem', width: '100%', maxWidth: 520 }}
              >
                <div style={{ width: 40, height: 4, background: '#e0e0e0', borderRadius: 99, margin: '0 auto 1.25rem' }} />
                <div style={{ display: 'inline-flex', width: 36, height: 36, borderRadius: 10, background: '#fff5f5', color: '#e63946', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                  <Icon name="x" size={20} color="#e63946" strokeWidth={2.4} />
                </div>
                <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#1a1a2e', marginBottom: '0.25rem' }}>Cancel this order?</div>
                <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  This cannot be undone. Please tell us why.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  {CANCEL_REASONS.map(r => (
                    <button key={r} onClick={() => { setCancelReason(r); setCancelError(''); }}
                      style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: 12, border: cancelReason === r ? '2px solid #e63946' : '1.5px solid #f0f0f0', background: cancelReason === r ? '#fff5f5' : '#fafafa', cursor: 'pointer', fontWeight: cancelReason === r ? 700 : 400, color: cancelReason === r ? '#e63946' : '#444', fontSize: '0.9rem', fontFamily: "'Segoe UI', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {r}
                      {cancelReason === r && <Icon name="check" size={16} color="#e63946" strokeWidth={3} />}
                    </button>
                  ))}
                </div>

                {cancelError && <div style={{ color: '#e63946', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{cancelError}</div>}

                <button onClick={handleCancel} disabled={cancelling}
                  style={{ width: '100%', background: cancelling ? '#ccc' : 'linear-gradient(135deg,#e63946,#c1121f)', color: '#fff', border: 'none', borderRadius: '999px', padding: '0.85rem', fontWeight: 800, fontSize: '0.95rem', cursor: cancelling ? 'not-allowed' : 'pointer', marginBottom: '0.65rem', fontFamily: "'Segoe UI', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {cancelling ? <><div style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', borderTop: '2.5px solid #fff', animation: 'spin 0.8s linear infinite' }} /> Cancelling…</> : 'Confirm Cancellation'}
                </button>
                <button onClick={() => setShowCancelModal(false)}
                  style={{ width: '100%', background: '#fff', color: '#555', border: '1.5px solid #e0e0e0', borderRadius: '999px', padding: '0.75rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                  Keep My Order
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </PageWrapper>
  );
}
