import LegalLayout, { Section } from '../components/LegalLayout';

export default function Privacy() {
  return (
    <LegalLayout
      title="Privacy"
      subtitle="What we collect, why we collect it, and the controls you have."
      lastUpdated="2026-04-28"
    >
      <Section heading="Information we collect">
        <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
          <li><strong>Account info:</strong> name, email, phone number, profile photo, password (hashed).</li>
          <li><strong>Orders & delivery:</strong> items, delivery address, notes, order history.</li>
          <li><strong>Payments:</strong> last 4 digits of cards, M-Pesa / Airtel Money / Mixx / Halotel transaction references. Full PANs and PINs never reach our servers.</li>
          <li><strong>Location:</strong> only when you share it for delivery — we don't track location in the background.</li>
          <li><strong>Device & usage:</strong> device type, browser, IP address, anonymous interaction logs for performance monitoring.</li>
        </ul>
      </Section>

      <Section heading="How we use your data">
        <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
          <li>To process and deliver your orders</li>
          <li>To communicate updates about your order, account, and promotions you've opted into</li>
          <li>To prevent fraud and protect your account</li>
          <li>To improve our service through aggregated, anonymised analytics</li>
        </ul>
      </Section>

      <Section heading="Who we share with">
        <p>
          We share only the minimum needed: your name and phone with the restaurant
          and rider for your active order; anonymised data with our payment partners
          (ClickPesa, mobile money operators); and we never sell your data to third
          parties.
        </p>
      </Section>

      <Section heading="Your rights">
        <p>
          You can view, update, or delete your account at any time from your Profile
          page. To request a full copy of your data or its deletion, email{' '}
          <a href="mailto:privacy@kebite.co.tz" style={{ color: '#ff6b00', fontWeight: 600 }}>privacy@kebite.co.tz</a>.
        </p>
      </Section>

      <Section heading="Retention">
        <p>
          We keep order records for 24 months for tax and dispute resolution. Account
          data is deleted within 30 days of your request. Anonymised analytics may be
          retained indefinitely.
        </p>
      </Section>
    </LegalLayout>
  );
}
