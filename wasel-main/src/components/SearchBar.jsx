import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Loader2,
  TrendingUp,
  Clock,
  ArrowRight,
  Tag,
  Store,
  Gift,
  Package,
  UtensilsCrossed,
  ShoppingBag,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { sanitizeInput } from '@/lib/security';
import { trackSearchQuery } from '@/lib/recommendationSignals';

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;
const MAX_SUGGESTIONS = 10;
const MAX_RECENT_SEARCHES = 6;
const SEARCH_POOL_LIMIT = 70;
const SEARCH_CACHE_TTL_MS = 3 * 60 * 1000;

const TYPE_META = {
  restaurant: {
    icon: Store,
    ar: 'مطعم',
    en: 'Restaurant',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  menu_item: {
    icon: UtensilsCrossed,
    ar: 'وجبة',
    en: 'Menu Item',
    color: 'text-orange-700 bg-orange-50 border-orange-200',
  },
  product: {
    icon: ShoppingBag,
    ar: 'منتج',
    en: 'Product',
    color: 'text-sky-700 bg-sky-50 border-sky-200',
  },
  gift: {
    icon: Gift,
    ar: 'هدية',
    en: 'Gift',
    color: 'text-fuchsia-700 bg-fuchsia-50 border-fuchsia-200',
  },
  package: {
    icon: Package,
    ar: 'باقة',
    en: 'Package',
    color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  },
};

function getItemImage(item) {
  if (item.image_url && typeof item.image_url === 'string') return item.image_url;
  if (item.image && typeof item.image === 'string') return item.image;
  if (Array.isArray(item.images) && item.images.length > 0) {
    const first = item.images[0];
    if (typeof first === 'string') return first;
    if (first?.url) return first.url;
  }
  return '';
}

function normalizeSearchItem(raw, type) {
  const displayName = raw.name_ar || raw.name || raw.title_ar || raw.title || '';
  const subtitle = raw.description_ar || raw.description || raw.category || raw.cuisine_type || '';

  return {
    id: raw.id,
    type,
    displayName,
    subtitle,
    category: raw.category || '',
    image_url: getItemImage(raw),
    price_syp: raw.customer_price || raw.price || raw.price_syp || null,
  };
}

function normalizeForMatch(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u064B-\u0652\u0670]/g, '')
    .replace(/[\u0640]/g, '')
    .replace(/[\u0622\u0623\u0625]/g, '\u0627')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0649/g, '\u064A')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateMatchScore(item, queryNormalized) {
  if (!queryNormalized) return 0;

  const name = normalizeForMatch(item.displayName);
  const subtitle = normalizeForMatch(item.subtitle);
  const category = normalizeForMatch(item.category);

  if (!name && !subtitle && !category) return 0;

  let score = 0;

  if (name === queryNormalized) score += 240;
  if (name.startsWith(queryNormalized)) score += 160;
  if (name.includes(queryNormalized)) score += 120;
  if (subtitle.includes(queryNormalized)) score += 45;
  if (category.includes(queryNormalized)) score += 30;

  const queryTokens = queryNormalized.split(' ').filter(Boolean);
  for (const token of queryTokens) {
    if (token.length < 2) continue;
    if (name.startsWith(token)) score += 25;
    else if (name.includes(token)) score += 15;
    if (subtitle.includes(token)) score += 7;
  }

  return score;
}

