import React from 'react';
import styles from './AboutPage.module.css';
import globalStyles from '../../styles/globals.module.css';
import { useTranslation } from 'react-i18next';

const AboutPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.aboutPage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>{t('about.title')}</h1>
          <p className={styles.heroSubtitle}>{t('about.subtitle')}</p>
        </div>
      </section>

      {/* Values Section */}
      <section className={styles.section}>
        <div className={globalStyles.container}>
          <h2 className={styles.sectionTitle}>{t('about.valuesTitle')}</h2>
          <p className={styles.sectionSubtitle}>{t('about.valuesSubtitle')}</p>
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>{t('about.qualityTitle')}</h3>
              <p className={styles.cardText}>{t('about.qualityText')}</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>{t('about.serviceTitle')}</h3>
              <p className={styles.cardText}>{t('about.serviceText')}</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>{t('about.reliabilityTitle')}</h3>
              <p className={styles.cardText}>{t('about.reliabilityText')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className={`${styles.section} ${styles.team}`}>
        <div className={globalStyles.container}>
          <h2 className={styles.sectionTitle}>{t('about.teamTitle')}</h2>
          <p className={styles.sectionSubtitle}>{t('about.teamSubtitle')}</p>
          <div className={styles.teamGrid}>
            <div className={styles.teamMember}>
              <img 
                src="/team/member1.jpg" 
                alt={t('about.member1.name')}
                className={styles.memberImage}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/200x200?text=AP';
                }}
              />
              <h3 className={styles.memberName}>{t('about.member1.name')}</h3>
              <p className={styles.memberPosition}>{t('about.member1.position')}</p>
            </div>
            <div className={styles.teamMember}>
              <img 
                src="/team/member2.jpg" 
                alt={t('about.member2.name')}
                className={styles.memberImage}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/200x200?text=MI';
                }}
              />
              <h3 className={styles.memberName}>{t('about.member2.name')}</h3>
              <p className={styles.memberPosition}>{t('about.member2.position')}</p>
            </div>
            <div className={styles.teamMember}>
              <img 
                src="/team/member3.jpg" 
                alt={t('about.member3.name')}
                className={styles.memberImage}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/200x200?text=DS';
                }}
              />
              <h3 className={styles.memberName}>{t('about.member3.name')}</h3>
              <p className={styles.memberPosition}>{t('about.member3.position')}</p>
            </div>
            <div className={styles.teamMember}>
              <img 
                src="/team/member4.jpg" 
                alt={t('about.member4.name')}
                className={styles.memberImage}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/200x200?text=AK';
                }}
              />
              <h3 className={styles.memberName}>{t('about.member4.name')}</h3>
              <p className={styles.memberPosition}>{t('about.member4.position')}</p>
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
              <div className={styles.statLabel}>{t('about.stats.premiumCars')}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>1000+</div>
              <div className={styles.statLabel}>{t('about.stats.happyClients')}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>3</div>
              <div className={styles.statLabel}>{t('about.stats.yearsOnMarket')}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>24/7</div>
              <div className={styles.statLabel}>{t('about.stats.support247')}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage; 