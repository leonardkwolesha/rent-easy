import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import KebiteLogo from '../../components/KebiteLogo';
import AvatarPicker from '../../components/AvatarPicker';
import LanguageToggle from '../../components/LanguageToggle';

const GRADIENT = 'linear-gradient(135deg, #ff6b00, #e63946)';
const BLUE = '#185FA5';
const DARK = '#1a1a2e';
const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
const DSM_CENTER = { lat: -6.7924, lng: 39.2083 };

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
    Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function StatCard({ icon, label, value }) {
  return (
    <div style={{ background: '#fff', borderRadius: '14px', padding: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', flex: 1, minWidth: '120px', textAlign: 'center' }}>
      <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <div style={{ fontSize: '0.7rem', color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontWeight: 900, color: DARK, fontSize: '1.1rem', marginTop: '2px' }}>{value}</div>
    </div>
  );
}

function MapSection({ currentLocation, activeOrder }) {
  if (!MAPS_KEY) {
    return (
      <div style={{ height: '55vw', maxHeight: '340px', background: 'linear-gradient(135deg, #e8f4fd, #dbeafe)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <IconMap size={42} color="#7793b8" />
        <div style={{ fontWeight: 700, color: '#555' }}>Map unavailable</div>
        <div style={{ fontSize: '0.8rem', color: '#888', textAlign: 'center', padding: '0 2rem' }}>Add VITE_GOOGLE_MAPS_KEY to client/.env to enable live map</div>
      </div>
    );
  }

  return (
    <div style={{ height: '55vw', maxHeight: '340px', position: 'relative' }}>
      <iframe
        title="rider-map"
        width="100%"
        height="100%"
        style={{ border: 'none', display: 'block' }}
        src={`https://maps.googleapis.com/maps/api/staticmap?center=${
          currentLocation ? `${currentLocation.lat},${currentLocation.lng}` : `${DSM_CENTER.lat},${DSM_CENTER.lng}`
        }&zoom=14&size=600x340&markers=color:blue%7C${
          currentLocation ? `${currentLocation.lat},${currentLocation.lng}` : `${DSM_CENTER.lat},${DSM_CENTER.lng}`
        }&key=${MAPS_KEY}`}
      />
      <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(255,255,255,0.9)', borderRadius: '8px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, color: DARK, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <IconPin size={13} color="#ff6b00" />
        {currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : 'Dar es Salaam'}
      </div>
    </div>
  );
}

function openInMaps(lat, lng) {
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank');
}

function getInitials(name = '') {
  const parts = name.trim().split(' ').filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const ico = { default: { width: 18, height: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } };

const IconBike = ({ size = 22, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5.5" cy="17.5" r="3.5" /><circle cx="18.5" cy="17.5" r="3.5" />
    <path d="M15 6h4l2 6" /><path d="M5 17.5L9 9h6l3 8.5" /><path d="M9 9V6" />
  </svg>
);
const IconCash = ({ size = 22, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" />
    <path d="M6 12h.01M18 12h.01" />
  </svg>
);
const IconStarSolid = ({ size = 22, color = '#f59e0b' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IconTrend = ({ size = 22, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
);
const IconPackage = ({ size = 18, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);
const IconPin = ({ size = 18, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const IconUser = ({ size = 18, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IconClock = ({ size = 18, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconCheck = ({ size = 18, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconSearch = ({ size = 28, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconPhone = ({ size = 16, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
  </svg>
);
const IconChat = ({ size = 16, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);
const IconLock = ({ size = 36, color = '#1a7a45' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IconMap = ({ size = 36, color = '#888' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);
const IconBag = ({ size = 36, color = '#888' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

function timeAgo(dt) {
  const diff = Math.floor((Date.now() - new Date(dt)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

const PAYMENT_LABELS = { mpesa: 'M-Pesa', airtel: 'Airtel Money', tigo: 'Mixx by Yas', cash: 'Cash on Delivery', wallet: 'Wallet', card: 'Card' };

export default function RiderDashboard() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('deliveries');
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [pwSheet, setPwSheet] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwVisible, setPwVisible] = useState({ current: false, new: false, confirm: false });
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable || false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acceptingOrder, setAcceptingOrder] = useState(null);
  const [markingDelivered, setMarkingDelivered] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const watchIdRef = useRef(null);
  const lastLocationSent = useRef(0);

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  }

  const fetchData = useCallback(async () => {
    try {
      const [oRes, aRes] = await Promise.all([
        api.get('/rider/orders/available'),
        api.get('/rider/analytics'),
      ]);
      setAvailableOrders(oRes.data);
      setAnalytics(aRes.data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (!isAvailable) {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCurrentLocation({ lat, lng });
        const now = Date.now();
        if (now - lastLocationSent.current > 10000) {
          lastLocationSent.current = now;
          api.put('/rider/me/location', { lat, lng }).catch(() => {});
        }
      },
      (err) => console.warn('Location error:', err),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [isAvailable]);

  async function toggleAvailability() {
    const next = !isAvailable;
    try {
      await api.put('/rider/me/availability', { isAvailable: next });
      setIsAvailable(next);
      showToast(next ? '🟢 You are now available' : '⚫ You are now offline');
    } catch {}
  }

  async function acceptOrder(order) {
    setAcceptingOrder(order._id);
    try {
      const res = await api.put(`/rider/orders/${order._id}/accept`);
      setActiveOrder(res.data);
      setAvailableOrders([]);
      showToast('✅ Order accepted! Head to pickup.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not accept order');
    } finally { setAcceptingOrder(null); }
  }

  async function markDelivered() {
    if (!activeOrder) return;
    setMarkingDelivered(true);
    try {
      await api.put(`/rider/orders/${activeOrder._id}/delivered`);
      setActiveOrder(null);
      fetchData();
      showToast('🎉 Delivery complete! Great job');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not mark delivered');
    } finally { setMarkingDelivered(false); }
  }

  function startEdit(field) {
    setEditField(field);
    setEditValue(user?.[field] ?? '');
    setEditError('');
  }

  async function saveEdit() {
    if (!editValue.trim()) { setEditError('Cannot be empty'); return; }
    setEditLoading(true); setEditError('');
    try {
      await api.put('/users/me', { [editField]: editValue.trim() });
      await refreshUser();
      setEditField(null);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Update failed');
    } finally { setEditLoading(false); }
  }

  function resetPwState() {
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setPwError(''); setPwSuccess(false); setPwLoading(false);
  }

  function openPwSheet() {
    resetPwState();
    setPwSheet(true);
  }

  function closePwSheet() {
    if (pwLoading) return;
    setPwSheet(false);
    resetPwState();
  }

  async function handleChangePw(e) {
    e.preventDefault();
    setPwError('');
    if (!currentPw) { setPwError('Enter your current password.'); return; }
    if (newPw.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    if (newPw === currentPw) { setPwError('New password must be different from current password.'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    setPwLoading(true);
    try {
      await api.post('/users/me/change-password', { currentPassword: currentPw, newPassword: newPw });
      setPwSuccess(true);
      setTimeout(() => { setPwSheet(false); resetPwState(); }, 1800);
    } catch (err) {
      setPwError(err.response?.data?.message || 'Could not update password.');
    } finally { setPwLoading(false); }
  }

  const restaurant = activeOrder?.restaurantId;
  const customer = activeOrder?.userId;

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: '100vh', background: '#f8f8f8' }}>
      {/* Top bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '56px', background: GRADIENT, zIndex: 1000, display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '10px' }}>
        <KebiteLogo variant="white" size="sm" />
        <div style={{ flex: 1, textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>Rider Dashboard</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isAvailable ? '#4ade80' : 'rgba(255,255,255,0.4)' }} />
          <span style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 600 }}>{isAvailable ? 'Available' : 'Offline'}</span>
          <button
            onClick={toggleAvailability}
            style={{ width: '40px', height: '22px', borderRadius: '999px', border: 'none', cursor: 'pointer', background: isAvailable ? '#4ade80' : 'rgba(255,255,255,0.3)', position: 'relative', marginLeft: '4px' }}>
            <div style={{ position: 'absolute', top: '3px', left: isAvailable ? '20px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
          </button>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>Out</button>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ position: 'fixed', top: '66px', left: '50%', transform: 'translateX(-50%)', background: DARK, color: '#fff', borderRadius: '999px', padding: '0.5rem 1.25rem', zIndex: 2000, fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ paddingTop: '56px' }}>
        {/* Map */}
        <MapSection currentLocation={currentLocation} activeOrder={activeOrder} />

        {/* Content panel — slides up over map */}
        <div style={{ background: '#f8f8f8', borderRadius: '18px 18px 0 0', marginTop: '-18px', position: 'relative', zIndex: 10 }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', background: '#fff', borderRadius: '18px 18px 0 0', padding: '0 1rem' }}>
            {[
              { key: 'deliveries', label: 'Deliveries', Icon: IconBike },
              { key: 'profile',    label: 'Profile',    Icon: IconUser },
            ].map(({ key, label, Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                style={{ flex: 1, padding: '0.9rem 0', background: 'none', border: 'none', borderBottom: activeTab === key ? '2.5px solid #ff6b00' : '2.5px solid transparent', color: activeTab === key ? '#ff6b00' : '#888', fontWeight: activeTab === key ? 700 : 500, fontSize: '0.88rem', cursor: 'pointer', fontFamily: "'Segoe UI', system-ui, sans-serif", transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Icon size={16} color={activeTab === key ? '#ff6b00' : '#888'} />
                {label}
              </button>
            ))}
          </div>

          <div style={{ padding: '1.25rem 1rem' }}>
          {activeTab === 'deliveries' && (<>
          {loading && <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>Loading…</div>}

          {/* Active Order */}
          {activeOrder && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#fff', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.1)', marginBottom: '1rem' }}>
              <div style={{ background: GRADIENT, padding: '0.85rem 1.25rem', color: '#fff', fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconBike size={20} color="#fff" /><span>Active Delivery</span>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ color: '#ff6b00', flexShrink: 0, marginTop: '2px' }}><IconPackage size={20} color="#ff6b00" /></span>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>Pickup</div>
                    <div style={{ fontWeight: 700, color: DARK }}>{restaurant?.name || 'Restaurant'}</div>
                    <div style={{ fontSize: '0.82rem', color: '#666' }}>{restaurant?.location?.address || restaurant?.location?.area || '—'}</div>
                    {restaurant?.location?.lat && (
                      <button onClick={() => openInMaps(restaurant.location.lat, restaurant.location.lng)} style={{ background: 'none', border: 'none', color: '#185FA5', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', padding: '2px 0', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>Open in Maps →</button>
                    )}
                  </div>
                </div>
                <div style={{ height: '1px', background: '#f0f0f0', marginBottom: '0.75rem' }} />
                <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', alignItems: 'flex-start' }}>
                  <span style={{ color: '#185FA5', flexShrink: 0, marginTop: '2px' }}><IconPin size={20} color="#185FA5" /></span>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>Deliver to</div>
                    <div style={{ fontWeight: 700, color: DARK }}>{customer?.name || 'Customer'}</div>
                    <div style={{ fontSize: '0.82rem', color: '#666' }}>{activeOrder.deliveryAddress?.street || activeOrder.deliveryAddress?.area || '—'}</div>
                  </div>
                </div>
                {customer?.phone && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <a href={`tel:${customer.phone}`} style={{ flex: 1, background: '#f0f0f0', color: DARK, borderRadius: '999px', padding: '0.5rem', textAlign: 'center', textDecoration: 'none', fontWeight: 700, fontSize: '0.82rem', fontFamily: "'Segoe UI', system-ui, sans-serif", display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <IconPhone size={14} color={DARK} /> Call Customer
                    </a>
                    <a href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, background: '#25D366', color: '#fff', borderRadius: '999px', padding: '0.5rem', textAlign: 'center', textDecoration: 'none', fontWeight: 700, fontSize: '0.82rem', fontFamily: "'Segoe UI', system-ui, sans-serif", display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <IconChat size={14} color="#fff" /> WhatsApp
                    </a>
                  </div>
                )}
                <button onClick={markDelivered} disabled={markingDelivered}
                  style={{ width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', border: 'none', borderRadius: '999px', fontWeight: 800, fontSize: '0.95rem', cursor: markingDelivered ? 'not-allowed' : 'pointer', opacity: markingDelivered ? 0.7 : 1, fontFamily: "'Segoe UI', system-ui, sans-serif", display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <IconCheck size={18} color="#fff" />
                  {markingDelivered ? 'Marking…' : 'Mark as Delivered'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Available Orders */}
          {!activeOrder && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: DARK, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconPackage size={20} color="#ff6b00" />
                <span>Orders Available Near You</span>
                {availableOrders.length > 0 && <span style={{ background: '#fff3e0', color: '#ff6b00', borderRadius: '999px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700 }}>{availableOrders.length}</span>}
              </div>
              {!loading && availableOrders.length === 0 && (
                <div style={{ background: '#fff', borderRadius: '18px', padding: '2.5rem', textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
                  <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}><IconSearch size={32} color="#bbb" /></div>
                  <div style={{ fontWeight: 700, color: '#888' }}>{isAvailable ? 'No orders available right now' : 'Go online to see available orders'}</div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {availableOrders.map((order) => {
                  const rest = order.restaurantId;
                  const distKm = currentLocation && rest?.location?.lat
                    ? haversineKm(currentLocation, { lat: rest.location.lat, lng: rest.location.lng }).toFixed(1)
                    : null;
                  const eta = distKm ? Math.ceil(distKm / 30 * 60) : null;
                  const itemCount = (order.items || []).reduce((s, it) => s + (it.quantity || 1), 0);
                  return (
                    <motion.div key={order._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem', gap: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 800, color: DARK }}>{rest?.name || 'Restaurant'}</div>
                          <div style={{ fontSize: '0.72rem', color: '#aaa', marginTop: '2px', fontFamily: 'monospace' }}>#{order._id.slice(-6).toUpperCase()}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {distKm && <div style={{ fontSize: '0.78rem', color: '#888', fontWeight: 600 }}>{distKm} km away</div>}
                          <div style={{ fontSize: '0.72rem', color: '#aaa', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <IconClock size={11} color="#aaa" /> {timeAgo(order.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#666', marginBottom: '4px' }}>
                        <IconPackage size={14} color="#ff6b00" />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Pickup: {rest?.location?.address || rest?.location?.area || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#666', marginBottom: '4px' }}>
                        <IconPin size={14} color="#185FA5" />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Drop: {order.deliveryAddress?.street || order.deliveryAddress?.area || order.deliveryAddress?.city || 'Dar es Salaam'}</span>
                      </div>
                      {order.userId?.name && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#666', marginBottom: '4px' }}>
                          <IconUser size={14} color="#888" /><span>{order.userId.name}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '8px 0 12px' }}>
                        {itemCount > 0 && <span style={{ background: '#fff3ec', color: '#ff6b00', borderRadius: '999px', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>{itemCount} item{itemCount > 1 ? 's' : ''}</span>}
                        {order.total != null && <span style={{ background: '#eef9f3', color: '#0F6E56', borderRadius: '999px', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>Order TSh {order.total.toLocaleString()}</span>}
                        {order.paymentMethod && <span style={{ background: '#f0f0f5', color: '#555', borderRadius: '999px', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</span>}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f5f5f5', paddingTop: '10px' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>You earn</div>
                          <div style={{ fontWeight: 900, color: '#0F6E56', fontSize: '1.05rem' }}>TSh {order.deliveryFee?.toLocaleString() || '—'}</div>
                          {eta && <div style={{ fontSize: '0.72rem', color: '#aaa' }}>~{eta} min ride</div>}
                        </div>
                        <button onClick={() => acceptOrder(order)} disabled={acceptingOrder === order._id}
                          style={{ background: GRADIENT, color: '#fff', border: 'none', borderRadius: '999px', padding: '0.6rem 1.4rem', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', opacity: acceptingOrder === order._id ? 0.7 : 1, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                          {acceptingOrder === order._id ? '…' : 'Accept Order →'}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stats strip */}
          {analytics && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
              <StatCard icon={<IconBike color="#ff6b00" />}      label="Today"      value={analytics.todayDeliveries} />
              <StatCard icon={<IconCash color="#0F6E56" />}      label="Today (TSh)" value={analytics.todayEarnings.toLocaleString()} />
              <StatCard icon={<IconStarSolid />}                 label="Rating"     value={analytics.avgRating} />
              <StatCard icon={<IconTrend color="#185FA5" />}     label="Week (TSh)" value={analytics.weekEarnings.toLocaleString()} />
            </div>
          )}

          <div style={{ height: '2rem' }} />
          </>)}

          {/* ── Profile Tab ── */}
          {activeTab === 'profile' && (
            <div>
              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#fff', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', marginBottom: '1rem' }}>
                <AvatarPicker size={64} fontSize="1.5rem" background={GRADIENT} borderColor="rgba(255,107,0,0.25)" />
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem', color: DARK }}>{user?.name}</div>
                  <div style={{ fontSize: '0.82rem', color: '#888', marginTop: '2px' }}>{user?.email}</div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fff3ec', color: '#ff6b00', borderRadius: '999px', padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700, marginTop: '6px' }}>
                    <IconBike size={12} color="#ff6b00" /> Kebite Rider
                  </span>
                </div>
              </div>

              {/* Stats */}
              {analytics && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <StatCard icon={<IconBike color="#ff6b00" />}  label="Today"       value={analytics.todayDeliveries} />
                  <StatCard icon={<IconCash color="#0F6E56" />}  label="Today (TSh)" value={analytics.todayEarnings.toLocaleString()} />
                  <StatCard icon={<IconStarSolid />}             label="Rating"      value={analytics.avgRating} />
                  <StatCard icon={<IconTrend color="#185FA5" />} label="Week (TSh)"  value={analytics.weekEarnings.toLocaleString()} />
                </div>
              )}

              {/* Editable info */}
              <div style={{ background: '#fff', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, marginBottom: '0.5rem' }}>Personal Info</div>

                {['name', 'phone'].map((field) => (
                  <div key={field} style={{ padding: '0.75rem 0', borderBottom: '1px solid #f5f5f5' }}>
                    {editField === field ? (
                      <>
                        <div style={{ fontSize: '0.72rem', color: '#aaa', marginBottom: '6px', textTransform: 'capitalize' }}>{field}</div>
                        <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditField(null); }}
                          style={{ width: '100%', borderRadius: '12px', border: '1.5px solid #ff6b00', padding: '0.55rem 0.85rem', fontSize: '0.9rem', outline: 'none', fontFamily: "'Segoe UI', system-ui, sans-serif", boxSizing: 'border-box' }} />
                        {editError && <div style={{ color: '#e63946', fontSize: '0.75rem', marginTop: '4px' }}>{editError}</div>}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <button onClick={() => setEditField(null)} style={{ flex: 1, padding: '0.45rem', borderRadius: '999px', border: '1.5px solid #ddd', color: '#888', background: '#fff', cursor: 'pointer', fontWeight: 600, fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: '0.82rem' }}>Cancel</button>
                          <button onClick={saveEdit} disabled={editLoading} style={{ flex: 1, padding: '0.45rem', borderRadius: '999px', border: 'none', color: '#fff', background: editLoading ? '#ccc' : GRADIENT, cursor: editLoading ? 'default' : 'pointer', fontWeight: 700, fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: '0.82rem' }}>{editLoading ? 'Saving…' : 'Save'}</button>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#aaa', marginBottom: '2px', textTransform: 'capitalize' }}>{field}</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 500, color: DARK }}>{user?.[field] || <span style={{ color: '#ccc', fontStyle: 'italic' }}>Not set</span>}</div>
                        </div>
                        <button onClick={() => startEdit(field)} aria-label={`Edit ${field}`}
                          style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: '4px' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#ff6b00'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#ccc'; }}>
                          <PencilIcon />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Read-only email */}
                <div style={{ padding: '0.75rem 0', borderBottom: '1px solid #f5f5f5' }}>
                  <div style={{ fontSize: '0.72rem', color: '#aaa', marginBottom: '2px' }}>Email</div>
                  <div style={{ fontSize: '0.9rem', color: '#555' }}>{user?.email}</div>
                </div>

                {/* Password */}
                <div style={{ padding: '0.75rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f5f5f5' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#aaa', marginBottom: '2px' }}>Password</div>
                    <div style={{ fontSize: '0.9rem', color: DARK, letterSpacing: '0.15em' }}>●●●●●●●●</div>
                  </div>
                  <button onClick={openPwSheet}
                    style={{ background: 'none', border: 'none', color: '#ff6b00', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                    Change →
                  </button>
                </div>

                {/* Language */}
                <LanguageToggle />
              </div>

              <div style={{ height: '2rem' }} />
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Password bottom sheet */}
      {pwSheet && (
        <div onClick={closePwSheet}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '1.75rem', width: '100%', maxWidth: '480px', position: 'relative' }}>
            <div style={{ width: 40, height: 4, background: '#e0e0e0', borderRadius: 99, margin: '0 auto 1.25rem' }} />
            <button onClick={closePwSheet} aria-label="Close" disabled={pwLoading}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#aaa', cursor: pwLoading ? 'default' : 'pointer', fontSize: '1.4rem', lineHeight: 1, padding: '4px 8px', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>×</button>
            <div style={{ fontWeight: 900, fontSize: '1.1rem', color: DARK, marginBottom: '1.25rem' }}>Change Password</div>
            {pwSuccess ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔒</div>
                <div style={{ fontWeight: 700, color: '#1a7a45' }}>Password updated!</div>
              </div>
            ) : (
              <form onSubmit={handleChangePw}>
                {[['current', 'Current Password', currentPw, setCurrentPw], ['new', 'New Password', newPw, setNewPw], ['confirm', 'Confirm New Password', confirmPw, setConfirmPw]].map(([id, lbl, v, set]) => {
                  const visible = pwVisible[id];
                  return (
                    <div key={id} style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '6px', fontWeight: 600 }}>{lbl}</label>
                      <div style={{ position: 'relative' }}>
                        <input type={visible ? 'text' : 'password'} value={v} onChange={e => set(e.target.value)} placeholder="••••••••"
                          style={{ width: '100%', border: '1.5px solid #e0e0e0', borderRadius: '12px', padding: '0.7rem 2.5rem 0.7rem 0.85rem', fontSize: '0.9rem', outline: 'none', fontFamily: "'Segoe UI', system-ui, sans-serif", boxSizing: 'border-box' }} />
                        <button type="button" aria-label={visible ? 'Hide password' : 'Show password'}
                          onClick={() => setPwVisible(s => ({ ...s, [id]: !s[id] }))}
                          style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 0, display: 'flex', alignItems: 'center' }}>
                          {visible ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {pwError && <div style={{ color: '#e63946', fontSize: '0.8rem', marginBottom: '0.75rem', background: '#fff5f5', border: '1px solid #fcc', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>{pwError}</div>}
                <button type="submit" disabled={pwLoading}
                  style={{ width: '100%', background: pwLoading ? '#ccc' : GRADIENT, color: '#fff', border: 'none', borderRadius: '999px', padding: '0.8rem', fontWeight: 700, fontSize: '0.95rem', cursor: pwLoading ? 'default' : 'pointer', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                  {pwLoading ? 'Saving…' : 'Change Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
