/**
 * Predefined Seva Membership Plans
 */
const SEVA_PLANS = {
  archana: {
    id: 'archana',
    name: 'Archana Seva',
    amount: 1251,
    duration: 'yearly',
    durationText: '1 Year',
    benefits: [
      'Monthly Archana & Sankalpa name inclusion',
      'Festival and puja notifications (notification only)',
      'Digital membership certificate',
    ],
    description: 'Begin your spiritual journey with monthly Archana performed in your name at the sacred sanctum of Goddess Samrajyalakshmi.',
    icon: '🙏',
  },
  sahasranama: {
    id: 'sahasranama',
    name: 'Sahasranama Seva',
    amount: 5400,
    duration: 'yearly',
    durationText: '1 Year',
    benefits: [
      'Monthly Archana & Sankalpa name inclusion',
      'Prasadam on temple visit',
      'Naivedya offered to the Goddess on a specific day in devotee\'s name',
      'Festival and puja notifications (notification only)',
      'Digital membership certificate',
    ],
    description: 'Elevate your devotion with the Sahasranama Seva — receive blessed Prasadam and Naivedya offered personally in your name.',
    icon: '🪔',
  },
  nitya_archana: {
    id: 'nitya_archana',
    name: 'Nitya Archana Seva',
    amount: 25200,
    duration: 'yearly',
    durationText: '1 Year',
    benefits: [
      'Daily Archana name inclusion',
      'Annual special Homam inclusion',
      'Monthly prasadam courier',
      'Festival and puja notifications (notification only)',
      'Digital membership certificate',
    ],
    description: 'Experience the grace of daily Archana — your name recited every day before the Goddess, with sacred Prasadam delivered to your doorstep.',
    icon: '🔥',
    popular: true,
  },
  saswatha: {
    id: 'saswatha',
    name: 'Saswatha Seva Membership',
    amount: 108000,
    duration: 'lifetime',
    durationText: 'One-Time (Lifetime)',
    benefits: [
      'Lifetime seva enrollment',
      'Daily Archana inclusion',
      'Special pujas/archana and prasadam delivery on selected dates',
      'Annual opportunity to participate in a Homam or special puja',
      'Festival and puja notifications (notification only)',
      'Special blessings letter from the temple',
      'Digital membership certificate',
    ],
    description: 'The ultimate seva commitment — a lifetime bond with Goddess Samrajyalakshmi with daily worship, special pujas, and eternal blessings.',
    icon: '✨',
    premium: true,
  },
  custom: {
    id: 'custom',
    name: 'Custom Seva / Donation',
    amount: null,
    duration: 'custom',
    durationText: 'As specified',
    benefits: [
      'Custom seva as defined by temple administration',
      'Digital receipt for donation',
      'Festival and puja notifications (notification only)',
    ],
    description: 'Make a custom donation or sponsor a specific seva. Our temple administration will personally coordinate your seva requirements.',
    icon: '💝',
  },
};

module.exports = { SEVA_PLANS };
