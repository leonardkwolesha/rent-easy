import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { BRAND } from '../theme';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  const field = (label, key, type = 'text') => (
    <div>
      <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>{label}</label>
      <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required
        style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: `1px solid ${BRAND.border}`, fontSize: 14, outline: 'none' }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400, background: BRAND.surface, borderRadius: 16, padding: 36, boxShadow: BRAND.shadow, border: `1px solid ${BRAND.border}` }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Building2 size={32} color={BRAND.primary} />
          <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>Sign In</h1>
          <p style={{ color: BRAND.muted, fontSize: 13, marginTop: 4 }}>Welcome back to RentEase</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {field('Email', 'email', 'email')}
          {field('Password', 'password', 'password')}
          <button type="submit" disabled={loading}
            style={{ padding: '12px', borderRadius: 10, background: BRAND.primary, color: '#fff', fontWeight: 600, fontSize: 15, marginTop: 4, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: 13, color: BRAND.muted, marginTop: 20 }}>
          No account? <Link to="/register" style={{ color: BRAND.primary, fontWeight: 500 }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