function SearchResultItem({ item, language, dir, onSelect }) {
  const meta = TYPE_META[item.type] || TYPE_META.product;
  const ItemIcon = meta.icon;
  const typeLabel = language === 'ar' ? meta.ar : meta.en;

  return (
    <motion.button
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1F7A63]/5 transition-colors"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ x: dir === 'rtl' ? -2 : 2 }}
    >
      <div className="w-11 h-11 rounded-xl bg-[#F9FAF8] border border-[#E5E7EB] flex items-center justify-center shrink-0 overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt=""
            className="w-full h-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <ItemIcon className="w-5 h-5 text-[#1F7A63]" />
        )}
      </div>

      <div className={`flex-1 min-w-0 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[#1F2933] truncate">{item.displayName}</p>
          <span className={`px-2 py-0.5 text-[10px] border rounded-full font-semibold ${meta.color}`}>
            {typeLabel}
          </span>
        </div>
        {item.subtitle && <p className="text-xs text-[#1F2933]/60 truncate mt-1">{item.subtitle}</p>}
        {typeof item.price_syp === 'number' && item.price_syp > 0 && (
          <p className="text-xs text-[#1F7A63] font-semibold mt-1">{item.price_syp.toLocaleString('en-US')} ل.س</p>
        )}
      </div>

      <ArrowRight className={`w-4 h-4 text-[#1F2933]/30 shrink-0 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
    </motion.button>
  );
}

function SectionHeader({ title, icon: Icon, onClear, language }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#F9FAF8] border-b border-[#E5E7EB]">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-[#1F7A63]" />
        <span className="text-xs font-semibold text-[#1F2933]/70">{title}</span>
      </div>
      {onClear && (
        <button onClick={onClear} className="text-xs text-[#1F7A63] hover:underline">
          {language === 'ar' ? 'مسح الكل' : 'Clear'}
        </button>
      )}
    </div>
  );
}

