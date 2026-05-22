import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Search, X, ChevronDown, Loader } from 'lucide-react';
import { BRAND } from '../theme';
import PropertyCard from '../components/PropertyCard';
import api from '../services/api';

const TYPES = ['apartment', 'house', 'studio', 'villa', 'room', 'commercial'];
const BEDROOM_OPTIONS = ['Any', '1', '2', '3', '4', '5+'];

const CSS = `
.prop-input{width:100%;padding:9px 12px;border-radius:8px;border:1px solid ${BRAND.border};font-size:13px;outline:none;transition:border-color .15s,box-shadow .15s;box-sizing:border-box;background:#fff;font-family:inherit}
.prop-input:focus{border-color:${BRAND.primary};box-shadow:0 0 0 3px ${BRAND.primary}18}
.prop-select{width:100%;padding:9px 12px;border-radius:8px;border:1px solid ${BRAND.border};font-size:13px;outline:none;cursor:pointer;background:#fff;font-family:inherit;transition:border-color .15s}
.prop-select:focus{border-color:${BRAND.primary}}
.filter-toggle{display:none;align-items:center;gap:8px;padding:9px 16px;border-radius:9px;border:1px solid ${BRAND.border};background:#fff;font-size:13px;font-weight:500;cursor:pointer;color:${BRAND.text};transition:background .15s}
.filter-toggle:hover{background:${BRAND.bg}}
.prop-grid{display:grid;grid-template-columns:260px 1fr;gap:28px;align-items:start}
.filters-panel{display:block}
.bed-btn{padding:7px 12px;border-radius:8px;border:1px solid ${BRAND.border};font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;background:#fff;color:${BRAND.text};font-family:inherit}
.bed-btn:hover{border-color:${BRAND.primary};color:${BRAND.primary}}
.bed-btn.active{background:${BRAND.primary};color:#fff;border-color:${BRAND.primary}}
@media(max-width:900px){
  .prop-grid{grid-template-columns:1fr}
  .filter-toggle{display:flex}
  .filters-panel{display:none}
  .filters-panel.open{display:block}
}
@media(max-width:600px){
  .prop-results-grid{grid-template-columns:1fr !important}
}
`;

