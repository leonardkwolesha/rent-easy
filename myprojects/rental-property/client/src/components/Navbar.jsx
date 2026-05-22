import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BRAND } from '../theme';
import { Building2, LayoutDashboard, LogOut, Menu, X, Home, ChevronRight, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dashboardPath = user
    ? ['landlord', 'agent', 'admin'].includes(user.role) ? '/landlord' : '/tenant'
    : '/login';

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const navLinks = [
    { to: '/', label: 'Home', icon: <Home size={15} /> },
    { to: '/properties', label: 'Properties', icon: <Building2 size={15} /> },
  ];

  const isAdmin = user?.role === 'admin';

  return (
    <>
      <nav style={{
        background: BRAND.surface,
        borderBottom: `1px solid ${BRAND.border}`,
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: BRAND.shadow,
      }}>
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800,
          fontSize: 18, color: BRAND.primary, textDecoration: 'none',
          fontFamily: "'Syne', sans-serif",
        }}>
          <div style={{
            width: 32, height: 32, background: BRAND.primary, borderRadius: 8,
            display: 'grid', placeItems: 'center',
          }}>
            <Building2 size={16} color="#fff" />
          </div>
          RentEase
        </Link>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="nav-desktop">
          {navLinks.map(({ to, label, icon }) => (
            <Link key={to} to={to} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8,
              fontWeight: isActive(to) ? 600 : 500, fontSize: 14,
              color: isActive(to) ? BRAND.primary : BRAND.text,
              background: isActive(to) ? BRAND.primary + '12' : 'transparent',
              textDecoration: 'none', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { if (!isActive(to)) e.currentTarget.style.background = BRAND.bg; }}
              onMouseLeave={e => { if (!isActive(to)) e.currentTarget.style.background = 'transparent'; }}>
              {icon}{label}
            </Link>
          ))}

          {user ? (
            <>
              <Link to={dashboardPath} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, fontWeight: 500, fontSize: 14,
                color: isActive(dashboardPath) ? BRAND.primary : BRAND.text,
                background: isActive(dashboardPath) ? BRAND.primary + '12' : 'transparent',
                textDecoration: 'none', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { if (!isActive(dashboardPath)) e.currentTarget.style.background = BRAND.bg; }}
                onMouseLeave={e => { if (!isActive(dashboardPath)) e.currentTarget.style.background = 'transparent'; }}>
                <LayoutDashboard size={15} />Dashboard
              </Link>
              {isAdmin && (
                <Link to="/admin" style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8, fontWeight: 500, fontSize: 14,
                  color: isActive('/admin') ? '#7C3AED' : BRAND.text,
                  background: isActive('/admin') ? '#EDE9FE' : 'transparent',
                  textDecoration: 'none', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { if (!isActive('/admin')) e.currentTarget.style.background = '#F5F3FF'; }}
                  onMouseLeave={e => { if (!isActive('/admin')) e.currentTarget.style.background = 'transparent'; }}>
                  <Shield size={15} />Admin
                </Link>
              )}
              <button onClick={handleLogout} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, fontWeight: 500, fontSize: 14,
                color: BRAND.danger, background: 'transparent',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <LogOut size={15} />Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{
                padding: '7px 16px', borderRadius: 8,
                fontWeight: 500, fontSize: 14, color: BRAND.text,
                textDecoration: 'none', transition: 'all 0.15s',
                marginLeft: 4,
              }}
                onMouseEnter={e => e.currentTarget.style.background = BRAND.bg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                Sign In
              </Link>
              <Link to="/register" style={{
                padding: '8px 18px', borderRadius: 8,
                background: BRAND.primary, color: '#fff',
                fontWeight: 600, fontSize: 14, marginLeft: 4,
                textDecoration: 'none', transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = BRAND.primaryMid}
                onMouseLeave={e => e.currentTarget.style.background = BRAND.primary}>
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(o => !o)} style={{
          display: 'none', background: 'none', border: 'none',
          cursor: 'pointer', color: BRAND.text, padding: 4,
        }} className="nav-mobile-btn">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div style={{
          position: 'fixed', top: 60, left: 0, right: 0, bottom: 0,
          zIndex: 99, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)',
        }} onClick={() => setOpen(false)}>
          <div style={{
            background: BRAND.surface, borderBottom: `1px solid ${BRAND.border}`,
            padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4,
            boxShadow: BRAND.shadowMd,
          }} onClick={e => e.stopPropagation()}>
            {navLinks.map(({ to, label, icon }) => (
              <Link key={to} to={to} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: 10,
                fontWeight: isActive(to) ? 600 : 500, fontSize: 15,
                color: isActive(to) ? BRAND.primary : BRAND.text,
                background: isActive(to) ? BRAND.primary + '12' : 'transparent',
                textDecoration: 'none',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{icon}{label}</span>
                <ChevronRight size={15} color={BRAND.muted} />
              </Link>
            ))}

            {user ? (
              <>
                <Link to={dashboardPath} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px', borderRadius: 10, fontWeight: 500, fontSize: 15,
                  color: isActive(dashboardPath) ? BRAND.primary : BRAND.text,
                  background: isActive(dashboardPath) ? BRAND.primary + '12' : 'transparent',
                  textDecoration: 'none',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><LayoutDashboard size={15} />Dashboard</span>
                  <ChevronRight size={15} color={BRAND.muted} />
                </Link>
                {isAdmin && (
                  <Link to="/admin" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', borderRadius: 10, fontWeight: 500, fontSize: 15,
                    color: isActive('/admin') ? '#7C3AED' : BRAND.text,
                    background: isActive('/admin') ? '#EDE9FE' : 'transparent',
                    textDecoration: 'none',
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Shield size={15} />Admin Panel</span>
                    <ChevronRight size={15} color={BRAND.muted} />
                  </Link>
                )}
                <div style={{ height: 1, background: BRAND.border, margin: '4px 0' }} />
                <button onClick={handleLogout} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', borderRadius: 10, fontWeight: 500, fontSize: 15,
                  color: BRAND.danger, background: 'transparent',
                  border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
                }}>
                  <LogOut size={15} />Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px', borderRadius: 10, fontWeight: 500, fontSize: 15,
                  color: BRAND.text, textDecoration: 'none',
                }}>
                  <span>Sign In</span><ChevronRight size={15} color={BRAND.muted} />
                </Link>
                <Link to="/register" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '12px', borderRadius: 10, fontWeight: 600, fontSize: 15,
                  background: BRAND.primary, color: '#fff', textDecoration: 'none',
                  marginTop: 4,
                }}>
                  Get Started →
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
