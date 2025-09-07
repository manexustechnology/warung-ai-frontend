export const formatCurrency = (amount: number, currency: 'IDR' | 'USD' = 'IDR'): string => {
  if (currency === 'IDR') {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat('id-ID').format(amount);
};