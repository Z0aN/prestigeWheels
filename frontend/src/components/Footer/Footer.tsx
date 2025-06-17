import React from 'react';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.container}>
        <div className={styles.content}>
          <section className={styles.section}>
            <h3>Prestige Wheels</h3>
            <p>Премиальная аренда автомобилей класса люкс</p>
          </section>
          
          <section className={styles.section}>
            <h4>Контакты</h4>
            <address>
              <p>Телефон: <a href="tel:+79991234567">+7 (999) 123-45-67</a></p>
              <p>Email: <a href="mailto:info@prestigewheels.ru">info@prestigewheels.ru</a></p>
            </address>
          </section>
          
          <section className={styles.section}>
            <h4>Режим работы</h4>
            <p>Пн-Вс: 9:00 - 21:00</p>
            <p>Без выходных</p>
          </section>
        </div>
        
        <div className={styles.bottom}>
          <p>&copy; 2025 Prestige Wheels. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 