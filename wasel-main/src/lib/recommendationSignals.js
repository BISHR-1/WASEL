const SEARCH_KEY = 'wasel_behavior_searches_v1';
const PAGE_VISITS_KEY = 'wasel_behavior_page_visits_v1';
const PAGE_DWELL_KEY = 'wasel_behavior_page_dwell_ms_v1';
const PURCHASE_KEY = 'wasel_behavior_purchases_v1';
const FAVORITES_KEY = 'wasel_favorites';
const MAX_SEARCH_ENTRIES = 60;

function safeParseObject(value, fallback = {}) {
  try {
    const parsed = JSON.parse(value || '{}');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  } catch (error) {
    console.error('Failed to parse behavior signals object:', error);
  }
  return fallback;
}

function safeParseArray(value, fallback = []) {
  try {
    const parsed = JSON.parse(value || '[]');
    if (Array.isArray(parsed)) return parsed;
  } catch (error) {
    console.error('Failed to parse behavior signals array:', error);
  }
  return fallback;
}

function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to persist behavior signals:', error);
  }
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function pageToCategory(pageName) {
  const page = normalizeText(pageName);
  if (!page) return 'other';
  if (page.includes('restaurant')) return 'restaurant';
  if (page.includes('sweet')) return 'sweets';
  if (page.includes('market') || page.includes('supermarket')) return 'supermarket';
  if (page.includes('electronic')) return 'electronics';
  if (page.includes('gift')) return 'gift';
  if (page.includes('package')) return 'package';
  if (page.includes('cart')) return 'cart';
  if (page.includes('home')) return 'home';
  return 'other';
}

function queryToCategory(query) {
  const text = normalizeText(query);
  if (!text) return 'other';

  if (
    text.includes('gift') ||
    text.includes('هد')
  ) return 'gift';

  if (
    text.includes('package') ||
    text.includes('باقة')
  ) return 'package';

  if (
    text.includes('restaurant') ||
    text.includes('menu') ||
    text.includes('food') ||
    text.includes('مطعم') ||
    text.includes('وجبة')
  ) return 'restaurant';

  if (
    text.includes('sweet') ||
    text.includes('dessert') ||
    text.includes('حلويات')
  ) return 'sweets';

  if (
    text.includes('supermarket') ||
    text.includes('market') ||
    text.includes('grocery') ||
    text.includes('ماركت') ||
    text.includes('سوبر')
  ) return 'supermarket';

  if (
    text.includes('electronic') ||
    text.includes('phone') ||
    text.includes('laptop') ||
    text.includes('الكترون')
  ) return 'electronics';

  return 'other';
}

function getSearchEntries() {
  if (typeof window === 'undefined') return [];
  return safeParseArray(localStorage.getItem(SEARCH_KEY), []);
}

function getPageVisits() {
  if (typeof window === 'undefined') return {};
  return safeParseObject(localStorage.getItem(PAGE_VISITS_KEY), {});
}

function getPageDwell() {
  if (typeof window === 'undefined') return {};
  return safeParseObject(localStorage.getItem(PAGE_DWELL_KEY), {});
}

export function trackSearchQuery(query, metadata = {}) {
  if (typeof window === 'undefined') return;
  const normalized = normalizeText(query);
  if (!normalized || normalized.length < 2) return;

  const entries = getSearchEntries();
  entries.unshift({
    query: normalized,
    category: metadata.category || queryToCategory(normalized),
    selectedType: metadata.selectedType || null,
    timestamp: Date.now(),
  });

  safeSetItem(SEARCH_KEY, entries.slice(0, MAX_SEARCH_ENTRIES));
}

export function trackPageVisit(pageName) {
  if (typeof window === 'undefined') return;
  const category = pageToCategory(pageName);
  const visits = getPageVisits();
  visits[category] = Number(visits[category] || 0) + 1;
  safeSetItem(PAGE_VISITS_KEY, visits);
}

export function trackPageDwell(pageName, durationMs) {
  if (typeof window === 'undefined') return;
  const duration = Number(durationMs || 0);
  if (!Number.isFinite(duration) || duration <= 0) return;

  const category = pageToCategory(pageName);
  const dwell = getPageDwell();
  dwell[category] = Number(dwell[category] || 0) + duration;
  safeSetItem(PAGE_DWELL_KEY, dwell);
}

export function trackPurchase(items = []) {
  if (typeof window === 'undefined') return;
  const purchases = safeParseObject(localStorage.getItem(PURCHASE_KEY), {});
  (items || []).forEach((item) => {
    const category = inferItemCategory(item);
    purchases[category] = Number(purchases[category] || 0) + Number(item?.quantity || 1);
  });
  safeSetItem(PURCHASE_KEY, purchases);
}

function getFavoritesAffinity() {
  if (typeof window === 'undefined') return {};
  const favs = safeParseArray(localStorage.getItem(FAVORITES_KEY), []);
  const score = {};
  favs.forEach((fav) => {
    const category = inferItemCategory(fav);
    score[category] = Number(score[category] || 0) + 3;
  });
  return score;
}

