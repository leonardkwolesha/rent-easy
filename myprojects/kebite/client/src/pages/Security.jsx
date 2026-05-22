import LegalLayout, { Section } from '../components/LegalLayout';

export default function Security() {
  return (
    <LegalLayout
      title="Security"
      subtitle="How we protect your account, your money, and your personal information."
      lastUpdated="2026-04-28"
    >
      <Section heading="Connection security">
        <p>
          All traffic between your phone and Kebite is sent over HTTPS with TLS 1.3.
          Your password is never sent in plain text — even our server only ever sees
          a salted bcrypt hash, never the password itself.
        </p>
      </Section>

      <Section heading="Payment security">
        <p>
          Mobile money payments (M-Pesa, Airtel Money, Mixx by Yas, Halotel) flow
          through ClickPesa, a PCI-DSS-compliant payment aggregator. The PIN you
          enter on your phone never reaches our servers.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          For card payments, we never store your full card number, expiry, or CVV.
          Only the last 4 digits and cardholder name are kept locally on your
          device for your own convenience.
        </p>
      </Section>

      <Section heading="Account security">
        <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
          <li>Passwords must be at least 6 characters and are checked for strength</li>
          <li>Sessions use signed JWT tokens with a 7-day expiry</li>
          <li>You're automatically signed out if your token is invalidated server-side</li>
          <li>Suspicious login attempts trigger an email alert</li>
        </ul>
      </Section>

      <Section heading="Reporting a vulnerability">
        <p>
          If you believe you've found a security issue, please email{' '}
          <a href="mailto:security@kebite.co.tz" style={{ color: '#ff6b00', fontWeight: 600 }}>security@kebite.co.tz</a>{' '}
          with steps to reproduce. We respond to all reports within 48 hours and
          credit responsible disclosures publicly.
        </p>
        <p style={{ marginTop: '0.5rem', color: '#888', fontSize: '0.85rem' }}>
          Please do not test on real customer accounts or data.
        </p>
      </Section>
    </LegalLayout>
  );
}
