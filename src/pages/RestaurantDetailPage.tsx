import React, { useState, useEffect } from 'react';
import { Star, Clock, MapPin, Search, ArrowLeft, Plus, Minus, Check, MessageSquarePlus } from 'lucide-react';
import { Restaurant, MenuItem, Review } from '../types/index.js';
import { api } from '../services/api.js';
import { useCart } from '../context/CartContext.js';
import { useAuth } from '../context/AuthContext.js';
import { ReviewModal } from '../components/ReviewModal.js';

interface RestaurantDetailPageProps {
  restaurantId: string;
  onBack: () => void;
  onNavigateToCheckout: () => void;
}

export const RestaurantDetailPage: React.FC<RestaurantDetailPageProps> = ({
  restaurantId,
  onBack,
  onNavigateToCheckout,
}) => {
  const { cartItems, addItem, updateQuantity, openCart, finalTotal } = useCart();
  const { user, openAuthModal } = useAuth();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [groupedMenu, setGroupedMenu] = useState<{ [category: string]: MenuItem[] }>({});
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters within menu
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [vegOnly, setVegOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'reviews'>('menu');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    fetchRestaurantData();
  }, [restaurantId]);

  const fetchRestaurantData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{
        success: boolean;
        restaurant: Restaurant;
        menu: MenuItem[];
        groupedMenu: { [category: string]: MenuItem[] };
        reviews: Review[];
      }>(`/api/restaurants/${restaurantId}`);

      if (res.success) {
        setRestaurant(res.restaurant);
        setMenu(res.menu || []);
        setGroupedMenu(res.groupedMenu || {});
        setReviews(res.reviews || []);
      }
    } catch (e) {
      console.error('Failed to load restaurant details:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = ['All', ...Object.keys(groupedMenu)];

  const filteredMenuItems = menu.filter((item) => {
    if (activeCategory !== 'All' && item.category !== activeCategory) return false;
    if (vegOnly && !item.isVegetarian) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getItemQuantityInCart = (itemId: string) => {
    const found = cartItems.find((i) => i.menuItemId === itemId);
    return found ? found.quantity : 0;
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-64 bg-slate-200 rounded-3xl"></div>
        <div className="h-10 bg-slate-200 rounded-xl w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <h3 className="text-lg font-bold text-slate-800">Restaurant Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">The restaurant you requested could not be located.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#E23744] text-white rounded-xl text-xs font-bold"
        >
          Back to Listings
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Top Breadcrumb & Back */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Restaurants</span>
        </button>
      </div>

      {/* Restaurant Header Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
          
          {/* Banner Photo */}
          <div className="h-56 sm:h-72 w-full relative bg-slate-900">
            <img
              src={restaurant.bannerImage || restaurant.image}
              alt={restaurant.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                  {restaurant.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-xl">
                  {restaurant.description}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-300">
                  <span>{restaurant.cuisines.join(', ')}</span>
                  <span>·</span>
                  <span>{restaurant.location.area}, {restaurant.location.city}</span>
                </div>
              </div>

              {/* Rating Card */}
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 text-slate-900 flex items-center gap-3 shrink-0 self-start sm:self-end shadow-lg">
                <div className="bg-emerald-600 text-white px-2.5 py-1 rounded-xl text-sm font-black flex items-center gap-1 tabular-nums">
                  <span>{restaurant.averageRating.toFixed(1)}</span>
                  <Star className="w-3.5 h-3.5 fill-white" />
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight tabular-nums">
                    {restaurant.totalRatings.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">Delivery Reviews</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>
                  <strong className="text-slate-800">{restaurant.deliveryTimeMin}-{restaurant.deliveryTimeMax} mins</strong> estimated delivery
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{restaurant.address}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-semibold text-slate-800 tabular-nums">
                ₹{restaurant.priceForTwo} for two
              </span>
              <span className="text-slate-300">·</span>
              <span className={`font-semibold ${restaurant.isOpen ? 'text-emerald-600' : 'text-red-500'}`}>
                {restaurant.isOpen ? 'Open Now' : 'Closed for Delivery'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Strip: Order Online (Menu) vs Reviews */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center gap-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('menu')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'menu'
                ? 'text-[#E23744]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Order Online ({menu.length})
            {activeTab === 'menu' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E23744]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'reviews'
                ? 'text-[#E23744]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Reviews ({reviews.length})
            {activeTab === 'reviews' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E23744]" />
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: Menu */}
      {activeTab === 'menu' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Left Sidebar: Categories Navigation */}
            <div className="hidden lg:block space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-2">
                Menu Categories
              </p>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeCategory === cat
                      ? 'bg-[#E23744] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Right Main Menu Items */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Menu Filter Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search within this menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#E23744]"
                  />
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => setVegOnly(!vegOnly)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                      vegOnly
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span>Veg Only</span>
                  </button>
                </div>
              </div>

              {/* Dishes Grid */}
              {filteredMenuItems.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <p className="text-sm font-bold text-slate-700">No dishes match your selection</p>
                  <p className="text-xs text-slate-400 mt-1">Try resetting the veg filter or search keywords.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMenuItems.map((item) => {
                    const qty = getItemQuantityInCart(item.id);

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-shadow flex justify-between gap-4"
                      >
                        {/* Dish Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            {/* Veg / Non-Veg Indicator */}
                            <div className="flex items-center gap-2 mb-1.5">
                              <div
                                className={`w-3.5 h-3.5 border flex items-center justify-center rounded-xs ${
                                  item.isVegetarian ? 'border-emerald-600' : 'border-red-600'
                                }`}
                              >
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    item.isVegetarian ? 'bg-emerald-600' : 'bg-red-600'
                                  }`}
                                />
                              </div>

                              {item.isBestSeller && (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                                  Bestseller
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm font-bold text-slate-900 leading-snug">
                              {item.name}
                            </h4>

                            <p className="text-xs font-bold text-slate-900 mt-1 tabular-nums">
                              ₹{item.price}
                            </p>

                            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Dish Image + Add Button Container */}
                        <div className="relative w-28 h-28 shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-xl bg-slate-100"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />

                          {/* Add / Stepper Button */}
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 shadow-sm">
                            {qty === 0 ? (
                              <button
                                onClick={() => addItem(item, restaurant.name)}
                                className="w-full py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-[#E23744] text-xs font-black uppercase rounded-lg shadow-xs transition-all hover:scale-105 active:scale-95"
                              >
                                ADD +
                              </button>
                            ) : (
                              <div className="w-full flex items-center justify-between bg-white border border-[#E23744] rounded-lg px-2 py-1 text-xs font-bold text-[#E23744]">
                                <button
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="hover:opacity-75"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="tabular-nums font-bold text-slate-900">
                                  {qty}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="hover:opacity-75"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Reviews */}
      {activeTab === 'reviews' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Customer Ratings &amp; Reviews</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Authentic reviews from verified foodies who ordered from {restaurant.name}
              </p>
            </div>
            <button
              onClick={() => {
                if (!user) {
                  openAuthModal('login');
                } else {
                  setIsReviewModalOpen(true);
                }
              }}
              className="px-4 py-2 bg-[#E23744] hover:bg-[#d02c38] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Write a Review</span>
            </button>
          </div>

          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-xs">
                No reviews posted yet. Be the first to share your dining experience!
              </div>
            ) : (
              reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-red-100 text-[#E23744] font-bold text-xs flex items-center justify-center uppercase">
                        {rev.customerName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-tight">
                          {rev.customerName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-emerald-600 text-white px-2 py-0.5 rounded-md text-xs font-bold tabular-nums">
                      <span>{rev.rating}</span>
                      <Star className="w-3 h-3 fill-white" />
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed pt-1">
                    {rev.comment}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Floating Bottom Cart Bar (if items in cart) */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <div className="bg-[#E23744] text-white rounded-2xl p-3.5 shadow-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-90">
                  {cartItems.reduce((acc, i) => acc + i.quantity, 0)} Items Added
                </p>
                <p className="text-base font-extrabold tabular-nums">
                  ₹{finalTotal} <span className="text-xs font-normal opacity-75">plus taxes</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={openCart}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  View Cart
                </button>
                <button
                  onClick={onNavigateToCheckout}
                  className="px-5 py-2 bg-white hover:bg-slate-100 text-[#E23744] text-xs font-extrabold rounded-xl transition-colors shadow-xs"
                >
                  Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        onClose={() => setIsReviewModalOpen(false)}
        onSuccess={() => fetchRestaurantData()}
      />
    </div>
  );
};
