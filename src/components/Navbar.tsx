import React, { useState } from 'react';
import { ShoppingBag, User as UserIcon, MapPin, ChevronDown, LogOut, LayoutDashboard, Shield, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useCart } from '../context/CartContext.js';
import { useLocation } from '../context/LocationContext.js';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onNavigateToOwner?: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onNavigateToOwner,
  onNavigateToAdmin,
  onNavigateToProfile,
}) => {
  const { user, openAuthModal, logout } = useAuth();
  const { itemCount, openCart } = useCart();
  const { currentLocation, openLocationModal } = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* 3-Zone Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Brand Wordmark & Location */}
        <div className="flex items-center gap-6 shrink-0">
          <button
            onClick={() => onTabChange('delivery')}
            className="text-2xl font-black italic tracking-tighter text-[#E23744] hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
          >
            zomato
          </button>

          {/* Quick Location Badge */}
          <button
            onClick={openLocationModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            title="Change Delivery Location"
          >
            <MapPin className="w-3.5 h-3.5 text-[#E23744]" />
            <span className="truncate max-w-[140px] font-semibold text-slate-900">
              {currentLocation.name}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">{currentLocation.city}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>
        </div>

        {/* Zone 2: 4-5 Navigation Links (single-line, clean hover underline) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <button
            onClick={() => onTabChange('delivery')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 ${
              currentTab === 'delivery'
                ? 'text-[#E23744] font-semibold border-b-2 border-[#E23744]'
                : 'hover:text-slate-900'
            }`}
          >
            Delivery
          </button>
          <button
            onClick={() => onTabChange('dining')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 ${
              currentTab === 'dining'
                ? 'text-[#E23744] font-semibold border-b-2 border-[#E23744]'
                : 'hover:text-slate-900'
            }`}
          >
            Dining Out
          </button>
          <button
            onClick={() => onTabChange('offers')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 ${
              currentTab === 'offers'
                ? 'text-[#E23744] font-semibold border-b-2 border-[#E23744]'
                : 'hover:text-slate-900'
            }`}
          >
            Offers
          </button>
          <button
            onClick={() => onTabChange('top-rated')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 ${
              currentTab === 'top-rated'
                ? 'text-[#E23744] font-semibold border-b-2 border-[#E23744]'
                : 'hover:text-slate-900'
            }`}
          >
            Top Rated
          </button>
        </nav>

        {/* Zone 3: Single Primary Action & User Zone */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Cart Trigger */}
          <button
            onClick={openCart}
            className="relative flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="w-4 h-4 text-[#E23744]" />
            <span className="hidden sm:inline">Cart</span>
            {itemCount > 0 && (
              <span className="flex items-center justify-center min-w-5 h-5 px-1 text-[11px] font-bold text-white bg-[#E23744] rounded-full tabular-nums">
                {itemCount}
              </span>
            )}
          </button>

          {/* User Profile or Sign In */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <div className="w-6 h-6 rounded-full bg-red-100 text-[#E23744] flex items-center justify-center font-bold text-xs uppercase">
                  {user.name.charAt(0)}
                </div>
                <span className="max-w-[100px] truncate font-semibold text-slate-900">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-[#E23744] uppercase tracking-wider">
                      Role: {user.role}
                    </span>
                  </div>

                  <button
                    onClick={onNavigateToProfile}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    My Profile &amp; Orders
                  </button>

                  {user.role === 'owner' && onNavigateToOwner && (
                    <button
                      onClick={onNavigateToOwner}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                    >
                      <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
                      Restaurant Dashboard
                    </button>
                  )}

                  {user.role === 'admin' && (
                    <>
                      {onNavigateToOwner && (
                        <button
                          onClick={onNavigateToOwner}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                          Owner View (Demo)
                        </button>
                      )}
                      {onNavigateToAdmin && (
                        <button
                          onClick={onNavigateToAdmin}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                        >
                          <Shield className="w-4 h-4 text-[#E23744]" />
                          Admin Console
                        </button>
                      )}
                    </>
                  )}

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={() => logout()}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="px-4 py-2 text-xs font-bold text-white bg-[#E23744] hover:bg-[#d02c38] rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
