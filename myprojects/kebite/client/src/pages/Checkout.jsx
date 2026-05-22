import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

// ── localStorage keys ─────────────────────────────────────────────────────────
const SAVED_PHONE_KEY = 'kebite_saved_phone'
const SAVED_CARDS_KEY = 'kebite_saved_cards'

// ── SVG icons ─────────────────────────────────────────────────────────────────

function ReceiptIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M4 2h16a1 1 0 0 1 1 1v18l-3-2-2 2-2-2-2 2-2-2-3 2V3a1 1 0 0 1 1-1z"
        fill="#ff6b00" fillOpacity="0.15" stroke="#ff6b00" strokeWidth="1.5" strokeLinejoin="round"/>
      <line x1="8" y1="8"  x2="16" y2="8"  stroke="#ff6b00" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="8" y1="12" x2="16" y2="12" stroke="#ff6b00" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="8" y1="16" x2="12" y2="16" stroke="#ff6b00" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function LockIcon({ size = 13, color = '#16a34a' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <rect x="3" y="7" width="10" height="8" rx="2" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.4"/>
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="8" cy="11" r="1.2" fill={color}/>
    </svg>
  )
}

function CashIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="1" y="7" width="26" height="14" rx="3" fill="#22C55E" stroke="#16A34A" strokeWidth="1.2"/>
      <rect x="1" y="7" width="26" height="14" rx="3" fill="url(#cg)"/>
      <circle cx="14" cy="14" r="4" fill="#BBF7D0" stroke="#16A34A" strokeWidth="1"/>
      <text x="12.5" y="17.5" fontSize="6" fontWeight="800" fill="#15803D" fontFamily="serif">$</text>
      <rect x="3"  y="10" width="4" height="3" rx="1" fill="#86EFAC" opacity="0.7"/>
      <rect x="21" y="15" width="4" height="3" rx="1" fill="#86EFAC" opacity="0.7"/>
      <defs>
        <linearGradient id="cg" x1="1" y1="7" x2="27" y2="21">
          <stop offset="0%"   stopColor="#4ADE80" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#16A34A" stopOpacity="0"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

function VisaIcon() {
  return (
    <svg width="44" height="28" viewBox="0 0 44 28" fill="none">
      <rect width="44" height="28" rx="5" fill="#1A1F71"/>
      <text x="5" y="20" fontSize="13" fontWeight="900" fill="#fff" fontFamily="serif" letterSpacing="0.5">VISA</text>
      <circle cx="30" cy="14" r="7" fill="#EB001B"/>
      <circle cx="38" cy="14" r="7" fill="#F79E1B"/>
      <path d="M34 8.5a7 7 0 0 1 0 11 7 7 0 0 1 0-11z" fill="#FF5F00"/>
    </svg>
  )
}

