/**
 * Number formatting utilities - تحويل الأرقام بين الصيغ المختلفة
 */

/**
 * Convert Arabic numbers to English
 */
export function arabicToEnglish(str) {
  if (!str) return str;
  const arabicNumbers = /[٠-٩]/g;
  return str.toString().replace(arabicNumbers, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
}

/**
 * Convert English numbers to Arabic (not recommended for this app)
 */
export function englishToArabic(str) {
  if (!str) return str;
  const englishNumbers = /[0-9]/g;
  return str.toString().replace(englishNumbers, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

/**
 * Format number with English digits and thousand separators
 */
export function formatNumberEnglish(num, decimals = 0) {
  if (typeof num !== 'number') {
    num = parseFloat(num) || 0;
  }
  return num.toLocaleString('en-US', { maximumFractionDigits: decimals });
}

/**
 * Format currency with English numbers
 */
export function formatCurrency(amount, currency = 'SYP') {
  const formatted = formatNumberEnglish(amount, currency === 'USD' ? 2 : 0);
  if (currency === 'SYP') {
    return `${formatted} SYP`;
  } else if (currency === 'USD') {
    return `$${formatted}`;
  }
  return formatted;
}

/**
 * Format percentage
 */
export function formatPercentage(num) {
  return `${formatNumberEnglish(num)}%`;
}
