import { Link } from 'react-router-dom';
import KebiteLogo from './KebiteLogo';
import PageWrapper from './PageWrapper';

const FONT = "'Segoe UI', system-ui, sans-serif";
const GRADIENT = 'linear-gradient(135deg, #ff6b00, #e63946)';

const FOOTER_LINKS = [
  { to: '/about', label: 'About' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/cookies', label: 'Cookies' },
  { to: '/security', label: 'Security' },
];

export default function LegalLayout({ title, subtitle, lastUpdated, children }) {
  return (
    <PageWrapper>
      <div style={{ fontFamily: FONT, color: '#1a1a2e', background: '#f8f8f8', minHeight: '100vh' }}>
        <header style={{ background: GRADIENT, padding: '3rem 1.5rem 4rem', color: '#fff', textAlign: 'center' }}>
          <Link to="/" style={{ display: 'inline-block', marginBottom: '1.25rem', textDecoration: 'none' }}>
            <KebiteLogo variant="white" size="md" />
          </Link>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, margin: '0 0 0.5rem' }}>{title}</h1>
          {subtitle && <p style={{ opacity: 0.92, fontSize: '1rem', margin: 0, maxWidth: 560, marginInline: 'auto', lineHeight: 1.5 }}>{subtitle}</p>}
          {lastUpdated && <div style={{ opacity: 0.75, fontSize: '0.78rem', marginTop: '0.85rem' }}>Last updated: {lastUpdated}</div>}
        </header>

        <main style={{ maxWidth: 760, margin: '-2rem auto 3rem', padding: '0 1.25rem' }}>
          <article style={{ background: '#fff', borderRadius: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: 'clamp(1.5rem, 4vw, 2.5rem)', lineHeight: 1.7, fontSize: '0.95rem', color: '#333' }}>
            {children}
          </article>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            {FOOTER_LINKS.filter((l) => l.label.toLowerCase() !== title.toLowerCase()).map((l) => (
              <Link key={l.to} to={l.to}
                style={{ color: '#ff6b00', fontWeight: 700, fontSize: '0.85rem', padding: '0.4rem 0.9rem', borderRadius: 999, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', textDecoration: 'none' }}>
                {l.label} →
              </Link>
            ))}
          </div>
        </main>

        <footer style={{ background: '#111', color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '1.25rem 1rem', fontSize: '0.8rem' }}>
          © 2026 Kebite · Tanzania's Food Delivery Platform
        </footer>
      </div>
    </PageWrapper>
  );
}

export function Section({ heading, children }) {
  return (
    <section style={{ marginBottom: '1.75rem' }}>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1a1a2e', margin: '0 0 0.6rem' }}>{heading}</h2>
      {children}
    </section>
  );
}
