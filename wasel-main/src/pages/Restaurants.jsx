import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '../api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Search, SlidersHorizontal, MapPin, ArrowLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/components/common/LanguageContext';
import { createPageUrl } from '@/utils';
import SmartLottie from '@/components/animations/SmartLottie';
import { ANIMATION_PRESETS } from '@/components/animations/animationPresets';

const Restaurants = () => {
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => base44.entities.Restaurant.list(),
  });

  const cuisineTypes = useMemo(() => {
    const types = restaurants.map(r => r.cuisine_type).filter(Boolean);
    return ['all', ...new Set(types)];
  }, [restaurants]);

  const filteredAndSortedRestaurants = useMemo(() => {
    let filtered = restaurants.filter(r => r.available !== false);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        (r.name || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        (r.cuisine_type || '').toLowerCase().includes(q)
      );
    }

    if (cuisineFilter !== 'all') {
      filtered = filtered.filter(r => r.cuisine_type === cuisineFilter);
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '', language === 'ar' ? 'ar' : 'en');
      return 0;
    });
  }, [restaurants, searchQuery, cuisineFilter, sortBy, language]);

  return (
    <div className="min-h-screen bg-gray-50 font-['Cairo']">
      {/* Header */}
      <header className="bg-gradient-to-br from-green-600 to-teal-500 py-12 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h1 className="text-4xl font-bold mb-2">{t('restaurants')}</h1>
          <p className="text-lg opacity-90">{t('restaurants_subtitle')}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 -mt-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 sticky top-4 z-10">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_restaurant_placeholder')}
                className="pl-10"
              />
            </div>
            <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('cuisine_type')} />
              </SelectTrigger>
              <SelectContent>
                {cuisineTypes.map(type => (
                  <SelectItem key={type} value={type}>{type === 'all' ? t('all_types') : type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Restaurants Grid */}
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <SmartLottie
              animationPath={ANIMATION_PRESETS.pageLoading.path}
              width={80}
              height={80}
              trigger="never"
              autoplay={true}
              loop={true}
            />
            <p className="text-gray-600 mt-4">جاري تحميل المطاعم...</p>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredAndSortedRestaurants.map((restaurant, index) => (
              <motion.div
                key={restaurant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
              >
                <div className="relative h-48">
                  <img
                    src={restaurant.image_url || 'https://placehold.co/400x300/f0f0f0/333?text=Wasel'}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/90 px-2 py-1 rounded-full text-xs font-medium text-gray-800">
                    <MapPin className="w-3 h-3" />
                    {restaurant.location}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-800">{restaurant.name}</h3>
                    <Badge variant="secondary">{restaurant.cuisine_type}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 h-10 line-clamp-2">{restaurant.description}</p>
                  <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                    <Link to={createPageUrl('RestaurantDetail', { id: restaurant.id })}>
                      <UtensilsCrossed className="w-4 h-4 mr-2" />
                      {t('view_menu')}
                    </Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Restaurants;