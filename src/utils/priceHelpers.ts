interface Product {
  estimatedPrice: string;
}

export const calculateProductsTotal = (products: Product[]) => {
  return products.reduce((sum, product) => sum + parseFloat(product.estimatedPrice || '0'), 0);
};

export const formatPrice = (price: number | string) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return `$${numPrice.toFixed(2)}`;
};

export const formatPriceRange = (min: number, max: number) => {
  return `${formatPrice(min)} - ${formatPrice(max)}`;
};

export const formatCurrency = (amount: number | string) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `Q${numAmount.toFixed(2)}`;
};