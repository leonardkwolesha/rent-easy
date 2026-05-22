import LegalLayout, { Section } from '../components/LegalLayout';

export default function About() {
  return (
    <LegalLayout
      title="About"
      subtitle="Kebite — Tanzania's homegrown food delivery platform, built in Dar es Salaam."
    >
      <Section heading="Our mission">
        <p>
          Kebite (from <em>kibite</em> — Swahili for "a small bite") connects hungry customers,
          local restaurants and motorbike riders across Dar es Salaam. We're on a mission
          to make great food from your favourite kitchens reach your door in 30 minutes —
          fast, affordable, and locally-built.
        </p>
      </Section>

      <Section heading="Why we built this">
        <p>
          Tanzania's food scene is one of the most vibrant on the continent — from
          mama ntilie kitchens to Indian biryani houses to Swahili coast pilau.
          Kebite gives every restaurant a fair shot at reaching customers without
          paying punitive commissions, and gives riders a steady source of income.
        </p>
      </Section>

      <Section heading="What we do">
        <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
          <li>Fast 30-minute delivery from 100+ Dar es Salaam restaurants</li>
          <li>Live order tracking from kitchen to your door</li>
          <li>Pay your way — M-Pesa, Airtel Money, Mixx by Yas, Halotel, or cash</li>
          <li>Built for Tanzanian phones, networks and currencies</li>
        </ul>
      </Section>

      <Section heading="Get in touch">
        <p>
          Restaurants, riders, partners and customers — we'd love to hear from you. <br />
          Email <a href="mailto:hello@kebite.co.tz" style={{ color: '#ff6b00', fontWeight: 600 }}>hello@kebite.co.tz</a>{' '}
          or call <strong>+255 700 000 000</strong>.
        </p>
      </Section>
    </LegalLayout>
  );
}
