import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Bed, Bath, CheckCircle, Phone, Mail, ArrowRight, AlertCircle, Loader } from 'lucide-react';
import { BRAND, STATUS_COLORS } from '../theme';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import api from '../services/api';

const CSS = `
.prop-input{width:100%;padding:10px 12px;border-radius:8px;border:1px solid ${BRAND.border};font-size:14px;outline:none;transition:border-color .15s,box-shadow .15s;box-sizing:border-box;font-family:inherit;color:${BRAND.text};background:#fff}
.prop-input:focus{border-color:${BRAND.primary};box-shadow:0 0 0 3px ${BRAND.primary}18}
.prop-thumb{opacity:.6;transition:opacity .15s,border-color .15s;cursor:pointer}
.prop-thumb:hover{opacity:1}
.prop-thumb.active{opacity:1}
@media(max-width:700px){.prop-grid{grid-template-columns:1fr!important}.prop-form-grid{grid-template-columns:1fr!important}}
`;

export default function PropertyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);

  // Apply form state
  const [applied, setApplied] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [form, setForm] = useState({
    message: '',
    moveInDate: '',
    employmentStatus: 'employed',
    monthlyIncome: '',
  });

  useEffect(() => {
    const el = document.createElement('style');
    el.dataset.id = 'prop-detail';
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  useEffect(() => {
    api.get(`/properties/${id}`)
      .then(r => setProperty(r.data.data))
      .catch(() => navigate('/properties'))
      .finally(() => setLoading(false));
  }, [id]);

  // Check if this tenant already applied to this property
  useEffect(() => {
    if (!user || user.role !== 'tenant') return;
    api.get('/applications/sent')
      .then(r => {
        const existing = r.data.data?.find(a => a.property?._id === id || a.property === id);
        if (existing) setApplied(true);
      })
      .catch(() => {});
  }, [id, user]);

  const handleApply = async (e) => {
    e.preventDefault();
    setApplyError('');
    setApplying(true);
    try {
      await api.post(`/applications/property/${id}`, {
        ...form,
        monthlyIncome: form.monthlyIncome ? Number(form.monthlyIncome) : undefined,
      });
      setApplied(true);
      setShowForm(false);
      toast.success('Application submitted! The landlord will review it shortly.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit application. Please try again.';
      setApplyError(msg);
      toast.error(msg);
    } finally {
      setApplying(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, gap: 10, color: BRAND.muted }}>
      <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      Loading property…
    </div>
  );
  if (!property) return null;

  const sc = STATUS_COLORS[property.status] || {};
  const fmt = (n) => n?.toLocaleString() ?? '—';
  const addr = [property.address?.street, property.address?.area, property.address?.city].filter(Boolean).join(', ');

  const isAvailable = property.status === 'available';
  const isTenant = user?.role === 'tenant';

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 24px' }}>
      {/* Image gallery */}
      {property.images?.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ borderRadius: BRAND.radius, overflow: 'hidden', height: 400, background: '#E2E8F0', position: 'relative' }}>
            <img
              src={property.images[imgIdx]}
              alt={property.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity .2s' }}
            />
            {property.images.length > 1 && (
              <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.55)', borderRadius: 6, padding: '4px 10px', color: '#fff', fontSize: 12 }}>
                {imgIdx + 1} / {property.images.length}
              </div>
            )}
          </div>
          {property.images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {property.images.map((img, i) => (
                <div key={i} onClick={() => setImgIdx(i)}
                  className={`prop-thumb${i === imgIdx ? ' active' : ''}`}
                  style={{ width: 76, height: 56, flexShrink: 0, borderRadius: 8, overflow: 'hidden', border: `2px solid ${i === imgIdx ? BRAND.primary : 'transparent'}` }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="prop-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'start' }}>
        {/* Left column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.text, textTransform: 'capitalize' }}>{property.status}</span>
            <span style={{ fontSize: 13, color: BRAND.muted, textTransform: 'capitalize' }}>{property.type}</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6, fontFamily: "'Syne', sans-serif", lineHeight: 1.2 }}>{property.title}</h1>
          {addr && (
            <p style={{ color: BRAND.muted, fontSize: 14, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 18 }}>
              <MapPin size={14} />{addr}
            </p>
          )}

          <div style={{ display: 'flex', gap: 20, marginBottom: 22, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, color: BRAND.text }}>
              <Bed size={15} color={BRAND.muted} />{property.bedrooms} bedroom{property.bedrooms !== 1 ? 's' : ''}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, color: BRAND.text }}>
              <Bath size={15} color={BRAND.muted} />{property.bathrooms} bathroom{property.bathrooms !== 1 ? 's' : ''}
            </span>
            {property.area_sqm && <span style={{ fontSize: 14, color: BRAND.muted }}>{property.area_sqm} m²</span>}
          </div>

          {property.description && (
            <>
              <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>About this property</h2>
              <p style={{ color: BRAND.muted, fontSize: 14, lineHeight: 1.75, marginBottom: 24 }}>{property.description}</p>
            </>
          )}

          {property.amenities?.length > 0 && (
            <>
              <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Amenities</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {property.amenities.map(a => (
                  <span key={a} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 12px', borderRadius: 20,
                    background: BRAND.primary + '10', color: BRAND.primary, fontSize: 13, fontWeight: 500,
                  }}>
                    <CheckCircle size={12} />{a}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Price + CTA card */}
          <div style={{ background: BRAND.surface, borderRadius: BRAND.radius, padding: 22, border: `1px solid ${BRAND.border}`, boxShadow: BRAND.shadowMd }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: BRAND.primary, lineHeight: 1, marginBottom: 2, fontFamily: "'Syne', sans-serif" }}>
              {property.rent?.currency || 'TZS'} {fmt(property.rent?.amount)}
              <span style={{ fontSize: 13, fontWeight: 400, color: BRAND.muted }}>/{property.rent?.period === 'yearly' ? 'yr' : 'mo'}</span>
            </p>
            {property.deposit > 0 && (
              <p style={{ fontSize: 13, color: BRAND.muted, marginBottom: 18 }}>
                Security deposit: {property.rent?.currency || 'TZS'} {fmt(property.deposit)}
              </p>
            )}

            {/* Already applied */}
            {isTenant && applied && (
              <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                <p style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 600, color: '#065F46', marginBottom: 4 }}>
                  <CheckCircle size={15} />Application submitted
                </p>
                <p style={{ fontSize: 13, color: '#059669' }}>
                  Waiting for the landlord to review your application.
                </p>
                <Link to="/tenant/applications" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 13, fontWeight: 600, color: '#065F46', textDecoration: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                  Track application <ArrowRight size={13} />
                </Link>
              </div>
            )}

            {/* Apply Now button */}
            {isAvailable && isTenant && !applied && (
              <button
                onClick={() => setShowForm(v => !v)}
                style={{
                  width: '100%', padding: '13px', borderRadius: 10,
                  background: showForm ? BRAND.bg : BRAND.primary,
                  color: showForm ? BRAND.text : '#fff',
                  fontWeight: 700, fontSize: 15,
                  border: showForm ? `1px solid ${BRAND.border}` : 'none',
                  cursor: 'pointer', transition: 'all .15s', marginBottom: 0,
                }}
                onMouseEnter={e => { if (!showForm) e.currentTarget.style.background = BRAND.primaryMid; }}
                onMouseLeave={e => { if (!showForm) e.currentTarget.style.background = showForm ? BRAND.bg : BRAND.primary; }}>
                {showForm ? 'Cancel' : 'Apply Now →'}
              </button>
            )}

            {/* Not logged in */}
            {!user && isAvailable && (
              <button
                onClick={() => navigate('/login')}
                style={{ width: '100%', padding: '13px', borderRadius: 10, background: BRAND.primary, color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = BRAND.primaryMid}
                onMouseLeave={e => e.currentTarget.style.background = BRAND.primary}>
                Sign In to Apply
              </button>
            )}

            {/* Non-tenant user */}
            {user && !isTenant && isAvailable && (
              <p style={{ fontSize: 13, color: BRAND.muted, textAlign: 'center', padding: '10px 0', fontStyle: 'italic' }}>
                Rental applications are for tenants only.
              </p>
            )}

            {/* Not available */}
            {!isAvailable && (
              <div style={{ padding: '12px 14px', borderRadius: 9, background: '#FEF3C7', border: '1px solid #FDE68A', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#92400E', fontWeight: 600 }}>
                  {property.status === 'occupied' ? 'This property is currently occupied' : 'Not available for rent'}
                </p>
              </div>
            )}
          </div>

          {/* Landlord card */}
          {property.landlord && (
            <div style={{ background: BRAND.surface, borderRadius: BRAND.radius, padding: 18, border: `1px solid ${BRAND.border}` }}>
              <p style={{ fontWeight: 600, marginBottom: 12, fontSize: 13, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '.4px' }}>Listed by</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: BRAND.primary + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: BRAND.primary, fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                  {property.landlord.name?.[0]?.toUpperCase()}
                </div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{property.landlord.name}</p>
              </div>
              {property.landlord.phone && (
                <a href={`tel:${property.landlord.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: BRAND.muted, textDecoration: 'none', padding: '4px 0', transition: 'color .15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = BRAND.primary}
                  onMouseLeave={e => e.currentTarget.style.color = BRAND.muted}>
                  <Phone size={13} />{property.landlord.phone}
                </a>
              )}
              {property.landlord.email && (
                <a href={`mailto:${property.landlord.email}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: BRAND.muted, textDecoration: 'none', padding: '4px 0', transition: 'color .15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = BRAND.primary}
                  onMouseLeave={e => e.currentTarget.style.color = BRAND.muted}>
                  <Mail size={13} />{property.landlord.email}
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Application form */}
      {showForm && isAvailable && isTenant && !applied && (
        <div style={{ marginTop: 28 }}>
          <form onSubmit={handleApply} style={{
            background: BRAND.surface, borderRadius: BRAND.radius,
            padding: '26px 28px', border: `1px solid ${BRAND.border}`,
            boxShadow: BRAND.shadowMd,
          }}>
            <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 4, fontFamily: "'Syne', sans-serif" }}>Rental Application</h3>
            <p style={{ fontSize: 13, color: BRAND.muted, marginBottom: 20 }}>
              Fill in your details. The landlord will review and respond to your application.
            </p>

            {applyError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderRadius: 9, background: '#FEF2F2', border: '1px solid #FECACA', marginBottom: 16, fontSize: 13, color: '#991B1B' }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                {applyError}
              </div>
            )}

            <div className="prop-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '.4px' }}>
                  Message to Landlord
                </label>
                <textarea
                  className="prop-input"
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  rows={3}
                  placeholder="Introduce yourself, explain why you're a great tenant…"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '.4px' }}>
                  Desired Move-in Date
                </label>
                <input
                  type="date"
                  className="prop-input"
                  value={form.moveInDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm(f => ({ ...f, moveInDate: e.target.value }))}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '.4px' }}>
                  Employment Status
                </label>
                <select
                  className="prop-input"
                  value={form.employmentStatus}
                  onChange={e => setForm(f => ({ ...f, employmentStatus: e.target.value }))}>
                  <option value="employed">Employed</option>
                  <option value="self-employed">Self-employed</option>
                  <option value="student">Student</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '.4px' }}>
                  Monthly Income (TZS) <span style={{ fontWeight: 400, textTransform: 'none' }}>— optional</span>
                </label>
                <input
                  type="number"
                  className="prop-input"
                  placeholder="e.g. 1,500,000"
                  value={form.monthlyIncome}
                  min={0}
                  onChange={e => setForm(f => ({ ...f, monthlyIncome: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20, alignItems: 'center' }}>
              <button
                type="submit"
                disabled={applying}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '12px 28px', borderRadius: 10,
                  background: applying ? BRAND.muted : BRAND.primary,
                  color: '#fff', fontWeight: 700, fontSize: 14,
                  border: 'none', cursor: applying ? 'not-allowed' : 'pointer',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => { if (!applying) e.currentTarget.style.background = BRAND.primaryMid; }}
                onMouseLeave={e => { if (!applying) e.currentTarget.style.background = BRAND.primary; }}>
                {applying
                  ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} />Submitting…</>
                  : <>Submit Application <ArrowRight size={15} /></>
                }
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setApplyError(''); }}
                style={{ padding: '12px 20px', borderRadius: 10, background: 'transparent', color: BRAND.muted, fontWeight: 500, fontSize: 14, border: `1px solid ${BRAND.border}`, cursor: 'pointer', transition: 'all .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = BRAND.bg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
