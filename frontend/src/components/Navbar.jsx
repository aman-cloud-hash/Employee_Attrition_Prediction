import React, { useState, useEffect } from 'react';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({ activeTab, setActiveTab }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Toggle visual theme
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  // Synchronize initial theme state
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const navItems = [
    { id: 'dashboard', label: 'Home' },
    { id: 'predict', label: 'Predict Attrition' },
    { id: 'about', label: 'About Project' },
    { id: 'contact', label: 'Contact' }
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar-header">
      <div class="nav-container">
        <div class="logo-link" onClick={() => handleNavClick('dashboard')}>
          <span class="logo-icon">📊</span>
          <div class="logo-text-wrapper">
            <span class="logo-text">Employee Attrition Prediction</span>
          </div>
        </div>

        <div class="nav-right-side">
          {/* Developer badge */}
          <div className="nav-developer-badge">
            <span className="dev-name">Aman Rajbhar</span>
            <span className="dev-role">Data Scientist</span>
          </div>

          <nav class="nav-menu">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Theme switcher */}
          <motion.button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label="Toggle visual theme"
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={theme}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </motion.div>
            </AnimatePresence>
          </motion.button>

          {/* Mobile menu toggle */}
          <button
            className="menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drop-down menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="nav-menu show"
            style={{ position: 'absolute', width: '100%' }}
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem' }}
              >
                {item.label}
              </button>
            ))}
            {/* Mobile developer info */}
            <div className="mobile-dev-badge">
              <span className="mobile-dev-title">Developer:</span>
              <span className="mobile-dev-name">Aman Rajbhar</span>
              <span className="mobile-dev-role">Data Scientist</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
