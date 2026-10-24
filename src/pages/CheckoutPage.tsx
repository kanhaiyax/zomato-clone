import React, { useState } from 'react';
import { MapPin, Plus, ShieldCheck, ArrowLeft, CreditCard, Banknote, AlertCircle, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { RazorpayModal } from '../components/RazorpayModal.js';
import { SavedAddress } from '../types/index.js';

interface CheckoutPageProps {
  onBack: () => void;
  onOrderPlaced: (orderId: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onBack, onOrderPlaced }) => {
  const { cartItems, activeRestaurantId, activeRestaurantName, subtotal, deliveryFee, tax, platformFee, discountAmount, appliedCoupon, finalTotal, clearCart } = useCart();
  const { user, openAuthModal, addAddress } = useAuth();

  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(() => {
    return user?.savedAddresses?.find((a) => a.isDefault) || user?.savedAddresses?.[0] || null;
  });

  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [newAddressLine, setNewAddressLine] = useState('');
  const [newCity, setNewCity] = useState('Bengaluru');
  const [newPincode, setNewPincode] = useState('560103');
  const [newAddressType, setNewAddressType] = useState<'Home' | 'Work' | 'Other'>('Home');

  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Razorpay Gateway State
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [activeRazorpayOrderId, setActiveRazorpayOrderId] = useState<string>('');

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressLine.trim()) return;

    try {
      await addAddress({
        type: newAddressType,
        addressLine: newAddressLine.trim(),
        city: newCity.trim(),
        pincode: newPincode.trim(),
        isDefault: true,
      });

      setSelectedAddress({
        id: `addr_${Date.now()}`,
        type: newAddressType,
        addressLine: newAddressLine.trim(),
        city: newCity.trim(),
        pincode: newPincode.trim(),
        isDefault: true,
      });

      setIsAddingNewAddress(false);
      setNewAddressLine('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save address');
    }
  };

  const handleInitiateOrder = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (cartItems.length === 0) {
      setErrorMessage('Your cart is empty. Please add delicious dishes first.');
      return;
    }

    const deliveryAddr = selectedAddress || {
      type: 'Home',
      addressLine: 'Apt 402, Green Glen Heights, Bellandur',
      city: 'Bengaluru',
      pincode: '560103',
      isDefault: true,
      id: 'addr_default',
    };

    setErrorMessage(null);
    setIsPlacingOrder(true);

    try {
      if (paymentMethod === 'razorpay') {
        // Step 1: Create Razorpay Order on backend
        const rzpRes = await api.post<{
          success: boolean;
          order: { id: string; amount: number };
        }>('/api/payments/create-order', {
          amount: finalTotal,
        });

        if (rzpRes.success && rzpRes.order) {
          setActiveRazorpayOrderId(rzpRes.order.id);
          setIsRazorpayOpen(true);
          setIsPlacingOrder(false);
        } else {
          throw new Error('Failed to create Razorpay payment order');
        }
      } else {
        // Cash on Delivery direct order placement
        await submitFinalOrder({
          paymentMethod: 'cod',
          deliveryAddress: deliveryAddr,
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initiate order. Please try again.');
      setIsPlacingOrder(false);
    }
  };

  const handleRazorpaySuccess = async (paymentDetails: {
    paymentId: string;
    orderId: string;
    signature: string;
  }) => {
    setIsRazorpayOpen(false);
    setIsPlacingOrder(true);

    try {
      // Step 2: Verify cryptographic signature on backend
      const verifyRes = await api.post<{ success: boolean }>('/api/payments/verify', {
        razorpay_order_id: paymentDetails.orderId,
        razorpay_payment_id: paymentDetails.paymentId,
        razorpay_signature: paymentDetails.signature,
        amount: finalTotal,
      });

      if (!verifyRes.success) {
        throw new Error('Payment signature verification failed on server.');
      }

      // Step 3: Create confirmed order on backend
      const deliveryAddr = selectedAddress || {
        type: 'Home',
        addressLine: 'Apt 402, Green Glen Heights, Bellandur',
        city: 'Bengaluru',
        pincode: '560103',
        isDefault: true,
        id: 'addr_default',
      };

      await submitFinalOrder({
        paymentMethod: 'razorpay',
        deliveryAddress: deliveryAddr,
        razorpayOrderId: paymentDetails.orderId,
        razorpayPaymentId: paymentDetails.paymentId,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment verification failed');
      setIsPlacingOrder(false);
    }
  };

  const submitFinalOrder = async (extraPayload: Record<string, any>) => {
    const payload = {
      restaurantId: activeRestaurantId,
      items: cartItems.map((i) => ({
        menuItemId: i.menuItemId,
        quantity: i.quantity,
      })),
      couponCode: appliedCoupon?.code,
      deliveryInstructions,
      ...extraPayload,
    };

    const res = await api.post<{ success: boolean; order: { id: string } }>('/api/orders', payload);

    if (res.success && res.order) {
      clearCart();
      onOrderPlaced(res.order.id);
    } else {
      throw new Error('Failed to create order on server');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </button>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-6">
          Order Checkout
        </h1>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs font-medium text-red-700">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Delivery Address & Payment Method */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: Delivery Address */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-50 text-[#E23744] flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Delivery Address</h3>
                </div>

                <button
                  onClick={() => setIsAddingNewAddress(!isAddingNewAddress)}
                  className="text-xs font-bold text-[#E23744] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingNewAddress ? 'Cancel' : 'Add New Address'}</span>
                </button>
              </div>

              {/* Add Address Form */}
              {isAddingNewAddress && (
                <form onSubmit={handleSaveNewAddress} className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <p className="text-xs font-bold text-slate-700">Add Delivery Location</p>
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Flat, House no., Building, Street address"
                      value={newAddressLine}
                      onChange={(e) => setNewAddressLine(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Pincode"
                      value={newPincode}
                      onChange={(e) => setNewPincode(e.target.value)}
                      className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="flex gap-2">
                    {(['Home', 'Work', 'Other'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewAddressType(type)}
                        className={`px-3 py-1 text-xs font-bold rounded-md border ${
                          newAddressType === type
                            ? 'bg-[#E23744] text-white border-[#E23744]'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800"
                  >
                    Save Address
                  </button>
                </form>
              )}

              {/* Saved Addresses List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {user?.savedAddresses && user.savedAddresses.length > 0 ? (
                  user.savedAddresses.map((addr) => {
                    const isSelected = selectedAddress?.id === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddress(addr)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#E23744] bg-red-50/40 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#E23744]" />
                            {addr.type}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-[#E23744] uppercase">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {addr.addressLine}, {addr.city} - {addr.pincode}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                    Delivering to default location: <strong>Indiranagar Hub, Bengaluru - 560103</strong>
                  </div>
                )}
              </div>

              {/* Delivery Instructions Note */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Delivery Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Leave with security, ring bell twice, avoid calling"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#E23744]"
                />
              </div>
            </div>

            {/* Step 2: Payment Method */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-red-50 text-[#E23744] flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h3 className="text-base font-bold text-slate-900">Payment Option</h3>
              </div>

              <div className="space-y-3">
                {/* Razorpay Online */}
                <label
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'razorpay'
                      ? 'border-[#E23744] bg-red-50/40'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    className="mt-1 text-[#E23744] focus:ring-[#E23744]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#E23744]" />
                      <span className="text-xs font-bold text-slate-900">
                        Razorpay Test Gateway (UPI, Cards, Netbanking)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Secure, instant test mode payment simulation with cryptographic HMAC verification.
                    </p>
                  </div>
                </label>

                {/* Cash on Delivery */}
                <label
                  onClick={() => setPaymentMethod('cod')}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-[#E23744] bg-red-50/40'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 text-[#E23744] focus:ring-[#E23744]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-900">
                        Cash on Delivery (COD)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pay cash or UPI upon delivery at your doorstep.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Pay Button */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Order Items ({cartItems.length})
              </h3>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 text-xs">
                {cartItems.map((item) => (
                  <div key={item.menuItemId} className="flex justify-between items-center text-slate-700">
                    <span className="truncate max-w-[160px]">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-semibold tabular-nums text-slate-900">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bill Details */}
              <div className="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Item Total</span>
                  <span className="font-semibold text-slate-900 tabular-nums">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="tabular-nums">
                    {deliveryFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee</span>
                  <span className="tabular-nums">₹{platformFee}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes (GST 5%)</span>
                  <span className="tabular-nums">₹{tax}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span className="tabular-nums">-₹{discountAmount}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
                  <span>Total Amount</span>
                  <span className="text-[#E23744] tabular-nums">₹{finalTotal}</span>
                </div>
              </div>

              {/* Place Order CTA */}
              <button
                onClick={handleInitiateOrder}
                disabled={isPlacingOrder || cartItems.length === 0}
                className="w-full py-3.5 px-4 bg-[#E23744] hover:bg-[#d02c38] disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isPlacingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <span>Place Order · ₹{finalTotal}</span>
                )}
              </button>

              <div className="flex items-center gap-2 text-[10px] text-slate-400 justify-center text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero-risk test mode payment &amp; instant cancellation guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay Test Modal */}
      <RazorpayModal
        isOpen={isRazorpayOpen}
        amount={finalTotal}
        razorpayOrderId={activeRazorpayOrderId}
        onSuccess={handleRazorpaySuccess}
        onCancel={() => {
          setIsRazorpayOpen(false);
          setIsPlacingOrder(false);
        }}
      />
    </div>
  );
};
