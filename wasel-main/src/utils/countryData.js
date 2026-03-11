/**
 * Country Data - Country codes, currencies, calling codes
 * بيانات الدول - رموز الدول والعملات وأرقام الاتصال
 */

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
