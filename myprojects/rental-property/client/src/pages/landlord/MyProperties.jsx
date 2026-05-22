import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Eye, AlertTriangle, X, ImagePlus, Upload } from 'lucide-react';
import { BRAND, STATUS_COLORS } from '../../theme';
import { toast } from '../../components/Toast';
import api from '../../services/api';

const TYPES = ['apartment', 'house', 'studio', 'villa', 'room', 'commercial'];
const empty = {
  title: '', description: '', type: 'apartment',
  address: { street: '', area: '', city: '', country: 'Tanzania' },
  rent: { amount: '', currency: 'TZS', period: 'monthly' },
  deposit: '', bedrooms: 1, bathrooms: 1, amenities: '',
};

const CSS = `
.mp-input{width:100%;padding:9px 11px;border-radius:8px;border:1px solid ${BRAND.border};font-size:13px;outline:none;transition:border-color .15s,box-shadow .15s;box-sizing:border-box;font-family:inherit}
.mp-input:focus{border-color:${BRAND.primary};box-shadow:0 0 0 3px ${BRAND.primary}18}
.mp-select{width:100%;padding:9px 11px;border-radius:8px;border:1px solid ${BRAND.border};font-size:13px;outline:none;cursor:pointer;font-family:inherit;transition:border-color .15s}
.mp-select:focus{border-color:${BRAND.primary}}
.img-thumb:hover .img-remove{opacity:1 !important}
.drop-zone:hover{border-color:${BRAND.primary} !important;background:${BRAND.primary}06 !important}
`;

