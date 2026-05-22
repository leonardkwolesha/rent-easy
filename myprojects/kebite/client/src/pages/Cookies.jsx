import LegalLayout, { Section } from '../components/LegalLayout';

export default function Cookies() {
  return (
    <LegalLayout
      title="Cookies"
      subtitle="The small bits of data we store on your device — what they do, and how to control them."
      lastUpdated="2026-04-28"
    >
      <Section heading="What are cookies?">
        <p>
          Cookies (and similar technologies like localStorage) are small files saved
          on your device by your browser. They let Kebite keep you logged in,
          remember your cart, and make the experience faster.
        </p>
      </Section>

      <Section heading="What we use">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '2px solid #f0f0f0' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '2px solid #f0f0f0' }}>Purpose</th>
              <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '2px solid #f0f0f0' }}>Type</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['kebite_token', 'Keeps you signed in across visits', 'Essential'],
              ['kebite_cart', 'Remembers items in your cart', 'Essential'],
              ['kebite_role', 'Routes you to the right dashboard (customer / restaurant / rider)', 'Essential'],
              ['kebite_recent_searches', 'Shows your recent restaurant searches', 'Preference'],
              ['kebite_saved_phone', 'Auto-fills your M-Pesa number at checkout', 'Preference'],
              ['kebite_saved_cards', 'Last 4 digits of saved cards (stored locally only)', 'Preference'],
              ['activeOrderCount', 'Shows the order badge in the bottom navigation', 'Preference'],
            ].map(([n, purpose, type]) => (
              <tr key={n}>
                <td style={{ padding: '0.55rem 0.6rem', borderBottom: '1px solid #f5f5f5', fontFamily: 'monospace', color: '#1a1a2e', fontSize: '0.82rem' }}>{n}</td>
                <td style={{ padding: '0.55rem 0.6rem', borderBottom: '1px solid #f5f5f5' }}>{purpose}</td>
                <td style={{ padding: '0.55rem 0.6rem', borderBottom: '1px solid #f5f5f5' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 999, background: type === 'Essential' ? '#fff3ec' : '#eef9f3', color: type === 'Essential' ? '#ff6b00' : '#0F6E56', fontWeight: 700, fontSize: '0.72rem' }}>{type}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section heading="Managing cookies">
        <p>
          You can clear all Kebite-related storage from your browser settings at any
          time. Clearing essential entries will sign you out and empty your cart.
          We don't use third-party advertising trackers.
        </p>
      </Section>
    </LegalLayout>
  );
}
