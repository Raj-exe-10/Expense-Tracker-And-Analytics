/**
 * Utility functions for formatting data
 */

/**
 * Safely format an amount to 2 decimal places
 * Handles both number and string inputs
 */
export const formatAmount = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined) {
    return '0.00';
  }
  const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount) || '0');
  if (isNaN(numAmount)) {
    return '0.00';
  }
  return numAmount.toFixed(2);
};

/**
 * Safely convert an amount to a number
 */
export const toNumber = (amount: number | string | null | undefined): number => {
  if (amount === null || amount === undefined) {
    return 0;
  }
  const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount) || '0');
  return isNaN(numAmount) ? 0 : numAmount;
};
