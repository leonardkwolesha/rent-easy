import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const HIDDEN_ON = ['/login', '/register'];

const NAV_ITEMS = [
  { path: '/',            label: 'Home',        icon: '🏠' },
  { path: '/restaurants', label: 'Restaurants', icon: '🍽️' },
  { path: '/orders',      label: 'Orders',       icon: '📦', badge: true },
  { path: '/profile',     label: 'Profile',      icon: '👤' },
];

const s = {
  nav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '64px',
    background: '#fff',
    borderTop: '1px solid #f0f0f0',
    boxShadow: '0 -2px 16px rgba(0,0,0,0.07)',
    display: 'flex',
    alignItems: 'stretch',
    zIndex: 900,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  item: (active) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: '8px 0 4px',
    position: 'relative',
    color: active ? '#e63946' : '#aaa',
    transition: 'color 0.15s',
  }),
  icon: (active) => ({
    fontSize: '1.35rem',
    lineHeight: 1,
    filter: active ? 'none' : 'grayscale(1)',
    transition: 'filter 0.15s',
  }),
  label: (active) => ({
    fontSize: '0.68rem',
    fontWeight: active ? 700 : 500,
    letterSpacing: '0.2px',
  }),
  dot: {
    position: 'absolute',
    top: '6px',
    right: 'calc(50% - 18px)',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #ff6b00, #e63946)',
    color: '#fff',
    fontSize: '0.6rem',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #fff',
    lineHeight: 1,
  },
};

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [badgeCount, setBadgeCount] = useState(0);

  // Re-read localStorage every time the route changes so the badge
  // updates after visiting the Orders page
  useEffect(() => {
    const count = parseInt(localStorage.getItem('activeOrderCount') || '0', 10);
    setBadgeCount(isNaN(count) ? 0 : count);
  }, [location.pathname]);

  if (HIDDEN_ON.includes(location.pathname)) return null;

  const active = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <nav style={s.nav}>
      {NAV_ITEMS.map(({ path, label, icon, badge }) => (
        <button key={path} style={s.item(active(path))} onClick={() => navigate(path)}>
          {badge && badgeCount > 0 && (
            <span style={s.dot}>{badgeCount > 9 ? '9+' : badgeCount}</span>
          )}
          <span style={s.icon(active(path))}>{icon}</span>
          <span style={s.label(active(path))}>{label}</span>
        </button>
      ))}
    </nav>
  );
}
