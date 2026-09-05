/**
 * Country Data - Country codes, currencies, calling codes
 * بيانات الدول - رموز الدول والعملات وأرقام الاتصال
 */

export const CURRENCY_META = {
  AED: { code: 'AED', name_ar: 'درهم إماراتي', symbol: 'د.إ', rateToUsd: 3.67 },
  USD: { code: 'USD', name_ar: 'دولار أمريكي', symbol: '$', rateToUsd: 1 },
  EUR: { code: 'EUR', name_ar: 'يورو', symbol: '€', rateToUsd: 0.92 },
  GBP: { code: 'GBP', name_ar: 'جنيه إسترليني', symbol: '£', rateToUsd: 0.79 },
  SAR: { code: 'SAR', name_ar: 'ريال سعودي', symbol: 'ر.س', rateToUsd: 3.75 },
  QAR: { code: 'QAR', name_ar: 'ريال قطري', symbol: 'ر.ق', rateToUsd: 3.64 },
  KWD: { code: 'KWD', name_ar: 'دينار كويتي', symbol: 'د.ك', rateToUsd: 0.3 },
  BHD: { code: 'BHD', name_ar: 'دينار بحريني', symbol: 'د.ب', rateToUsd: 0.38 },
  OMR: { code: 'OMR', name_ar: 'ريال عماني', symbol: 'ر.ع', rateToUsd: 0.38 },
  JOD: { code: 'JOD', name_ar: 'دينار أردني', symbol: 'د.ا', rateToUsd: 0.71 },
  EGP: { code: 'EGP', name_ar: 'جنيه مصري', symbol: 'ج.م', rateToUsd: 50.5 },
  TRY: { code: 'TRY', name_ar: 'ليرة تركية', symbol: '₺', rateToUsd: 33.5 },
  LBP: { code: 'LBP', name_ar: 'ليرة لبنانية', symbol: 'ل.ل', rateToUsd: 88690 },
  SYP: { code: 'SYP', name_ar: 'ليرة سورية', symbol: 'ل.س', rateToUsd: 150 },
  SEK: { code: 'SEK', name_ar: 'كرونة سويدية', symbol: 'kr', rateToUsd: 10.8 },
  DKK: { code: 'DKK', name_ar: 'كرونة دانمركية', symbol: 'kr', rateToUsd: 6.7 },
  NOK: { code: 'NOK', name_ar: 'كرونة نرويجية', symbol: 'kr', rateToUsd: 10.2 },
  CHF: { code: 'CHF', name_ar: 'فرنك سويسري', symbol: 'CHF', rateToUsd: 0.9 },
  CAD: { code: 'CAD', name_ar: 'دولار كندي', symbol: 'C$', rateToUsd: 1.36 },
  AUD: { code: 'AUD', name_ar: 'دولار أسترالي', symbol: 'A$', rateToUsd: 1.51 },
  NZD: { code: 'NZD', name_ar: 'دولار نيوزيلندي', symbol: 'NZ$', rateToUsd: 1.61 },
  JPY: { code: 'JPY', name_ar: 'ين ياباني', symbol: '¥', rateToUsd: 157.5 },
  CNY: { code: 'CNY', name_ar: 'يوان صيني', symbol: '¥', rateToUsd: 7.24 },
  INR: { code: 'INR', name_ar: 'روبية هندية', symbol: '₹', rateToUsd: 83.5 },
  PKR: { code: 'PKR', name_ar: 'روبية باكستانية', symbol: '₨', rateToUsd: 278 },
  BDT: { code: 'BDT', name_ar: 'تاكا بنغلاديشي', symbol: '৳', rateToUsd: 108 },
  IDR: { code: 'IDR', name_ar: 'روبية إندونيسية', symbol: 'Rp', rateToUsd: 16200 },
  MYR: { code: 'MYR', name_ar: 'رينغيت ماليزي', symbol: 'RM', rateToUsd: 4.74 },
  SGD: { code: 'SGD', name_ar: 'دولار سنغافوري', symbol: 'S$', rateToUsd: 1.35 },
  THB: { code: 'THB', name_ar: 'بات تايلاندي', symbol: '฿', rateToUsd: 36.1 },
  PHP: { code: 'PHP', name_ar: 'بيزو فلبيني', symbol: '₱', rateToUsd: 58.2 },
  VND: { code: 'VND', name_ar: 'دونغ فيتنامي', symbol: '₫', rateToUsd: 25000 },
  KRW: { code: 'KRW', name_ar: 'وون كوري', symbol: '₩', rateToUsd: 1370 },
  BRL: { code: 'BRL', name_ar: 'ريال برازيلي', symbol: 'R$', rateToUsd: 5.7 },
  MXN: { code: 'MXN', name_ar: 'بيزو مكسيكي', symbol: '$', rateToUsd: 18.5 },
  ARS: { code: 'ARS', name_ar: 'بيزو أرجنتيني', symbol: '$', rateToUsd: 1050 },
  CLP: { code: 'CLP', name_ar: 'بيزو تشيلي', symbol: '$', rateToUsd: 924 },
  COP: { code: 'COP', name_ar: 'بيزو كولومبي', symbol: '$', rateToUsd: 4000 },
  MAD: { code: 'MAD', name_ar: 'درهم مغربي', symbol: 'د.م', rateToUsd: 9.9 },
  TND: { code: 'TND', name_ar: 'دينار تونسي', symbol: 'د.ت', rateToUsd: 3.16 },
  DZD: { code: 'DZD', name_ar: 'دينار جزائري', symbol: 'د.ج', rateToUsd: 134 },
  KES: { code: 'KES', name_ar: 'شيلينغ كيني', symbol: 'KSh', rateToUsd: 127 },
  NGN: { code: 'NGN', name_ar: 'نيرة نيجيرية', symbol: '₦', rateToUsd: 1540 },
  ZAR: { code: 'ZAR', name_ar: 'راند جنوب أفريقي', symbol: 'R', rateToUsd: 18.4 },
};

