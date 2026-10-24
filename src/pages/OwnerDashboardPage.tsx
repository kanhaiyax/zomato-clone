import React, { useState, useEffect } from 'react';
import { ChefHat, ShoppingBag, Plus, CheckCircle2, Clock, DollarSign, Store, ToggleLeft, ToggleRight, Trash2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { Restaurant, Order, MenuItem } from '../types/index.js';
import { api } from '../services/api.js';
import { realtime } from '../services/websocket.js';

interface OwnerDashboardPageProps {
  onBack: () => void;
  onTrackOrder: (orderId: string) => void;
}

export const OwnerDashboardPage: React.FC<OwnerDashboardPageProps> = ({ onBack, onTrackOrder }) => {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'analytics'>('orders');
  const [isLoading, setIsLoading] = useState(true);

  // New Menu Item Form
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Main Course');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemVeg, setNewItemVeg] = useState(false);

  useEffect(() => {
    fetchOwnerData();

    // Subscribe to real-time events for incoming orders
    realtime.connect();
    realtime.subscribe('all');

    const unsubscribe = realtime.onMessage((msg) => {
      if (msg.type === 'order:new' || msg.type === 'order:status_update') {
        fetchOrdersOnly();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const fetchOwnerData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ success: boolean; restaurant: Restaurant }>('/api/owner/my-restaurant');
      if (res.success && res.restaurant) {
        setRestaurant(res.restaurant);
        await Promise.all([
          fetchOrders(res.restaurant.id),
          fetchMenu(res.restaurant.id),
          fetchAnalytics(res.restaurant.id),
        ]);
      }
    } catch (e) {
      console.error('Owner data fetch failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async (restId: string) => {
    const res = await api.get<{ success: boolean; orders: Order[] }>(`/api/owner/orders?restaurantId=${restId}`);
    if (res.success) {
      setOrders(res.orders || []);
    }
  };

  const fetchOrdersOnly = async () => {
    if (!restaurant) return;
    const res = await api.get<{ success: boolean; orders: Order[] }>(`/api/owner/orders?restaurantId=${restaurant.id}`);
    if (res.success) {
      setOrders(res.orders || []);
    }
  };

  const fetchMenu = async (restId: string) => {
    const res = await api.get<{ success: boolean; items: MenuItem[] }>(`/api/menu/restaurant/${restId}`);
    if (res.success) {
      setMenuItems(res.items || []);
    }
  };

  const fetchAnalytics = async (restId: string) => {
    const res = await api.get<{ success: boolean; analytics: any }>(`/api/owner/analytics?restaurantId=${restId}`);
    if (res.success) {
      setAnalytics(res.analytics);
    }
  };

  const handleToggleStoreOpen = async () => {
    if (!restaurant) return;
    try {
      const res = await api.put<{ success: boolean; restaurant: Restaurant }>(`/api/restaurants/${restaurant.id}`, {
        isOpen: !restaurant.isOpen,
      });
      if (res.success && res.restaurant) {
        setRestaurant(res.restaurant);
      }
    } catch (err) {
      alert('Failed to update restaurant status');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    try {
      const res = await api.patch<{ success: boolean; order: Order }>(`/api/orders/${orderId}/status`, {
        status: nextStatus,
      });
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, orderStatus: nextStatus as any } : o))
        );
      }
    } catch (e: any) {
      alert(e.message || 'Status update failed');
    }
  };

  const handleToggleItemAvailability = async (itemId: string) => {
    try {
      const res = await api.patch<{ success: boolean; item: MenuItem }>(`/api/menu/${itemId}/toggle-availability`);
      if (res.success && res.item) {
        setMenuItems((prev) =>
          prev.map((i) => (i.id === itemId ? res.item : i))
        );
      }
    } catch (e) {
      alert('Failed to toggle availability');
    }
  };

  const handleCreateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || !newItemName || !newItemPrice) return;

    try {
      const res = await api.post<{ success: boolean; item: MenuItem }>(`/api/menu/restaurant/${restaurant.id}`, {
        name: newItemName.trim(),
        price: Number(newItemPrice),
        category: newItemCategory.trim(),
        description: newItemDesc.trim(),
        isVegetarian: newItemVeg,
        isAvailable: true,
      });

      if (res.success && res.item) {
        setMenuItems([...menuItems, res.item]);
        setIsAddingItem(false);
        setNewItemName('');
        setNewItemPrice('');
        setNewItemDesc('');
      }
    } catch (e: any) {
      alert(e.message || 'Failed to add item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Delete this dish?')) return;
    try {
      await api.delete(`/api/menu/${itemId}`);
      setMenuItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (e) {
      alert('Failed to delete item');
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading Restaurant Console...</div>;
  }

  if (!restaurant) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">No Restaurant Profile Linked</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">Please log in with an authorized owner account.</p>
        <button onClick={onBack} className="px-4 py-2 bg-[#E23744] text-white text-xs font-bold rounded-xl">
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
              <img
                src={restaurant.image}
                alt={restaurant.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Partner Kitchen Console
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500">{restaurant.location.area}</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                {restaurant.name}
              </h1>
            </div>
          </div>

          {/* Online / Offline switch */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleStoreOpen}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                restaurant.isOpen
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-red-50 border-red-300 text-red-800'
              }`}
            >
              {restaurant.isOpen ? (
                <>
                  <ToggleRight className="w-5 h-5 text-emerald-600" />
                  <span>Accepting Orders (ONLINE)</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5 text-red-500" />
                  <span>Kitchen Closed (OFFLINE)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sales KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Revenue</span>
            <p className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
              ₹{analytics?.totalRevenue || 0}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Orders</span>
            <p className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
              {analytics?.totalOrders || orders.length}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Live Orders</span>
            <p className="text-2xl font-black text-[#E23744] mt-1 tabular-nums">
              {analytics?.activeOrdersCount || 0}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Order</span>
            <p className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
              ₹{analytics?.averageOrderValue || 0}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'orders' ? 'text-[#E23744]' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Live Kitchen Orders ({orders.length})
            {activeTab === 'orders' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E23744]" />}
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'menu' ? 'text-[#E23744]' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Menu Items ({menuItems.length})
            {activeTab === 'menu' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E23744]" />}
          </button>
        </div>

        {/* Tab Content: Live Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-400">
                No orders received yet. Stay online to receive incoming requests!
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#E23744]">{order.orderNumber}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-500">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Customer: <strong className="text-slate-900">{order.customerName || 'Customer'}</strong> ({order.customerPhone || 'N/A'})
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-slate-900 tabular-nums">
                        ₹{order.totalAmount}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase ${
                          order.orderStatus === 'delivered'
                            ? 'bg-emerald-50 text-emerald-700'
                            : order.orderStatus === 'cancelled'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {order.orderStatus.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Items in order */}
                  <div className="space-y-1.5 text-xs">
                    {order.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between text-slate-700">
                        <span>
                          <strong className="text-slate-900 tabular-nums">{i.quantity}x</strong> {i.name}
                        </span>
                        <span className="tabular-nums font-semibold">₹{i.price * i.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Controls to advance order status */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={() => onTrackOrder(order.id)}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900"
                    >
                      View Live Tracking &rarr;
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                      {order.orderStatus === 'placed' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                        >
                          Accept Order
                        </button>
                      )}
                      {order.orderStatus === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs"
                        >
                          Start Preparing
                        </button>
                      )}
                      {order.orderStatus === 'preparing' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'ready_for_pickup')}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
                        >
                          Mark Ready For Pickup
                        </button>
                      )}
                      {order.orderStatus === 'ready_for_pickup' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'out_for_delivery')}
                          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs"
                        >
                          Handover to Driver
                        </button>
                      )}
                      {order.orderStatus === 'out_for_delivery' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                        >
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab Content: Menu Items */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Manage Menu Dishes</h3>
              <button
                onClick={() => setIsAddingItem(!isAddingItem)}
                className="px-4 py-2 bg-[#E23744] hover:bg-[#d02c38] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>{isAddingItem ? 'Cancel' : 'Add New Dish'}</span>
              </button>
            </div>

            {/* Add Dish Form */}
            {isAddingItem && (
              <form onSubmit={handleCreateMenuItem} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
                <h4 className="text-sm font-bold text-slate-900">Add Dish to Restaurant Menu</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Dish Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tandoori Paneer Tikka"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="e.g. 290"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Starters, Main Course, Desserts"
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="flex items-center gap-4 pt-6">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newItemVeg}
                        onChange={(e) => setNewItemVeg(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Vegetarian Dish</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Short description of ingredients and preparation"
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800"
                >
                  Save Dish
                </button>
              </form>
            )}

            {/* Dishes Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="divide-y divide-slate-100">
                {menuItems.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 rounded-xs ${
                          item.isVegetarian ? 'border-emerald-600' : 'border-red-600'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${item.isVegetarian ? 'bg-emerald-600' : 'bg-red-600'}`} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{item.name}</p>
                        <p className="text-[11px] text-slate-500">{item.category} · ₹{item.price}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleItemAvailability(item.id)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                          item.isAvailable
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-red-50 text-red-700 border-red-300'
                        }`}
                      >
                        {item.isAvailable ? 'In Stock' : 'Sold Out'}
                      </button>

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                        title="Delete Dish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
