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
  PLN: { code: 'PLN', name_ar: 'زلوتي بولندي', symbol: 'zł', rateToUsd: 3.96 },
  CZK: { code: 'CZK', name_ar: 'كرونة تشيكية', symbol: 'Kč', rateToUsd: 22.5 },
  HUF: { code: 'HUF', name_ar: 'فورنت مجري', symbol: 'Ft', rateToUsd: 365 },
  RON: { code: 'RON', name_ar: 'ليو روماني', symbol: 'lei', rateToUsd: 4.62 },
  BGN: { code: 'BGN', name_ar: 'ليف بلغاري', symbol: 'лв', rateToUsd: 1.78 },
  HRK: { code: 'HRK', name_ar: 'كونا كرواتي', symbol: 'kn', rateToUsd: 7.2 },
  RSD: { code: 'RSD', name_ar: 'دينار صربي', symbol: 'дин.', rateToUsd: 109 },
  BAM: { code: 'BAM', name_ar: 'مارك البوسنة والهرسك', symbol: 'KM', rateToUsd: 1.8 },
  UAH: { code: 'UAH', name_ar: 'هريفنيا أوكرانية', symbol: '₴', rateToUsd: 41.5 },
  GEL: { code: 'GEL', name_ar: 'لاري جورجي', symbol: '₾', rateToUsd: 2.82 },
  MDL: { code: 'MDL', name_ar: 'ليو مولدوفي', symbol: 'L', rateToUsd: 17.8 },
  ISK: { code: 'ISK', name_ar: 'كرونة آيسلندية', symbol: 'kr', rateToUsd: 143 },
  PEN: { code: 'PEN', name_ar: 'سول بيروفي', symbol: 'S/', rateToUsd: 3.72 },
  UYU: { code: 'UYU', name_ar: 'بيزو أوروغواي', symbol: '$U', rateToUsd: 39.2 },
  PYG: { code: 'PYG', name_ar: 'غواراني باراغواي', symbol: '₲', rateToUsd: 7400 },
  BOB: { code: 'BOB', name_ar: 'بوليفيانو بوليفي', symbol: 'Bs', rateToUsd: 6.9 },
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
  { code: 'IQ', name_ar: 'العراق', name_en: 'Iraq', callingCode: '+964', currency: 'IQD', currencyRate: 1300 },
  { code: 'IR', name_ar: 'إيران', name_en: 'Iran', callingCode: '+98', currency: 'IRR', currencyRate: 420000 },
  { code: 'PS', name_ar: 'فلسطين', name_en: 'Palestine', callingCode: '+970', currency: 'ILS', currencyRate: 3.6 },
  { code: 'IL', name_ar: 'إسرائيل', name_en: 'Israel', callingCode: '+972', currency: 'ILS', currencyRate: 3.6 },
  { code: 'DZ', name_ar: 'الجزائر', name_en: 'Algeria', callingCode: '+213', currency: 'DZD', currencyRate: 134 },
  { code: 'MA', name_ar: 'المغرب', name_en: 'Morocco', callingCode: '+212', currency: 'MAD', currencyRate: 9.9 },
  { code: 'TN', name_ar: 'تونس', name_en: 'Tunisia', callingCode: '+216', currency: 'TND', currencyRate: 3.16 },
  { code: 'LY', name_ar: 'ليبيا', name_en: 'Libya', callingCode: '+218', currency: 'LYD', currencyRate: 4.8 },
  { code: 'SD', name_ar: 'السودان', name_en: 'Sudan', callingCode: '+249', currency: 'SDG', currencyRate: 600 },
  { code: 'SS', name_ar: 'جنوب السودان', name_en: 'South Sudan', callingCode: '+211', currency: 'SSP', currencyRate: 5000 },
  { code: 'ET', name_ar: 'إثيوبيا', name_en: 'Ethiopia', callingCode: '+251', currency: 'ETB', currencyRate: 57 },
  { code: 'KE', name_ar: 'كينيا', name_en: 'Kenya', callingCode: '+254', currency: 'KES', currencyRate: 127 },
  { code: 'UG', name_ar: 'أوغندا', name_en: 'Uganda', callingCode: '+256', currency: 'UGX', currencyRate: 3700 },
  { code: 'TZ', name_ar: 'تنزانيا', name_en: 'Tanzania', callingCode: '+255', currency: 'TZS', currencyRate: 2600 },
  { code: 'RW', name_ar: 'رواندا', name_en: 'Rwanda', callingCode: '+250', currency: 'RWF', currencyRate: 1280 },
  { code: 'ZM', name_ar: 'زامبيا', name_en: 'Zambia', callingCode: '+260', currency: 'ZMW', currencyRate: 26 },
  { code: 'NG', name_ar: 'نيجيريا', name_en: 'Nigeria', callingCode: '+234', currency: 'NGN', currencyRate: 1540 },
  { code: 'GH', name_ar: 'غانا', name_en: 'Ghana', callingCode: '+233', currency: 'GHS', currencyRate: 12.3 },
  { code: 'CM', name_ar: 'الكاميرون', name_en: 'Cameroon', callingCode: '+237', currency: 'XAF', currencyRate: 600 },
  { code: 'SN', name_ar: 'السنغال', name_en: 'Senegal', callingCode: '+221', currency: 'XOF', currencyRate: 600 },
  { code: 'ML', name_ar: 'مالي', name_en: 'Mali', callingCode: '+223', currency: 'XOF', currencyRate: 600 },
  { code: 'BF', name_ar: 'بوركينا فاسو', name_en: 'Burkina Faso', callingCode: '+226', currency: 'XOF', currencyRate: 600 },
  { code: 'NE', name_ar: 'النيجر', name_en: 'Niger', callingCode: '+227', currency: 'XOF', currencyRate: 600 },
  { code: 'GA', name_ar: 'الغابون', name_en: 'Gabon', callingCode: '+241', currency: 'XAF', currencyRate: 600 },
  { code: 'CD', name_ar: 'جمهورية الكونغو الديمقراطية', name_en: 'Democratic Republic of the Congo', callingCode: '+243', currency: 'CDF', currencyRate: 2800 },
  { code: 'CG', name_ar: 'جمهورية الكونغو', name_en: 'Republic of the Congo', callingCode: '+242', currency: 'XAF', currencyRate: 600 },
  { code: 'AO', name_ar: 'أنغولا', name_en: 'Angola', callingCode: '+244', currency: 'AOA', currencyRate: 840 },
  { code: 'MZ', name_ar: 'موزمبيق', name_en: 'Mozambique', callingCode: '+258', currency: 'MZN', currencyRate: 63 },
  { code: 'BW', name_ar: 'بوتسوانا', name_en: 'Botswana', callingCode: '+267', currency: 'BWP', currencyRate: 13.5 },
  { code: 'LS', name_ar: 'ليسوتو', name_en: 'Lesotho', callingCode: '+266', currency: 'LSL', currencyRate: 18.4 },
  { code: 'SZ', name_ar: 'إسواتيني', name_en: 'Eswatini', callingCode: '+268', currency: 'SZL', currencyRate: 18.4 },
  { code: 'ZA', name_ar: 'جنوب أفريقيا', name_en: 'South Africa', callingCode: '+27', currency: 'ZAR', currencyRate: 18.4 },
  { code: 'MG', name_ar: 'مدغشقر', name_en: 'Madagascar', callingCode: '+261', currency: 'MGA', currencyRate: 4500 },
  { code: 'MU', name_ar: 'موريشيوس', name_en: 'Mauritius', callingCode: '+230', currency: 'MUR', currencyRate: 45 },
  { code: 'DE', name_ar: 'ألمانيا', name_en: 'Germany', callingCode: '+49', currency: 'EUR', currencyRate: 0.92 },
  { code: 'FR', name_ar: 'فرنسا', name_en: 'France', callingCode: '+33', currency: 'EUR', currencyRate: 0.92 },
  { code: 'ES', name_ar: 'إسبانيا', name_en: 'Spain', callingCode: '+34', currency: 'EUR', currencyRate: 0.92 },
  { code: 'IT', name_ar: 'إيطاليا', name_en: 'Italy', callingCode: '+39', currency: 'EUR', currencyRate: 0.92 },
  { code: 'PT', name_ar: 'البرتغال', name_en: 'Portugal', callingCode: '+351', currency: 'EUR', currencyRate: 0.92 },
  { code: 'IE', name_ar: 'أيرلندا', name_en: 'Ireland', callingCode: '+353', currency: 'EUR', currencyRate: 0.92 },
  { code: 'NL', name_ar: 'هولندا', name_en: 'Netherlands', callingCode: '+31', currency: 'EUR', currencyRate: 0.92 },
  { code: 'BE', name_ar: 'بلجيكا', name_en: 'Belgium', callingCode: '+32', currency: 'EUR', currencyRate: 0.92 },
  { code: 'AT', name_ar: 'النمسا', name_en: 'Austria', callingCode: '+43', currency: 'EUR', currencyRate: 0.92 },
  { code: 'SE', name_ar: 'السويد', name_en: 'Sweden', callingCode: '+46', currency: 'SEK', currencyRate: 10.8 },
  { code: 'NO', name_ar: 'النرويج', name_en: 'Norway', callingCode: '+47', currency: 'NOK', currencyRate: 10.2 },
  { code: 'DK', name_ar: 'الدنمارك', name_en: 'Denmark', callingCode: '+45', currency: 'DKK', currencyRate: 6.7 },
  { code: 'FI', name_ar: 'فنلندا', name_en: 'Finland', callingCode: '+358', currency: 'EUR', currencyRate: 0.92 },
  { code: 'PL', name_ar: 'بولندا', name_en: 'Poland', callingCode: '+48', currency: 'PLN', currencyRate: 3.96 },
  { code: 'CZ', name_ar: 'التشيك', name_en: 'Czech Republic', callingCode: '+420', currency: 'CZK', currencyRate: 22.5 },
  { code: 'SK', name_ar: 'سلوفاكيا', name_en: 'Slovakia', callingCode: '+421', currency: 'EUR', currencyRate: 0.92 },
  { code: 'HU', name_ar: 'هنغاريا', name_en: 'Hungary', callingCode: '+36', currency: 'HUF', currencyRate: 365 },
  { code: 'RO', name_ar: 'رومانيا', name_en: 'Romania', callingCode: '+40', currency: 'RON', currencyRate: 4.62 },
  { code: 'BG', name_ar: 'بلغاريا', name_en: 'Bulgaria', callingCode: '+359', currency: 'BGN', currencyRate: 1.78 },
  { code: 'GR', name_ar: 'اليونان', name_en: 'Greece', callingCode: '+30', currency: 'EUR', currencyRate: 0.92 },
  { code: 'HR', name_ar: 'كرواتيا', name_en: 'Croatia', callingCode: '+385', currency: 'HRK', currencyRate: 7.2 },
  { code: 'SI', name_ar: 'سلوفينيا', name_en: 'Slovenia', callingCode: '+386', currency: 'EUR', currencyRate: 0.92 },
  { code: 'RS', name_ar: 'صربيا', name_en: 'Serbia', callingCode: '+381', currency: 'RSD', currencyRate: 109 },
  { code: 'BA', name_ar: 'البوسنة والهرسك', name_en: 'Bosnia and Herzegovina', callingCode: '+387', currency: 'BAM', currencyRate: 1.8 },
  { code: 'AL', name_ar: 'ألبانيا', name_en: 'Albania', callingCode: '+355', currency: 'ALL', currencyRate: 96 },
  { code: 'MK', name_ar: 'مقدونيا الشمالية', name_en: 'North Macedonia', callingCode: '+389', currency: 'MKD', currencyRate: 56 },
  { code: 'IS', name_ar: 'آيسلندا', name_en: 'Iceland', callingCode: '+354', currency: 'ISK', currencyRate: 143 },
  { code: 'CH', name_ar: 'سويسرا', name_en: 'Switzerland', callingCode: '+41', currency: 'CHF', currencyRate: 0.9 },
  { code: 'GB', name_ar: 'المملكة المتحدة', name_en: 'United Kingdom', callingCode: '+44', currency: 'GBP', currencyRate: 0.79 },
  { code: 'US', name_ar: 'الولايات المتحدة', name_en: 'United States', callingCode: '+1', currency: 'USD', currencyRate: 1 },
  { code: 'CA', name_ar: 'كندا', name_en: 'Canada', callingCode: '+1', currency: 'CAD', currencyRate: 1.36 },
  { code: 'MX', name_ar: 'المكسيك', name_en: 'Mexico', callingCode: '+52', currency: 'MXN', currencyRate: 18.5 },
  { code: 'GT', name_ar: 'غواتيمالا', name_en: 'Guatemala', callingCode: '+502', currency: 'GTQ', currencyRate: 7.8 },
  { code: 'SV', name_ar: 'السلفادور', name_en: 'El Salvador', callingCode: '+503', currency: 'USD', currencyRate: 1 },
  { code: 'HN', name_ar: 'هندوراس', name_en: 'Honduras', callingCode: '+504', currency: 'HNL', currencyRate: 24.8 },
  { code: 'NI', name_ar: 'نيكاراغوا', name_en: 'Nicaragua', callingCode: '+505', currency: 'NIO', currencyRate: 36.5 },
  { code: 'CR', name_ar: 'كوستاريكا', name_en: 'Costa Rica', callingCode: '+506', currency: 'CRC', currencyRate: 500 },
  { code: 'PA', name_ar: 'بنما', name_en: 'Panama', callingCode: '+507', currency: 'PAB', currencyRate: 1 },
  { code: 'DO', name_ar: 'جمهورية الدومينيكان', name_en: 'Dominican Republic', callingCode: '+1', currency: 'DOP', currencyRate: 58 },
  { code: 'PR', name_ar: 'بورتوريكو', name_en: 'Puerto Rico', callingCode: '+1', currency: 'USD', currencyRate: 1 },
  { code: 'EC', name_ar: 'الإكوادور', name_en: 'Ecuador', callingCode: '+593', currency: 'USD', currencyRate: 1 },
  { code: 'PE', name_ar: 'بيرو', name_en: 'Peru', callingCode: '+51', currency: 'PEN', currencyRate: 3.72 },
  { code: 'CO', name_ar: 'كولومبيا', name_en: 'Colombia', callingCode: '+57', currency: 'COP', currencyRate: 4000 },
  { code: 'VE', name_ar: 'فنزويلا', name_en: 'Venezuela', callingCode: '+58', currency: 'VES', currencyRate: 21 },
  { code: 'BR', name_ar: 'البرازيل', name_en: 'Brazil', callingCode: '+55', currency: 'BRL', currencyRate: 5.7 },
  { code: 'AR', name_ar: 'الأرجنتين', name_en: 'Argentina', callingCode: '+54', currency: 'ARS', currencyRate: 1050 },
  { code: 'CL', name_ar: 'تشيلي', name_en: 'Chile', callingCode: '+56', currency: 'CLP', currencyRate: 924 },
  { code: 'UY', name_ar: 'الأوروغواي', name_en: 'Uruguay', callingCode: '+598', currency: 'UYU', currencyRate: 39.2 },
  { code: 'PY', name_ar: 'باراغواي', name_en: 'Paraguay', callingCode: '+595', currency: 'PYG', currencyRate: 7400 },
  { code: 'BO', name_ar: 'بوليفيا', name_en: 'Bolivia', callingCode: '+591', currency: 'BOB', currencyRate: 6.9 },
  { code: 'CN', name_ar: 'الصين', name_en: 'China', callingCode: '+86', currency: 'CNY', currencyRate: 7.24 },
  { code: 'HK', name_ar: 'هونغ كونغ', name_en: 'Hong Kong', callingCode: '+852', currency: 'HKD', currencyRate: 7.8 },
  { code: 'TW', name_ar: 'تايوان', name_en: 'Taiwan', callingCode: '+886', currency: 'TWD', currencyRate: 32 },
  { code: 'JP', name_ar: 'اليابان', name_en: 'Japan', callingCode: '+81', currency: 'JPY', currencyRate: 157.5 },
  { code: 'KR', name_ar: 'كوريا الجنوبية', name_en: 'South Korea', callingCode: '+82', currency: 'KRW', currencyRate: 1370 },
  { code: 'IN', name_ar: 'الهند', name_en: 'India', callingCode: '+91', currency: 'INR', currencyRate: 83.5 },
  { code: 'PK', name_ar: 'باكستان', name_en: 'Pakistan', callingCode: '+92', currency: 'PKR', currencyRate: 278 },
  { code: 'BD', name_ar: 'بنغلاديش', name_en: 'Bangladesh', callingCode: '+880', currency: 'BDT', currencyRate: 108 },
  { code: 'LK', name_ar: 'سريلانكا', name_en: 'Sri Lanka', callingCode: '+94', currency: 'LKR', currencyRate: 295 },
  { code: 'NP', name_ar: 'نيبال', name_en: 'Nepal', callingCode: '+977', currency: 'NPR', currencyRate: 133 },
  { code: 'MM', name_ar: 'ميانمار', name_en: 'Myanmar', callingCode: '+95', currency: 'MMK', currencyRate: 2100 },
  { code: 'TH', name_ar: 'تايلاند', name_en: 'Thailand', callingCode: '+66', currency: 'THB', currencyRate: 36.1 },
  { code: 'VN', name_ar: 'فيتنام', name_en: 'Vietnam', callingCode: '+84', currency: 'VND', currencyRate: 25000 },
  { code: 'ID', name_ar: 'إندونيسيا', name_en: 'Indonesia', callingCode: '+62', currency: 'IDR', currencyRate: 16200 },
  { code: 'MY', name_ar: 'ماليزيا', name_en: 'Malaysia', callingCode: '+60', currency: 'MYR', currencyRate: 4.74 },
  { code: 'SG', name_ar: 'سنغافورة', name_en: 'Singapore', callingCode: '+65', currency: 'SGD', currencyRate: 1.35 },
  { code: 'PH', name_ar: 'الفلبين', name_en: 'Philippines', callingCode: '+63', currency: 'PHP', currencyRate: 58.2 },
  { code: 'KH', name_ar: 'كمبوديا', name_en: 'Cambodia', callingCode: '+855', currency: 'KHR', currencyRate: 4100 },
  { code: 'LA', name_ar: 'لاوس', name_en: 'Laos', callingCode: '+856', currency: 'LAK', currencyRate: 20800 },
  { code: 'MN', name_ar: 'منغوليا', name_en: 'Mongolia', callingCode: '+976', currency: 'MNT', currencyRate: 3450 },
  { code: 'KZ', name_ar: 'كازاخستان', name_en: 'Kazakhstan', callingCode: '+7', currency: 'KZT', currencyRate: 500 },
  { code: 'UZ', name_ar: 'أوزبكستان', name_en: 'Uzbekistan', callingCode: '+998', currency: 'UZS', currencyRate: 12400 },
  { code: 'KG', name_ar: 'قرغيزستان', name_en: 'Kyrgyzstan', callingCode: '+996', currency: 'KGS', currencyRate: 88 },
  { code: 'TJ', name_ar: 'طاجيكستان', name_en: 'Tajikistan', callingCode: '+992', currency: 'TJS', currencyRate: 10.8 },
  { code: 'TM', name_ar: 'تركمانستان', name_en: 'Turkmenistan', callingCode: '+993', currency: 'TMT', currencyRate: 3.5 },
  { code: 'AZ', name_ar: 'أذربيجان', name_en: 'Azerbaijan', callingCode: '+994', currency: 'AZN', currencyRate: 1.7 },
  { code: 'GE', name_ar: 'جورجيا', name_en: 'Georgia', callingCode: '+995', currency: 'GEL', currencyRate: 2.82 },
  { code: 'UA', name_ar: 'أوكرانيا', name_en: 'Ukraine', callingCode: '+380', currency: 'UAH', currencyRate: 41.5 },
  { code: 'MD', name_ar: 'مولدافيا', name_en: 'Moldova', callingCode: '+373', currency: 'MDL', currencyRate: 17.8 },
  { code: 'BY', name_ar: 'بيلاروسيا', name_en: 'Belarus', callingCode: '+375', currency: 'BYN', currencyRate: 3.2 },
  { code: 'AU', name_ar: 'أستراليا', name_en: 'Australia', callingCode: '+61', currency: 'AUD', currencyRate: 1.51 },
  { code: 'NZ', name_ar: 'نيوزيلندا', name_en: 'New Zealand', callingCode: '+64', currency: 'NZD', currencyRate: 1.61 },
  { code: 'FJ', name_ar: 'فيجي', name_en: 'Fiji', callingCode: '+679', currency: 'FJD', currencyRate: 2.27 },
  { code: 'PG', name_ar: 'بابوا غينيا الجديدة', name_en: 'Papua New Guinea', callingCode: '+675', currency: 'PGK', currencyRate: 3.8 },
  { code: 'TO', name_ar: 'تونغا', name_en: 'Tonga', callingCode: '+676', currency: 'TOP', currencyRate: 2.4 },
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

export function getCountryByCallingCode(callingCode) {
  if (!callingCode) return null;
  const normalized = String(callingCode).replace(/\s+/g, '').replace(/^\+/, '');
  return COUNTRIES.find((country) => String(country.callingCode || '').replace(/\s+/g, '').replace(/^\+/, '') === normalized) || null;
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

export function convertUsdToCurrency(usdAmount, currencyCode) {
  const numericUsdAmount = Number(usdAmount || 0);
  const currency = getCurrencyByCode(currencyCode);
  return numericUsdAmount * Number(currency?.rateToUsd || 1);
}

export function convertFromCurrencyToUsd(amount, currencyCode) {
  const numericAmount = Number(amount || 0);
  const currency = getCurrencyByCode(currencyCode);
  const rate = Number(currency?.rateToUsd || 1);
  return rate > 0 ? numericAmount / rate : 0;
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