export const COUNTRIES = [
  { code: 'AE', name_ar: 'الإمارات', name_en: 'United Arab Emirates', callingCode: '+971', currency: 'AED', currencyRate: 3.67 },
  { code: 'SA', name_ar: 'السعودية', name_en: 'Saudi Arabia', callingCode: '+966', currency: 'SAR', currencyRate: 3.75 },
  { code: 'QA', name_ar: 'قطر', name_en: 'Qatar', callingCode: '+974', currency: 'QAR', currencyRate: 3.64 },
  { code: 'KW', name_ar: 'الكويت', name_en: 'Kuwait', callingCode: '+965', currency: 'KWD', currencyRate: 0.30 },
  { code: 'BH', name_ar: 'البحرين', name_en: 'Bahrain', callingCode: '+973', currency: 'BHD', currencyRate: 0.38 },
  { code: 'OM', name_ar: 'عمان', name_en: 'Oman', callingCode: '+968', currency: 'OMR', currencyRate: 0.38 },
  { code: 'SY', name_ar: 'سوريا', name_en: 'Syria', callingCode: '+963', currency: 'SYP', currencyRate: 150 },
  { code: 'TR', name_ar: 'تركيا', name_en: 'Turkey', callingCode: '+90', currency: 'TRY', currencyRate: 33.5 },
  { code: 'LB', name_ar: 'لبنان', name_en: 'Lebanon', callingCode: '+961', currency: 'LBP', currencyRate: 88690 },
  { code: 'JO', name_ar: 'الأردن', name_en: 'Jordan', callingCode: '+962', currency: 'JOD', currencyRate: 0.71 },
  { code: 'EG', name_ar: 'مصر', name_en: 'Egypt', callingCode: '+20', currency: 'EGP', currencyRate: 50.5 },
  { code: 'DE', name_ar: 'ألمانيا', name_en: 'Germany', callingCode: '+49', currency: 'EUR', currencyRate: 0.92 },
  { code: 'FR', name_ar: 'فرنسا', name_en: 'France', callingCode: '+33', currency: 'EUR', currencyRate: 0.92 },
  { code: 'NL', name_ar: 'هولندا', name_en: 'Netherlands', callingCode: '+31', currency: 'EUR', currencyRate: 0.92 },
  { code: 'SE', name_ar: 'السويد', name_en: 'Sweden', callingCode: '+46', currency: 'SEK', currencyRate: 10.8 },
  { code: 'AT', name_ar: 'النمسا', name_en: 'Austria', callingCode: '+43', currency: 'EUR', currencyRate: 0.92 },
  { code: 'BE', name_ar: 'بلجيكا', name_en: 'Belgium', callingCode: '+32', currency: 'EUR', currencyRate: 0.92 },
  { code: 'US', name_ar: 'الولايات المتحدة', name_en: 'United States', callingCode: '+1', currency: 'USD', currencyRate: 1 },
  { code: 'GB', name_ar: 'المملكة المتحدة', name_en: 'United Kingdom', callingCode: '+44', currency: 'GBP', currencyRate: 0.79 },
  { code: 'CA', name_ar: 'كندا', name_en: 'Canada', callingCode: '+1', currency: 'CAD', currencyRate: 1.36 },
  { code: 'AU', name_ar: 'أستراليا', name_en: 'Australia', callingCode: '+61', currency: 'AUD', currencyRate: 1.51 },
  { code: 'NZ', name_ar: 'نيوزيلندا', name_en: 'New Zealand', callingCode: '+64', currency: 'NZD', currencyRate: 1.61 },
  { code: 'JP', name_ar: 'اليابان', name_en: 'Japan', callingCode: '+81', currency: 'JPY', currencyRate: 157.5 },
  { code: 'CH', name_ar: 'سويسرا', name_en: 'Switzerland', callingCode: '+41', currency: 'CHF', currencyRate: 0.9 },
  { code: 'NO', name_ar: 'النرويج', name_en: 'Norway', callingCode: '+47', currency: 'NOK', currencyRate: 10.2 },
  { code: 'DK', name_ar: 'الدنمارك', name_en: 'Denmark', callingCode: '+45', currency: 'DKK', currencyRate: 6.7 },
  { code: 'IN', name_ar: 'الهند', name_en: 'India', callingCode: '+91', currency: 'INR', currencyRate: 83.5 },
  { code: 'PK', name_ar: 'باكستان', name_en: 'Pakistan', callingCode: '+92', currency: 'PKR', currencyRate: 278 },
  { code: 'BD', name_ar: 'بنغلاديش', name_en: 'Bangladesh', callingCode: '+880', currency: 'BDT', currencyRate: 108 },
  { code: 'SG', name_ar: 'سنغافورة', name_en: 'Singapore', callingCode: '+65', currency: 'SGD', currencyRate: 1.35 },
  { code: 'MY', name_ar: 'ماليزيا', name_en: 'Malaysia', callingCode: '+60', currency: 'MYR', currencyRate: 4.74 },
  { code: 'ID', name_ar: 'إندونيسيا', name_en: 'Indonesia', callingCode: '+62', currency: 'IDR', currencyRate: 16200 },
  { code: 'TH', name_ar: 'تايلاند', name_en: 'Thailand', callingCode: '+66', currency: 'THB', currencyRate: 36.1 },
  { code: 'PH', name_ar: 'الفلبين', name_en: 'Philippines', callingCode: '+63', currency: 'PHP', currencyRate: 58.2 },
  { code: 'VN', name_ar: 'فيتنام', name_en: 'Vietnam', callingCode: '+84', currency: 'VND', currencyRate: 25000 },
  { code: 'KR', name_ar: 'كوريا الجنوبية', name_en: 'South Korea', callingCode: '+82', currency: 'KRW', currencyRate: 1370 },
  { code: 'BR', name_ar: 'البرازيل', name_en: 'Brazil', callingCode: '+55', currency: 'BRL', currencyRate: 5.7 },
  { code: 'MX', name_ar: 'المكسيك', name_en: 'Mexico', callingCode: '+52', currency: 'MXN', currencyRate: 18.5 },
  { code: 'AR', name_ar: 'الأرجنتين', name_en: 'Argentina', callingCode: '+54', currency: 'ARS', currencyRate: 1050 },
  { code: 'CL', name_ar: 'تشيلي', name_en: 'Chile', callingCode: '+56', currency: 'CLP', currencyRate: 924 },
  { code: 'CO', name_ar: 'كولومبيا', name_en: 'Colombia', callingCode: '+57', currency: 'COP', currencyRate: 4000 },
  { code: 'MA', name_ar: 'المغرب', name_en: 'Morocco', callingCode: '+212', currency: 'MAD', currencyRate: 9.9 },
  { code: 'TN', name_ar: 'تونس', name_en: 'Tunisia', callingCode: '+216', currency: 'TND', currencyRate: 3.16 },
  { code: 'DZ', name_ar: 'الجزائر', name_en: 'Algeria', callingCode: '+213', currency: 'DZD', currencyRate: 134 },
  { code: 'ZA', name_ar: 'جنوب أفريقيا', name_en: 'South Africa', callingCode: '+27', currency: 'ZAR', currencyRate: 18.4 },
  { code: 'NG', name_ar: 'نيجيريا', name_en: 'Nigeria', callingCode: '+234', currency: 'NGN', currencyRate: 1540 },
  { code: 'KE', name_ar: 'كينيا', name_en: 'Kenya', callingCode: '+254', currency: 'KES', currencyRate: 127 },
];

