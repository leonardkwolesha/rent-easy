import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import KebiteLogo from './KebiteLogo';

const GRADIENT = 'linear-gradient(135deg, #ff6b00, #e63946)';
const DARK = '#1a1a2e';

const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
  </svg>
);

const OrdersNavIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
    <rect x="9" y="3" width="6" height="4" rx="1"/>
    <line x1="9" y1="12" x2="15" y2="12"/>
    <line x1="9" y1="16" x2="13" y2="16"/>
  </svg>
);

const MenuNavIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
    <path d="M7 2v20"/>
    <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
  </svg>
);

const ProfileNavIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const SignOutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const NAV = [
  { label: 'Dashboard',    Icon: DashboardIcon,   path: '/restaurant/dashboard' },
  { label: 'Live Orders',  Icon: OrdersNavIcon,   path: '/restaurant/orders' },
  { label: 'Menu Manager', Icon: MenuNavIcon,      path: '/restaurant/menu' },
  { label: 'Profile',      Icon: ProfileNavIcon,   path: '/restaurant/profile' },
];

export default function RestaurantSidebar({ restaurant, onToggleOpen, openLoading }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  function handleSignOut() {
    logout();
    window.location.href = '/login';
  }

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <KebiteLogo variant="white" size="sm" />
        {restaurant && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem', lineHeight: 1.3 }}>{restaurant.name}</div>
            <div style={{ display: 'inline-block', background: 'rgba(255,107,0,0.3)', color: '#ffcba4', borderRadius: '999px', padding: '2px 10px', fontSize: '0.7rem', fontWeight: 700, marginTop: '4px' }}>Partner</div>
          </div>
        )}
      </div>

      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {NAV.map(({ label, Icon, path }) => (
          <button key={path} onClick={() => { navigate(path); setMobileOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.65rem 1rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', fontFamily: "'Segoe UI', system-ui, sans-serif", background: isActive(path) ? GRADIENT : 'transparent', color: isActive(path) ? '#fff' : 'rgba(255,255,255,0.65)', transition: 'all 0.15s', width: '100%', textAlign: 'left' }}>
            <Icon />{label}
          </button>
        ))}
      </nav>

      <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {restaurant && onToggleOpen && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.06)', borderRadius: '12px', marginBottom: '0.5rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: restaurant.isOpen ? '#22c55e' : '#666', flexShrink: 0 }} />
            <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600, flex: 1 }}>
              {restaurant.isOpen ? 'Restaurant OPEN' : 'Restaurant CLOSED'}
            </span>
            <button onClick={onToggleOpen} disabled={openLoading}
              style={{ width: '40px', height: '22px', borderRadius: '999px', border: 'none', cursor: 'pointer', background: restaurant.isOpen ? '#22c55e' : '#555', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: '3px', left: restaurant.isOpen ? '20px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </button>
          </div>
        )}
        <button onClick={handleSignOut}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.65rem 1rem', borderRadius: '10px', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', background: 'transparent', width: '100%', fontSize: '0.88rem', fontFamily: "'Segoe UI', system-ui, sans-serif", transition: 'color 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}>
          <SignOutIcon />Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div style={{ width: '220px', background: DARK, height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 100, display: 'none', flexDirection: 'column' }} className="rs-desktop-sidebar">
        {content}
      </div>

      <div className="rs-mobile-topbar" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '56px', background: DARK, zIndex: 200, display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '1rem' }}>
        <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }} aria-label="Open menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <KebiteLogo variant="white" size="sm" />
        {restaurant && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: restaurant.isOpen ? '#22c55e' : '#666' }} />
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem' }}>{restaurant.isOpen ? 'Open' : 'Closed'}</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300 }} />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', stiffness: 400, damping: 35 }} style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: '260px', background: DARK, zIndex: 400 }}>
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @media(min-width:768px){
          .rs-desktop-sidebar { display: flex !important; }
          .rs-mobile-topbar   { display: none !important; }
          .rs-content { margin-left: 220px !important; padding-top: 0 !important; }
        }
      `}</style>
    </>
  );
}
