import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { popIn } from '../animations/variants';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ACTIVE_STATUSES = new Set(['placed', 'confirmed', 'preparing', 'ready', 'on_the_way']);

const HIDDEN_ON = ['/login', '/register', '/forgot-password', '/reset-password', '/onboarding', '/about', '/privacy', '/cookies', '/security'];
const HIDDEN_PREFIX = ['/restaurant/', '/rider/', '/admin/'];
const GRADIENT = 'linear-gradient(135deg, #ff6b00, #e63946)';

const HomeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const OrdersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
    <rect x="9" y="3" width="6" height="4" rx="1"/>
    <line x1="9" y1="12" x2="15" y2="12"/>
    <line x1="9" y1="16" x2="13" y2="16"/>
  </svg>
);
const ProfileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const NAV_ITEMS = [
  { label: 'Home',        path: '/',            Icon: HomeIcon },
  { label: 'Restaurants', path: '/restaurants', Icon: SearchIcon },
  { label: 'Orders',      path: '/orders',      Icon: OrdersIcon, badge: true },
  { label: 'Profile',     path: '/profile',     Icon: ProfileIcon },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [badgeCount, setBadgeCount] = useState(0);

  useEffect(() => {
    if (!user) { setBadgeCount(0); return; }
    api.get('/orders/my')
      .then(res => {
        const count = res.data.filter(o => ACTIVE_STATUSES.has(o.status)).length;
        setBadgeCount(count);
        localStorage.setItem('activeOrderCount', count);
      })
      .catch(() => {
        const fallback = parseInt(localStorage.getItem('activeOrderCount') || '0', 10);
        setBadgeCount(isNaN(fallback) ? 0 : fallback);
      });
  }, [location.pathname, user]);

  if (loading) return null;
  if (HIDDEN_ON.includes(location.pathname)) return null;
  if (HIDDEN_PREFIX.some((p) => location.pathname.startsWith(p))) return null;
  if (user && user.role !== 'customer') return null;

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, height: '64px',
      background: '#fff', borderTop: '1px solid #f0f0f0',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      zIndex: 1000, paddingBottom: 'env(safe-area-inset-bottom)',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {NAV_ITEMS.map(({ label, path, Icon, badge }) => {
        const active = isActive(path);
        return (
          <motion.button
            key={path}
            onClick={() => navigate(path)}
            whileTap={{ scale: 0.85, transition: { type: 'spring', stiffness: 600, damping: 25 } }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '3px', cursor: 'pointer', padding: '8px 16px',
              border: 'none', background: 'transparent', position: 'relative',
              color: active ? '#e63946' : '#bbb',
            }}
          >
            {/* Sliding active indicator */}
            <AnimatePresence>
              {active && (
                <motion.div
                  layoutId="navIndicator"
                  initial={false}
                  style={{
                    position: 'absolute', top: 0, left: '20%', right: '20%',
                    height: '3px', borderRadius: '0 0 4px 4px',
                    background: GRADIENT,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </AnimatePresence>

            {/* Icon with bounce on activate */}
            <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.span
                animate={active ? { y: [0, -6, 0] } : { y: 0 }}
                transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                style={{ display: 'flex', willChange: 'transform' }}
              >
                <Icon />
              </motion.span>

              {/* Badge */}
              <AnimatePresence>
                {badge && badgeCount > 0 && (
                  <motion.span
                    key="badge"
                    variants={popIn}
                    initial="hidden"
                    animate="visible"
                    exit={{ scale: 0, opacity: 0 }}
                    style={{
                      position: 'absolute', top: '-4px', right: '-4px',
                      background: GRADIENT, color: '#fff',
                      fontSize: '10px', fontWeight: 700, borderRadius: '50%',
                      minWidth: '18px', height: '18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid #fff', lineHeight: 1,
                    }}
                  >
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>

            <span style={{
              fontSize: '10px', fontWeight: active ? 600 : 400,
              color: active ? '#e63946' : '#aaa', lineHeight: 1,
            }}>
              {label}
            </span>
          </motion.button>
        );
      })}
    </nav>
  );
}
