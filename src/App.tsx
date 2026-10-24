import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext.js';
import { CartProvider } from './context/CartContext.js';
import { LocationProvider } from './context/LocationContext.js';

import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { AuthModal } from './components/AuthModal.js';
import { LocationModal } from './components/LocationModal.js';
import { CartDrawer } from './components/CartDrawer.js';
import { ConflictModal } from './components/ConflictModal.js';

import { HomePage } from './pages/HomePage.js';
import { RestaurantDetailPage } from './pages/RestaurantDetailPage.js';
import { CheckoutPage } from './pages/CheckoutPage.js';
import { OrderTrackingPage } from './pages/OrderTrackingPage.js';
import { UserProfilePage } from './pages/UserProfilePage.js';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage.js';
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';

type ViewMode = 'home' | 'restaurant' | 'checkout' | 'tracking' | 'profile' | 'owner' | 'admin';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [currentTab, setCurrentTab] = useState<string>('delivery');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string>('ord_sample_live');

  const handleSelectRestaurant = (restaurantId: string) => {
    setSelectedRestaurantId(restaurantId);
    setCurrentView('restaurant');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTrackOrder = (orderId: string) => {
    setActiveTrackingOrderId(orderId);
    setCurrentView('tracking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderPlaced = (orderId: string) => {
    setActiveTrackingOrderId(orderId);
    setCurrentView('tracking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AuthProvider>
      <CartProvider>
        <LocationProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
            
            {/* Top Navigation */}
            <Navbar
              currentTab={currentTab}
              onTabChange={(tab) => {
                setCurrentTab(tab);
                setCurrentView('home');
              }}
              onNavigateToOwner={() => setCurrentView('owner')}
              onNavigateToAdmin={() => setCurrentView('admin')}
              onNavigateToProfile={() => setCurrentView('profile')}
            />

            {/* Dynamic View Routing */}
            <main className="flex-1">
              {currentView === 'home' && (
                <HomePage
                  onSelectRestaurant={handleSelectRestaurant}
                />
              )}

              {currentView === 'restaurant' && selectedRestaurantId && (
                <RestaurantDetailPage
                  restaurantId={selectedRestaurantId}
                  onBack={() => setCurrentView('home')}
                  onNavigateToCheckout={() => setCurrentView('checkout')}
                />
              )}

              {currentView === 'checkout' && (
                <CheckoutPage
                  onBack={() => {
                    if (selectedRestaurantId) {
                      setCurrentView('restaurant');
                    } else {
                      setCurrentView('home');
                    }
                  }}
                  onOrderPlaced={handleOrderPlaced}
                />
              )}

              {currentView === 'tracking' && (
                <OrderTrackingPage
                  orderId={activeTrackingOrderId}
                  onBack={() => setCurrentView('home')}
                />
              )}

              {currentView === 'profile' && (
                <UserProfilePage
                  onTrackOrder={handleTrackOrder}
                  onNavigateHome={() => setCurrentView('home')}
                />
              )}

              {currentView === 'owner' && (
                <OwnerDashboardPage
                  onBack={() => setCurrentView('home')}
                  onTrackOrder={handleTrackOrder}
                />
              )}

              {currentView === 'admin' && (
                <AdminDashboardPage
                  onBack={() => setCurrentView('home')}
                  onTrackOrder={handleTrackOrder}
                />
              )}
            </main>

            {/* Global Footer */}
            <Footer />

            {/* Global Overlays & Modals */}
            <AuthModal />
            <LocationModal />
            <CartDrawer onNavigateToCheckout={() => setCurrentView('checkout')} />
            <ConflictModal />
          </div>
        </LocationProvider>
      </CartProvider>
    </AuthProvider>
  );
}
