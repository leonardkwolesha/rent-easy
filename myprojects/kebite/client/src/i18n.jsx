import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'kebite_lang';
const DEFAULT_LANG = 'en';
const SUPPORTED = ['en', 'sw'];

const dict = {
  en: {
    // Common
    save: 'Save', cancel: 'Cancel', close: 'Close', edit: 'Edit', remove: 'Remove',
    saving: 'Saving…', loading: 'Loading…', retry: 'Retry',
    yes: 'Yes', no: 'No',

    // Profile shared
    profile: 'Profile',
    profilePhoto: 'Profile photo',
    takePhoto: 'Take Photo',
    chooseGallery: 'Choose from Gallery',
    removePhoto: 'Remove Photo',
    accountInfo: 'Account Info',
    personalInfo: 'Personal Info',
    yourName: 'Your Name',
    yourPhone: 'Your Phone',
    name: 'Name', email: 'Email', phone: 'Phone',
    password: 'Password',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm New Password',
    passwordUpdated: 'Password updated!',
    notSet: 'Not set',
    language: 'Language',
    english: 'English',
    swahili: 'Kiswahili',

    // Restaurant
    restaurantPartner: 'Restaurant Partner',
    restaurantName: 'Restaurant Name',
    restaurantDetails: 'Restaurant Details',
    description: 'Description',
    deliveryTimeMin: 'Delivery Time (min)',
    deliveryFee: 'Delivery Fee (TSh)',
    minOrder: 'Minimum Order (TSh)',
    cuisine: 'Cuisine',
    location: 'Location',
    rating: 'Rating', delivery: 'Delivery', status: 'Status',
    open: 'Open', closed: 'Closed',

    // Rider
    deliveries: 'Deliveries',
    available: 'Available', offline: 'Offline',
    activeDelivery: 'Active Delivery',
    pickup: 'Pickup', deliverTo: 'Deliver to',
    callCustomer: 'Call Customer', whatsapp: 'WhatsApp',
    markDelivered: 'Mark as Delivered',
    ordersAvailableNearYou: 'Orders Available Near You',
    noOrdersRightNow: 'No orders available right now',
    goOnline: 'Go online to see available orders',
    youEarn: 'You earn',
    acceptOrder: 'Accept Order',
    today: 'Today',
    week: 'Week',

    // Login
    welcomeBack: 'Welcome back',
    signIn: 'Sign in', signingIn: 'Signing in…',
    emailAddress: 'Email address',
    forgotPassword: 'Forgot password?',
    signInWithGoogle: 'Sign in with Google',
    or: 'OR',
    dontHaveAccount: "Don't have an account?",
    register: 'Register',
  },
  sw: {
    save: 'Hifadhi', cancel: 'Ghairi', close: 'Funga', edit: 'Hariri', remove: 'Ondoa',
    saving: 'Inahifadhi…', loading: 'Inapakia…', retry: 'Jaribu tena',
    yes: 'Ndiyo', no: 'Hapana',

    profile: 'Wasifu',
    profilePhoto: 'Picha ya wasifu',
    takePhoto: 'Piga Picha',
    chooseGallery: 'Chagua kutoka Maktaba',
    removePhoto: 'Ondoa Picha',
    accountInfo: 'Taarifa za Akaunti',
    personalInfo: 'Taarifa Binafsi',
    yourName: 'Jina lako',
    yourPhone: 'Simu yako',
    name: 'Jina', email: 'Barua pepe', phone: 'Simu',
    password: 'Nenosiri',
    changePassword: 'Badilisha Nenosiri',
    currentPassword: 'Nenosiri la Sasa',
    newPassword: 'Nenosiri Jipya',
    confirmPassword: 'Thibitisha Nenosiri Jipya',
    passwordUpdated: 'Nenosiri limebadilishwa!',
    notSet: 'Halijawekwa',
    language: 'Lugha',
    english: 'Kiingereza',
    swahili: 'Kiswahili',

    restaurantPartner: 'Mshirika wa Mgahawa',
    restaurantName: 'Jina la Mgahawa',
    restaurantDetails: 'Maelezo ya Mgahawa',
    description: 'Maelezo',
    deliveryTimeMin: 'Muda wa Kufikisha (dakika)',
    deliveryFee: 'Ada ya Kufikisha (TSh)',
    minOrder: 'Agizo la Chini (TSh)',
    cuisine: 'Aina ya Chakula',
    location: 'Mahali',
    rating: 'Ukadiriaji', delivery: 'Kufikisha', status: 'Hali',
    open: 'Wazi', closed: 'Imefungwa',

    deliveries: 'Utoaji',
    available: 'Nipo', offline: 'Sipo',
    activeDelivery: 'Utoaji Unaoendelea',
    pickup: 'Chukua', deliverTo: 'Peleka kwa',
    callCustomer: 'Piga Mteja', whatsapp: 'WhatsApp',
    markDelivered: 'Imefikishwa',
    ordersAvailableNearYou: 'Maagizo Yaliyo Karibu Nawe',
    noOrdersRightNow: 'Hakuna maagizo kwa sasa',
    goOnline: 'Washa hali ya kupatikana ili uone maagizo',
    youEarn: 'Unapata',
    acceptOrder: 'Kubali Agizo',
    today: 'Leo',
    week: 'Wiki',

    welcomeBack: 'Karibu tena',
    signIn: 'Ingia', signingIn: 'Inaingia…',
    emailAddress: 'Barua pepe',
    forgotPassword: 'Umesahau nenosiri?',
    signInWithGoogle: 'Ingia na Google',
    or: 'AU',
    dontHaveAccount: 'Huna akaunti?',
    register: 'Jisajili',
  },
};

const LangContext = createContext(null);

function readStored() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED.includes(v) ? v : DEFAULT_LANG;
  } catch { return DEFAULT_LANG; }
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readStored);

  const setLang = useCallback((next) => {
    if (!SUPPORTED.includes(next)) return;
    setLangState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
  }, []);

  const t = useCallback((key) => {
    return (dict[lang] && dict[lang][key]) || dict.en[key] || key;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t, supported: SUPPORTED }), [lang, setLang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
