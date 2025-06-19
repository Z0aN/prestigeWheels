import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Header.module.css';
import { useTranslation } from 'react-i18next';

const Header: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Закрытие меню при клике вне
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <header className={styles.header} role="banner">
        <div className={styles.container}>
          <Link to="/" className={styles.logo}>
            <h1>Prestige Wheels</h1>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.left}>
          <Link to="/" className={styles.logo}>
            <h1>{t('header.logo')}</h1>
          </Link>
        </div>
        <div className={styles.right}>
          <nav className={styles.nav}>
            <Link to="/" className={styles.navLink}>{t('header.home')}</Link>
            <Link to="/about" className={styles.navLink}>{t('header.about')}</Link>
            <Link to="/cars" className={styles.navLink}>{t('header.cars')}</Link>
          </nav>
          <div className={styles.userMenu}>
            {user ? (
              <div className={styles.userProfile} data-testid="user-profile">
                <div className={styles.userAvatar} data-testid="user-avatar" aria-hidden="true">
                  {(user.first_name?.[0] || user.username?.[0] || 'U').toUpperCase()}
                </div>
                <div className={styles.userInfo} data-testid="user-info">
                  <span className={styles.userName} data-testid="user-name">
                    {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username}
                  </span>
                  <span className={styles.userEmail} data-testid="user-email">{user.email}</span>
                </div>
                <div className={styles.dropdown}>
                  <div className={styles.dropdownContent}>
                    <Link to="/profile" className={styles.dropdownItem}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      {t('header.myProfile')}
                    </Link>
                    {user.is_superuser && (
                      <a 
                        href={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000'}/admin/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.dropdownItem}
                      >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 1l3 9h9l-7 5.5 3 9-8-6-8 6 3-9-7-5.5h9z"/>
                      </svg>
                        {t('header.adminPanel')}
                      </a>
                    )}
                    <div className={styles.dropdownDivider}></div>
                    <button onClick={handleLogout} className={styles.dropdownItem}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16,17 21,12 16,7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      {t('logout')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.authLinks}>
                <Link to="/login" className={styles.navLink} role="menuitem">
                  {t('login')}
                </Link>
                <Link to="/register" className={styles.registerBtn} role="menuitem">
                  {t('header.register')}
                </Link>
              </div>
            )}
            <div className={styles.languageSwitcher} ref={langMenuRef}>
              <button onClick={() => setLangMenuOpen((v) => !v)} aria-label={t('chooseLanguage')}>
                {i18n.language === 'en' ? 'EN' : 'RU'}
                <span style={{display: 'inline-block', transition: 'transform 0.2s', transform: langMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)'}}>
                  ▼
                </span>
              </button>
              {langMenuOpen && (
                <div className={styles.languageDropdown}>
                  <button onClick={() => { i18n.changeLanguage('ru'); setLangMenuOpen(false); }} disabled={i18n.language === 'ru'}>
                    Русский
                  </button>
                  <button onClick={() => { i18n.changeLanguage('en'); setLangMenuOpen(false); }} disabled={i18n.language === 'en'}>
                    English
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 