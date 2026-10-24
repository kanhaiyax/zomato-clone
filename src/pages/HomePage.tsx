import React, { useState, useEffect } from 'react';
import { Search, Star, Clock, Sparkles, Filter, ChevronRight, Percent, Utensils, Award } from 'lucide-react';
import { Restaurant, Coupon } from '../types/index.js';
import { api } from '../services/api.js';
import { useLocation } from '../context/LocationContext.js';

interface HomePageProps {
  onSelectRestaurant: (restaurantId: string) => void;
  onNavigateToOffers?: () => void;
}

const CUISINES = [
  { name: 'All', icon: Utensils },
  { name: 'Biryani', icon: Sparkles },
  { name: 'Pizza', icon: Sparkles },
  { name: 'Burgers', icon: Sparkles },
  { name: 'North Indian', icon: Sparkles },
  { name: 'Asian', icon: Sparkles },
  { name: 'Healthy', icon: Sparkles },
  { name: 'Desserts', icon: Sparkles },
];

export const HomePage: React.FC<HomePageProps> = ({ onSelectRestaurant }) => {
  const { currentLocation } = useLocation();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [minRating, setMinRating] = useState<number>(0);
  const [pureVegOnly, setPureVegOnly] = useState(false);
  const [maxDeliveryTime, setMaxDeliveryTime] = useState<number>(120);
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'deliveryTime' | 'priceLow' | 'priceHigh'>('popularity');

  useEffect(() => {
    fetchRestaurants();
    fetchCoupons();
  }, [searchQuery, selectedCuisine, minRating, pureVegOnly, maxDeliveryTime, sortBy, currentLocation]);

  const fetchRestaurants = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedCuisine !== 'All') params.append('cuisine', selectedCuisine);
      if (minRating > 0) params.append('rating', minRating.toString());
      if (pureVegOnly) params.append('pureVeg', 'true');
      if (maxDeliveryTime < 120) params.append('maxDeliveryTime', maxDeliveryTime.toString());
      params.append('sort', sortBy);

      const res = await api.get<{ success: boolean; restaurants: Restaurant[] }>(
        `/api/restaurants?${params.toString()}`
      );
      if (res.success) {
        setRestaurants(res.restaurants);
      }
    } catch (err) {
      console.error('Failed to load restaurants:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await api.get<{ success: boolean; coupons: Coupon[] }>('/api/coupons');
      if (res.success) {
        setCoupons(res.coupons);
      }
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white overflow-hidden py-16 md:py-24">
        {/* Measured Hero Photography Scrim */}
        <div className="absolute inset-0 z-0 opacity-30 mix-blend-overlay pointer-events-none">
          <img
            src="/src/assets/images/hero_food_spread_1792857444168.jpg"
            alt="Zomato Feast"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black italic tracking-tight text-white mb-4">
            zomato
          </h1>
          <p className="text-lg sm:text-xl font-medium text-slate-300 max-w-2xl mx-auto mb-8 text-balance">
            Discover the best food &amp; drinks in <span className="text-white font-bold">{currentLocation.name}, {currentLocation.city}</span>
          </p>

          {/* Search Bar Container */}
          <div className="max-w-2xl mx-auto bg-white rounded-2xl p-2 shadow-2xl flex flex-col sm:flex-row items-center gap-2 border border-slate-200">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search for restaurant, cuisine, or a dish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                Clear
              </button>
            )}
            <button
              onClick={fetchRestaurants}
              className="w-full sm:w-auto px-6 py-3 bg-[#E23744] hover:bg-[#d02c38] text-white text-sm font-bold rounded-xl transition-colors shadow-xs"
            >
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Promotional Offers Strip */}
        {coupons.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-[#E23744]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Featured Offers &amp; Promo Codes
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {coupons.slice(0, 3).map((cpn) => (
                <div
                  key={cpn.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:shadow-sm transition-all flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-red-50 text-[#E23744] font-black text-xs tracking-wider font-mono">
                      {cpn.code}
                    </span>
                    <p className="text-xs font-semibold text-slate-900 mt-1 line-clamp-1">
                      {cpn.discountType === 'percentage'
                        ? `${cpn.discountValue}% OFF up to ₹${cpn.maximumDiscount}`
                        : `Flat ₹${cpn.discountValue} OFF`}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      On orders above ₹{cpn.minimumOrderValue}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cuisines Segmented Bar */}
        <div className="mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CUISINES.map((c) => {
              const active = selectedCuisine === c.name;
              return (
                <button
                  key={c.name}
                  onClick={() => setSelectedCuisine(c.name)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                    active
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs font-bold text-slate-400 mr-2 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            {/* Pure Veg Switch */}
            <button
              onClick={() => setPureVegOnly(!pureVegOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                pureVegOnly
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-600"></div>
              <span>Pure Veg</span>
            </button>

            {/* Rating 4.0+ */}
            <button
              onClick={() => setMinRating(minRating === 4.0 ? 0 : 4.0)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                minRating === 4.0
                  ? 'bg-amber-50 border-amber-500 text-amber-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Rating 4.0+</span>
            </button>

            {/* Fast Delivery (< 30m) */}
            <button
              onClick={() => setMaxDeliveryTime(maxDeliveryTime === 30 ? 120 : 30)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                maxDeliveryTime === 30
                  ? 'bg-red-50 border-red-500 text-red-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-red-500" />
              <span>Fast Delivery (&lt;30m)</span>
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="popularity">Popularity / Featured</option>
              <option value="rating">Rating: High to Low</option>
              <option value="deliveryTime">Delivery Time</option>
              <option value="priceLow">Cost: Low to High</option>
              <option value="priceHigh">Cost: High to Low</option>
            </select>
          </div>
        </div>

        {/* Section Heading */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Best Food Delivery Restaurants in {currentLocation.name}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Showing {restaurants.length} verified dining establishments
            </p>
          </div>
        </div>

        {/* Restaurant Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-200 p-3 space-y-3 animate-pulse">
                <div className="w-full h-48 bg-slate-200 rounded-xl"></div>
                <div className="h-5 bg-slate-200 rounded-md w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded-md w-1/2"></div>
              </div>
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto my-12">
            <div className="w-16 h-16 rounded-full bg-red-50 text-[#E23744] flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No restaurants match your filters</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Try resetting your filters or search keywords to see more options in {currentLocation.name}.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCuisine('All');
                setMinRating(0);
                setPureVegOnly(false);
                setMaxDeliveryTime(120);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-[#E23744] rounded-xl hover:bg-[#d02c38] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                onClick={() => onSelectRestaurant(restaurant.id)}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col"
              >
                {/* Image Container with Delivery Time Tag */}
                <div className="relative h-52 bg-slate-100 overflow-hidden">
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Fallback gradient if image fails
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />

                  {/* Delivery time chip */}
                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg text-xs font-bold text-slate-800 flex items-center gap-1 shadow-sm tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{restaurant.deliveryTimeMin}-{restaurant.deliveryTimeMax} min</span>
                  </div>

                  {restaurant.isFeatured && (
                    <div className="absolute top-3 left-3 bg-[#E23744] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                      <Award className="w-3 h-3" />
                      <span>Promoted</span>
                    </div>
                  )}

                  {restaurant.pureVeg && (
                    <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                      PURE VEG
                    </div>
                  )}
                </div>

                {/* Details Section (Zero-Pill formatting) */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-[#E23744] transition-colors line-clamp-1">
                        {restaurant.name}
                      </h3>
                      {/* Rating Box */}
                      <div className="flex items-center gap-1 bg-emerald-600 text-white px-2 py-0.5 rounded-md text-xs font-bold tabular-nums shrink-0">
                        <span>{restaurant.averageRating.toFixed(1)}</span>
                        <Star className="w-3 h-3 fill-white" />
                      </div>
                    </div>

                    {/* Unboxed Metadata with · separator */}
                    <p className="text-xs text-slate-500 line-clamp-1 mb-2">
                      {restaurant.cuisines.join(', ')}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="truncate max-w-[150px]">{restaurant.location.area}</span>
                    <span className="font-semibold text-slate-700 tabular-nums">
                      ₹{restaurant.priceForTwo} for two
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
