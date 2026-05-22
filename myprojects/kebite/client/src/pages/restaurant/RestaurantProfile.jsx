import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import RestaurantSidebar from '../../components/RestaurantSidebar';
import AvatarPicker from '../../components/AvatarPicker';
import LanguageToggle from '../../components/LanguageToggle';

const GRADIENT = 'linear-gradient(135deg, #ff6b00, #e63946)';
const DARK = '#1a1a2e';
const FONT = "'Segoe UI', system-ui, sans-serif";
const CARD = { background: '#fff', borderRadius: '18px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '1.5rem', marginBottom: '1rem' };
const CUISINE_SUGGESTIONS = ['Tanzanian', 'Swahili', 'Pizza', 'Burgers', 'Indian', 'Chinese', 'Seafood', 'Grills', 'BBQ', 'Fast Food', 'Vegan', 'Continental'];

function getInitials(name = '') {
  const parts = name.trim().split(' ').filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

function EditRow({ label, value, fieldKey, onSave, type = 'text', prefix = '' }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { setVal(value ?? ''); }, [value]);

  async function save() {
    const trimmed = type === 'number' ? Number(val) : String(val).trim();
    if (String(trimmed).trim() === '') { setErr('Cannot be empty'); return; }
    setSaving(true); setErr('');
    try {
      await onSave(fieldKey, trimmed);
      setEditing(false);
    } catch (e) {
      setErr(e.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  }

  return (
    <div style={{ padding: '0.75rem 0', borderBottom: '1px solid #f5f5f5' }}>
      {editing ? (
        <>
          <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '6px' }}>{label}</div>
          <input
            autoFocus
            type={type}
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
            style={{ width: '100%', borderRadius: '12px', border: '1.5px solid #ff6b00', padding: '0.55rem 0.85rem', fontSize: '0.9rem', outline: 'none', fontFamily: FONT, boxSizing: 'border-box' }}
          />
          {err && <div style={{ color: '#e63946', fontSize: '0.75rem', marginTop: '4px' }}>{err}</div>}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button onClick={() => setEditing(false)} style={{ flex: 1, padding: '0.45rem', borderRadius: '999px', border: '1.5px solid #ddd', color: '#888', background: '#fff', cursor: 'pointer', fontWeight: 600, fontFamily: FONT, fontSize: '0.82rem' }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ flex: 1, padding: '0.45rem', borderRadius: '999px', border: 'none', color: '#fff', background: saving ? '#ccc' : GRADIENT, cursor: saving ? 'default' : 'pointer', fontWeight: 700, fontFamily: FONT, fontSize: '0.82rem' }}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '2px' }}>{label}</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 500, color: DARK }}>
              {value !== null && value !== undefined && value !== '' ? (type === 'number' ? prefix + Number(value).toLocaleString() : value) : <span style={{ color: '#ccc', fontStyle: 'italic' }}>Not set</span>}
            </div>
          </div>
          <button onClick={() => setEditing(true)} aria-label={`Edit ${label}`}
            style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: '4px', borderRadius: '8px' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ff6b00'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#ccc'; }}>
            <PencilIcon />
          </button>
        </div>
      )}
    </div>
  );
}

