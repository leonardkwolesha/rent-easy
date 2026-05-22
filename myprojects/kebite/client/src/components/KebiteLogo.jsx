const SIZES = {
  sm: { icon: 28, font: '18px', tag: '8px',  radius: 7  },
  md: { icon: 40, font: '26px', tag: '10px', radius: 10 },
  lg: { icon: 56, font: '36px', tag: '12px', radius: 14 },
};

const TAG_COLOR = {
  primary: '#aaa',
  white:   'rgba(255,255,255,0.75)',
  dark:    '#555',
  icon:    '#aaa',
};

export default function KebiteLogo({ variant = 'primary', size = 'md', style = {} }) {
  const s = SIZES[size] ?? SIZES.md;

  const wordmarkColor = variant === 'white' ? '#ffffff' : 'url(#kebiteGradText)';
  const iconBg        = variant === 'white' ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg, #ff6b00, #e63946)';
  const iconBorder    = variant === 'white' ? '1.5px solid rgba(255,255,255,0.4)' : 'none';
  const tagColor      = TAG_COLOR[variant] ?? '#aaa';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', ...style }}>
      {/* Icon mark */}
      <div style={{
        width: s.icon, height: s.icon, borderRadius: s.radius,
        background: iconBg, border: iconBorder, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width={s.icon * 0.65} height={s.icon * 0.65} viewBox="0 0 26 26" fill="none">
          {/* Fork */}
          <line x1="7"  y1="3" x2="7"  y2="23" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
          <line x1="4"  y1="3" x2="4"  y2="9"  stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
          <line x1="10" y1="3" x2="10" y2="9"  stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
          <line x1="4"  y1="9" x2="10" y2="9"  stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
          {/* Knife */}
          <line x1="18" y1="3" x2="18" y2="23" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
          <path d="M18 3 Q24 7 24 11 Q24 16 18 18" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
          {/* Speed lines */}
          <line x1="1" y1="17" x2="4" y2="17" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
          <line x1="1" y1="20" x2="3" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
        </svg>
      </div>

      {/* Wordmark + tagline — hidden in icon-only variant */}
      {variant !== 'icon' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <svg
            height={s.icon * 0.68}
            viewBox="0 0 130 28"
            style={{ display: 'block', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="kebiteGradText" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#ff6b00"/>
                <stop offset="100%" stopColor="#e63946"/>
              </linearGradient>
            </defs>
            <text
              x="0" y="22"
              fontFamily="'Segoe UI', system-ui, sans-serif"
              fontSize="28"
              fontWeight="900"
              letterSpacing="-0.8"
              fill={wordmarkColor}
            >
              Kebite
            </text>
          </svg>
          <div style={{
            fontSize: s.tag, fontWeight: 600, color: tagColor,
            letterSpacing: '2px', textTransform: 'uppercase',
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            marginTop: '-2px',
          }}>
            Food Delivery · 🇹🇿
          </div>
        </div>
      )}
    </div>
  );
}
