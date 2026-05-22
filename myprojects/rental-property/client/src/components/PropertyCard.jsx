import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Tag } from 'lucide-react';
import { BRAND, STATUS_COLORS } from '../theme';

const fmt = (n) => n?.toLocaleString() ?? '—';

export default function PropertyCard({ property }) {
  const { _id, title, type, address, rent, bedrooms, bathrooms, images, status } = property;
  const s = STATUS_COLORS[status] || STATUS_COLORS.available;

  return (
    <Link to={`/properties/${_id}`} style={{
      display: 'block', background: BRAND.surface, borderRadius: BRAND.radius,
      overflow: 'hidden', boxShadow: BRAND.shadow, border: `1px solid ${BRAND.border}`,
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = BRAND.shadow; }}
    >
      <div style={{ position: 'relative', height: 180, background: '#E2E8F0', overflow: 'hidden' }}>
        {images?.[0]
          ? <img src={images[0]} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: BRAND.muted, fontSize: 13 }}>No Image</div>
        }
        <span style={{
          position: 'absolute', top: 10, right: 10, padding: '3px 10px',
          borderRadius: 6, fontSize: 11, fontWeight: 600, background: s.bg, color: s.text,
        }}>{status}</span>
        <span style={{
          position: 'absolute', top: 10, left: 10, padding: '3px 10px',
          borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(0,0,0,0.55)', color: '#fff',
        }}>{type}</span>
      </div>

      <div style={{ padding: '14px 16px' }}>
        <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: BRAND.text }}>{title}</p>
        <p style={{ fontSize: 13, color: BRAND.muted, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
          <MapPin size={12} />{address?.area ? `${address.area}, ` : ''}{address?.city}
        </p>
        <div style={{ display: 'flex', gap: 12, fontSize: 13, color: BRAND.muted, marginBottom: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Bed size={13} />{bedrooms} bed</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Bath size={13} />{bathrooms} bath</span>
        </div>
        <p style={{ fontWeight: 700, fontSize: 17, color: BRAND.primary, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Tag size={14} />{rent?.currency} {fmt(rent?.amount)}
          <span style={{ fontSize: 12, fontWeight: 400, color: BRAND.muted }}>/{rent?.period === 'yearly' ? 'yr' : 'mo'}</span>
        </p>
      </div>
    </Link>
  );
}