export default function Properties() {
  const [searchParams] = useSearchParams();

  // ── What the inputs display (updates immediately on keystroke) ──
  const [draft, setDraft] = useState({
    city: searchParams.get('city') || '',
    minRent: '',
    maxRent: '',
  });

  // ── What the API actually uses (only updates after debounce / instant for selects) ──
  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    type: '',
    minRent: '',
    maxRent: '',
    bedrooms: '',
    page: 1,
  });

  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false); // debounce pending indicator
  const [filtersOpen, setFiltersOpen] = useState(false);

  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  // ── Inject CSS once ──
  useEffect(() => {
    const style = document.createElement('style');
    style.dataset.id = 'prop-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // ── Fetch with abort controller to cancel stale requests ──
  const fetchProperties = useCallback(async (f) => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const clean = Object.fromEntries(
        Object.entries(f).filter(([, v]) => v !== '' && v !== 0 && v !== 'Any')
      );
      const query = new URLSearchParams(clean).toString();
      const { data } = await api.get(`/properties?${query}`, {
        signal: controller.signal,
      });
      setProperties(data.data);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return; // ignore aborted
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, []);

  // ── Re-fetch whenever committed filters change ──
  useEffect(() => {
    fetchProperties(filters);
  }, [filters, fetchProperties]);

  // ── Debounce text inputs (city, minRent, maxRent) — 450ms ──
  useEffect(() => {
    clearTimeout(debounceRef.current);
    const hasChange =
      draft.city !== filters.city ||
      draft.minRent !== filters.minRent ||
      draft.maxRent !== filters.maxRent;

    if (!hasChange) { setSearching(false); return; }

    setSearching(true);
    debounceRef.current = setTimeout(() => {
      setFilters(f => ({
        ...f,
        city: draft.city,
        minRent: draft.minRent,
        maxRent: draft.maxRent,
        page: 1,
      }));
    }, 450);

    return () => clearTimeout(debounceRef.current);
  }, [draft.city, draft.minRent, draft.maxRent]);

  // ── Instant update for selects ──
  const setInstant = (key, val) =>
    setFilters(f => ({ ...f, [key]: val, page: 1 }));

  const clearAll = () => {
    setDraft({ city: '', minRent: '', maxRent: '' });
    setFilters({ city: '', type: '', minRent: '', maxRent: '', bedrooms: '', page: 1 });
  };

  const activeCount = [
    draft.city, filters.type, draft.minRent, draft.maxRent, filters.bedrooms,
  ].filter(v => v && v !== 'Any').length;

  const Label = ({ children }) => (
    <label style={{ fontSize: 11, fontWeight: 600, color: BRAND.muted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.4px' }}>
      {children}
    </label>
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Syne', sans-serif", marginBottom: 2 }}>
          Browse Properties
        </h1>
        <p style={{ color: BRAND.muted, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          {loading || searching
            ? <><Loader size={12} style={{ animation: 'spin 1s linear infinite' }} />Searching…</>
            : `${total} propert${total !== 1 ? 'ies' : 'y'} found`
          }
        </p>
      </div>

      {/* Mobile filter toggle */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <button className="filter-toggle" onClick={() => setFiltersOpen(o => !o)}>
          <SlidersHorizontal size={14} />
          Filters
          {activeCount > 0 && (
            <span style={{ background: BRAND.primary, color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
              {activeCount}
            </span>
          )}
          <ChevronDown size={13} style={{ transition: 'transform .2s', transform: filtersOpen ? 'rotate(180deg)' : 'none' }} />
        </button>
        {activeCount > 0 && (
          <button onClick={clearAll} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: BRAND.danger, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            <X size={12} />Clear all
          </button>
        )}
      </div>

      <div className="prop-grid">
        {/* ── Filters sidebar ── */}
        <div className={`filters-panel${filtersOpen ? ' open' : ''}`}>
          <div style={{
            background: BRAND.surface, borderRadius: BRAND.radius, padding: 20,
            border: `1px solid ${BRAND.border}`, boxShadow: BRAND.shadow,
            position: 'sticky', top: 80,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <SlidersHorizontal size={14} color={BRAND.primary} />Filters
              </p>
              {activeCount > 0 && (
                <button onClick={clearAll} style={{ fontSize: 12, color: BRAND.danger, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <X size={11} />Clear
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* City search */}
              <div>
                <Label>City</Label>
                <div style={{ position: 'relative' }}>
                  {searching && draft.city !== filters.city
                    ? <Loader size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: BRAND.primary, animation: 'spin 1s linear infinite' }} />
                    : <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: BRAND.muted }} />
                  }
                  <input
                    className="prop-input"
                    value={draft.city}
                    placeholder="e.g. Dar es Salaam"
                    onChange={e => setDraft(d => ({ ...d, city: e.target.value }))}
                    style={{ paddingLeft: 30 }}
                  />
                  {draft.city && (
                    <button onClick={() => setDraft(d => ({ ...d, city: '' }))}
                      style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: BRAND.muted, display: 'flex', padding: 2 }}>
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Property type */}
              <div>
                <Label>Property Type</Label>
                <select
                  className="prop-select"
                  value={filters.type}
                  onChange={e => setInstant('type', e.target.value)}
                >
                  <option value="">All Types</option>
                  {TYPES.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Bedrooms */}
              <div>
                <Label>Bedrooms</Label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {BEDROOM_OPTIONS.map(b => (
                    <button
                      key={b}
                      className={`bed-btn${filters.bedrooms === (b === 'Any' ? '' : b === '5+' ? '5' : b) ? ' active' : ''}`}
                      onClick={() => setInstant('bedrooms', b === 'Any' ? '' : b === '5+' ? '5' : b)}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rent range */}
              <div>
                <Label>Rent Range (TZS/mo)</Label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    className="prop-input"
                    value={draft.minRent}
                    type="number"
                    placeholder="Min"
                    min="0"
                    onChange={e => setDraft(d => ({ ...d, minRent: e.target.value }))}
                  />
                  <span style={{ color: BRAND.muted, fontSize: 12, flexShrink: 0 }}>—</span>
                  <input
                    className="prop-input"
                    value={draft.maxRent}
                    type="number"
                    placeholder="Max"
                    min="0"
                    onChange={e => setDraft(d => ({ ...d, maxRent: e.target.value }))}
                  />
                </div>
                {(searching && (draft.minRent !== filters.minRent || draft.maxRent !== filters.maxRent)) && (
                  <p style={{ fontSize: 11, color: BRAND.primary, marginTop: 4 }}>Applying…</p>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* ── Results ── */}
        <div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ borderRadius: BRAND.radius, overflow: 'hidden', background: BRAND.surface, border: `1px solid ${BRAND.border}` }}>
                  <div style={{ height: 180, background: `linear-gradient(90deg,${BRAND.bg} 25%,#e8e8e8 50%,${BRAND.bg} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease infinite' }} />
                  <div style={{ padding: 16 }}>
                    <div style={{ height: 14, borderRadius: 6, background: BRAND.bg, marginBottom: 8, width: '65%' }} />
                    <div style={{ height: 11, borderRadius: 6, background: BRAND.bg, width: '45%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '72px 0', color: BRAND.muted }}>
              <Search size={38} color={BRAND.border} style={{ marginBottom: 14 }} />
              <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: BRAND.text }}>No properties found</p>
              <p style={{ fontSize: 13 }}>Try adjusting your filters or clearing them</p>
              {activeCount > 0 && (
                <button onClick={clearAll} style={{ marginTop: 16, padding: '9px 20px', borderRadius: 9, background: BRAND.primary, color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="prop-results-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
                {properties.map(p => <PropertyCard key={p._id} property={p} />)}
              </div>

              {pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 32, flexWrap: 'wrap' }}>
                  {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                    <button key={p}
                      onClick={() => setFilters(f => ({ ...f, page: p }))}
                      style={{
                        width: 38, height: 38, borderRadius: 9, fontWeight: 600, fontSize: 13,
                        cursor: 'pointer', transition: 'all .15s',
                        background: filters.page === p ? BRAND.primary : BRAND.surface,
                        color: filters.page === p ? '#fff' : BRAND.text,
                        border: `1px solid ${filters.page === p ? BRAND.primary : BRAND.border}`,
                      }}
                      onMouseEnter={e => { if (filters.page !== p) e.currentTarget.style.background = BRAND.bg; }}
                      onMouseLeave={e => { if (filters.page !== p) e.currentTarget.style.background = BRAND.surface; }}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>
    </div>
  );
}