/**
 * Get country by code
 */
export function getCountryByCode(code) {
  return COUNTRIES.find(c => c.code === code);
}

/**
 * Get country by Arabic name
 */
export function getCountryByArabicName(name) {
  return COUNTRIES.find(c => c.name_ar === name);
}

/**
 * Get calling code by country code
 */
export function getCallingCode(countryCode) {
  const country = getCountryByCode(countryCode);
  return country?.callingCode || '+1';
}

export function getCurrencyByCode(code) {
  const normalized = String(code || '').toUpperCase();
  return CURRENCY_META[normalized] || CURRENCY_META.USD;
}

export function getCurrencyRateToUsd(code) {
  return Number(getCurrencyByCode(code)?.rateToUsd || 1);
}

/**
 * Format phone number with calling code
 */
export function formatPhoneNumber(phone, countryCode) {
  const callingCode = getCallingCode(countryCode);
  // Remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // If already starts with calling code (without +), return as is
  if (cleanPhone.startsWith(callingCode.replace('+', ''))) {
    return `+${cleanPhone}`;
  }
  
  // Otherwise prepend calling code
  return `${callingCode}${cleanPhone}`;
}

/**
 * Get all country Arabic names
 */
export function getCountriesArabicNames() {
  return COUNTRIES.map(c => c.name_ar);
}

/**
 * Get country code from Arabic name
 */
export function getCountryCodeFromArabicName(arabicName) {
  const country = getCountryByArabicName(arabicName);
  return country?.code || null;
}

/**
 * Get country flag emoji from 2-letter ISO code
 */
export function getCountryFlag(code) {
  if (!code || code.length !== 2) return '';
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    ...[...upper].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  );
}