function MixxIcon() {
  return (
    <svg width="44" height="24" viewBox="0 0 44 24" fill="none">
      <rect width="44" height="24" rx="4" fill="#0066CC"/>
      <text x="4"  y="16" fontSize="8" fontWeight="900" fill="#fff"    fontFamily="sans-serif">mixx</text>
      <text x="26" y="16" fontSize="7" fontWeight="700" fill="#FFD700" fontFamily="sans-serif">YAS</text>
    </svg>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCardNumber(v) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}
function formatExpiry(v) {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length >= 3 ? d.slice(0, 2) + '/' + d.slice(2) : d
}
function loadSavedCards() {
  try { return JSON.parse(localStorage.getItem(SAVED_CARDS_KEY) ?? '[]') } catch { return [] }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Checkout() {
  const navigate = useNavigate()
  const { cart, cartTotal, clearCart } = useCart()
  const { user } = useAuth()

  const items = cart.items

  const [address, setAddress] = useState({
    area:   user?.savedAddresses?.[0]?.area   ?? '',
    street: user?.savedAddresses?.[0]?.street ?? '',
    notes:  '',
  })
  const [paymentMethod, setPaymentMethod] = useState('mpesa')

  // ── phone state ──
  const [phone, setPhone] = useState(
    () => user?.phone?.replace(/^\+255/, '') ?? localStorage.getItem(SAVED_PHONE_KEY) ?? ''
  )

  // ── card state ──
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv,    setCardCvv]    = useState('')
  const [cardName,   setCardName]   = useState('')
  const [saveCard,   setSaveCard]   = useState(false)
  const [savedCards, setSavedCards] = useState(loadSavedCards)
  const [activeSavedCard, setActiveSavedCard] = useState(null)

  // ── misc ──
  const [promoCode,    setPromoCode]    = useState('')
  const [promoData,    setPromoData]    = useState(null)
  const [promoError,   setPromoError]   = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [errors,       setErrors]       = useState({})
  const [summaryOpen,  setSummaryOpen]  = useState(true)

  const deliveryFee = items[0]?.deliveryFee ?? 2000
  const discount    = promoData?.discount   ?? 0
  const total       = cartTotal + deliveryFee - discount

  // Redirect if cart emptied
  useEffect(() => { if (items.length === 0) navigate('/restaurants') }, [items])

  // Auto-fill phone from localStorage if user profile has none
  useEffect(() => {
    if (!phone) {
      const saved = localStorage.getItem(SAVED_PHONE_KEY)
      if (saved) setPhone(saved)
    }
  }, [])

  // ── Promo ─────────────────────────────────────────────────────────────────

  async function applyPromo() {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    setPromoError('')
    try {
      const res = await api.post('/promos/validate', {
        code: promoCode.trim(), restaurantId: items[0]?.restaurantId,
      })
      setPromoData(res.data)
    } catch (err) {
      setPromoError(err.response?.data?.message ?? 'Invalid or expired promo code')
      setPromoData(null)
    } finally { setPromoLoading(false) }
  }

  // ── Validation ────────────────────────────────────────────────────────────

  function validate() {
    const e = {}
    if (!address.area.trim()) e.area = 'Area is required'
    if (!paymentMethod) e.payment = 'Select a payment method'

    if (['mpesa', 'airtel', 'mixx'].includes(paymentMethod)) {
      if (!phone.trim()) e.phone = 'Phone number is required'
      else if (phone.replace(/\D/g, '').length < 9) e.phone = 'Enter a valid phone number'
    }

    if (paymentMethod === 'visa') {
      if (cardNumber.replace(/\s/g, '').length < 16) e.cardNumber = 'Enter a valid 16-digit card number'
      if (!cardExpiry.match(/^\d{2}\/\d{2}$/)) e.cardExpiry = 'Enter expiry as MM/YY'
      if (cardCvv.length < 3) e.cardCvv = 'Enter 3-digit CVV'
      if (!cardName.trim()) e.cardName = 'Enter card holder name'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Place order ───────────────────────────────────────────────────────────

  async function handlePlaceOrder() {
    if (!validate()) return
    setLoading(true)
    setError('')
    try {
      const payload = {
        items: items.map(i => ({
          menuItemId: i._id, name: i.name, price: i.price, quantity: i.quantity,
        })),
        restaurantId:    items[0]?.restaurantId,
        deliveryAddress: { area: address.area, street: address.street, notes: address.notes },
        paymentMethod,
        phoneNumber: ['mpesa', 'airtel', 'mixx'].includes(paymentMethod)
          ? '+255' + phone.replace(/\D/g, '').replace(/^0/, '')
          : user?.phone,
        promoCode: promoData ? promoCode : undefined,
        total,
      }
      if (paymentMethod === 'visa') {
        payload.cardDetails = { last4: cardNumber.replace(/\s/g, '').slice(-4), holderName: cardName }
      }

      const res = await api.post('/orders', payload)

      // ── trigger ClickPesa USSD push for mobile money ────────────────────
      if (['mpesa', 'airtel', 'mixx'].includes(paymentMethod)) {
        try {
          await api.post('/payments', {
            orderId: res.data._id,
            method: paymentMethod,
            phoneNumber: payload.phoneNumber,
          })
        } catch (err) {
          setError(err.response?.data?.message ?? 'Payment prompt failed. Try again or pick another method.')
          setLoading(false)
          return
        }
      }

      // ── persist data after success ──────────────────────────────────────
      if (['mpesa', 'airtel', 'mixx'].includes(paymentMethod) && phone) {
        localStorage.setItem(SAVED_PHONE_KEY, phone.replace(/\D/g, ''))
      }
      if (paymentMethod === 'visa' && saveCard) {
        const newCard = {
          id:        Date.now(),
          last4:     cardNumber.replace(/\s/g, '').slice(-4),
          cardName:  cardName.trim().toUpperCase(),
          cardExpiry,
        }
        const existing = loadSavedCards().filter(
          c => !(c.last4 === newCard.last4 && c.cardName === newCard.cardName)
        )
        const updated = [newCard, ...existing].slice(0, 5)
        localStorage.setItem(SAVED_CARDS_KEY, JSON.stringify(updated))
        setSavedCards(updated)
      }

      const cur = parseInt(localStorage.getItem('activeOrderCount') ?? '0')
      localStorage.setItem('activeOrderCount', cur + 1)
      clearCart()
      navigate(`/orders/${res.data._id}/track`)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Order failed. Please try again.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally { setLoading(false) }
  }

  // ── Tap a saved card chip ──────────────────────────────────────────────────
  function useSavedCard(card) {
    setActiveSavedCard(card.id)
    setCardName(card.cardName)
    setCardExpiry(card.cardExpiry)
    setCardNumber('')   // PAN never stored; user must re-enter
    setCardCvv('')
  }

  // ── Style helpers ─────────────────────────────────────────────────────────

  const inputBase = {
    width: '100%', boxSizing: 'border-box', borderRadius: 12,
    padding: '0.75rem 1rem', fontSize: '0.875rem',
    fontFamily: "'Segoe UI',system-ui,sans-serif",
    outline: 'none', transition: 'border-color 0.15s', background: '#fff',
  }
  const errBorder  = { border: '1.5px solid #e63946' }
  const normBorder = { border: '1.5px solid #e0e0e0' }

  // ── Phone input (inline render function, not component) ───────────────────
  function renderPhoneInput() {
    return (
      <div style={{ marginTop: '0.75rem' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          <span style={{ background: '#f0f0f0', padding: '0.7rem 0.85rem', borderRadius: '12px 0 0 12px', border: '1.5px solid #e0e0e0', borderRight: 'none', fontSize: '0.875rem', color: '#555', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            +255
          </span>
          <input
            type="tel"
            maxLength={10}
            placeholder="7XX XXX XXX"
            value={phone}
            autoComplete="tel-national"
            onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
            style={{ ...inputBase, borderRadius: '0 12px 12px 0', ...(errors.phone ? errBorder : normBorder) }}
          />
        </div>
        {phone && !errors.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5, fontSize: '0.72rem', color: '#16a34a' }}>
            <LockIcon size={11} /> Auto-filled from your saved number
          </div>
        )}
        {errors.phone && <div style={{ fontSize: '0.78rem', color: '#e63946', marginTop: 4 }}>{errors.phone}</div>}
      </div>
    )
  }

  // ── Visa card fields (inline render function) ─────────────────────────────
  function renderCardFields() {
    return (
      <div style={{ marginTop: '0.75rem' }} onClick={e => e.stopPropagation()}>

        {/* Saved card chips */}
        {savedCards.length > 0 && (
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#888', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Saved cards
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {savedCards.map(card => {
                const isActive = activeSavedCard === card.id
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => useSavedCard(card)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.45rem 0.85rem', borderRadius: 999, border: isActive ? '2px solid #ff6b00' : '1.5px solid #e0e0e0', background: isActive ? '#fff8f5' : '#fafafa', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: isActive ? '#ff6b00' : '#444', transition: 'all 0.15s' }}
                  >
                    <VisaIcon />
                    •••• {card.last4}
                    <span style={{ opacity: 0.6, fontWeight: 400 }}>{card.cardExpiry}</span>
                    {isActive && <span style={{ color: '#16a34a', fontSize: '0.7rem' }}>✓</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Card number */}
        <input
          type="text"
          inputMode="numeric"
          placeholder="1234 5678 9012 3456"
          maxLength={19}
          value={cardNumber}
          autoComplete="cc-number"
          onChange={e => setCardNumber(formatCardNumber(e.target.value))}
          style={{ ...inputBase, ...(errors.cardNumber ? errBorder : normBorder), marginBottom: 8, letterSpacing: '0.08em' }}
        />
        {errors.cardNumber && <div style={{ fontSize: '0.78rem', color: '#e63946', marginBottom: 6 }}>{errors.cardNumber}</div>}

        {/* Expiry + CVV */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              inputMode="numeric"
              placeholder="MM / YY"
              maxLength={5}
              value={cardExpiry}
              autoComplete="cc-exp"
              onChange={e => setCardExpiry(formatExpiry(e.target.value))}
              style={{ ...inputBase, ...(errors.cardExpiry ? errBorder : normBorder) }}
            />
            {errors.cardExpiry && <div style={{ fontSize: '0.78rem', color: '#e63946', marginTop: 4 }}>{errors.cardExpiry}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <input
              type="password"
              inputMode="numeric"
              placeholder="CVV"
              maxLength={3}
              value={cardCvv}
              autoComplete="cc-csc"
              onChange={e => setCardCvv(e.target.value.replace(/\D/g, ''))}
              style={{ ...inputBase, ...(errors.cardCvv ? errBorder : normBorder) }}
            />
            {errors.cardCvv && <div style={{ fontSize: '0.78rem', color: '#e63946', marginTop: 4 }}>{errors.cardCvv}</div>}
          </div>
        </div>

        {/* Card holder name + secured connection badge */}
        <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label htmlFor="cardName" style={{ fontSize: '0.78rem', color: '#888', fontWeight: 500 }}>
            Card holder name
          </label>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 700, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 999, padding: '2px 8px' }}>
            <LockIcon size={11} color="#16a34a" />
            Secured Connection
          </span>
        </div>
        <input
          id="cardName"
          type="text"
          placeholder="JOHN DOE"
          value={cardName}
          autoComplete="cc-name"
          onChange={e => setCardName(e.target.value.toUpperCase())}
          style={{ ...inputBase, ...(errors.cardName ? errBorder : normBorder), textTransform: 'uppercase', letterSpacing: '0.04em' }}
        />
        {errors.cardName && <div style={{ fontSize: '0.78rem', color: '#e63946', marginTop: 4 }}>{errors.cardName}</div>}

        {/* SSL info bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: '0.65rem', padding: '0.5rem 0.75rem', background: '#f0fdf4', borderRadius: 10, border: '1px solid #dcfce7' }}>
          <LockIcon size={13} color="#16a34a" />
          <span style={{ fontSize: '0.72rem', color: '#15803d', lineHeight: 1.4 }}>
            256-bit SSL encrypted · Your card details are stored securely on this device only
          </span>
        </div>

        {/* Save card toggle */}
        <label
          htmlFor="saveCard"
          style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: '0.85rem', cursor: 'pointer', padding: '0.75rem', background: saveCard ? '#fff8f5' : '#fafafa', borderRadius: 12, border: saveCard ? '1.5px solid #ff6b00' : '1.5px solid #f0f0f0', transition: 'all 0.15s' }}
          onClick={e => e.stopPropagation()}
        >
          <div
            style={{ width: 20, height: 20, borderRadius: 6, border: saveCard ? 'none' : '2px solid #ccc', background: saveCard ? 'linear-gradient(135deg,#ff6b00,#e63946)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}
            onClick={() => setSaveCard(v => !v)}
          >
            {saveCard && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <div onClick={() => setSaveCard(v => !v)}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a1a2e' }}>Save card for future use</div>
            <div style={{ fontSize: '0.72rem', color: '#888' }}>One-tap checkout next time · Stored on this device only</div>
          </div>
        </label>
      </div>
    )
  }

  // ── Payment options ───────────────────────────────────────────────────────

  const PAYMENTS = [
    {
      value:  'mpesa',
      icon:   <span style={{ background: '#e63946', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.04em', flexShrink: 0 }}>M-PESA</span>,
      title:  'Vodacom M-Pesa',
      sub:    'Pay via mobile money prompt',
      expand: renderPhoneInput,
    },
    {
      value:  'airtel',
      icon:   <span style={{ background: '#e63946', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.04em', flexShrink: 0 }}>AIRTEL</span>,
      title:  'Airtel Money',
      sub:    'Pay via mobile money prompt',
      expand: renderPhoneInput,
    },
    {
      value:  'mixx',
      icon:   <MixxIcon />,
      title:  'Mixx by Yas',
      sub:    'Pay via Mixx mobile money',
      expand: renderPhoneInput,
    },
    {
      value:  'visa',
      icon:   <VisaIcon />,
      title:  'Visa / Mastercard',
      sub:    savedCards.length > 0 ? `${savedCards.length} saved card${savedCards.length > 1 ? 's' : ''}` : 'Debit or credit card',
      expand: renderCardFields,
    },
    {
      value:  'cash',
      icon:   <div style={{ width: 44, height: 28, background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CashIcon /></div>,
      title:  'Cash on Delivery',
      sub:    'Pay when your rider arrives',
      expand: null,
    },
  ]

  // ── Shared place-order button ─────────────────────────────────────────────

  const btnStyle = {
    background:     loading ? '#ccc' : 'linear-gradient(135deg,#ff6b00,#e63946)',
    color:          '#fff', border: 'none', borderRadius: '999px',
    padding:        '0.85rem 2rem', fontWeight: 800, fontSize: '1rem',
    cursor:         loading ? 'not-allowed' : 'pointer',
    boxShadow:      loading ? 'none' : '0 4px 16px rgba(255,107,0,0.35)',
    transition:     'all 0.15s', display: 'flex',
    alignItems:     'center', justifyContent: 'center',
    gap: 8, minWidth: 180,
  }

  function PlaceOrderBtn() {
    return (
      <button onClick={handlePlaceOrder} disabled={loading} style={btnStyle}>
        {loading
          ? <><div style={{ width: 20, height: 20, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid #fff', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} /> Placing order…</>
          : 'Place Order →'}
      </button>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f8', fontFamily: "'Segoe UI',system-ui,sans-serif", paddingBottom: 110 }}>
      <style>{`
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin         { to{transform:rotate(360deg)} }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: 'linear-gradient(135deg,#ff6b00,#e63946)', padding: '1.25rem 1rem 1.5rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '999px', padding: '0.4rem 1rem', fontSize: '0.85rem', marginBottom: '0.75rem', display: 'inline-block' }} aria-label="Go back">
          ← Back
        </button>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.75rem', fontWeight: 900, color: '#fff' }}>Checkout</h1>
        <div style={{ color: '#fff', opacity: 0.85, fontSize: '0.875rem' }}>
          {items.length} item{items.length > 1 ? 's' : ''} from {cart.restaurantName}
        </div>
      </div>

      {/* ── ORDER SUMMARY ── */}
      <div style={{ background: '#fff', borderRadius: 18, margin: '1rem', padding: '1.25rem', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', animation: 'fadeSlideUp 0.3s ease' }}>
        <div onClick={() => setSummaryOpen(o => !o)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: summaryOpen ? '0.75rem' : 0 }}>
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ReceiptIcon /> Order Summary
          </span>
          <span style={{ color: '#888', fontSize: '0.9rem' }}>{summaryOpen ? '▲' : '▼'}</span>
        </div>

        {summaryOpen && (
          <>
            {items.map(item => (
              <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #f5f5f5' }}>
                <span style={{ fontSize: '0.9rem', color: '#1a1a2e' }}>{item.quantity}× {item.name}</span>
                <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '0.9rem' }}>TSh {(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div style={{ height: 1, background: '#f0f0f0', margin: '0.75rem 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#555', marginBottom: '0.4rem' }}>
              <span>Subtotal</span><span>TSh {cartTotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#555', marginBottom: '0.75rem' }}>
              <span>Delivery fee</span><span>TSh {deliveryFee.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: '0.5rem' }}>
              <input
                placeholder="Enter promo code"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && applyPromo()}
                style={{ ...inputBase, flex: 1, ...normBorder, padding: '0.65rem 1rem' }}
              />
              <button onClick={applyPromo} disabled={promoLoading} style={{ background: 'linear-gradient(135deg,#ff6b00,#e63946)', color: '#fff', border: 'none', borderRadius: '999px', padding: '0.65rem 1rem', fontWeight: 700, fontSize: '0.82rem', cursor: promoLoading ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
                {promoLoading ? '…' : 'Apply'}
              </button>
            </div>
            {promoError && <div style={{ fontSize: '0.78rem', color: '#e63946', marginBottom: 6 }}>{promoError}</div>}
            {promoData  && <div style={{ fontSize: '0.875rem', color: '#1a7a45', fontWeight: 600, marginBottom: 6 }}>✅ −TSh {discount.toLocaleString()}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1rem', color: '#1a1a2e', paddingTop: '0.75rem', borderTop: '2px solid #f0f0f0' }}>
              <span>Total</span><span>TSh {total.toLocaleString()}</span>
            </div>
          </>
        )}
      </div>

      {/* ── DELIVERY ADDRESS ── */}
      <div style={{ background: '#fff', borderRadius: 18, margin: '0 1rem 1rem', padding: '1.25rem', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', animation: 'fadeSlideUp 0.4s ease' }}>
        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1a1a2e', marginBottom: '1rem' }}>📍 Delivery Address</div>
        <div>
          <label htmlFor="area" style={{ fontSize: '0.78rem', color: '#888', marginBottom: 4, display: 'block' }}>Area / Neighbourhood *</label>
          <input id="area" placeholder="e.g. Masaki, Kariakoo, Kinondoni" value={address.area} autoComplete="address-level2" onChange={e => setAddress({ ...address, area: e.target.value })} style={{ ...inputBase, ...(errors.area ? errBorder : normBorder) }} />
          {errors.area && <div style={{ fontSize: '0.78rem', color: '#e63946', marginTop: 4 }}>{errors.area}</div>}
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <label htmlFor="street" style={{ fontSize: '0.78rem', color: '#888', marginBottom: 4, display: 'block' }}>Street / Building</label>
          <input id="street" placeholder="e.g. Msasani Road, House 12" value={address.street} autoComplete="street-address" onChange={e => setAddress({ ...address, street: e.target.value })} style={{ ...inputBase, ...normBorder }} />
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <label htmlFor="notes" style={{ fontSize: '0.78rem', color: '#888', marginBottom: 4, display: 'block' }}>Delivery notes (optional)</label>
          <textarea id="notes" placeholder="Gate code, landmark, floor…" value={address.notes} onChange={e => setAddress({ ...address, notes: e.target.value })} style={{ ...inputBase, ...normBorder, resize: 'none', height: 70 }} />
        </div>
      </div>

      {/* ── PAYMENT METHOD ── */}
      <div style={{ background: '#fff', borderRadius: 18, margin: '0 1rem 1rem', padding: '1.25rem', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', animation: 'fadeSlideUp 0.5s ease' }}>
        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1a1a2e', marginBottom: '1rem' }}>💳 Payment Method</div>
        {PAYMENTS.map(p => {
          const selected = paymentMethod === p.value
          return (
            <div key={p.value} onClick={() => setPaymentMethod(p.value)} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.9rem 1rem', borderRadius: 14, marginBottom: '0.6rem', cursor: 'pointer', transition: 'all 0.15s', border: selected ? '2px solid #ff6b00' : '1.5px solid #f0f0f0', background: selected ? '#fff8f5' : '#fff' }}>
              <div style={{ paddingTop: 2, flexShrink: 0 }}>{p.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a1a2e' }}>{p.title}</div>
                <div style={{ color: '#888', fontSize: '0.78rem' }}>{p.sub}</div>
                {selected && p.expand && p.expand()}
              </div>
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: selected ? '5px solid #ff6b00' : '2px solid #ccc', flexShrink: 0, boxSizing: 'border-box', marginTop: 2 }} />
            </div>
          )
        })}
        {errors.payment && <div style={{ fontSize: '0.78rem', color: '#e63946', marginTop: 4 }}>{errors.payment}</div>}
      </div>

      {/* ── ERROR BANNER ── */}
      {error && (
        <div style={{ background: '#fff5f5', border: '1px solid #fcc', borderRadius: 14, padding: '0.85rem 1rem', margin: '0 1rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
          <span>⚠️</span>
          <span style={{ color: '#c1121f', fontSize: '0.875rem' }}>{error}</span>
        </div>
      )}

      {/* ── INLINE PLACE ORDER (always in scroll flow) ── */}
      <div style={{ margin: '0 1rem 1.5rem', background: '#fff', borderRadius: 18, padding: '1.25rem', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: '1.15rem', color: '#1a1a2e' }}>TSh {total.toLocaleString()}</div>
          <div style={{ fontSize: '0.72rem', color: '#888' }}>Total incl. delivery</div>
        </div>
        <PlaceOrderBtn />
      </div>

      {/* ── STICKY BOTTOM BAR ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(10px)', borderTop: '1px solid #f0f0f0', padding: '0.875rem 1rem', zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 600, margin: '0 auto', gap: '1rem' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#1a1a2e', lineHeight: 1.2 }}>TSh {total.toLocaleString()}</div>
            <div style={{ fontSize: '0.72rem', color: '#888' }}>incl. delivery</div>
          </div>
          <PlaceOrderBtn />
        </div>
      </div>
    </div>
  )
}
