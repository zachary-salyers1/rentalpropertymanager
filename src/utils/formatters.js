/**
 * Format a number as USD currency
 * @param {number} amount - The amount to format
 * @param {boolean} [showCents=true] - Whether to show cents
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, showCents = true) => {
  if (!amount && amount !== 0) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0
  }).format(amount);
};

/**
 * Parse a currency string to number
 * @param {string} currencyString - The currency string to parse
 * @returns {number} Parsed amount
 */
export const parseCurrency = (currencyString) => {
  if (!currencyString) return 0;
  return parseFloat(currencyString.replace(/[^0-9.-]+/g, '')) || 0;
};