export default function MyProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Image upload state
  const [newFiles, setNewFiles] = useState([]);        // File objects selected by user
  const [previews, setPreviews] = useState([]);         // Object URLs for preview
  const [existingImages, setExistingImages] = useState([]); // URLs already on the property
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.dataset.id = 'mp-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Clean up object URLs when files change or form closes
  useEffect(() => {
    return () => previews.forEach(url => URL.revokeObjectURL(url));
  }, [previews]);

  const load = () =>
    api.get('/properties/my')
      .then(r => setProperties(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const resetImageState = () => {
    previews.forEach(url => URL.revokeObjectURL(url));
    setNewFiles([]);
    setPreviews([]);
    setExistingImages([]);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(empty);
    resetImageState();
    setShowForm(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const openEdit = (p) => {
    setEditing(p._id);
    setForm({
      ...p,
      rent: { ...p.rent, amount: p.rent.amount },
      amenities: p.amenities?.join(', ') || '',
      address: { ...p.address },
    });
    resetImageState();
    setExistingImages(p.images || []);
    setShowForm(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const handleFileSelect = (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (valid.length === 0) return;
    const total = existingImages.length + newFiles.length + valid.length;
    if (total > 10) {
      toast.error('Maximum 10 images per property');
      return;
    }
    const newPreviews = valid.map(f => URL.createObjectURL(f));
    setNewFiles(prev => [...prev, ...valid]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeNewFile = (index) => {
    URL.revokeObjectURL(previews[index]);
    setNewFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        amenities: form.amenities.split(',').map(a => a.trim()).filter(Boolean),
        rent: { ...form.rent, amount: Number(form.rent.amount) },
        deposit: Number(form.deposit) || 0,
      };

      let propertyId = editing;

      if (editing) {
        // Preserve existing images that weren't removed
        payload.images = existingImages;
        await api.put(`/properties/${editing}`, payload);
      } else {
        const res = await api.post('/properties', payload);
        propertyId = res.data.data._id;
      }

      // Upload new images if any
      if (newFiles.length > 0 && propertyId) {
        setUploading(true);
        const formData = new FormData();
        newFiles.forEach(f => formData.append('images', f));
        await api.post(`/properties/${propertyId}/images`, formData);
        setUploading(false);
      }

      toast.success(editing ? 'Property updated' : 'Property created');
      setShowForm(false);
      resetImageState();
      load();
    } catch (err) {
      setUploading(false);
      toast.error(err.response?.data?.message || 'Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/properties/${id}`);
      toast.success('Property deleted');
      setDeletingId(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const setF = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setAddr = (key, val) => setForm(f => ({ ...f, address: { ...f.address, [key]: val } }));
  const setRent = (key, val) => setForm(f => ({ ...f, rent: { ...f.rent, [key]: val } }));

  const inp = (label, val, onChange, type = 'text', placeholder = '') => (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '.4px' }}>{label}</label>
      <input type={type} className="mp-input" value={val} placeholder={placeholder}
        onChange={e => onChange(e.target.value)} />
    </div>
  );

  const totalImageCount = existingImages.length + newFiles.length;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>My Properties</h1>
          <p style={{ color: BRAND.muted, fontSize: 13, marginTop: 2 }}>{properties.length} propert{properties.length !== 1 ? 'ies' : 'y'}</p>
        </div>
        <button onClick={openAdd} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
          borderRadius: 9, background: BRAND.primary, color: '#fff',
          fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', transition: 'background .15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = BRAND.primaryMid}
          onMouseLeave={e => e.currentTarget.style.background = BRAND.primary}>
          <Plus size={16} />Add Property
        </button>
      </div>

      {/* ─── Form ─── */}
      {showForm && (
        <form onSubmit={handleSave} style={{
          background: BRAND.surface, borderRadius: BRAND.radius, padding: 24,
          border: `1px solid ${BRAND.border}`, marginBottom: 24, boxShadow: BRAND.shadowMd,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, fontFamily: "'Syne', sans-serif" }}>
              {editing ? 'Edit Property' : 'New Property'}
            </h3>
            <button type="button" onClick={() => { setShowForm(false); resetImageState(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: BRAND.muted, display: 'flex', padding: 4 }}>
              <X size={18} />
            </button>
          </div>

          {/* Property details grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {inp('Title *', form.title, v => setF('title', v), 'text', 'e.g. Modern 2BR Apartment')}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '.4px' }}>Type *</label>
              <select className="mp-select" value={form.type} onChange={e => setF('type', e.target.value)}>
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            {inp('Rent Amount (TZS) *', form.rent.amount, v => setRent('amount', v), 'number', '0')}
            {inp('Deposit (TZS)', form.deposit, v => setF('deposit', v), 'number', '0')}
            {inp('Bedrooms', form.bedrooms, v => setF('bedrooms', v), 'number')}
            {inp('Bathrooms', form.bathrooms, v => setF('bathrooms', v), 'number')}
            {inp('Street *', form.address.street, v => setAddr('street', v), 'text', 'e.g. 12 Uhuru St')}
            {inp('Area / Neighbourhood', form.address.area, v => setAddr('area', v), 'text', 'e.g. Kariakoo')}
            {inp('City *', form.address.city, v => setAddr('city', v), 'text', 'e.g. Dar es Salaam')}

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '.4px' }}>Description *</label>
              <textarea className="mp-input" value={form.description}
                onChange={e => setF('description', e.target.value)} rows={3}
                placeholder="Describe the property — layout, features, nearby landmarks…"
                style={{ resize: 'vertical' }} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              {inp('Amenities (comma-separated)', form.amenities, v => setF('amenities', v), 'text', 'e.g. WiFi, Parking, Generator, Swimming Pool')}
            </div>
          </div>

          {/* ─── Image upload ─── */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '.4px' }}>
                Property Images <span style={{ fontWeight: 400, textTransform: 'none', color: BRAND.muted }}> ({totalImageCount}/10)</span>
              </label>
              {totalImageCount < 10 && (
                <button type="button" onClick={() => fileInputRef.current?.click()} style={{
                  display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600,
                  color: BRAND.primary, background: BRAND.primary + '10', border: `1px solid ${BRAND.primary}30`,
                  padding: '5px 12px', borderRadius: 7, cursor: 'pointer', transition: 'background .15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = BRAND.primary + '20'}
                  onMouseLeave={e => e.currentTarget.style.background = BRAND.primary + '10'}>
                  <ImagePlus size={13} />Add Images
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              style={{ display: 'none' }}
              onChange={e => { handleFileSelect(e.target.files); e.target.value = ''; }}
            />

            {/* Drop zone — shown when no images yet */}
            {totalImageCount === 0 && (
              <div className="drop-zone"
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${BRAND.border}`, borderRadius: 10,
                  padding: '32px 20px', textAlign: 'center', cursor: 'pointer',
                  transition: 'border-color .15s, background .15s',
                }}>
                <Upload size={24} color={BRAND.muted} style={{ margin: '0 auto 10px' }} />
                <p style={{ fontSize: 14, fontWeight: 500, color: BRAND.text, marginBottom: 3 }}>Click or drag images here</p>
                <p style={{ fontSize: 12, color: BRAND.muted }}>JPEG, PNG or WebP · up to 5 MB each · max 10 images</p>
              </div>
            )}

            {/* Image grid */}
            {totalImageCount > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8, marginTop: 4 }}>
                {/* Existing images (edit mode) */}
                {existingImages.map((url, i) => (
                  <div key={`existing-${i}`} className="img-thumb" style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 8, overflow: 'hidden', border: `1px solid ${BRAND.border}` }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: 4, left: 6, background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4 }}>SAVED</div>
                    <button type="button" className="img-remove" onClick={() => removeExistingImage(i)} style={{
                      position: 'absolute', top: 4, right: 4, width: 22, height: 22,
                      borderRadius: '50%', background: 'rgba(220,38,38,0.9)', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', opacity: 0, transition: 'opacity .15s',
                    }}>
                      <X size={11} color="#fff" />
                    </button>
                  </div>
                ))}

                {/* New file previews */}
                {previews.map((url, i) => (
                  <div key={`new-${i}`} className="img-thumb" style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 8, overflow: 'hidden', border: `2px solid ${BRAND.primary}40` }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: 4, left: 6, background: 'rgba(27,67,50,0.8)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4 }}>NEW</div>
                    <button type="button" className="img-remove" onClick={() => removeNewFile(i)} style={{
                      position: 'absolute', top: 4, right: 4, width: 22, height: 22,
                      borderRadius: '50%', background: 'rgba(220,38,38,0.9)', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', opacity: 0, transition: 'opacity .15s',
                    }}>
                      <X size={11} color="#fff" />
                    </button>
                  </div>
                ))}

                {/* Add more button */}
                {totalImageCount < 10 && (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop} onDragOver={e => e.preventDefault()}
                    style={{
                      aspectRatio: '4/3', borderRadius: 8, border: `2px dashed ${BRAND.border}`,
                      background: BRAND.bg, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 4,
                      cursor: 'pointer', transition: 'border-color .15s, background .15s', color: BRAND.muted,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND.primary; e.currentTarget.style.background = BRAND.primary + '08'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = BRAND.border; e.currentTarget.style.background = BRAND.bg; }}>
                    <Plus size={18} />
                    <span style={{ fontSize: 11 }}>Add more</span>
                  </button>
                )}
              </div>
            )}

            {uploading && (
              <p style={{ fontSize: 12, color: BRAND.primary, marginTop: 8, fontWeight: 500 }}>
                Uploading images to Cloudinary…
              </p>
            )}
          </div>

          {/* Form actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${BRAND.border}` }}>
            <button type="submit" disabled={saving || uploading} style={{
              padding: '10px 24px', borderRadius: 9, background: BRAND.primary, color: '#fff',
              fontWeight: 600, fontSize: 13, border: 'none',
              cursor: saving || uploading ? 'not-allowed' : 'pointer',
              opacity: saving || uploading ? 0.7 : 1, transition: 'background .15s',
            }}
              onMouseEnter={e => { if (!saving && !uploading) e.currentTarget.style.background = BRAND.primaryMid; }}
              onMouseLeave={e => e.currentTarget.style.background = BRAND.primary}>
              {saving ? (uploading ? 'Uploading images…' : 'Saving…') : editing ? 'Update Property' : 'Create Property'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); resetImageState(); }} style={{
              padding: '10px 20px', borderRadius: 9, background: BRAND.bg,
              border: `1px solid ${BRAND.border}`, fontSize: 13, cursor: 'pointer',
            }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ─── Property list ─── */}
      {loading ? (
        <p style={{ color: BRAND.muted, textAlign: 'center', padding: 40 }}>Loading…</p>
      ) : properties.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: BRAND.muted }}>
          <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>No properties yet</p>
          <p style={{ fontSize: 13, marginBottom: 20 }}>Add your first property to get started</p>
          <button onClick={openAdd} style={{
            padding: '10px 22px', borderRadius: 9, background: BRAND.primary,
            color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer',
          }}>
            <Plus size={14} style={{ display: 'inline', marginRight: 6 }} />Add Property
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {properties.map(p => {
            const s = STATUS_COLORS[p.status];
            const isDeleting = deletingId === p._id;
            return (
              <div key={p._id} style={{
                background: BRAND.surface, borderRadius: BRAND.radius,
                border: `1px solid ${isDeleting ? '#FECACA' : BRAND.border}`,
                overflow: 'hidden', transition: 'box-shadow .2s',
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = BRAND.shadowMd}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

                <div style={{
                  padding: '14px 18px', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', gap: 12, flexWrap: 'wrap',
                }}>
                  {/* Thumbnail */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 56, height: 44, borderRadius: 8, overflow: 'hidden',
                      background: BRAND.bg, flexShrink: 0, border: `1px solid ${BRAND.border}`,
                    }}>
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: BRAND.border }}>
                            <ImagePlus size={16} />
                          </div>
                      }
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 600, fontSize: 14, color: BRAND.text }}>{p.title}</p>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.text }}>{p.status}</span>
                      </div>
                      <p style={{ fontSize: 12, color: BRAND.muted }}>
                        {p.address?.city} · {p.type} · {p.bedrooms} bed · TZS {p.rent?.amount?.toLocaleString()}/mo
                        {p.images?.length > 0 && <span style={{ marginLeft: 8, color: BRAND.primary }}>· {p.images.length} photo{p.images.length !== 1 ? 's' : ''}</span>}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <a href={`/properties/${p._id}`} target="_blank" rel="noreferrer"
                      title="View listing"
                      style={{ padding: '7px', borderRadius: 7, background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.muted, display: 'flex', cursor: 'pointer', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                      onMouseLeave={e => e.currentTarget.style.background = BRAND.bg}>
                      <Eye size={14} />
                    </a>
                    <button onClick={() => openEdit(p)} title="Edit"
                      style={{ padding: '7px', borderRadius: 7, background: BRAND.primary + '10', border: `1px solid ${BRAND.primary}30`, color: BRAND.primary, display: 'flex', cursor: 'pointer', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = BRAND.primary + '22'}
                      onMouseLeave={e => e.currentTarget.style.background = BRAND.primary + '10'}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeletingId(isDeleting ? null : p._id)} title="Delete"
                      style={{ padding: '7px', borderRadius: 7, background: '#FEF2F2', border: `1px solid #FECACA`, color: BRAND.danger, display: 'flex', cursor: 'pointer', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                      onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {isDeleting && (
                  <div style={{ padding: '12px 18px', borderTop: `1px solid #FECACA`, background: '#FEF2F2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <AlertTriangle size={14} color="#DC2626" />
                      <p style={{ fontSize: 13, color: '#DC2626', fontWeight: 500 }}>
                        Delete <strong>{p.title}</strong>? This cannot be undone.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleDelete(p._id)} style={{
                        padding: '7px 16px', borderRadius: 8, background: '#DC2626', color: '#fff',
                        fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer',
                      }}>Delete</button>
                      <button onClick={() => setDeletingId(null)} style={{
                        padding: '7px 14px', borderRadius: 8, background: '#fff',
                        border: `1px solid #FECACA`, fontSize: 13, cursor: 'pointer', color: BRAND.muted,
                      }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
