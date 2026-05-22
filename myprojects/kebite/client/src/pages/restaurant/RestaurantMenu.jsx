import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import RestaurantSidebar from '../../components/RestaurantSidebar';

const GRADIENT = 'linear-gradient(135deg, #ff6b00, #e63946)';
const DARK = '#1a1a2e';
const ALL_TAGS = ['Spicy', 'Vegan', 'Gluten-Free', 'Halal', 'Vegetarian'];
const DEFAULT_CATS = ['Starters', 'Mains', 'Drinks', 'Desserts', 'Other'];

function ItemModal({ item, onClose, onSaved }) {
  const isEdit = !!item?._id;
  const [form, setForm] = useState({
    name: item?.name || '',
    category: item?.category || 'Mains',
    price: item?.price || '',
    description: item?.description || '',
    imageUrl: item?.imageUrl || item?.image || '',
    tags: item?.tags || [],
    isAvailable: item?.isAvailable !== false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageMode, setImageMode] = useState('url');

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const toggleTag = (tag) => setForm({ ...form, tags: form.tags.includes(tag) ? form.tags.filter((t) => t !== tag) : [...form.tags, tag] });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Item name is required'); return; }
    if (!form.price || Number(form.price) <= 0) { setError('Price must be greater than 0'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, price: Number(form.price) };
      if (isEdit) {
        await api.put(`/restaurant/me/menu/${item._id}`, payload);
      } else {
        await api.post('/restaurant/me/menu', payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save item');
    } finally { setSaving(false); }
  }

  const inputStyle = { width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #e0e0e0', fontSize: '0.9rem', outline: 'none', background: '#fafafa', boxSizing: 'border-box', color: DARK };
  const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#555', marginBottom: '0.35rem' };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 400, damping: 35 }} style={{ background: '#fff', borderRadius: '18px 18px 0 0', width: '100%', maxWidth: '480px', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontWeight: 900, fontSize: '1.1rem', color: DARK }}>{isEdit ? 'Edit Item' : '+ Add New Item'}</div>
          <button onClick={onClose} style={{ background: '#f0f0f0', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>✕</button>
        </div>

        {error && <div style={{ background: '#fff5f5', border: '1px solid #fcc', borderRadius: '12px', padding: '0.65rem 1rem', marginBottom: '1rem', color: '#c1121f', fontSize: '0.85rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Item Name *</label>
            <input value={form.name} onChange={set('name')} placeholder="e.g. Chicken Pilau" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select value={form.category} onChange={set('category')} style={{ ...inputStyle, cursor: 'pointer' }}>
                {DEFAULT_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Price (TSh) *</label>
              <input type="number" value={form.price} onChange={set('price')} placeholder="5000" min="1" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Description <span style={{ color: '#aaa', fontWeight: 400 }}>({200 - (form.description?.length || 0)} chars left)</span></label>
            <textarea value={form.description} onChange={set('description')} maxLength={200} rows={3} placeholder="Describe the dish…" style={{ ...inputStyle, borderRadius: '12px', resize: 'none' }} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Item Image</label>
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem' }}>
              {['url', 'file'].map((mode) => (
                <button key={mode} type="button" onClick={() => setImageMode(mode)}
                  style={{ padding: '0.3rem 0.9rem', borderRadius: '999px', border: `1.5px solid ${imageMode === mode ? '#ff6b00' : '#e0e0e0'}`, background: imageMode === mode ? '#fff8f5' : '#fafafa', color: imageMode === mode ? '#ff6b00' : '#888', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                  {mode === 'url' ? 'Paste URL' : 'Choose File'}
                </button>
              ))}
            </div>
            {imageMode === 'url' ? (
              <input value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://example.com/image.jpg" style={inputStyle} />
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px dashed #e0e0e0', background: '#fafafa', cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span style={{ fontSize: '0.88rem', color: '#555', fontWeight: 600 }}>Upload from device</span>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) {
                    setError('Image is too large. Please pick one under 5 MB.');
                    e.target.value = '';
                    return;
                  }
                  setError('');
                  const reader = new FileReader();
                  reader.onload = (ev) => setForm((f) => ({ ...f, imageUrl: ev.target.result }));
                  reader.readAsDataURL(file);
                }} />
              </label>
            )}
            {form.imageUrl && (
              <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <img src={form.imageUrl} alt="" onError={(e) => { e.target.style.display = 'none'; }} style={{ width: '72px', height: '56px', objectFit: 'cover', borderRadius: '8px' }} />
                <button type="button" onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))} style={{ background: '#fff5f5', border: 'none', borderRadius: '6px', padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem', color: '#e63946', fontWeight: 600 }}>Remove</button>
              </div>
            )}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Tags</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {ALL_TAGS.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  style={{ padding: '0.3rem 0.8rem', borderRadius: '999px', border: `1.5px solid ${form.tags.includes(tag) ? '#ff6b00' : '#e0e0e0'}`, background: form.tags.includes(tag) ? '#fff8f5' : '#fafafa', color: form.tags.includes(tag) ? '#ff6b00' : '#888', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
            <button type="button" onClick={() => setForm({ ...form, isAvailable: !form.isAvailable })}
              style={{ width: '44px', height: '24px', borderRadius: '999px', border: 'none', cursor: 'pointer', background: form.isAvailable ? '#22c55e' : '#ccc', position: 'relative', transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: '3px', left: form.isAvailable ? '22px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </button>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: form.isAvailable ? '#22c55e' : '#888' }}>{form.isAvailable ? 'Available' : 'Unavailable'}</span>
          </div>
          <button type="submit" disabled={saving} style={{ width: '100%', padding: '0.85rem', borderRadius: '999px', border: 'none', background: GRADIENT, color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Item'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function RestaurantMenu() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [modalItem, setModalItem] = useState(undefined);
  const [togglingItem, setTogglingItem] = useState(null);

  const fetchMenu = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get('/restaurant/me');
      setMenu(res.data.menu || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load menu');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  const categories = ['All', ...Array.from(new Set(menu.map((i) => i.category || 'Main')))];
  const displayed = activeCategory === 'All' ? menu : menu.filter((i) => (i.category || 'Main') === activeCategory);

  async function toggleAvailability(item) {
    setTogglingItem(item._id);
    try {
      await api.put(`/restaurant/me/menu/${item._id}`, { isAvailable: !item.isAvailable });
      setMenu((prev) => prev.map((m) => m._id === item._id ? { ...m, isAvailable: !m.isAvailable } : m));
    } catch {}
    finally { setTogglingItem(null); }
  }

  async function softDelete(itemId) {
    try {
      await api.delete(`/restaurant/me/menu/${itemId}`);
      setMenu((prev) => prev.map((m) => m._id === itemId ? { ...m, isAvailable: false } : m));
    } catch {}
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <RestaurantSidebar />

      <div className="rs-content" style={{ paddingTop: '56px', minHeight: '100vh', background: '#f8f8f8' }}>
        <div style={{ background: GRADIENT, padding: '1.5rem 1.5rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem' }}>Menu Manager</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginTop: '4px' }}>{menu.length} items</div>
          </div>
          <button onClick={() => setModalItem(null)} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: '999px', padding: '0.55rem 1.25rem', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
            + Add Item
          </button>
        </div>

        <div style={{ padding: '0 1rem', marginTop: '-1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '1rem', background: '#fff', borderRadius: '18px', padding: '0.75rem', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                style={{ padding: '0.45rem 1.1rem', borderRadius: '999px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap', background: activeCategory === cat ? GRADIENT : '#f8f8f8', color: activeCategory === cat ? '#fff' : '#888', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                {cat}
              </button>
            ))}
          </div>

          {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Loading menu…</div>}
          {error && <div style={{ background: '#fff5f5', border: '1px solid #fcc', borderRadius: '18px', padding: '1.5rem', color: '#c1121f', textAlign: 'center' }}>{error}</div>}
          {!loading && !error && displayed.length === 0 && (
            <div style={{ background: '#fff', borderRadius: '18px', padding: '3rem', textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🍽️</div>
              <div style={{ fontWeight: 700, color: '#555', marginBottom: '1rem' }}>No items in this category</div>
              <button onClick={() => setModalItem(null)} style={{ background: GRADIENT, color: '#fff', border: 'none', borderRadius: '999px', padding: '0.6rem 1.5rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>Add First Item</button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem', paddingBottom: '2rem' }}>
            {displayed.map((item) => (
              <motion.div key={item._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#fff', borderRadius: '16px', padding: '1rem', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', opacity: item.isAvailable ? 1 : 0.6 }}>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: DARK, fontSize: '0.95rem', marginBottom: '2px' }}>{item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</div>
                    <div style={{ fontWeight: 800, color: '#ff6b00', marginTop: '6px', fontSize: '0.95rem' }}>TSh {item.price?.toLocaleString()}</div>
                    {item.tags?.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {item.tags.map((tag) => <span key={tag} style={{ background: '#f0f0f0', color: '#666', borderRadius: '999px', padding: '1px 8px', fontSize: '0.7rem' }}>{tag}</span>)}
                      </div>
                    )}
                  </div>
                  {(item.imageUrl || item.image) && (
                    <img src={item.imageUrl || item.image} alt={item.name} onError={(e) => { e.target.style.display = 'none'; }} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }} />
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '0.75rem', borderTop: '1px solid #f0f0f0' }}>
                  <button type="button" onClick={() => toggleAvailability(item)} disabled={togglingItem === item._id}
                    style={{ width: '36px', height: '20px', borderRadius: '999px', border: 'none', cursor: 'pointer', background: item.isAvailable ? '#22c55e' : '#ccc', position: 'relative', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: '2px', left: item.isAvailable ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </button>
                  <span style={{ fontSize: '0.75rem', color: item.isAvailable ? '#22c55e' : '#aaa', fontWeight: 600, flex: 1 }}>{item.isAvailable ? 'Available' : 'Hidden'}</span>
                  <button onClick={() => setModalItem(item)} style={{ background: '#f0f0f0', border: 'none', borderRadius: '8px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>Edit</button>
                  <button onClick={() => softDelete(item._id)} style={{ background: '#fff5f5', border: 'none', borderRadius: '8px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#e63946', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>Hide</button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* FAB — always visible so Add Item is never hidden by scroll */}
      {menu.length > 0 && (
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setModalItem(null)}
          style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 450, background: GRADIENT, color: '#fff', border: 'none', borderRadius: '999px', padding: '0.75rem 1.4rem', fontWeight: 800, fontSize: '0.95rem', fontFamily: "'Segoe UI', system-ui, sans-serif", cursor: 'pointer', boxShadow: '0 6px 24px rgba(255,107,0,0.45)', display: 'flex', alignItems: 'center', gap: '6px' }}
          aria-label="Add menu item"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Item
        </motion.button>
      )}

      <AnimatePresence>
        {modalItem !== undefined && (
          <ItemModal item={modalItem} onClose={() => setModalItem(undefined)} onSaved={() => { setModalItem(undefined); fetchMenu(); }} />
        )}
      </AnimatePresence>
    </div>
  );
}
