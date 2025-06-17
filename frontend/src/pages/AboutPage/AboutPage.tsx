import React from 'react';
import styles from './AboutPage.module.css';
import globalStyles from '../../styles/globals.module.css';

const AboutPage: React.FC = () => {
  return (
    <div className={styles.aboutPage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>О компании Prestige Wheels</h1>
          <p className={styles.heroSubtitle}>
            Мы предоставляем премиальный сервис аренды автомобилей с 2020 года, 
            делая каждую поездку особенной
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section className={styles.section}>
        <div className={globalStyles.container}>
          <h2 className={styles.sectionTitle}>Наши ценности</h2>
          <p className={styles.sectionSubtitle}>
            Мы стремимся предоставить нашим клиентам исключительный опыт аренды автомобилей,
            основанный на трех ключевых принципах
          </p>
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Качество</h3>
              <p className={styles.cardText}>
                Мы предлагаем только лучшие автомобили премиум-класса, 
                поддерживая их в идеальном техническом состоянии
              </p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Сервис</h3>
              <p className={styles.cardText}>
                Индивидуальный подход к каждому клиенту и круглосуточная 
                поддержка для вашего комфорта
              </p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Надежность</h3>
              <p className={styles.cardText}>
                Полное страховое покрытие и прозрачные условия аренды 
                для вашего спокойствия
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className={`${styles.section} ${styles.team}`}>
        <div className={globalStyles.container}>
          <h2 className={styles.sectionTitle}>Наша команда</h2>
          <p className={styles.sectionSubtitle}>
            Профессионалы, которые делают ваш опыт аренды незабываемым
          </p>
          <div className={styles.teamGrid}>
            <div className={styles.teamMember}>
              <img 
                src="/team/member1.jpg" 
                alt="Александр Петров"
                className={styles.memberImage}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/200x200?text=AP';
                }}
              />
              <h3 className={styles.memberName}>Александр Петров</h3>
              <p className={styles.memberPosition}>Генеральный директор</p>
            </div>
            <div className={styles.teamMember}>
              <img 
                src="/team/member2.jpg" 
                alt="Мария Иванова"
                className={styles.memberImage}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/200x200?text=MI';
                }}
              />
              <h3 className={styles.memberName}>Мария Иванова</h3>
              <p className={styles.memberPosition}>Руководитель отдела продаж</p>
            </div>
            <div className={styles.teamMember}>
              <img 
                src="/team/member3.jpg" 
                alt="Дмитрий Соколов"
                className={styles.memberImage}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/200x200?text=DS';
                }}
              />
              <h3 className={styles.memberName}>Дмитрий Соколов</h3>
              <p className={styles.memberPosition}>Технический директор</p>
            </div>
            <div className={styles.teamMember}>
              <img 
                src="/team/member4.jpg" 
                alt="Анна Козлова"
                className={styles.memberImage}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/200x200?text=AK';
                }}
              />
              <h3 className={styles.memberName}>Анна Козлова</h3>
              <p className={styles.memberPosition}>Менеджер по работе с клиентами</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.stats}>
        <div className={globalStyles.container}>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>50+</div>
              <div className={styles.statLabel}>Премиальных автомобилей</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>1000+</div>
              <div className={styles.statLabel}>Довольных клиентов</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>3</div>
              <div className={styles.statLabel}>Года на рынке</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>24/7</div>
              <div className={styles.statLabel}>Поддержка клиентов</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage; 