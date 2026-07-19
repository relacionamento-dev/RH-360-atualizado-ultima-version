export const formatCurrency = (value: number | string) => {
  const num = typeof value === 'string' ? parseFloat(value.replace('R$', '').replace('.', '').replace(',', '.')) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
};

export const formatPercent = (value: number | string) => {
  const num = typeof value === 'string' ? parseFloat(value.replace('%', '').replace(',', '.')) : value;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(num) + '%';
};

export const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.NumberFormat('pt-BR').format(d.getDate()) + '/' + 
         new Intl.NumberFormat('pt-BR').format(d.getMonth() + 1) + '/' + 
         d.getFullYear();
};
