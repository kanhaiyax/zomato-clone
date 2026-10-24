import React, { useState } from 'react';
import { X, CreditCard, Smartphone, Building2, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';

interface RazorpayModalProps {
  isOpen: boolean;
  amount: number;
  razorpayOrderId: string;
  onSuccess: (paymentDetails: { paymentId: string; orderId: string; signature: string }) => void;
  onCancel: () => void;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  isOpen,
  amount,
  razorpayOrderId,
  onSuccess,
  onCancel,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('user@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    try {
      // Obtain valid cryptographic test signature from backend
      const res = await api.post<{
        success: boolean;
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }>('/api/payments/simulate-signature', {
        razorpay_order_id: razorpayOrderId,
      });

      if (res.success) {
        onSuccess({
          orderId: res.razorpay_order_id,
          paymentId: res.razorpay_payment_id,
          signature: res.razorpay_signature,
        });
      }
    } catch (e) {
      console.error('Payment simulation failed:', e);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Razorpay Brand Header */}
        <div className="bg-[#0c2340] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-extrabold text-sm border border-blue-400/30">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-blue-300 font-semibold">
                  Razorpay Trusted Gateway
                </span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                  TEST MODE
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">Zomato Food Delivery</h4>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Banner */}
        <div className="bg-slate-50 px-6 py-3.5 border-b border-slate-200 flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-500">Order ID: <span className="font-mono text-slate-700">{razorpayOrderId}</span></p>
            <p className="text-xs text-slate-500">Includes all taxes and delivery fees</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Total Payable</span>
            <span className="text-xl font-black text-slate-900 tabular-nums">₹{amount}</span>
          </div>
        </div>

        {/* Method Selector Tabs */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedMethod('upi')}
              className={`py-2 px-3 rounded-xl border text-center transition-all ${
                selectedMethod === 'upi'
                  ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold'
              }`}
            >
              <Smartphone className="w-4 h-4 mx-auto mb-1 text-blue-600" />
              <span className="text-xs">UPI / QR</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMethod('card')}
              className={`py-2 px-3 rounded-xl border text-center transition-all ${
                selectedMethod === 'card'
                  ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold'
              }`}
            >
              <CreditCard className="w-4 h-4 mx-auto mb-1 text-blue-600" />
              <span className="text-xs">Card</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMethod('netbanking')}
              className={`py-2 px-3 rounded-xl border text-center transition-all ${
                selectedMethod === 'netbanking'
                  ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold'
              }`}
            >
              <Building2 className="w-4 h-4 mx-auto mb-1 text-blue-600" />
              <span className="text-xs">Netbanking</span>
            </button>
          </div>

          {/* Method Content */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
            {selectedMethod === 'upi' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Enter UPI VPA / ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
                <p className="text-[11px] text-slate-500">Supports Google Pay, PhonePe, Paytm, CRED</p>
              </div>
            )}

            {selectedMethod === 'card' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Test Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    defaultValue="12/28"
                    placeholder="MM/YY"
                    className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                  />
                  <input
                    type="text"
                    defaultValue="894"
                    placeholder="CVV"
                    className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
            )}

            {selectedMethod === 'netbanking' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Select Bank</label>
                <select className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg">
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>State Bank of India</option>
                  <option>Axis Bank</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>256-bit SSL encrypted · Verified by Razorpay test environment</span>
          </div>

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSimulatePayment}
              disabled={isProcessing}
              className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Pay ₹{amount}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
