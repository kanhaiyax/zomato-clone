import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, CheckCircle2, Phone, XCircle, AlertCircle, ShoppingBag, MapPin, ChefHat, Bike, Store, RefreshCw } from 'lucide-react';
import { Order } from '../types/index.js';
import { api } from '../services/api.js';
import { realtime } from '../services/websocket.js';
import { LiveDriverMap } from '../components/LiveDriverMap.js';

interface OrderTrackingPageProps {
  orderId: string;
  onBack: () => void;
}

const ORDER_STEPS = [
  { key: 'placed', label: 'Order Placed', icon: ShoppingBag },
  { key: 'confirmed', label: 'Confirmed', icon: Store },
  { key: 'preparing', label: 'Preparing Meal', icon: ChefHat },
  { key: 'ready_for_pickup', label: 'Packed & Ready', icon: CheckCircle2 },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Bike },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({ orderId, onBack }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchOrderDetails();

    // Connect to WebSocket and subscribe to this specific order's real-time events
    realtime.connect();
    realtime.subscribe(`order:${orderId}`);

    const unsubscribe = realtime.onMessage((msg) => {
      if (msg.orderId === orderId && msg.order) {
        setOrder(msg.order);
      }
    });

    // Fallback polling every 6 seconds
    const interval = setInterval(() => {
      fetchOrderDetails(true);
    }, 6000);

    return () => {
      unsubscribe();
      realtime.unsubscribe(`order:${orderId}`);
      clearInterval(interval);
    };
  }, [orderId]);

  const fetchOrderDetails = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const res = await api.get<{
        success: boolean;
        order: Order;
        restaurant: any;
      }>(`/api/orders/${orderId}`);

      if (res.success && res.order) {
        setOrder(res.order);
        setRestaurant(res.restaurant);
      }
    } catch (e: any) {
      if (!isBackground) {
        setErrorMessage(e.message || 'Failed to load order');
      }
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    setIsCancelling(true);
    try {
      const res = await api.post<{ success: boolean; order: Order }>(`/api/orders/${orderId}/cancel`);
      if (res.success && res.order) {
        setOrder(res.order);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded-xl w-1/3"></div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
        <div className="h-48 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <p className="text-sm font-bold text-slate-800">Order not found</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-[#E23744] text-white rounded-xl text-xs font-bold"
        >
          Back
        </button>
      </div>
    );
  }

  const currentStepIndex = ORDER_STEPS.findIndex((s) => s.key === order.orderStatus);
  const isCancelled = order.orderStatus === 'cancelled';
  const isEligibleForCancel = ['placed', 'confirmed'].includes(order.orderStatus);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Discovery</span>
          </button>

          <button
            onClick={() => fetchOrderDetails()}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Status</span>
          </button>
        </div>

        {/* Order Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#E23744] uppercase tracking-wider font-mono">
                  {order.orderNumber}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500">
                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-1">
                {restaurant?.name || 'Restaurant'}
              </h1>
              <p className="text-xs text-slate-500">
                Delivering to: <span className="font-semibold text-slate-700">{order.deliveryAddress.addressLine}, {order.deliveryAddress.city}</span>
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-500 block">Estimated Arrival</span>
              <span className="text-lg font-black text-slate-900 tabular-nums">
                {isCancelled ? 'Order Cancelled' : order.orderStatus === 'delivered' ? 'Delivered' : order.estimatedDeliveryTime}
              </span>
            </div>
          </div>

          {/* Interactive Live Route Map */}
          {!isCancelled && (
            <div className="mt-6">
              <LiveDriverMap
                orderStatus={order.orderStatus}
                driverName={order.driverDetails?.name}
                vehicleNumber={order.driverDetails?.vehicleNumber}
                restaurantName={restaurant?.name}
                deliveryAddress={order.deliveryAddress.addressLine}
              />
            </div>
          )}

          {/* Order Status Timeline Bar */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            {isCancelled ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800">
                <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold">This order has been cancelled</h4>
                  <p className="text-[11px] text-red-600">
                    Payment status: {order.paymentStatus === 'refunded' ? 'Refund initiated' : 'No charge'}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
                  Live Order Progression
                </p>

                {/* Stepper Grid */}
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0 hidden md:block">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-500"
                      style={{
                        width: `${(Math.max(0, currentStepIndex) / (ORDER_STEPS.length - 1)) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 relative z-10">
                    {ORDER_STEPS.map((step, idx) => {
                      const isComplete = idx <= currentStepIndex;
                      const isCurrent = idx === currentStepIndex;
                      const Icon = step.icon;

                      return (
                        <div key={step.key} className="flex flex-col items-center text-center">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                              isCurrent
                                ? 'bg-[#E23744] text-white ring-4 ring-red-100 shadow-sm'
                                : isComplete
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>

                          <span
                            className={`text-xs mt-2 font-semibold ${
                              isCurrent
                                ? 'text-[#E23744] font-bold'
                                : isComplete
                                ? 'text-slate-900'
                                : 'text-slate-400'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status Note History */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1">
            <span className="font-semibold text-slate-700">Latest Update: </span>
            <span>
              {order.statusHistory[order.statusHistory.length - 1]?.note || 'Processing smoothly'}
            </span>
          </div>

          {/* Cancel Order Action */}
          {isEligibleForCancel && (
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Need to make adjustments?</span>
              <button
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition-colors"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          )}
        </div>

        {/* Order Details & Receipt */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Item Summary
          </h3>

          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 tabular-nums">{item.quantity}x</span>
                  <span className="text-slate-800">{item.name}</span>
                </div>
                <span className="font-semibold tabular-nums text-slate-900">
                  ₹{item.price * item.quantity}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Item Subtotal</span>
              <span className="tabular-nums font-semibold text-slate-800">₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="tabular-nums">₹{order.deliveryFee}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxes (GST 5%)</span>
              <span className="tabular-nums">₹{order.tax}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount ({order.couponCode})</span>
                <span className="tabular-nums">-₹{order.discount}</span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
              <span>Grand Total</span>
              <span className="text-[#E23744] tabular-nums">₹{order.totalAmount}</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Payment Method: <strong className="uppercase text-slate-700">{order.paymentMethod}</strong></span>
            <span className={`font-bold ${order.paymentStatus === 'completed' ? 'text-emerald-600' : 'text-amber-600'}`}>
              Status: {order.paymentStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
