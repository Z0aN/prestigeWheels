import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI, bookingsAPI } from '../../services/api';
import { Booking } from '../../types';
import styles from './ProfilePage.module.css';
import globalStyles from '../../styles/globals.module.css';
import { Button, Input, Card } from '../../components/UI';

const ProfilePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'bookings'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [loadingBookingId, setLoadingBookingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [editBookingId, setEditBookingId] = useState<number | null>(null);
  const [editDates, setEditDates] = useState<{date_from: string, date_to: string}>({date_from: '', date_to: ''});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    loadBookings();
    
    // Проверяем URL параметры для переключения вкладки
    const tab = searchParams.get('tab');
    if (tab === 'bookings') {
      setActiveTab('bookings');
    }

    // Инициализируем форму редактирования данными пользователя
    if (user) {
      setEditForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || ''
      });
    }
  }, [searchParams, isAuthenticated, navigate, user]);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const bookingsData = await bookingsAPI.getAll();
      
      // Проверяем, если данные приходят в формате пагинации
      const bookingsArray = Array.isArray(bookingsData) 
        ? bookingsData 
        : (bookingsData as any)?.results || [];
      
      setBookings(bookingsArray);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setError('Ошибка загрузки бронирований');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const updatedUser = await authAPI.updateProfile(editForm);
      updateUser(updatedUser);
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Ошибка обновления профиля');
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm('Вы уверены, что хотите отменить это бронирование?')) {
      return;
    }

    try {
      setLoadingBookingId(bookingId);
      await bookingsAPI.update(bookingId, { status: 'cancelled' });
      await loadBookings(); // Перезагружаем список
      setError(null);
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      setError(error.message || 'Ошибка отмены бронирования');
    } finally {
      setLoadingBookingId(null);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      pending: 'Ожидает подтверждения',
      confirmed: 'Подтверждено',
      active: 'Активно',
      completed: 'Завершено',
      cancelled: 'Отменено'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusClass = (status: string) => {
    return styles[`status${status.charAt(0).toUpperCase() + status.slice(1)}`] || styles.statusPending;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Удаляем неиспользуемую функцию calculateDays

  const filteredBookings = Array.isArray(bookings) 
    ? bookings.filter(booking => {
        if (bookingFilter === 'all') return true;
        return booking.status === bookingFilter;
      })
    : [];

  const getBookingStats = () => {
    if (!Array.isArray(bookings)) {
      return { total: 0, pending: 0, confirmed: 0, cancelled: 0 };
    }
    
    const stats = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
    };
    return stats;
  };

  const handleOpenEditModal = (booking: Booking) => {
    setEditBookingId(booking.id);
    setEditDates({date_from: booking.date_from, date_to: booking.date_to});
    setIsEditModalOpen(true);
  };

  const handleEditBookingDates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBookingId) return;
    try {
      setLoadingBookingId(editBookingId);
      await bookingsAPI.update(editBookingId, {
        date_from: editDates.date_from,
        date_to: editDates.date_to
      });
      setIsEditModalOpen(false);
      setEditBookingId(null);
      await loadBookings();
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Ошибка изменения дат бронирования');
    } finally {
      setLoadingBookingId(null);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setSuccessMessage(null);
    try {
      await authAPI.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm
      });
      setSuccessMessage('Пароль успешно изменен');
      setOldPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
    } catch (err: any) {
      setPasswordError(err.message || 'Ошибка при смене пароля');
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className={styles.profilePage}>
        <div className={globalStyles.container}>
          <div className={styles.error}>
            <h1>Необходима авторизация</h1>
            <p>Пожалуйста, войдите в систему для просмотра профиля</p>
            <Link to="/login" className={styles.loginButton}>
              Войти
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && activeTab === 'bookings') {
    return (
      <div className={styles.profilePage}>
        <div className={globalStyles.container}>
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}></div>
            <p>Загрузка данных...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profilePage}>
      <div className={globalStyles.container}>
        <div className={styles.header}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              {(user.first_name?.[0] || user.username?.[0] || 'U').toUpperCase()}
            </div>
            <div className={styles.userInfo}>
              <h1>{user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}</h1>
              <p>{user.email}</p>
              {user.date_joined && (
                <span className={styles.memberSince}>
                  Участник с {formatDate(user.date_joined)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'profile' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Профиль
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'bookings' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Мои бронирования ({Array.isArray(bookings) ? bookings.length : 0})
          </button>
        </div>

        <div className={styles.content}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className={styles.profileContent}>
              <div className={styles.profileCard}>
                <div className={styles.cardHeader}>
                  <h2>Личная информация</h2>
                  {!isEditing && (
                    <button
                      className={styles.editButton}
                      onClick={() => setIsEditing(true)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Редактировать
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleEditSubmit} className={styles.editForm}>
                    <div className={styles.formRow}>
                      <div className={styles.inputGroup}>
                        <label>Имя</label>
                        <input
                          type="text"
                          value={editForm.first_name}
                          onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                          required
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Фамилия</label>
                        <input
                          type="text"
                          value={editForm.last_name}
                          onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Email</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className={styles.formActions}>
                      <button type="submit" className={styles.saveButton}>
                        Сохранить
                      </button>
                      <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={() => {
                          setIsEditing(false);
                          setError(null);
                          // Сбрасываем форму к исходным данным
                          setEditForm({
                            first_name: user.first_name || '',
                            last_name: user.last_name || '',
                            email: user.email || ''
                          });
                        }}
                      >
                        Отмена
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className={styles.profileInfo}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Email:</span>
                      <span className={styles.infoValue}>{user.email}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Имя:</span>
                      <span className={styles.infoValue}>{user.first_name || 'Не указано'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Фамилия:</span>
                      <span className={styles.infoValue}>{user.last_name || 'Не указано'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Имя пользователя:</span>
                      <span className={styles.infoValue}>{user.username}</span>
                    </div>
                  </div>
                )}
              </div>
              <Card size="large" variant="elevated" className={styles.passwordCard}>
                <Card.Header>
                  <h2>Смена пароля</h2>
                </Card.Header>
                <form onSubmit={handlePasswordChange} autoComplete="off">
                  <Card.Content>
                    <div style={{ marginBottom: '1rem' }}>
                      <Input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Текущий пароль"
                        required
                        label="Текущий пароль"
                      />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Новый пароль"
                        required
                        label="Новый пароль"
                      />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <Input
                        type="password"
                        value={newPasswordConfirm}
                        onChange={(e) => setNewPasswordConfirm(e.target.value)}
                        placeholder="Подтверждение нового пароля"
                        required
                        label="Подтверждение нового пароля"
                      />
                    </div>
                    {passwordError && <div className={styles.errorMessage}>{passwordError}</div>}
                    {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
                  </Card.Content>
                  <Card.Actions align="left">
                    <Button type="submit" color="primary" size="large">Изменить пароль</Button>
                  </Card.Actions>
                </form>
              </Card>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className={styles.bookingsContent}>
              {!Array.isArray(bookings) || bookings.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📅</div>
                  <h3>У вас пока нет бронирований</h3>
                  <p>Выберите автомобиль из нашего каталога и сделайте первое бронирование</p>
                  <Link to="/cars" className={styles.browseCarsButton}>
                    Посмотреть автомобили
                  </Link>
                </div>
              ) : (
                <>
                  <div className={styles.bookingsHeader}>
                    <div className={styles.bookingsStats}>
                      <div className={styles.stat}>
                        <span className={styles.statNumber}>{getBookingStats().total}</span>
                        <span className={styles.statLabel}>Всего</span>
                      </div>
                      <div className={styles.stat}>
                        <span className={styles.statNumber}>{getBookingStats().pending}</span>
                        <span className={styles.statLabel}>Ожидает</span>
                      </div>
                      <div className={styles.stat}>
                        <span className={styles.statNumber}>{getBookingStats().confirmed}</span>
                        <span className={styles.statLabel}>Подтверждено</span>
                      </div>
                      <div className={styles.stat}>
                        <span className={styles.statNumber}>{getBookingStats().cancelled}</span>
                        <span className={styles.statLabel}>Отменено</span>
                      </div>
                    </div>
                    
                    <div className={styles.bookingsFilters}>
                      <Button
                        className={`${styles.filterButton} ${bookingFilter === 'all' ? styles.filterActive : ''}`}
                        variant="text"
                        onClick={() => setBookingFilter('all')}
                      >
                        Все ({getBookingStats().total})
                      </Button>
                      <Button
                        className={`${styles.filterButton} ${bookingFilter === 'pending' ? styles.filterActive : ''}`}
                        variant="text"
                        onClick={() => setBookingFilter('pending')}
                      >
                        Ожидает ({getBookingStats().pending})
                      </Button>
                      <Button
                        className={`${styles.filterButton} ${bookingFilter === 'confirmed' ? styles.filterActive : ''}`}
                        variant="text"
                        onClick={() => setBookingFilter('confirmed')}
                      >
                        Подтверждено ({getBookingStats().confirmed})
                      </Button>
                      <Button
                        className={`${styles.filterButton} ${bookingFilter === 'cancelled' ? styles.filterActive : ''}`}
                        variant="text"
                        onClick={() => setBookingFilter('cancelled')}
                      >
                        Отменено ({getBookingStats().cancelled})
                      </Button>
                    </div>
                  </div>

                <div className={styles.bookingsList}>
                    {filteredBookings.map((booking) => (
                    <div key={booking.id} className={styles.bookingCard}>
                      <div className={styles.bookingImage}>
                        <img
                          src={booking.car.image_url || booking.car.image}
                          alt={`${booking.car.brand} ${booking.car.name}`}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/api/placeholder/300/200';
                          }}
                        />
                        <div className={`${styles.bookingStatus} ${getStatusClass(booking.status)}`}>
                          {getStatusText(booking.status)}
                        </div>
                      </div>
                      <div className={styles.bookingInfo}>
                        <div className={styles.bookingHeader}>
                          <h3>{booking.car.brand} {booking.car.name}</h3>
                          <span className={styles.bookingId}>#{booking.id}</span>
                        </div>
                        <div className={styles.bookingDetails}>
                          <div className={styles.bookingDates}>
                            <div className={styles.dateRange}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                              </svg>
                              <span>
                                {formatDate(booking.date_from)} - {formatDate(booking.date_to)}
                              </span>
                            </div>
                            <span className={styles.duration}>
                              {booking.days_count} дн.
                            </span>
                          </div>
                          <div className={styles.bookingPrice}>
                              <div className={styles.pricePerDay}>
                            {Number(booking.car.price || 0).toLocaleString('ru-RU')} ₽/день
                          </div>
                              {booking.total_price && (
                                <div className={styles.totalPrice}>
                                  Итого: {Number(booking.total_price).toLocaleString('ru-RU')} ₽
                                </div>
                              )}
                            </div>
                        </div>
                        <div className={styles.bookingActions}>
                          <Link
                            to={`/cars/${booking.car.id}`}
                            className={styles.viewCarButton}
                          >
                            Посмотреть автомобиль
                          </Link>
                          {booking.status === 'pending' && (
                            <>
                              <Button 
                                className={styles.cancelButton}
                                variant="outlined"
                                color="secondary"
                                onClick={() => handleCancelBooking(booking.id)}
                                disabled={loadingBookingId === booking.id}
                              >
                                {loadingBookingId === booking.id ? 'Отменяем...' : 'Отменить'}
                              </Button>
                              <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => handleOpenEditModal(booking)}
                                disabled={loadingBookingId === booking.id}
                              >
                                Изменить дату
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {isEditModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Изменить даты бронирования</h3>
            <form onSubmit={handleEditBookingDates} className={styles.editBookingForm}>
              <Input
                type="date"
                label="Дата начала аренды"
                value={editDates.date_from}
                onChange={e => setEditDates(d => ({...d, date_from: e.target.value}))}
                min={new Date().toISOString().split('T')[0]}
                required
                fullWidth
              />
              <Input
                type="date"
                label="Дата окончания аренды"
                value={editDates.date_to}
                onChange={e => setEditDates(d => ({...d, date_to: e.target.value}))}
                min={editDates.date_from || new Date().toISOString().split('T')[0]}
                required
                fullWidth
              />
              <div className={styles.modalActions}>
                <Button type="submit" variant="filled" color="primary" disabled={loadingBookingId !== null}>
                  Сохранить
                </Button>
                <Button type="button" variant="outlined" color="secondary" onClick={() => setIsEditModalOpen(false)}>
                  Отмена
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage; 