import React from 'react';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.section}>
            <h3>Prestige Wheels</h3>
            <p>Премиальная аренда автомобилей класса люкс</p>
          </div>
          
          <div className={styles.section}>
            <h4>Контакты</h4>
            <p>Телефон: +7 (999) 123-45-67</p>
            <p>Email: info@prestigewheels.ru</p>
          </div>
          
          <div className={styles.section}>
            <h4>Режим работы</h4>
            <p>Пн-Вс: 9:00 - 21:00</p>
            <p>Без выходных</p>
          </div>
        </div>
        
        <div className={styles.bottom}>
          <p>&copy; 2025 Prestige Wheels. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 