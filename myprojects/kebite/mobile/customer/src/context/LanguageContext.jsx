import { createContext, useContext, useState } from 'react';

const STRINGS = {
  en: {
    greeting:         (name) => `Habari, ${name} 👋`,
    subGreeting:      'What are you craving today?',
    searchPlaceholder:'Search restaurants or dishes',
    passTitle:        'Kebite Pass',
    passSub:          'Free delivery on every order',
    passCta:          'Try 30 days free →',
    categories: {
      All:       'All',
      Tanzanian: '🇹🇿 Tanzanian',
      Pizza:     '🍕 Pizza',
      Seafood:   '🐟 Seafood',
      Chicken:   '🍗 Chicken',
      BBQ:       '🔥 BBQ',
      Healthy:   '🥗 Healthy',
      Burgers:   '🍔 Burgers',
      Desserts:  '🍨 Desserts',
    },
    locationLabel:   'Dar es Salaam',
    // Chat
    chatWelcome:     "Hi! I'm Keba 👋 Your Kebite assistant. How can I help?",
    chatPlaceholder: 'Type a message…',
    chatToggle:      'SW',
    chatError:       'Sorry, something went wrong. Please try again.',
    quickChips:      ['Track my order', 'Change address', 'Cancel order', 'Payment help', 'Restaurant info'],
    // Cart / Checkout
    promoPlaceholder:'Promo code',
    promoApply:      'Apply',
    promoRemove:     'Remove',
    promoError:      'Invalid or expired promo code.',
  },
  sw: {
    greeting:         (name) => `Habari, ${name} 👋`,
    subGreeting:      'Unataka kula nini leo?',
    searchPlaceholder:'Tafuta mkahawa au chakula',
    passTitle:        'Kebite Pass',
    passSub:          'Utoaji bure kwa kila agizo',
    passCta:          'Jaribu siku 30 bure →',
    categories: {
      All:       'Zote',
      Tanzanian: '🇹🇿 Kitanzania',
      Pizza:     '🍕 Pizza',
      Seafood:   '🐟 Samaki',
      Chicken:   '🍗 Kuku',
      BBQ:       '🔥 Kuchoma',
      Healthy:   '🥗 Afya',
      Burgers:   '🍔 Boga',
      Desserts:  '🍨 Vitafunio',
    },
    locationLabel:   'Dar es Salaam',
    chatWelcome:     'Habari! Mimi ni Keba 👋 Msaidizi wako wa Kebite. Ninaweza kukusaidia vipi?',
    chatPlaceholder: 'Andika ujumbe…',
    chatToggle:      'EN',
    chatError:       'Samahani, tatizo limetokea. Tafadhali jaribu tena.',
    quickChips:      ['Fuatilia agizo', 'Badilisha anwani', 'Ghairi agizo', 'Msaada wa malipo', 'Habari ya mkahawa'],
    promoPlaceholder:'Nambari ya promo',
    promoApply:      'Tumia',
    promoRemove:     'Ondoa',
    promoError:      'Nambari ya promo si sahihi au imekwisha muda.',
  },
};

const LanguageContext = createContext({
  lang:    'en',
  setLang: () => {},
  t:       STRINGS.en,
});

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');
  return (
    <LanguageContext.Provider value={{ lang, setLang, t: STRINGS[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
