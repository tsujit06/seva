import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';

function Header() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <header className="temple-header">
      <div className="header-gold-stripe" />
      <div className="header-content">
        <Link to="/" className="header-left" style={{ textDecoration: 'none' }}>
          <img
            src="/goddess-logo.png"
            alt="Shree Samrajyalakshmi"
            className="header-logo-img"
          />
          <div>
            <div className="header-title-kannada">ಶ್ರೀ ಸಾಮ್ರಾಜ್ಯಲಕ್ಷ್ಮಿ ದೇವಾಲಯ</div>
            <div className="header-title">SHREE SAMRAJYALAKSHMI TEMPLE</div>
            <div className="header-subtitle">Devotee Seva Membership Portal</div>
          </div>
        </Link>
        <nav className="header-nav">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            🏛️ Seva Plans
          </Link>
          <Link to="/admin" className={isAdmin ? 'active' : ''}>
            🔐 Admin Portal
          </Link>
        </nav>
      </div>
      <div className="header-gold-stripe" />
    </header>
  );
}

function Footer() {
  return (
    <footer className="temple-footer">
      <div className="footer-temple-name-kannada">ಶ್ರೀ ಸಾಮ್ರಾಜ್ಯಲಕ್ಷ್ಮಿ ದೇವಾಲಯ</div>
      <div className="footer-temple-name">SHREE SAMRAJYALAKSHMI TEMPLE</div>
      <div className="footer-text">
        Thonachagondanahalli Village, Madhugiri Taluk, Karnataka (Bharat) - 572112
      </div>
      <div className="footer-text" style={{ fontSize: 12, marginTop: 4 }}>
        Website: www.samrajyalakshmitemple.org
      </div>
      <div className="footer-text" style={{ fontSize: 12, marginTop: 4 }}>
        Email: samrajyalakshmitemple@gmail.com
      </div>
      <div className="footer-blessing">
        "Om Samrajyalakshmiyai Namaha — May the Goddess bless all devotees with eternal prosperity"
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <Footer />
    </div>
  );
}
