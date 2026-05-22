import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useCart } from '../context/CartContext'

const CUISINE_EMOJI = {
  Biryani: '🍛', Burgers: '🍔', Pizza: '🍕',
  'Nyama Choma': '🥩', Pilau: '🥘',
  Samosas: '🥟', Desserts: '🍰',
  Sushi: '🍱', Chinese: '🥡',
  Indian: '🍜', default: '🍽️',
}

function getEmoji(cuisines = []) {
  for (const c of cuisines) {
    if (CUISINE_EMOJI[c]) return CUISINE_EMOJI[c]
  }
  return CUISINE_EMOJI.default
}

function getCategories(menu = []) {
  const cats = [...new Set(menu.map(i => i.category ?? 'Main'))]
  return cats.length ? cats : ['Main']
}

export default function RestaurantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { cart, addToCart, removeFromCart, pendingAdd, confirmSwitch, cancelSwitch } = useCart()

  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [activeTab, setActiveTab]   = useState(null)
  const [addedItem, setAddedItem]   = useState(null)

  const myCartItems = cart.items.filter(i => i.restaurantId === restaurant?._id)
  const myCartCount = myCartItems.reduce((s, i) => s + i.quantity, 0)
  const myCartTotal = myCartItems.reduce((s, i) => s + i.price * i.quantity, 0)

  async function fetchRestaurant() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/restaurants/${id}`)
      setRestaurant(res.data)
      const cats = getCategories(res.data.menu ?? [])
      if (cats.length > 0) setActiveTab(cats[0])
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load restaurant. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRestaurant() }, [id])

  function getQtyInCart(itemId) {
    const found = cart.items.find(i => i._id === itemId)
    return found ? found.quantity : 0
  }

  function handleAdd(item) {
    addToCart({
      _id:            item._id,
      name:           item.name,
      price:          item.price,
      restaurantId:   restaurant._id,
      restaurantName: restaurant.name,
      emoji:          getEmoji(restaurant.cuisine),
    }, {
      _id:  restaurant._id,
      name: restaurant.name,
    })
    setAddedItem(item._id)
    setTimeout(() => setAddedItem(null), 400)
  }

  const shimmerStyle = {
    background: 'linear-gradient(90deg,#efefef 25%,#f5f5f5 50%,#efefef 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f8f8', fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <div style={{ height: 240, ...shimmerStyle }} />
        <div style={{ padding: '1.25rem 1rem', background: '#fff', marginBottom: 8 }}>
          {[180, 120, 200].map((w, i) => (
            <div key={i} style={{ width: w, height: 16, borderRadius: 8, marginBottom: 10, ...shimmerStyle }} />
          ))}
        </div>
        <div style={{ padding: '0 1rem' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: 90, borderRadius: 14, marginBottom: 12, ...shimmerStyle }} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
        <div style={{ background: '#fff5f5', border: '1px solid #fcc', borderRadius: 18, padding: '2rem', textAlign: 'center', maxWidth: 400, margin: '0 1rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>⚠️</div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#c1121f', marginBottom: '0.5rem' }}>Could not load restaurant</div>
          <div style={{ color: '#666', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>{error}</div>
          <button onClick={fetchRestaurant} style={{ background: 'linear-gradient(135deg,#ff6b00,#e63946)', color: '#fff', border: 'none', borderRadius: '999px', padding: '0.65rem 1.75rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  const categories = getCategories(restaurant.menu)
  const filtered = (restaurant.menu ?? []).filter(
    item => (item.category ?? 'Main') === activeTab && item.isAvailable !== false
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f8', fontFamily: "'Segoe UI',system-ui,sans-serif", paddingBottom: myCartCount > 0 ? '88px' : '24px' }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes popIn   { 0%{transform:scale(1)} 50%{transform:scale(1.25)} 100%{transform:scale(1)} }
        @keyframes slideUp { from{transform:translateY(100%);opacity:0.5} to{transform:translateY(0);opacity:1} }
        @keyframes floatUp { 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(-28px);opacity:0} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── HERO ── */}
      <div style={{ height: 240, position: 'relative', overflow: 'hidden' }}>
        {restaurant.imageUrl ? (
          <>
            <img
              src={restaurant.imageUrl}
              onError={e => { e.target.style.display = 'none' }}
              style={{ width: '100%', height: 240, objectFit: 'cover', display: 'block' }}
              alt={restaurant.name}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.15) 0%,rgba(0,0,0,0.65) 100%)' }} />
          </>
        ) : (
          <div style={{ width: '100%', height: 240, background: 'linear-gradient(135deg,#ff6b00,#e63946)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.4s ease' }}>
            <span style={{ fontSize: '5rem' }}>{getEmoji(restaurant.cuisine)}</span>
          </div>
        )}

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.35)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '999px', padding: '0.4rem 1rem', fontSize: '0.85rem', backdropFilter: 'blur(4px)', zIndex: 1 }}
          aria-label="Go back"
        >
          ← Back
        </button>

        {/* Share */}
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: restaurant.name, url: window.location.href })
            } else {
              navigator.clipboard.writeText(window.location.href)
            }
          }}
          style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.35)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '999px', padding: '0.4rem 1rem', fontSize: '0.85rem', backdropFilter: 'blur(4px)', zIndex: 1 }}
          aria-label="Share restaurant"
        >
          ↗ Share
        </button>

        {/* Name + badge */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1rem 1rem 1.25rem', zIndex: 1 }}>
          <h1 style={{ margin: '0 0 0.35rem', fontSize: '1.5rem', fontWeight: 900, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            {restaurant.name}
          </h1>
          <span style={{ display: 'inline-block', background: restaurant.isOpen ? '#d4f7e0' : '#f0f0f0', color: restaurant.isOpen ? '#1a7a45' : '#999', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.7rem' }}>
            {restaurant.isOpen ? '● Open' : '● Closed'}
          </span>
        </div>
      </div>

      {/* ── INFO BAR ── */}
      <div style={{ background: '#fff', padding: '1rem 1.25rem', borderBottom: '1px solid #f0f0f0', marginBottom: 8, animation: 'fadeIn 0.4s ease' }}>
        {/* Cuisine tags */}
        {restaurant.cuisine?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '0.75rem' }}>
            {restaurant.cuisine.map(c => (
              <span key={c} style={{ background: '#fff3ec', color: '#ff6b00', borderRadius: '999px', padding: '0.25rem 0.75rem', fontSize: '0.78rem', fontWeight: 600 }}>
                {c}
              </span>
            ))}
          </div>
        )}

        {/* Meta strip */}
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.875rem', color: '#555' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>⏱ {restaurant.deliveryTime ?? '—'} min</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>⭐ {restaurant.rating?.toFixed(1) ?? '—'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>🚚 TSh {restaurant.deliveryFee?.toLocaleString() ?? '—'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>📍 {restaurant.location?.address ? restaurant.location.address.split(',')[0] : 'Dar es Salaam'}</span>
        </div>

        {/* Description */}
        {restaurant.description && (
          <p style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f5f5f5', fontSize: '0.875rem', color: '#666', lineHeight: 1.6, margin: '0.75rem 0 0' }}>
            {restaurant.description}
          </p>
        )}

        {/* Info chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: '0.75rem' }}>
          {restaurant.minOrder > 0 && (
            <span style={{ background: '#f5f5f5', color: '#555', borderRadius: '999px', padding: '0.2rem 0.75rem', fontSize: '0.78rem' }}>
              Min. TSh {restaurant.minOrder.toLocaleString()}
            </span>
          )}
          <span style={{ background: '#f5f5f5', color: '#555', borderRadius: '999px', padding: '0.2rem 0.75rem', fontSize: '0.78rem' }}>
            📱 M-Pesa
          </span>
        </div>
      </div>

      {/* ── CATEGORY TABS ── */}
      <div style={{ overflowX: 'auto', display: 'flex', gap: '0.5rem', padding: '0.75rem 1rem', background: '#fff', marginBottom: 8, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            style={{ flexShrink: 0, padding: '0.45rem 1.1rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s', background: activeTab === cat ? 'linear-gradient(135deg,#ff6b00,#e63946)' : '#f5f5f5', color: activeTab === cat ? '#fff' : '#555' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── MENU ITEMS ── */}
      <div style={{ padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>
            <div style={{ fontSize: '3rem' }}>🍽️</div>
            <div style={{ marginTop: '0.5rem' }}>No items in this category</div>
          </div>
        ) : filtered.map(item => {
          const qty = getQtyInCart(item._id)
          const itemImg = item.imageUrl || item.image
          return (
            <div
              key={item._id}
              style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', padding: '0.9rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', animation: 'fadeIn 0.3s ease', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}
            >
              {/* Left */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1a1a2e', margin: '0 0 0.25rem' }}>{item.name}</div>
                {item.description && (
                  <div style={{ fontSize: '0.8rem', color: '#888', lineHeight: 1.5, margin: '0 0 0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.description}
                  </div>
                )}
                {item.tags?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: '0.25rem' }}>
                    {item.tags.map(tag => (
                      <span key={tag} style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '999px', background: '#fff3ec', color: '#ff6b00' }}>{tag}</span>
                    ))}
                  </div>
                )}
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#ff6b00', marginTop: '0.5rem', display: 'block' }}>
                  TSh {item.price.toLocaleString()}
                </span>
              </div>

              {/* Right */}
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                {itemImg && (
                  <img
                    src={itemImg}
                    onError={e => { e.target.style.display = 'none' }}
                    style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', display: 'block' }}
                    alt={item.name}
                  />
                )}

                {/* Qty controls */}
                <div style={{ position: 'relative' }}>
                  {qty === 0 ? (
                    <>
                      <button
                        onClick={() => handleAdd(item)}
                        aria-label={`Add ${item.name} to cart`}
                        style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#ff6b00,#e63946)', color: '#fff', border: 'none', fontSize: '1.4rem', fontWeight: 300, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(255,107,0,0.35)', animation: addedItem === item._id ? 'popIn 0.4s ease' : 'none' }}
                      >
                        +
                      </button>
                      {addedItem === item._id && (
                        <div style={{ position: 'absolute', bottom: '100%', right: 0, color: '#ff6b00', fontWeight: 900, fontSize: '0.95rem', pointerEvents: 'none', animation: 'floatUp 0.6s ease forwards' }}>
                          +1
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        aria-label="Decrease quantity"
                        style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', color: '#ff6b00', border: '2px solid #ff6b00', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
                      >
                        −
                      </button>
                      <span style={{ fontWeight: 800, minWidth: 20, textAlign: 'center', fontSize: '0.95rem', color: '#1a1a2e' }}>{qty}</span>
                      <button
                        onClick={() => handleAdd(item)}
                        aria-label="Increase quantity"
                        style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#ff6b00,#e63946)', color: '#fff', border: 'none', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── STICKY CART BAR ── */}
      {myCartCount > 0 && (
        <div style={{ position: 'fixed', bottom: 64, left: 0, right: 0, zIndex: 900, padding: '0.75rem 1rem' }}>
          <button
            onClick={() => navigate('/checkout')}
            style={{ width: '100%', background: 'linear-gradient(135deg,#ff6b00,#e63946)', borderRadius: 16, padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(255,107,0,0.35)', animation: 'slideUp 0.3s ease' }}
          >
            <span style={{ fontSize: '0.9rem', opacity: 0.9, color: '#fff' }}>
              {myCartCount} item{myCartCount > 1 ? 's' : ''}
            </span>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>View Cart</span>
            <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
              TSh {myCartTotal.toLocaleString()}
            </span>
          </button>
        </div>
      )}

      {/* ── CONFLICT MODAL ── */}
      {pendingAdd && (
        <div
          onClick={cancelSwitch}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 24, padding: '2rem 1.5rem', maxWidth: 320, width: '100%', textAlign: 'center', animation: 'fadeIn 0.2s ease' }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🛒</div>
            <div style={{ fontWeight: 900, fontSize: '1.15rem', color: '#1a1a2e', marginBottom: '0.5rem' }}>Start a new order?</div>
            <p style={{ color: '#888', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
              Your cart has items from a different restaurant. Starting a new order will clear your current cart.
            </p>
            <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
              <button
                onClick={confirmSwitch}
                style={{ background: 'linear-gradient(135deg,#ff6b00,#e63946)', color: '#fff', border: 'none', borderRadius: '999px', padding: '0.75rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}
              >
                Clear &amp; add new
              </button>
              <button
                onClick={cancelSwitch}
                style={{ background: '#fff', color: '#ff6b00', border: '2px solid #ff6b00', borderRadius: '999px', padding: '0.75rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}
              >
                Keep current cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
