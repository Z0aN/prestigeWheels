import React from 'react';
import styles from './Footer.module.css';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.container}>
        <div className={styles.topRow}>
          <div className={styles.logoBlock}>
            <div className={styles.logoWrap}>
              <img src="/favicon.ico" alt="Prestige Wheels" className={styles.logoImg} />
              <span className={styles.logoText}>Prestige Wheels</span>
            </div>
            <p className={styles.slogan}>{t('footer.slogan')}</p>
            <div className={styles.socials}>
              <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={styles.socialLink}><i className="fab fa-instagram"></i></a>
              <a href="https://t.me/" target="_blank" rel="noopener noreferrer" aria-label="Telegram" className={styles.socialLink}><i className="fab fa-telegram-plane"></i></a>
              <a href="https://wa.me/79991234567" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className={styles.socialLink}><i className="fab fa-whatsapp"></i></a>
            </div>
          </div>
          <div className={styles.infoBlocks}>
            <div className={styles.infoSection}>
              <h4>{t('footer.contacts')}</h4>
              <address>
                <p>{t('footer.phone')}: <a href="tel:+79991234567">+7 (999) 123-45-67</a></p>
                <p>Email: <a href="mailto:info@prestigewheels.ru">info@prestigewheels.ru</a></p>
              </address>
            </div>
            <div className={styles.infoSection}>
              <h4>{t('footer.workingHours')}</h4>
              <p>{t('footer.workingTime')}</p>
              <p>{t('footer.noDaysOff')}</p>
            </div>
          </div>
        </div>
        <div className={styles.bottom}>
          <p>&copy; 2025 Prestige Wheels. {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 