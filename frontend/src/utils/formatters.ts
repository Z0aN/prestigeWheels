export const formatPrice = (price: number | string): string => {
  const numPrice = Number(price || 0);
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);
}; 