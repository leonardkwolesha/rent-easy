import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { BRAND } from '../theme';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';

const ROLES = [
  { value: 'tenant', label: 'Tenant', desc: 'Looking to rent a property' },
  { value: 'landlord', label: 'Landlord', desc: 'I own properties to rent out' },
  { value: 'agent', label: 'Agent', desc: 'I manage properties for landlords' },
];

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'tenant' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register(form);
      toast.success(`Welcome to RentEase, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  const field = (label, key, type = 'text') => (
    <div>
      <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>{label}</label>
      <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required={key !== 'phone'}
        style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: `1px solid ${BRAND.border}`, fontSize: 14, outline: 'none' }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440, background: BRAND.surface, borderRadius: 16, padding: 36, boxShadow: BRAND.shadow, border: `1px solid ${BRAND.border}` }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Building2 size={32} color={BRAND.primary} />
          <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>Create Account</h1>
          <p style={{ color: BRAND.muted, fontSize: 13, marginTop: 4 }}>Join RentEase today</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Role picker */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 8 }}>I am a...</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {ROLES.map(r => (
                <button key={r.value} type="button" onClick={() => setForm(f => ({ ...f, role: r.value }))}
                  style={{
                    flex: 1, padding: '10px 6px', borderRadius: 8, fontSize: 12, fontWeight: 600, textAlign: 'center',
                    border: `2px solid ${form.role === r.value ? BRAND.primary : BRAND.border}`,
                    background: form.role === r.value ? '#EFF6FF' : BRAND.surface,
                    color: form.role === r.value ? BRAND.primary : BRAND.text,
                  }}>
                  {r.label}
                  <div style={{ fontWeight: 400, color: BRAND.muted, marginTop: 2, fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {field('Full Name', 'name')}
          {field('Email', 'email', 'email')}
          {field('Phone (optional)', 'phone', 'tel')}
          {field('Password', 'password', 'password')}

          <button type="submit" disabled={loading}
            style={{ padding: '12px', borderRadius: 10, background: BRAND.primary, color: '#fff', fontWeight: 600, fontSize: 15, marginTop: 4, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: BRAND.muted, marginTop: 20 }}>
          Already have an account? <Link to="/login" style={{ color: BRAND.primary, fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
