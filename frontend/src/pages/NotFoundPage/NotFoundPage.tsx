import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>404 - Страница не найдена</h1>
      <p>Запрашиваемая страница не существует</p>
      <Link to="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>
        Вернуться на главную
      </Link>
    </div>
  );
};

export default NotFoundPage; 