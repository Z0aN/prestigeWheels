import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  variant?: 'flat' | 'elevated' | 'outlined';
  size?: 'small' | 'medium' | 'large';
  hover?: boolean;
  clickable?: boolean;
  className?: string;
  onClick?: () => void;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardActionsProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right' | 'space-between';
}

const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Content: React.FC<CardContentProps>;
  Actions: React.FC<CardActionsProps>;
} = ({ 
  children, 
  variant = 'elevated', 
  size = 'medium', 
  hover = false, 
  clickable = false, 
  className = '', 
  onClick 
}) => {
  const cardClasses = [
    styles.card,
    styles[variant],
    styles[size],
    hover && styles.hover,
    clickable && styles.clickable,
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={cardClasses} 
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      {children}
    </div>
  );
};

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div className={`${styles.cardHeader} ${className}`}>
    {children}
  </div>
);

const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => (
  <div className={`${styles.cardContent} ${className}`}>
    {children}
  </div>
);

const CardActions: React.FC<CardActionsProps> = ({ children, className = '', align = 'right' }) => (
  <div className={`${styles.cardActions} ${styles[`align-${align}`]} ${className}`}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Actions = CardActions;

export default Card; 