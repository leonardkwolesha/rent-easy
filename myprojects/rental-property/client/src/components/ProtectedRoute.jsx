import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BRAND } from '../theme';
import { Shield, LogOut } from 'lucide-react';

function AgentPendingScreen({ logout }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BRAND.bg, padding: 24 }}>
      <div style={{ maxWidth: 440, textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '2px solid #FDE68A' }}>
          <Shield size={30} color="#92400E" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, fontFamily: "'Syne', sans-serif" }}>Awaiting Approval</h2>
        <p style={{ color: BRAND.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
          Your agent account is pending review by an administrator. You'll be able to list properties and manage applications once approved. This usually takes 1–2 business days.
        </p>
        <button onClick={logout} style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px',
          borderRadius: 9, background: BRAND.primary, color: '#fff',
          fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer',
        }}>
          <LogOut size={15} />Sign out
        </button>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children, roles }) {
  const { user, logout } = useAuth();

  if (!user) return <Navigate to="/login" />;

  // Unapproved agents get a friendly waiting screen instead of a silent redirect
  if (user.role === 'agent' && !user.isApproved) {
    return <AgentPendingScreen logout={logout} />;
  }

  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" />;

  return children;
}
