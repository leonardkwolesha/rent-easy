import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import PageWrapper from '../components/PageWrapper';
import { staggerFast, scaleIn, cardHover, fadeUp, stagger } from '../animations/variants';

const CUISINE_FILTERS = ['All', 'Biryani', 'Burgers', 'Pizza', 'Nyama Choma', 'Pilau', 'Samosas', 'Desserts'];
const CUISINE_EMOJI = { Biryani: '🍛', Burgers: '🍔', Pizza: '🍕', 'Nyama Choma': '🥩', Pilau: '🥘', Indian: '🍜', Chinese: '🥡', default: '🍽️' };

function getEmoji(cuisines = []) {
  for (const c of cuisines) if (CUISINE_EMOJI[c]) return CUISINE_EMOJI[c];
  return CUISINE_EMOJI.default;
}

const s = {
  page: { fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: '100vh', background: '#f8f8f8' },
  header: { background: 'linear-gradient(135deg, #ff6b00, #e63946)', padding: '1.5rem 2rem 3rem', color: '#fff' },
  backBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '999px', padding: '0.4rem 1rem', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '1rem', display: 'inline-block' },
  headerTitle: { fontSize: '2rem', fontWeight: 900, margin: '0 0 0.25rem' },
  headerSub: { opacity: 0.85, margin: 0 },
  searchRow: { display: 'flex', gap: '0.75rem', marginTop: '1.25rem', maxWidth: '500px' },
  searchInput: { flex: 1, padding: '0.7rem 1.25rem', borderRadius: '999px', border: 'none', fontSize: '0.95rem', outline: 'none' },
  body: { maxWidth: '1100px', margin: '0 auto', padding: '2rem' },
  filtersRow: { display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.75rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' },
  cardBase: { background: '#fff', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', cursor: 'pointer', border: '1px solid #f0f0f0' },
  cardImgPlaceholder: (open) => ({ height: '150px', background: open ? 'linear-gradient(135deg, #ff6b0022, #e6394622)' : 'linear-gradient(135deg, #f0f0f0, #e8e8e8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }),
  cardBody: { padding: '1rem 1.25rem 1.25rem' },
  cardTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardName: { fontWeight: 800, fontSize: '1.05rem', margin: '0 0 0.25rem' },
  badge: (open) => ({ fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '999px', background: open ? '#d4f7e0' : '#f0f0f0', color: open ? '#1a7a45' : '#999', whiteSpace: 'nowrap' }),
  cardCuisine: { fontSize: '0.82rem', color: '#888', margin: '0.25rem 0 0.75rem' },
  cardMeta: { display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#555' },
  emptyState: { textAlign: 'center', padding: '4rem 2rem', color: '#999' },
  errorBox: { background: '#fff5f5', border: '1px solid #fcc', borderRadius: '16px', padding: '2rem', textAlign: 'center', maxWidth: '480px', margin: '4rem auto' },
  retryBtn: { background: 'linear-gradient(135deg, #ff6b00, #e63946)', color: '#fff', border: 'none', borderRadius: '999px', padding: '0.65rem 1.75rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' },
  loadingGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' },
  skeleton: { borderRadius: '18px', overflow: 'hidden', height: '240px', border: '1px solid #f0f0f0', background: 'linear-gradient(90deg, #efefef 25%, #f5f5f5 50%, #efefef 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' },
};

function RestaurantCard({ r, onClick }) {
  return (
    <motion.div
      style={s.cardBase}
      initial="rest"
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
      variants={cardHover}
      layout
      onClick={onClick}
    >
      <motion.div
        style={{ overflow: 'hidden' }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div style={s.cardImgPlaceholder(r.isOpen)}>{getEmoji(r.cuisine)}</div>
      </motion.div>
      <div style={s.cardBody}>
        <div style={s.cardTopRow}>
          <div style={s.cardName}>{r.name}</div>
          <span style={s.badge(r.isOpen)}>{r.isOpen ? 'Open' : 'Closed'}</span>
        </div>
        <div style={s.cardCuisine}>{r.cuisine?.join(' · ')}</div>
        <div style={s.cardMeta}>
          <span>⏱ {r.deliveryTime ?? '—'} min</span>
          <span>⭐ {r.rating ?? '—'}</span>
          <span>🚚 TSh {r.deliveryFee ?? '—'}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  function fetchRestaurants() {
    setLoading(true); setError(null);
    const params = {};
    if (activeFilter !== 'All') params.cuisine = activeFilter;
    const currentSearch = search.trim() || searchParams.get('q') || '';
    if (currentSearch) params.q = currentSearch;
    api.get('/restaurants', { params })
      .then((res) => setRestaurants(res.data))
      .catch((err) => {
        setError(!err.response
          ? 'Cannot reach the server. Make sure the backend is running on port 5000.'
          : `Server error: ${err.response.status} — ${err.response.data?.message || 'Something went wrong.'}`);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const cuisineParam = searchParams.get('cuisine');
    if (cuisineParam && CUISINE_FILTERS.includes(cuisineParam)) setActiveFilter(cuisineParam);
    const qParam = searchParams.get('q');
    if (qParam) setSearch(qParam);
  }, []);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) { setSearch(q); fetchRestaurants(); }
  }, [searchParams]);

  useEffect(() => { fetchRestaurants(); }, [activeFilter]);

  useEffect(() => {
    if (!search.trim()) return;
    const timer = setTimeout(() => fetchRestaurants(), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (search === '') fetchRestaurants();
  }, [search]);

  const q = search.trim().toLowerCase();
  const displayed = restaurants.filter((r) => {
    const matchesCuisine =
      activeFilter === 'All' ||
      r.cuisine?.some((c) => c.toLowerCase() === activeFilter.toLowerCase());
    const matchesSearch =
      !q ||
      r.name?.toLowerCase().includes(q) ||
      r.cuisine?.some((c) => c.toLowerCase().includes(q)) ||
      r.description?.toLowerCase().includes(q);
    return matchesCuisine && matchesSearch;
  });

  return (
    <PageWrapper>
      <div style={s.page}>
        <style>{`
          @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        `}</style>

        <div style={s.header}>
          <button style={s.backBtn} onClick={() => navigate('/')}>← Back to home</button>
          <h1 style={s.headerTitle}>Restaurants near you</h1>
          <p style={s.headerSub}>
            {loading ? 'Loading…' : error ? 'Oops, something went wrong' : `${restaurants.length} restaurants available`}
          </p>
          <form onSubmit={(e) => { e.preventDefault(); fetchRestaurants(); }} style={s.searchRow}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                style={{ ...s.searchInput, flex: undefined, width: '100%', boxSizing: 'border-box', paddingRight: search ? '2.5rem' : '1.25rem' }}
                placeholder="Search restaurants or cuisine…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search.length > 0 && (
                <button type="button" onClick={() => setSearch('')} aria-label="Clear search" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '1rem', padding: 0 }}>✕</button>
              )}
            </div>
            <motion.button
              type="submit"
              disabled={loading}
              style={{ ...s.backBtn, background: '#fff', color: '#e63946', fontWeight: 700, margin: 0, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              {loading ? 'Searching…' : 'Search'}
            </motion.button>
          </form>
        </div>

        <div style={s.body}>
          {/* Filter pills with layoutId active indicator */}
          <motion.div style={s.filtersRow} variants={staggerFast} initial="hidden" animate="visible">
            {CUISINE_FILTERS.map((f) => {
              const active = activeFilter === f;
              return (
                <motion.button
                  key={f}
                  variants={scaleIn}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setActiveFilter(f)}
                  style={{ padding: '0.45rem 1.1rem', borderRadius: '999px', border: active ? 'none' : '1.5px solid #ddd', background: active ? 'linear-gradient(135deg, #ff6b00, #e63946)' : '#fff', color: active ? '#fff' : '#555', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                >
                  {f}
                </motion.button>
              );
            })}
          </motion.div>

          {error && (
            <div style={s.errorBox}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>⚠️</div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#c1121f', marginBottom: '0.5rem' }}>Could not load restaurants</div>
              <div style={{ color: '#666', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>{error}</div>
              <button style={s.retryBtn} onClick={fetchRestaurants}>Retry</button>
            </div>
          )}

          {loading && !error && (
            <div style={s.loadingGrid}>
              {Array.from({ length: 6 }).map((_, i) => <div key={i} style={s.skeleton} />)}
            </div>
          )}

          {!loading && !error && (
            displayed.length === 0 ? (
              <div style={s.emptyState}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🍽️</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#444', marginBottom: '0.5rem' }}>No restaurants found</div>
                <p>Try a different filter or search term.</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={activeFilter}
                  style={s.grid}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  {displayed.map((r) => (
                    <RestaurantCard key={r._id} r={r} onClick={() => navigate(`/restaurants/${r._id}`)} />
                  ))}
                </motion.div>
              </AnimatePresence>
            )
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
