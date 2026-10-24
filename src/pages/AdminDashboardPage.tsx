import React, { useState, useEffect } from 'react';
import { ShieldCheck, Store, Users, ShoppingBag, Plus, CheckCircle2, XCircle, AlertCircle, Trash2, ArrowRight } from 'lucide-react';
import { api } from '../services/api.js';
import { Restaurant, User, Coupon, Order } from '../types/index.js';

interface AdminDashboardPageProps {
  onBack: () => void;
  onTrackOrder: (orderId: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onBack, onTrackOrder }) => {
  const [stats, setStats] = useState<any>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'restaurants' | 'users' | 'coupons' | 'orders'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // New Coupon Form
  const [isAddingCoupon, setIsAddingCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrder, setMinOrder] = useState('200');
  const [maxDiscount, setMaxDiscount] = useState('100');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [overviewRes, restRes, userRes, couponRes, orderRes] = await Promise.all([
        api.get<{ success: boolean; stats: any }>('/api/admin/overview'),
        api.get<{ success: boolean; restaurants: Restaurant[] }>('/api/admin/restaurants'),
        api.get<{ success: boolean; users: User[] }>('/api/admin/users'),
        api.get<{ success: boolean; coupons: Coupon[] }>('/api/admin/coupons'),
        api.get<{ success: boolean; orders: Order[] }>('/api/admin/orders'),
      ]);

      if (overviewRes.success) setStats(overviewRes.stats);
      if (restRes.success) setRestaurants(restRes.restaurants || []);
      if (userRes.success) setUsers(userRes.users || []);
      if (couponRes.success) setCoupons(couponRes.coupons || []);
      if (orderRes.success) setOrders(orderRes.orders || []);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateApproval = async (restId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await api.patch<{ success: boolean; restaurant: Restaurant }>(`/api/admin/restaurants/${restId}/approval`, {
        status,
      });
      if (res.success) {
        setRestaurants((prev) =>
          prev.map((r) => (r.id === restId ? { ...r, approvalStatus: status } : r))
        );
      }
    } catch (e) {
      alert('Failed to update restaurant approval');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await api.patch<{ success: boolean; user: User }>(`/api/admin/users/${userId}/status`, {
        status: nextStatus,
      });
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, accountStatus: nextStatus as any } : u))
        );
      }
    } catch (e) {
      alert('Failed to update user status');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode || !discountValue) return;

    try {
      const res = await api.post<{ success: boolean; coupon: Coupon }>('/api/admin/coupons', {
        code: couponCode.trim(),
        discountType,
        discountValue: Number(discountValue),
        minimumOrderValue: Number(minOrder),
        maximumDiscount: Number(maxDiscount),
        description: description.trim(),
      });

      if (res.success && res.coupon) {
        setCoupons([...coupons, res.coupon]);
        setIsAddingCoupon(false);
        setCouponCode('');
        setDiscountValue('');
        setDescription('');
      }
    } catch (e: any) {
      alert(e.message || 'Failed to create coupon');
    }
  };

  const handleDeactivateCoupon = async (couponId: string) => {
    try {
      await api.delete(`/api/admin/coupons/${couponId}`);
      setCoupons((prev) =>
        prev.map((c) => (c.id === couponId ? { ...c, isActive: false } : c))
      );
    } catch (e) {
      alert('Failed to deactivate coupon');
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading Admin Console...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2 py-0.5 rounded-md">
                Super Admin Console
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500">Platform Management</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Zomato Administration
            </h1>
          </div>

          <button
            onClick={onBack}
            className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors"
          >
            Back to App
          </button>
        </div>

        {/* Global Stats Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Gross Volume</span>
            <p className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
              ₹{stats?.totalGrossVolume || 0}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">15% Platform Take</span>
            <p className="text-2xl font-black text-emerald-600 mt-1 tabular-nums">
              ₹{stats?.platformCommission || 0}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Restaurants</span>
            <p className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
              {stats?.approvedRestaurantsCount || 0}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Users</span>
            <p className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
              {stats?.totalUsers || 0}
            </p>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-6 border-b border-slate-200 overflow-x-auto pb-1">
          {(['overview', 'restaurants', 'users', 'coupons', 'orders'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap relative ${
                activeTab === tab ? 'text-[#E23744]' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab}
              {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E23744]" />}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Platform Health Overview</h3>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span>Registered Foodies (Customers)</span>
                  <span className="font-bold text-slate-900 tabular-nums">{stats?.customerCount || 0}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span>Registered Restaurant Owners</span>
                  <span className="font-bold text-slate-900 tabular-nums">{stats?.ownerCount || 0}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span>Pending Restaurant Approvals</span>
                  <span className="font-bold text-amber-600 tabular-nums">{stats?.pendingApprovalsCount || 0}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>Completed Food Deliveries</span>
                  <span className="font-bold text-emerald-600 tabular-nums">{orders.length}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Recent Platform Orders</h3>
              <div className="space-y-2 text-xs">
                {orders.slice(0, 4).map((o) => (
                  <div key={o.id} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
                    <div>
                      <span className="font-bold text-slate-900">{o.restaurantName}</span>
                      <p className="text-[10px] text-slate-400">{o.customerName} · {o.orderNumber}</p>
                    </div>
                    <span className="font-bold tabular-nums text-slate-900">₹{o.totalAmount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Restaurant Approvals */}
        {activeTab === 'restaurants' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Restaurant Moderation &amp; Approvals</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {restaurants.map((r) => (
                <div key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={r.image}
                      alt={r.name}
                      className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{r.name}</p>
                      <p className="text-[11px] text-slate-500">{r.location.area}, {r.location.city} · {r.cuisines.join(', ')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-md uppercase ${
                        r.approvalStatus === 'approved'
                          ? 'bg-emerald-50 text-emerald-700'
                          : r.approvalStatus === 'rejected'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {r.approvalStatus}
                    </span>

                    {r.approvalStatus !== 'approved' && (
                      <button
                        onClick={() => handleUpdateApproval(r.id, 'approved')}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg"
                      >
                        Approve
                      </button>
                    )}

                    {r.approvalStatus !== 'rejected' && (
                      <button
                        onClick={() => handleUpdateApproval(r.id, 'rejected')}
                        className="px-3 py-1 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Users */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">User Accounts Management</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {users.map((u) => (
                <div key={u.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{u.name}</p>
                    <p className="text-slate-500">{u.email} · Role: <span className="font-semibold uppercase text-slate-700">{u.role}</span></p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`font-bold px-2 py-0.5 rounded-md uppercase text-[10px] ${
                        u.accountStatus === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {u.accountStatus}
                    </span>

                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleToggleUserStatus(u.id, u.accountStatus)}
                        className="px-3 py-1 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg"
                      >
                        {u.accountStatus === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Coupons */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Promotional Coupons</h3>
              <button
                onClick={() => setIsAddingCoupon(!isAddingCoupon)}
                className="px-4 py-2 bg-[#E23744] hover:bg-[#d02c38] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>{isAddingCoupon ? 'Cancel' : 'Create Promo Code'}</span>
              </button>
            </div>

            {isAddingCoupon && (
              <form onSubmit={handleCreateCoupon} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
                <h4 className="text-sm font-bold text-slate-900">Create New Coupon</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Coupon Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MONSOON30"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Discount Type</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Discount Value</label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="e.g. 50 or 150"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Minimum Order Value (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={minOrder}
                      onChange={(e) => setMinOrder(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Max Discount Cap (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Short description shown to customers"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800"
                >
                  Save Coupon
                </button>
              </form>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="divide-y divide-slate-100">
                {coupons.map((c) => (
                  <div key={c.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <span className="font-mono font-bold text-sm text-[#E23744] bg-red-50 px-2.5 py-0.5 rounded-md">
                        {c.code}
                      </span>
                      <p className="text-slate-600 mt-1">{c.description}</p>
                      <p className="text-[11px] text-slate-400">Min Order: ₹{c.minimumOrderValue} · Used: {c.usageCount} times</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-md uppercase text-[10px] ${
                          c.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>

                      {c.isActive && (
                        <button
                          onClick={() => handleDeactivateCoupon(c.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                          title="Deactivate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Orders */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">All Platform Orders ({orders.length})</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {orders.map((o) => (
                <div key={o.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-mono font-bold text-[#E23744]">{o.orderNumber}</span>
                    <span className="text-slate-300 mx-2">·</span>
                    <span className="font-bold text-slate-900">{o.restaurantName}</span>
                    <p className="text-slate-500 mt-0.5">Customer: {o.customerName} ({o.customerEmail})</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-extrabold tabular-nums text-slate-900">₹{o.totalAmount}</span>
                    <span
                      className={`font-bold px-2.5 py-0.5 rounded-md uppercase text-[11px] ${
                        o.orderStatus === 'delivered' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {o.orderStatus.replace('_', ' ')}
                    </span>
                    <button
                      onClick={() => onTrackOrder(o.id)}
                      className="px-3 py-1 bg-slate-900 text-white rounded-lg font-bold"
                    >
                      Track
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
