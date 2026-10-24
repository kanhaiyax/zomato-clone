import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, Tag, ShoppingBag, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext.js';

interface CartDrawerProps {
  onNavigateToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigateToCheckout }) => {
  const {
    cartItems,
    activeRestaurantName,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeItem,
    appliedCoupon,
    discountAmount,
    applyCoupon,
    removeCoupon,
    subtotal,
    deliveryFee,
    tax,
    platformFee,
    finalTotal,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = codeToApply || couponInput;
    if (!code.trim()) return;

    setIsApplying(true);
    setCouponError(null);
    const result = await applyCoupon(code.trim().toUpperCase());
    setIsApplying(false);

    if (!result.success) {
      setCouponError(result.message);
    } else {
      setCouponInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 text-[#E23744] rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">My Food Cart</h3>
                {activeRestaurantName && (
                  <p className="text-xs text-slate-500 truncate max-w-[220px]">
                    From <span className="font-semibold text-slate-700">{activeRestaurantName}</span>
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={closeCart}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-800">Your cart is empty</h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1 mb-6">
                  Add appetizing dishes from your favorite restaurants and treat yourself!
                </p>
                <button
                  onClick={closeCart}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#E23744] hover:bg-[#d02c38] rounded-xl transition-colors"
                >
                  Explore Restaurants
                </button>
              </div>
            ) : (
              <>
                {/* Items List */}
                <div className="space-y-3.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Selected Items ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})
                  </p>
                  {cartItems.map((item) => (
                    <div
                      key={item.menuItemId}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {/* Veg / Non-Veg mark */}
                        <div
                          className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 rounded-xs ${
                            item.isVegetarian ? 'border-emerald-600' : 'border-red-600'
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.isVegetarian ? 'bg-emerald-600' : 'bg-red-600'
                            }`}
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-500 tabular-nums">
                            ₹{item.price} each
                          </p>
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-2xs">
                        <button
                          onClick={() => updateQuantity(item.menuItemId, -1)}
                          className="p-1 text-slate-500 hover:text-red-600 transition-colors"
                          title="Decrease"
                        >
                          {item.quantity === 1 ? (
                            <Trash2 className="w-3.5 h-3.5" />
                          ) : (
                            <Minus className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-800 tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.menuItemId, 1)}
                          className="p-1 text-slate-500 hover:text-emerald-600 transition-colors"
                          title="Increase"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Item Subtotal */}
                      <div className="text-right w-16">
                        <span className="text-sm font-bold text-slate-900 tabular-nums">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupons Section */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#E23744]" />
                      Coupons &amp; Offers
                    </span>
                    {appliedCoupon && (
                      <button
                        onClick={removeCoupon}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {appliedCoupon ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs font-medium text-emerald-800">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-bold text-emerald-900">{appliedCoupon.code} applied!</p>
                          <p className="text-[11px] text-emerald-700">{appliedCoupon.description}</p>
                        </div>
                      </div>
                      <span className="font-bold tabular-nums text-emerald-700">
                        -₹{discountAmount}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter coupon code"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E23744]"
                        />
                        <button
                          onClick={() => handleApplyCoupon()}
                          disabled={isApplying || !couponInput.trim()}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors"
                        >
                          Apply
                        </button>
                      </div>

                      {couponError && (
                        <p className="text-xs text-red-600">{couponError}</p>
                      )}

                      {/* Quick Coupon Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <button
                          onClick={() => handleApplyCoupon('WELCOME50')}
                          className="text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          WELCOME50
                        </button>
                        <button
                          onClick={() => handleApplyCoupon('ZOMATOFEAST')}
                          className="text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          ZOMATOFEAST
                        </button>
                        <button
                          onClick={() => handleApplyCoupon('FREEFEE')}
                          className="text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          FREEFEE
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Bill Breakdown */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-2.5 text-xs text-slate-600">
                  <p className="font-bold text-slate-900 text-sm mb-2">Bill Summary</p>

                  <div className="flex justify-between items-center">
                    <span>Item Total</span>
                    <span className="font-semibold text-slate-900 tabular-nums">₹{subtotal}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Delivery Partner Fee</span>
                    <span className="tabular-nums">
                      {deliveryFee === 0 ? (
                        <span className="text-emerald-600 font-semibold">FREE (Above ₹500)</span>
                      ) : (
                        `₹${deliveryFee}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Platform Fee</span>
                    <span className="tabular-nums">₹{platformFee}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>GST &amp; Restaurant Taxes (5%)</span>
                    <span className="tabular-nums">₹{tax}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-emerald-600 font-semibold">
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span className="tabular-nums">-₹{discountAmount}</span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-2.5 mt-2 flex justify-between items-center text-sm font-bold text-slate-900">
                    <span>To Pay</span>
                    <span className="text-base text-[#E23744] tabular-nums">₹{finalTotal}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Checkout CTA */}
          {cartItems.length > 0 && (
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  closeCart();
                  onNavigateToCheckout();
                }}
                className="w-full py-3.5 px-4 bg-[#E23744] hover:bg-[#d02c38] text-white text-sm font-bold rounded-xl shadow-md flex items-center justify-between transition-colors"
              >
                <div className="text-left">
                  <span className="text-xs font-normal opacity-90 block">Total Amount</span>
                  <span className="text-base font-extrabold tabular-nums">₹{finalTotal}</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold">
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