export default function RestaurantProfile() {
  const { user, refreshUser } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pwSheet, setPwSheet] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwVisible, setPwVisible] = useState({ current: false, new: false, confirm: false });
  const [pwSuccess, setPwSuccess] = useState(false);
  const [cuisineEditing, setCuisineEditing] = useState(false);
  const [cuisineList, setCuisineList] = useState([]);
  const [cuisineInput, setCuisineInput] = useState('');
  const [cuisineSaving, setCuisineSaving] = useState(false);
  const [cuisineError, setCuisineError] = useState('');

  useEffect(() => {
    api.get('/restaurant/me')
      .then(res => setRestaurant(res.data))
      .catch(err => setError(err.response?.data?.message || 'Could not load profile'))
      .finally(() => setLoading(false));
  }, []);

  async function saveRestaurant(field, value) {
    const res = await api.put('/restaurant/me', { [field]: value });
    setRestaurant(res.data);
  }

  function startCuisineEdit() {
    setCuisineList(restaurant?.cuisine || []);
    setCuisineInput('');
    setCuisineError('');
    setCuisineEditing(true);
  }

  function cancelCuisineEdit() {
    setCuisineEditing(false);
    setCuisineError('');
    setCuisineInput('');
  }

  function addCuisineTag(raw) {
    const tag = raw.trim();
    if (!tag) return;
    const exists = cuisineList.some(c => c.toLowerCase() === tag.toLowerCase());
    if (exists) { setCuisineError(`"${tag}" is already added`); return; }
    if (tag.length > 30) { setCuisineError('Cuisine name is too long'); return; }
    setCuisineList([...cuisineList, tag]);
    setCuisineInput('');
    setCuisineError('');
  }

  function removeCuisineTag(tag) {
    setCuisineList(cuisineList.filter(c => c !== tag));
    setCuisineError('');
  }

  async function saveCuisine() {
    setCuisineSaving(true);
    setCuisineError('');
    try {
      const res = await api.put('/restaurant/me', { cuisine: cuisineList });
      setRestaurant(res.data);
      setCuisineEditing(false);
    } catch (err) {
      setCuisineError(err.response?.data?.message || 'Could not save cuisines');
    } finally { setCuisineSaving(false); }
  }

  async function saveUser(field, value) {
    await api.put('/users/me', { [field]: value });
    await refreshUser();
  }

  function resetPwState() {
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setPwError(''); setPwSuccess(false); setPwLoading(false);
  }

  function openPwSheet() {
    resetPwState();
    setPwSheet(true);
  }

  function closePwSheet() {
    if (pwLoading) return;
    setPwSheet(false);
    resetPwState();
  }

  async function handleChangePw(e) {
    e.preventDefault();
    setPwError('');
    if (!currentPw) { setPwError('Enter your current password.'); return; }
    if (newPw.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    if (newPw === currentPw) { setPwError('New password must be different from current password.'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    setPwLoading(true);
    try {
      await api.post('/users/me/change-password', { currentPassword: currentPw, newPassword: newPw });
      setPwSuccess(true);
      setTimeout(() => { setPwSheet(false); resetPwState(); }, 1800);
    } catch (err) {
      setPwError(err.response?.data?.message || 'Could not update password.');
    } finally { setPwLoading(false); }
  }

  const contentStyle = { paddingTop: '56px', minHeight: '100vh', background: '#f8f8f8', fontFamily: FONT };

  if (loading) return (
    <div style={{ fontFamily: FONT }}>
      <RestaurantSidebar restaurant={null} />
      <div className="rs-content" style={{ ...contentStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#888' }}>Loading profile…</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ fontFamily: FONT }}>
      <RestaurantSidebar restaurant={null} />
      <div className="rs-content" style={{ ...contentStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ background: '#fff5f5', border: '1px solid #fcc', borderRadius: '18px', padding: '2rem', textAlign: 'center', maxWidth: '360px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
          <div style={{ color: '#c1121f', fontWeight: 700 }}>{error}</div>
          <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', background: GRADIENT, color: '#fff', border: 'none', borderRadius: '999px', padding: '0.6rem 1.5rem', cursor: 'pointer', fontWeight: 700, fontFamily: FONT }}>Retry</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: FONT }}>
      <RestaurantSidebar restaurant={restaurant} />

      <div className="rs-content" style={contentStyle}>
        {/* Header */}
        <div style={{ background: GRADIENT, padding: '2rem 2rem 3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <AvatarPicker size={72} fontSize="1.6rem" />
            <div>
              <div style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 900 }}>{user?.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginTop: '2px' }}>{restaurant?.name}</div>
              <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '999px', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700, marginTop: '6px', border: '1px solid rgba(255,255,255,0.3)' }}>
                Restaurant Partner
              </span>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 1rem', marginTop: '-1.5rem', maxWidth: '700px' }}>
          {/* Stats strip */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            {[
              { label: 'Rating',   value: restaurant?.rating ? restaurant.rating.toFixed(1) + ' ★' : '—' },
              { label: 'Delivery', value: (restaurant?.deliveryTime ?? '—') + ' min' },
              { label: 'Status',   value: restaurant?.isOpen ? 'Open ✓' : 'Closed' },
            ].map(({ label, value }) => (
              <div key={label} style={{ flex: 1, background: '#fff', borderRadius: '14px', padding: '0.9rem 0.75rem', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <div style={{ fontWeight: 900, color: '#ff6b00', fontSize: '1rem' }}>{value}</div>
                <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Restaurant details */}
          <div style={CARD}>
            <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem', fontWeight: 700 }}>Restaurant Details</div>
            <EditRow label="Restaurant Name"        value={restaurant?.name}         fieldKey="name"         onSave={saveRestaurant} />
            <EditRow label="Phone Number"           value={restaurant?.phone}        fieldKey="phone"        onSave={saveRestaurant} />
            <EditRow label="Description"            value={restaurant?.description}  fieldKey="description"  onSave={saveRestaurant} />
            <EditRow label="Delivery Time (min)"    value={restaurant?.deliveryTime} fieldKey="deliveryTime" onSave={saveRestaurant} type="number" />
            <EditRow label="Delivery Fee (TSh)"     value={restaurant?.deliveryFee}  fieldKey="deliveryFee"  onSave={saveRestaurant} type="number" prefix="TSh " />
            <EditRow label="Minimum Order (TSh)"    value={restaurant?.minOrder}     fieldKey="minOrder"     onSave={saveRestaurant} type="number" prefix="TSh " />

            {/* Editable: cuisine */}
            <div style={{ padding: '0.75rem 0', borderBottom: '1px solid #f5f5f5' }}>
              {cuisineEditing ? (
                <>
                  <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '6px' }}>Cuisine</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '0.6rem' }}>
                    {cuisineList.length === 0 && (
                      <span style={{ color: '#ccc', fontSize: '0.85rem', fontStyle: 'italic' }}>No cuisines yet — add some below</span>
                    )}
                    {cuisineList.map(c => (
                      <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fff3ec', color: '#ff6b00', borderRadius: '999px', padding: '3px 6px 3px 12px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {c}
                        <button onClick={() => removeCuisineTag(c)} aria-label={`Remove ${c}`}
                          style={{ background: 'rgba(255,107,0,0.18)', border: 'none', color: '#ff6b00', borderRadius: '50%', width: '18px', height: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1, padding: 0, fontFamily: FONT }}>×</button>
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginBottom: '0.6rem' }}>
                    <input
                      value={cuisineInput}
                      onChange={e => setCuisineInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); addCuisineTag(cuisineInput); }
                        if (e.key === 'Escape') cancelCuisineEdit();
                      }}
                      placeholder="Add a cuisine (e.g. Swahili)"
                      maxLength={30}
                      style={{ flex: 1, borderRadius: '12px', border: '1.5px solid #ff6b00', padding: '0.5rem 0.85rem', fontSize: '0.9rem', outline: 'none', fontFamily: FONT, boxSizing: 'border-box' }}
                    />
                    <button onClick={() => addCuisineTag(cuisineInput)} disabled={!cuisineInput.trim()}
                      style={{ padding: '0.5rem 1rem', borderRadius: '999px', border: 'none', color: '#fff', background: cuisineInput.trim() ? GRADIENT : '#ddd', cursor: cuisineInput.trim() ? 'pointer' : 'default', fontWeight: 700, fontFamily: FONT, fontSize: '0.85rem' }}>Add</button>
                  </div>

                  <div style={{ marginBottom: '0.6rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#aaa', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Suggestions</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {CUISINE_SUGGESTIONS.filter(s => !cuisineList.some(c => c.toLowerCase() === s.toLowerCase())).map(s => (
                        <button key={s} onClick={() => addCuisineTag(s)}
                          style={{ background: '#fafafa', color: '#555', border: '1.5px solid #eee', borderRadius: '999px', padding: '3px 10px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>+ {s}</button>
                      ))}
                    </div>
                  </div>

                  {cuisineError && <div style={{ color: '#e63946', fontSize: '0.75rem', marginBottom: '6px' }}>{cuisineError}</div>}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={cancelCuisineEdit} disabled={cuisineSaving} style={{ flex: 1, padding: '0.45rem', borderRadius: '999px', border: '1.5px solid #ddd', color: '#888', background: '#fff', cursor: cuisineSaving ? 'default' : 'pointer', fontWeight: 600, fontFamily: FONT, fontSize: '0.82rem' }}>Cancel</button>
                    <button onClick={saveCuisine} disabled={cuisineSaving} style={{ flex: 1, padding: '0.45rem', borderRadius: '999px', border: 'none', color: '#fff', background: cuisineSaving ? '#ccc' : GRADIENT, cursor: cuisineSaving ? 'default' : 'pointer', fontWeight: 700, fontFamily: FONT, fontSize: '0.82rem' }}>{cuisineSaving ? 'Saving…' : 'Save'}</button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '6px' }}>Cuisine</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {restaurant?.cuisine?.length
                        ? restaurant.cuisine.map(c => <span key={c} style={{ background: '#fff3ec', color: '#ff6b00', borderRadius: '999px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: 600 }}>{c}</span>)
                        : <span style={{ color: '#ccc', fontSize: '0.85rem', fontStyle: 'italic' }}>None set</span>}
                    </div>
                  </div>
                  <button onClick={startCuisineEdit} aria-label="Edit cuisine"
                    style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: '4px', borderRadius: '8px' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ff6b00'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#ccc'; }}>
                    <PencilIcon />
                  </button>
                </div>
              )}
            </div>

            {/* Read-only: location */}
            <div style={{ padding: '0.75rem 0' }}>
              <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '2px' }}>Location</div>
              <div style={{ fontSize: '0.9rem', color: DARK }}>{restaurant?.location?.address || restaurant?.location?.area || 'Dar es Salaam'}</div>
            </div>
          </div>

          {/* Account info */}
          <div style={CARD}>
            <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem', fontWeight: 700 }}>Account Info</div>
            <EditRow label="Your Name"  value={user?.name}  fieldKey="name"  onSave={saveUser} />
            <EditRow label="Your Phone" value={user?.phone} fieldKey="phone" onSave={saveUser} />

            {/* Read-only email */}
            <div style={{ padding: '0.75rem 0', borderBottom: '1px solid #f5f5f5' }}>
              <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '2px' }}>Email</div>
              <div style={{ fontSize: '0.9rem', color: '#555' }}>{user?.email}</div>
            </div>

            {/* Password change */}
            <div style={{ padding: '0.75rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f5f5f5' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '2px' }}>Password</div>
                <div style={{ fontSize: '0.9rem', color: DARK, letterSpacing: '0.15em' }}>●●●●●●●●</div>
              </div>
              <button onClick={openPwSheet}
                style={{ background: 'none', border: 'none', color: '#ff6b00', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
                Change →
              </button>
            </div>

            {/* Language */}
            <LanguageToggle />
          </div>

          <div style={{ height: '2rem' }} />
        </div>
      </div>

      {/* Password bottom sheet */}
      {pwSheet && (
        <div onClick={closePwSheet}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '1.75rem', width: '100%', maxWidth: '480px', position: 'relative' }}>
            <div style={{ width: 40, height: 4, background: '#e0e0e0', borderRadius: 99, margin: '0 auto 1.25rem' }} />
            <button onClick={closePwSheet} aria-label="Close" disabled={pwLoading}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#aaa', cursor: pwLoading ? 'default' : 'pointer', fontSize: '1.4rem', lineHeight: 1, padding: '4px 8px', fontFamily: FONT }}>×</button>
            <div style={{ fontWeight: 900, fontSize: '1.1rem', color: DARK, marginBottom: '1.25rem' }}>Change Password</div>
            {pwSuccess ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔒</div>
                <div style={{ fontWeight: 700, color: '#1a7a45' }}>Password updated!</div>
              </div>
            ) : (
              <form onSubmit={handleChangePw}>
                {[['current', 'Current Password', currentPw, setCurrentPw], ['new', 'New Password', newPw, setNewPw], ['confirm', 'Confirm New Password', confirmPw, setConfirmPw]].map(([id, lbl, v, set]) => {
                  const visible = pwVisible[id];
                  return (
                    <div key={id} style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '6px', fontWeight: 600 }}>{lbl}</label>
                      <div style={{ position: 'relative' }}>
                        <input type={visible ? 'text' : 'password'} value={v} onChange={e => set(e.target.value)} placeholder="••••••••"
                          style={{ width: '100%', border: '1.5px solid #e0e0e0', borderRadius: '12px', padding: '0.7rem 2.5rem 0.7rem 0.85rem', fontSize: '0.9rem', outline: 'none', fontFamily: FONT, boxSizing: 'border-box' }} />
                        <button type="button" aria-label={visible ? 'Hide password' : 'Show password'}
                          onClick={() => setPwVisible(s => ({ ...s, [id]: !s[id] }))}
                          style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 0, display: 'flex', alignItems: 'center' }}>
                          {visible ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {pwError && <div style={{ color: '#e63946', fontSize: '0.8rem', marginBottom: '0.75rem', background: '#fff5f5', border: '1px solid #fcc', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>{pwError}</div>}
                <button type="submit" disabled={pwLoading}
                  style={{ width: '100%', background: pwLoading ? '#ccc' : GRADIENT, color: '#fff', border: 'none', borderRadius: '999px', padding: '0.8rem', fontWeight: 700, fontSize: '0.95rem', cursor: pwLoading ? 'default' : 'pointer', fontFamily: FONT }}>
                  {pwLoading ? 'Saving…' : 'Change Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
