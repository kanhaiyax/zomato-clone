import React, { useState, useEffect } from 'react';
import { User as UserIcon, Phone, Mail, MapPin, Plus, Trash2, ShoppingBag, ArrowRight, Star, Clock, CheckCircle2, ShieldCheck, ChefHat, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { Order } from '../types/index.js';
import { api } from '../services/api.js';
import { ReviewModal } from '../components/ReviewModal.js';

interface UserProfilePageProps {
  onTrackOrder: (orderId: string) => void;
  onNavigateHome: () => void;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({ onTrackOrder, onNavigateHome }) => {
  const { user, updateProfile, addAddress, deleteAddress, switchDemoAccount } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  // Profile Edit
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  // Add Address Form
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [pincode, setPincode] = useState('560103');
  const [addressType, setAddressType] = useState<'Home' | 'Work' | 'Other'>('Home');

  // Review Modal
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const res = await api.get<{ success: boolean; orders: Order[] }>('/api/orders/my-orders');
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (e) {
      console.error('Failed to load orders:', e);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage(null);
    try {
      await updateProfile(name, phone);
      setProfileMessage('Profile updated successfully!');
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err: any) {
      setProfileMessage(err.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine.trim()) return;
    try {
      await addAddress({
        type: addressType,
        addressLine: addressLine.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        isDefault: false,
      });
      setIsAddingAddress(false);
      setAddressLine('');
    } catch (err) {
      alert('Failed to save address');
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-24 text-center">
        <h3 className="text-base font-bold text-slate-800">Please sign in to view your profile</h3>
        <button
          onClick={onNavigateHome}
          className="mt-4 px-4 py-2 bg-[#E23744] text-white text-xs font-bold rounded-xl"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Quick Demo Switcher Banner */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-amber-950 uppercase tracking-wider">
              College Project &amp; Demo Evaluation Mode
            </p>
            <p className="text-xs text-amber-800 mt-0.5">
              Switch between simulated accounts with 1 click to test full customer, restaurant owner, and admin roles.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => switchDemoAccount('customer')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all ${
                user.role === 'customer'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-slate-700 border-amber-300 hover:bg-amber-50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Customer</span>
            </button>
            <button
              onClick={() => switchDemoAccount('owner')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all ${
                user.role === 'owner'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-700 border-amber-300 hover:bg-amber-50'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Owner</span>
            </button>
            <button
              onClick={() => switchDemoAccount('admin')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all ${
                user.role === 'admin'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-slate-700 border-amber-300 hover:bg-amber-50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Profile Card & Address Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Profile Details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-[#E23744]" />
              <span>Personal Details</span>
            </h3>

            {profileMessage && (
              <p className="mt-3 text-xs font-bold text-emerald-600">{profileMessage}</p>
            )}

            <form onSubmit={handleUpdateProfile} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#E23744]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="flex items-center gap-2 px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{user.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#E23744]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  {isUpdatingProfile ? 'Saving...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* Saved Addresses */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#E23744]" />
                  <span>Saved Delivery Locations</span>
                </h3>

                <button
                  onClick={() => setIsAddingAddress(!isAddingAddress)}
                  className="text-xs font-bold text-[#E23744] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingAddress ? 'Cancel' : 'Add New'}</span>
                </button>
              </div>

              {isAddingAddress && (
                <form onSubmit={handleAddAddress} className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Address Line"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Pincode"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="flex gap-2">
                    {(['Home', 'Work', 'Other'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setAddressType(t)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
                          addressType === t ? 'bg-[#E23744] text-white border-[#E23744]' : 'bg-white border-slate-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg"
                  >
                    Save
                  </button>
                </form>
              )}

              <div className="mt-4 space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {user.savedAddresses.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    No saved addresses yet.
                  </p>
                ) : (
                  user.savedAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="flex items-start justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{addr.type}</span>
                        <p className="text-slate-600 mt-0.5">{addr.addressLine}, {addr.city} - {addr.pincode}</p>
                      </div>
                      <button
                        onClick={() => deleteAddress(addr.id)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete Address"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#E23744]" />
            <span>Past Orders ({orders.length})</span>
          </h3>

          {isLoadingOrders ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading your orders...</div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              You haven&apos;t placed any orders yet. Delicious food is just a tap away!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {orders.map((o) => (
                <div key={o.id} className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {o.restaurantName || 'Restaurant'}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono text-xs text-slate-500 font-semibold">{o.orderNumber}</span>
                      <span className="text-slate-300">·</span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          o.orderStatus === 'delivered'
                            ? 'bg-emerald-50 text-emerald-700'
                            : o.orderStatus === 'cancelled'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {o.orderStatus.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1">
                      {o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </p>

                    <p className="text-[11px] text-slate-400">
                      Placed on {new Date(o.createdAt).toLocaleDateString()} at{' '}
                      {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                        ₹{o.totalAmount}
                      </span>
                      <span className="text-[10px] text-slate-400 block uppercase">
                        {o.paymentMethod}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onTrackOrder(o.id)}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                      >
                        <span>Track</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {o.orderStatus === 'delivered' && (
                        <button
                          onClick={() => setSelectedOrderForReview(o)}
                          className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-500" />
                          <span>Review</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedOrderForReview && (
        <ReviewModal
          isOpen={true}
          restaurantId={selectedOrderForReview.restaurantId}
          restaurantName={selectedOrderForReview.restaurantName || 'Restaurant'}
          orderId={selectedOrderForReview.id}
          onClose={() => setSelectedOrderForReview(null)}
          onSuccess={() => {
            alert('Review submitted successfully!');
            fetchOrders();
          }}
        />
      )}
    </div>
  );
};