export default function SearchBar({
  placeholder,
  variant = 'default',
  onSearch,
  autoFocus = false,
  language = 'ar',
  dir = 'rtl',
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);

  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const searchPoolCacheRef = useRef({ at: 0, items: [] });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('wasel_recent_searches');
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentSearches(parsed.slice(0, MAX_RECENT_SEARCHES));
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  }, []);

  useEffect(() => {
    setTrendingSearches(
      language === 'ar'
        ? [
            { query: 'باقات هدايا' },
            { query: 'عطور نسائية' },
            { query: 'بوكيه ورد' },
            { query: 'سوبرماركت' },
          ]
        : [
            { query: 'Gift packages' },
            { query: 'Perfumes' },
            { query: 'Flower bouquet' },
            { query: 'Supermarket' },
          ]
    );
  }, [language]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const fetchSearchPool = useCallback(async () => {
    const now = Date.now();
    const cached = searchPoolCacheRef.current;
    if (cached.items.length > 0 && (now - cached.at) < SEARCH_CACHE_TTL_MS) {
      return cached.items;
    }

    const [menuRes, productRes, restaurantRes, giftRes, packageRes] = await Promise.allSettled([
      base44.entities.MenuItem.list({ limit: SEARCH_POOL_LIMIT, sort: { created_date: -1 } }),
      base44.entities.Product.list({ limit: SEARCH_POOL_LIMIT, sort: { created_date: -1 } }),
      base44.entities.Restaurant.list({ limit: Math.round(SEARCH_POOL_LIMIT / 2), sort: { created_date: -1 } }),
      base44.entities.Gift.list({ limit: Math.round(SEARCH_POOL_LIMIT / 2), sort: { created_date: -1 } }),
      base44.entities.Package.list({ limit: Math.round(SEARCH_POOL_LIMIT / 2), sort: { created_date: -1 } }),
    ]);

    const pool = [];

    if (menuRes.status === 'fulfilled') {
      pool.push(...(menuRes.value || []).map((item) => normalizeSearchItem(item, 'menu_item')));
    }
    if (productRes.status === 'fulfilled') {
      pool.push(...(productRes.value || []).map((item) => normalizeSearchItem(item, 'product')));
    }
    if (restaurantRes.status === 'fulfilled') {
      pool.push(...(restaurantRes.value || []).map((item) => normalizeSearchItem(item, 'restaurant')));
    }
    if (giftRes.status === 'fulfilled') {
      pool.push(...(giftRes.value || []).map((item) => normalizeSearchItem(item, 'gift')));
    }
    if (packageRes.status === 'fulfilled') {
      pool.push(...(packageRes.value || []).map((item) => normalizeSearchItem(item, 'package')));
    }

    searchPoolCacheRef.current = {
      at: now,
      items: pool,
    };

    return pool;
  }, []);

  const performSearch = useCallback(async (searchQuery) => {
    const sanitized = sanitizeInput(searchQuery, MAX_QUERY_LENGTH);
    if (sanitized.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      const queryNormalized = normalizeForMatch(sanitized);
      const [results, searchPool] = await Promise.all([
        Promise.allSettled([
          base44.entities.MenuItem.list({ limit: 8, search: sanitized }),
          base44.entities.Product.list({ limit: 8, search: sanitized }),
          base44.entities.Restaurant.list({ limit: 6, search: sanitized }),
          base44.entities.Gift.list({ limit: 6, search: sanitized }),
          base44.entities.Package.list({ limit: 6, search: sanitized }),
        ]),
        fetchSearchPool(),
      ]);

      const directMatches = [];

      if (results[0].status === 'fulfilled') {
        directMatches.push(...(results[0].value || []).map((item) => normalizeSearchItem(item, 'menu_item')));
      }
      if (results[1].status === 'fulfilled') {
        directMatches.push(...(results[1].value || []).map((item) => normalizeSearchItem(item, 'product')));
      }
      if (results[2].status === 'fulfilled') {
        directMatches.push(...(results[2].value || []).map((item) => normalizeSearchItem(item, 'restaurant')));
      }
      if (results[3].status === 'fulfilled') {
        directMatches.push(...(results[3].value || []).map((item) => normalizeSearchItem(item, 'gift')));
      }
      if (results[4].status === 'fulfilled') {
        directMatches.push(...(results[4].value || []).map((item) => normalizeSearchItem(item, 'package')));
      }

      const rankedDirect = directMatches
        .filter((item) => item.displayName)
        .map((item) => ({
          ...item,
          _score: calculateMatchScore(item, queryNormalized) + 120,
        }));

      const rankedPool = (searchPool || [])
        .filter((item) => item.displayName)
        .map((item) => ({
          ...item,
          _score: calculateMatchScore(item, queryNormalized),
        }))
        .filter((item) => item._score > 0);

      const mergedByKey = new Map();
      [...rankedDirect, ...rankedPool].forEach((item) => {
        const key = `${item.type}-${item.id}`;
        const existing = mergedByKey.get(key);
        if (!existing || (item._score || 0) > (existing._score || 0)) {
          mergedByKey.set(key, item);
        }
      });

      const filtered = Array.from(mergedByKey.values())
        .sort((a, b) => (b._score || 0) - (a._score || 0))
        .slice(0, MAX_SUGGESTIONS)
        .map(({ _score, ...item }) => item);

      setSuggestions(filtered);
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchSearchPool]);

  const handleInputChange = (event) => {
    const value = event.target.value;
    setQuery(value);
    setIsOpen(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, DEBOUNCE_MS);
  };

  const saveToRecent = (searchQuery) => {
    try {
      const existing = recentSearches.filter((item) => item.query !== searchQuery);
      const updated = [{ query: searchQuery, timestamp: Date.now() }, ...existing].slice(0, MAX_RECENT_SEARCHES);
      setRecentSearches(updated);
      localStorage.setItem('wasel_recent_searches', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('wasel_recent_searches');
  };

  const navigateToItem = (item) => {
    if (item.type === 'restaurant') {
      navigate(createPageUrl('Restaurants', { search: item.displayName }));
      return;
    }

    if (item.type === 'gift') {
      navigate(createPageUrl('Gifts', { search: item.displayName }));
      return;
    }

    if (item.type === 'package') {
      navigate(createPageUrl('Packages', { search: item.displayName }));
      return;
    }

    if (item.type === 'product') {
      const category = String(item.category || '').toLowerCase();
      if (category.includes('electronic')) {
        navigate(createPageUrl('Electronics', { search: item.displayName }));
        return;
      }
      if (category.includes('supermarket') || category.includes('market')) {
        navigate(createPageUrl('Supermarket', { search: item.displayName }));
        return;
      }
      if (category.includes('sweet') || category.includes('dessert')) {
        navigate(createPageUrl('Sweets', { search: item.displayName }));
        return;
      }
      navigate(createPageUrl('Home', { search: item.displayName }));
      return;
    }

    navigate(createPageUrl('Restaurants', { search: item.displayName }));
  };

  const handleSelect = (item, type) => {
    const selectedQuery = item.query || item.displayName;
    if (selectedQuery) {
      setQuery(selectedQuery);
      saveToRecent(selectedQuery);
      trackSearchQuery(selectedQuery, { selectedType: item?.type || type });
    }

    if (type === 'result') {
      navigateToItem(item);
    } else if (onSearch) {
      onSearch(selectedQuery);
    } else {
      navigate(createPageUrl('Home', { search: selectedQuery }));
    }

    setIsOpen(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const sanitized = sanitizeInput(query, MAX_QUERY_LENGTH);

    if (sanitized.length >= MIN_QUERY_LENGTH) {
      saveToRecent(sanitized);
      trackSearchQuery(sanitized, { selectedType: 'submit' });
      if (onSearch) {
        onSearch(sanitized);
      } else {
        navigate(createPageUrl('Home', { search: sanitized }));
      }
      setIsOpen(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'hero':
        return {
          container: 'w-full max-w-2xl mx-auto',
          input: 'w-full bg-white border-2 border-[#E5E7EB] rounded-2xl px-5 py-4 text-base shadow-lg focus:border-[#1F7A63] focus:ring-4 focus:ring-[#1F7A63]/10',
          icon: `${dir === 'rtl' ? 'right-4' : 'left-4'} w-6 h-6`,
          clear: dir === 'rtl' ? 'left-3' : 'right-3',
        };
      case 'minimal':
        return {
          container: 'w-full max-w-xs',
          input: 'w-full bg-[#F9FAF8] border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:border-[#1F7A63] focus:ring-2 focus:ring-[#1F7A63]/10',
          icon: `${dir === 'rtl' ? 'right-2.5' : 'left-2.5'} w-4 h-4`,
          clear: dir === 'rtl' ? 'left-2.5' : 'right-2.5',
        };
      case 'header':
        return {
          container: 'w-full',
          input: 'w-full bg-[#F9FAF8] border border-[#E5E7EB] rounded-lg py-2.5 text-sm focus:ring-2 focus:ring-[#1F7A63] focus:border-[#1F7A63]',
          icon: `${dir === 'rtl' ? 'right-3' : 'left-3'} w-4 h-4`,
          clear: dir === 'rtl' ? 'left-3' : 'right-3',
        };
      default:
        return {
          container: 'w-full max-w-md',
          input: 'w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm shadow-sm focus:border-[#1F7A63] focus:ring-2 focus:ring-[#1F7A63]/20',
          icon: `${dir === 'rtl' ? 'right-3.5' : 'left-3.5'} w-5 h-5`,
          clear: dir === 'rtl' ? 'left-3' : 'right-3',
        };
    }
  };

  const styles = getVariantStyles();
  const inputPadding = dir === 'rtl' ? 'pr-10 pl-10' : 'pl-10 pr-10';
  const showDropdown = isOpen && (query.length >= MIN_QUERY_LENGTH || recentSearches.length > 0 || trendingSearches.length > 0);

  const text = {
    results: language === 'ar' ? 'نتائج البحث' : 'Search results',
    recent: language === 'ar' ? 'بحث سابق' : 'Recent searches',
    trending: language === 'ar' ? 'الأكثر بحثا' : 'Trending',
    noResults: language === 'ar' ? `لا توجد نتائج لـ "${query}"` : `No results for "${query}"`,
    viewAll: language === 'ar' ? 'عرض كل النتائج' : 'View all results',
  };

  return (
    <div ref={containerRef} className={`relative ${styles.container}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder || (language === 'ar' ? 'ابحث عن المنتجات...' : 'Search products...')}
            maxLength={MAX_QUERY_LENGTH}
            autoFocus={autoFocus}
            className={`${styles.input} ${inputPadding} text-[#1F2933] placeholder:text-[#1F2933]/40 transition-all outline-none`}
            dir={dir}
          />

          <div className={`absolute top-1/2 -translate-y-1/2 ${styles.icon} text-[#1F2933]/40`}>
            {isLoading ? <Loader2 className="w-full h-full animate-spin" /> : <Search className="w-full h-full" />}
          </div>

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                inputRef.current?.focus();
              }}
              className={`absolute ${styles.clear} top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#E5E7EB] flex items-center justify-center hover:bg-[#1F7A63]/20 transition-colors`}
            >
              <X className="w-3 h-3 text-[#1F2933]" />
            </button>
          )}
        </div>
      </form>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E5E7EB] rounded-xl shadow-xl overflow-hidden z-50"
          >
            {query.length >= MIN_QUERY_LENGTH && suggestions.length > 0 && (
              <div>
                <SectionHeader title={text.results} icon={Search} language={language} />
                {suggestions.map((item) => (
                  <SearchResultItem
                    key={`${item.type}-${item.id}`}
                    item={item}
                    language={language}
                    dir={dir}
                    onSelect={() => handleSelect(item, 'result')}
                  />
                ))}
              </div>
            )}

            {query.length >= MIN_QUERY_LENGTH && suggestions.length === 0 && !isLoading && (
              <div className="px-4 py-6 text-center text-sm text-[#1F2933]/50">{text.noResults}</div>
            )}

            {query.length < MIN_QUERY_LENGTH && recentSearches.length > 0 && (
              <div>
                <SectionHeader title={text.recent} icon={Clock} onClear={clearRecentSearches} language={language} />
                {recentSearches.map((item, index) => (
                  <SearchResultItem
                    key={`recent-${index}`}
                    item={{
                      id: item.query,
                      type: 'product',
                      displayName: item.query,
                      subtitle: language === 'ar' ? 'بحث سابق' : 'Recent search',
                    }}
                    language={language}
                    dir={dir}
                    onSelect={() => handleSelect({ query: item.query }, 'recent')}
                  />
                ))}
              </div>
            )}

            {query.length < MIN_QUERY_LENGTH && trendingSearches.length > 0 && (
              <div>
                <SectionHeader title={text.trending} icon={TrendingUp} language={language} />
                {trendingSearches.map((item, index) => (
                  <SearchResultItem
                    key={`trend-${index}`}
                    item={{
                      id: item.query,
                      type: 'product',
                      displayName: item.query,
                      subtitle: language === 'ar' ? 'اقتراح شائع' : 'Popular suggestion',
                    }}
                    language={language}
                    dir={dir}
                    onSelect={() => handleSelect({ query: item.query }, 'trending')}
                  />
                ))}
              </div>
            )}

            {query.length >= MIN_QUERY_LENGTH && suggestions.length > 0 && (
              <button
                onClick={handleSubmit}
                className="w-full px-4 py-3 bg-[#F9FAF8] border-t border-[#E5E7EB] text-sm text-[#1F7A63] font-medium hover:bg-[#1F7A63]/5 transition-colors flex items-center justify-center gap-2"
              >
                <Tag className="w-4 h-4" />
                {text.viewAll}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CompactSearch({ onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="w-10 h-10 rounded-full bg-[#F9FAF8] border border-[#E5E7EB] flex items-center justify-center hover:bg-[#1F7A63]/10 hover:border-[#1F7A63] transition-colors"
    >
      <Search className="w-5 h-5 text-[#1F2933]" />
    </button>
  );
}