export function getBehaviorAffinity() {
  const searches = getSearchEntries();
  const visits = getPageVisits();
  const dwell = getPageDwell();
  const purchases = safeParseObject(localStorage.getItem(PURCHASE_KEY), {});
  const favAffinity = getFavoritesAffinity();

  const score = {};

  // Search scoring: newest queries get higher weight
  searches.forEach((entry, index) => {
    const weight = Math.max(1, 8 - Math.floor(index / 6));
    const category = entry?.category || queryToCategory(entry?.query);
    score[category] = Number(score[category] || 0) + weight;
  });

  // Page visit scoring: 2x weight
  Object.entries(visits).forEach(([category, count]) => {
    score[category] = Number(score[category] || 0) + Number(count || 0) * 2;
  });

  // Dwell time scoring: minutes capped at 12 per category
  Object.entries(dwell).forEach(([category, totalMs]) => {
    const minutes = Number(totalMs || 0) / 60000;
    score[category] = Number(score[category] || 0) + Math.min(12, minutes);
  });

  // Purchase history: strong signal (5x per item bought)
  Object.entries(purchases).forEach(([category, count]) => {
    score[category] = Number(score[category] || 0) + Math.min(40, Number(count || 0) * 5);
  });

  // Favorites signal
  Object.entries(favAffinity).forEach(([category, pts]) => {
    score[category] = Number(score[category] || 0) + Number(pts || 0);
  });

  return score;
}

export function inferItemCategory(item) {
  const itemType = normalizeText(item?.item_type || item?.type || item?.source_type);
  const category = normalizeText(item?.category);

  if (itemType.includes('gift') || category.includes('gift') || category.includes('هد')) return 'gift';
  if (itemType.includes('package') || category.includes('package') || category.includes('باقة')) return 'package';
  if (itemType.includes('menu') || itemType.includes('restaurant') || category.includes('restaurant') || category.includes('food') || category.includes('مطعم')) return 'restaurant';
  if (category.includes('supermarket') || category.includes('market') || category.includes('grocery') || category.includes('سوبر')) return 'supermarket';
  if (category.includes('electronic') || category.includes('الكترون')) return 'electronics';
  if (category.includes('sweet') || category.includes('dessert') || category.includes('حلويات')) return 'sweets';

  return 'other';
}

export function scoreItemsByBehavior(items = [], options = {}) {
  const affinity = getBehaviorAffinity();
  const now = Date.now();
  const { cartCategories = [] } = options;

  return (items || [])
    .map((item, index) => {
      const category = inferItemCategory(item);
      const behaviorScore = Number(affinity[category] || 0);

      // Freshness: newer items get a boost that decays over 28 days
      const freshnessRaw = Date.parse(item?.updated_date || item?.created_date || '');
      const ageDays = Number.isFinite(freshnessRaw) ? Math.max(0, (now - freshnessRaw) / 86400000) : 30;
      const freshnessBoost = Math.max(0, 4 - Math.min(4, ageDays / 7));

      // Popularity: items with order_count or popularity fields
      const popularity = Number(item?.order_count || item?.popularity || item?.sales_count || 0);
      const popularityBoost = Math.min(6, Math.log2(popularity + 1) * 2);

      // Rating boost
      const rating = Number(item?.rating || item?.avg_rating || 0);
      const ratingBoost = rating >= 4 ? (rating - 3) * 1.5 : 0;

      // Cross-sell: boost items NOT in current cart categories for diversity
      const crossSellBoost = cartCategories.length > 0 && !cartCategories.includes(category) ? 2 : 0;

      const randomTieBreaker = (index % 5) * 0.05;
      const score = behaviorScore * 3 + freshnessBoost + popularityBoost + ratingBoost + crossSellBoost + randomTieBreaker;

      return {
        ...item,
        __behaviorCategory: category,
        __recommendationScore: score,
      };
    })
    .sort((a, b) => (b.__recommendationScore || 0) - (a.__recommendationScore || 0));
}

export function interleaveByCategory(items = [], limit = 8) {
  const buckets = {};
  (items || []).forEach((item) => {
    const category = item.__behaviorCategory || inferItemCategory(item);
    if (!buckets[category]) buckets[category] = [];
    buckets[category].push(item);
  });

  const categoriesByWeight = Object.entries(buckets)
    .map(([category, bucket]) => {
      const avgScore = bucket.reduce((sum, item) => sum + Number(item.__recommendationScore || 0), 0) / Math.max(bucket.length, 1);
      return { category, avgScore };
    })
    .sort((a, b) => b.avgScore - a.avgScore)
    .map((entry) => entry.category);

  const result = [];
  let cursor = 0;

  while (result.length < limit) {
    let pushedInRound = false;

    for (let i = 0; i < categoriesByWeight.length; i += 1) {
      const category = categoriesByWeight[(cursor + i) % categoriesByWeight.length];
      const bucket = buckets[category];
      if (bucket && bucket.length > 0) {
        result.push(bucket.shift());
        pushedInRound = true;
        if (result.length >= limit) break;
      }
    }

    if (!pushedInRound) break;
    cursor += 1;
  }

  return result;
}
