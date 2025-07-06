export const formatDate = (date: string | Date, locale: string = 'es-GT') => {
  return new Date(date).toLocaleDateString(locale);
};

export const formatDateTime = (date: string | Date, locale: string = 'es-GT') => {
  return new Date(date).toLocaleString(locale);
};

export const isDatePast = (date: string | Date) => {
  return new Date(date) < new Date();
};

export const getDaysUntil = (date: string | Date) => {
  const targetDate = new Date(date);
  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};