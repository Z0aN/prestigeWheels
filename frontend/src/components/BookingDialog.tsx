import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Car, CarService, Booking } from '../types';
import api from '../services/api';
import { formatPrice } from '../utils/formatters';
import { addDays } from 'date-fns';

interface BookingDialogProps {
  open: boolean;
  onClose: () => void;
  car: Car;
}

const BookingDialog: React.FC<BookingDialogProps> = ({ open, onClose, car }) => {
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(addDays(new Date(), 1));
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingPreview, setBookingPreview] = useState<{
    days_count: number;
    base_price: number;
    discount_percentage: number;
    discount_amount: number;
    total_price: number;
  } | null>(null);

  // Выбираем обязательные услуги по умолчанию
  useEffect(() => {
    const requiredServices = car.services
      .filter(service => service.is_required)
      .map(service => service.id);
    setSelectedServices(requiredServices);
  }, [car]);

  // Получаем предварительный расчет стоимости
  useEffect(() => {
    const fetchBookingPreview = async () => {
      if (!startDate || !endDate) return;

      try {
        const preview = await api.post<Booking>('/bookings/preview/', {
          car_id: car.id,
          date_from: startDate.toISOString().split('T')[0],
          date_to: endDate.toISOString().split('T')[0],
          service_ids: selectedServices,
        });

        setBookingPreview({
          days_count: Number(preview.days_count || 0),
          base_price: Number(preview.base_price || 0),
          discount_percentage: Number(preview.discount_percentage || 0),
          discount_amount: Number(preview.discount_amount || 0),
          total_price: Number(preview.total_price || 0),
        });
      } catch (err) {
        console.error('Failed to fetch booking preview:', err);
      }
    };

    fetchBookingPreview();
  }, [car.id, startDate, endDate, selectedServices]);

  const handleServiceToggle = (serviceId: number, isRequired: boolean) => {
    if (isRequired) return;

    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate) {
      setError('Пожалуйста, выберите даты аренды');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/bookings/', {
        car_id: car.id,
        date_from: startDate.toISOString().split('T')[0],
        date_to: endDate.toISOString().split('T')[0],
        service_ids: selectedServices,
      });

      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось создать бронирование');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Бронирование {car.brand} {car.name}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Выберите даты аренды
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <DatePicker
              label="Дата начала"
              value={startDate}
              onChange={setStartDate}
              disablePast
              format="dd.MM.yyyy"
            />
            <DatePicker
              label="Дата окончания"
              value={endDate}
              onChange={setEndDate}
              disablePast
              minDate={startDate || undefined}
              format="dd.MM.yyyy"
            />
          </Box>
        </Box>

        <Typography variant="subtitle1" gutterBottom>
          Дополнительные услуги
        </Typography>
        <List>
          {car.services.map((service: CarService) => (
            <ListItem key={service.id} disablePadding>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedServices.includes(service.id)}
                    onChange={() => handleServiceToggle(service.id, service.is_required)}
                    disabled={service.is_required}
                  />
                }
                label={
                  <Box>
                    <Typography>
                      {service.service.name} - {formatPrice(service.price)}
                      {service.is_required && ' (обязательно)'}
                    </Typography>
                    {service.notes && (
                      <Typography variant="body2" color="text.secondary">
                        {service.notes}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>

        {bookingPreview && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Расчет стоимости
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="Количество дней"
                  secondary={bookingPreview.days_count}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Базовая стоимость"
                  secondary={formatPrice(bookingPreview.base_price)}
                />
              </ListItem>
              {bookingPreview.discount_percentage > 0 && (
                <ListItem>
                  <ListItemText 
                    primary={`Скидка (${bookingPreview.discount_percentage}%)`}
                    secondary={`-${formatPrice(bookingPreview.discount_amount)}`}
                  />
                </ListItem>
              )}
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="Итоговая стоимость"
                  secondary={formatPrice(bookingPreview.total_price)}
                />
              </ListItem>
            </List>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || !startDate || !endDate}
        >
          {loading ? 'Создание бронирования...' : 'Забронировать'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookingDialog; 