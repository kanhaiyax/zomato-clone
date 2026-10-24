import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useCart } from '../context/CartContext.js';

export const ConflictModal: React.FC = () => {
  const { restaurantConflict, resolveConflict, activeRestaurantName } = useCart();

  if (!restaurantConflict) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 leading-snug">
          Replace items already in cart?
        </h3>

        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          Your cart currently contains delicious food from{' '}
          <span className="font-semibold text-slate-900">{activeRestaurantName || 'another restaurant'}</span>.
          Do you want to discard those items and start a new order from{' '}
          <span className="font-semibold text-slate-900">{restaurantConflict.restaurantName}</span>?
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={() => resolveConflict(false)}
            className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Keep Current Cart
          </button>
          <button
            onClick={() => resolveConflict(true)}
            className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-[#E23744] hover:bg-[#d02c38] rounded-xl shadow-xs transition-colors"
          >
            Discard &amp; Add New
          </button>
        </div>
      </div>
    </div>
  );
};
