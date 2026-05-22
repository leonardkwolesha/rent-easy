import { useLang } from '../i18n';

const FONT = "'Segoe UI', system-ui, sans-serif";
const GRADIENT = 'linear-gradient(135deg, #ff6b00, #e63946)';

const IconGlobe = ({ size = 16, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export default function LanguageToggle({ compact = false }) {
  const { lang, setLang, t } = useLang();
  const options = [
    { code: 'en', short: 'EN', label: t('english') },
    { code: 'sw', short: 'SW', label: t('swahili') },
  ];

  if (compact) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f5f5f5', borderRadius: '999px', padding: '3px', fontFamily: FONT }}>
        <IconGlobe size={14} color="#888" />
        {options.map(({ code, short }) => (
          <button key={code} onClick={() => setLang(code)} aria-pressed={lang === code} aria-label={code === 'en' ? 'English' : 'Kiswahili'}
            style={{ border: 'none', background: lang === code ? GRADIENT : 'transparent', color: lang === code ? '#fff' : '#555', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', fontSize: '0.72rem', cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s' }}>
            {short}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: '0.75rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f5f5f5' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#fff3ec', color: '#ff6b00', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconGlobe size={18} color="#ff6b00" />
        </span>
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1a1a2e', fontFamily: FONT }}>{t('language')}</div>
          <div style={{ fontSize: '0.75rem', color: '#888', fontFamily: FONT }}>{options.find(o => o.code === lang)?.label}</div>
        </div>
      </div>
      <div style={{ display: 'inline-flex', gap: '4px', background: '#f5f5f5', borderRadius: '999px', padding: '3px' }}>
        {options.map(({ code, short }) => (
          <button key={code} onClick={() => setLang(code)} aria-pressed={lang === code}
            style={{ border: 'none', background: lang === code ? GRADIENT : 'transparent', color: lang === code ? '#fff' : '#555', fontWeight: 700, padding: '6px 14px', borderRadius: '999px', fontSize: '0.78rem', cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s' }}>
            {short}
          </button>
        ))}
      </div>
    </div>
  );
}
