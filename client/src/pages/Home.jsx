import React from 'react';
import { Link } from 'react-router-dom';

const PLANS = [
  {
    id: 'archana',
    name: 'Archana Seva',
    amount: 1251,
    icon: '🙏',
    description:
      'Begin your spiritual journey with monthly Archana performed in your name at the sacred sanctum of Goddess Samrajyalakshmi.',
    benefits: [
      'Monthly Archana & Sankalpa name inclusion',
      'Festival and puja notifications (notification only)',
      'Digital membership certificate',
    ],
  },
  {
    id: 'sahasranama',
    name: 'Sahasranama Seva',
    amount: 5400,
    icon: '🪔',
    description:
      'Elevate your devotion with the Sahasranama Seva — receive blessed Prasadam and Naivedya offered personally in your name.',
    benefits: [
      'Monthly Archana & Sankalpa name inclusion',
      'Prasadam on temple visit',
      "Naivedya offered to the Goddess on a specific day in devotee's name",
      'Festival and puja notifications (notification only)',
      'Digital membership certificate',
    ],
  },
  {
    id: 'nitya_archana',
    name: 'Nitya Archana Seva',
    amount: 25200,
    icon: '🔥',
    popular: true,
    description:
      'Experience the grace of daily Archana — your name recited every day before the Goddess, with sacred Prasadam delivered to your doorstep.',
    benefits: [
      'Daily Archana name inclusion',
      'Annual special Homam inclusion',
      'Monthly prasadam courier',
      'Festival and puja notifications (notification only)',
      'Digital membership certificate',
    ],
  },
  {
    id: 'saswatha',
    name: 'Saswatha Seva Membership',
    amount: 108000,
    icon: '✨',
    premium: true,
    description:
      'The ultimate seva commitment — a lifetime bond with Goddess Samrajyalakshmi with daily worship, special pujas, and eternal blessings.',
    benefits: [
      'Lifetime seva enrollment',
      'Daily Archana inclusion',
      'Special pujas/archana and prasadam delivery on selected dates',
      'Annual opportunity to participate in a Homam or special puja',
      'Festival and puja notifications (notification only)',
      'Special blessings letter from the temple',
      'Digital membership certificate',
    ],
  },
];

function PlanCard({ plan }) {
  const cardClass = `plan-card ${plan.popular ? 'popular' : ''} ${plan.premium ? 'premium' : ''}`;

  return (
    <div className={cardClass}>
      {plan.popular && <div className="plan-badge">POPULAR</div>}
      {plan.premium && <div className="plan-badge premium">PREMIUM</div>}
      <div className="plan-icon">{plan.icon}</div>
      <h3 className="plan-name">{plan.name}</h3>
      <div className="plan-price">
        <span className="currency">₹</span>
        {Number(plan.amount).toLocaleString('en-IN')}
      </div>
      <div className="plan-duration">{plan.premium ? 'One-Time (Lifetime)' : 'Per Year'}</div>
      <p className="plan-description">{plan.description}</p>
      <ul className="plan-benefits">
        {plan.benefits.map((benefit, idx) => (
          <li key={idx}>{benefit}</li>
        ))}
      </ul>
    </div>
  );
}

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <img src="/goddess-logo.png" alt="Goddess Samrajyalakshmi" className="hero-goddess-img" />
        <h1 className="hero-title">DEVOTEE SEVA MEMBERSHIP</h1>
        <hr className="hero-divider" />
        <p className="hero-subtitle">
          Offer your devotion to Goddess Samrajyalakshmi through sacred seva memberships.
          Choose a plan that resonates with your spiritual journey and receive divine blessings.
        </p>
      </section>

      <div className="page-container">
        {/* Section Title */}
        <div className="section-title">
          <h2>Sacred Seva Plans</h2>
          <p>Membership tiers for devotees of Shree Samrajyalakshmi Temple</p>
          <hr className="section-divider" />
        </div>

        {/* Plans Grid */}
        <div className="plans-grid">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>

        {/* Custom Donation info */}
        <div className="custom-donation-card">
          <h3 className="plan-name" style={{ marginBottom: 8 }}>Custom Seva / Donation</h3>
          <p className="plan-description" style={{ maxWidth: 500, margin: '0 auto 16px' }}>
            Make a custom donation or sponsor a specific seva. Please contact the temple administration 
            for custom seva arrangements. Any amount of your choice is welcome.
          </p>
        </div>

        {/* Contact / Info */}
        <div style={{ textAlign: 'center', marginTop: 48, padding: '24px 0' }}>
          <p style={{ color: '#8B7355', fontSize: 13, lineHeight: 1.8, maxWidth: 600, margin: '0 auto' }}>
            All seva contributions go directly toward temple maintenance, daily puja rituals,
            festival celebrations, and community welfare activities. Your devotion sustains the 
            sacred traditions of Shree Samrajyalakshmi Temple.
          </p>
          <p style={{ color: '#8B7355', fontSize: 13, marginTop: 16 }}>
            📞 For enrollment, please contact the temple office or visit in person.
          </p>
        </div>
      </div>
    </div>
  );
}
