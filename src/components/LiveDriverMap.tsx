import React, { useEffect, useState } from 'react';
import { Navigation, Bike, Store, Home, CheckCircle2 } from 'lucide-react';

interface LiveDriverMapProps {
  orderStatus: string;
  driverName?: string;
  vehicleNumber?: string;
  restaurantName?: string;
  deliveryAddress?: string;
}

export const LiveDriverMap: React.FC<LiveDriverMapProps> = ({
  orderStatus,
  driverName = 'Suresh Kumar',
  vehicleNumber = 'KA 01 EK 9102',
  restaurantName = 'Paradise Biryani',
  deliveryAddress = 'Indiranagar, Bengaluru',
}) => {
  // Progress along the route from 0% (at restaurant) to 100% (at customer)
  const [progress, setProgress] = useState(
    orderStatus === 'delivered' ? 100 : orderStatus === 'out_for_delivery' ? 55 : 15
  );

  useEffect(() => {
    if (orderStatus === 'out_for_delivery') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return 95;
          return prev + 1;
        });
      }, 2500);
      return () => clearInterval(interval);
    } else if (orderStatus === 'delivered') {
      setProgress(100);
    } else {
      setProgress(15);
    }
  }, [orderStatus]);

  // Interpolate coordinates along an SVG curved path
  // SVG coordinates: Origin (80, 160), Control (240, 50), Destination (400, 140)
  const t = progress / 100;
  const p0 = { x: 70, y: 150 };
  const p1 = { x: 230, y: 50 };
  const p2 = { x: 410, y: 140 };

  // Quadratic bezier formula: B(t) = (1-t)^2*P0 + 2(1-t)t*P1 + t^2*P2
  const driverX = Math.round((1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x);
  const driverY = Math.round((1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y);

  return (
    <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-lg text-white">
      {/* Top Map Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <div className="bg-slate-800/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/80 flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-[#E23744] animate-pulse" />
          <span className="text-xs font-semibold text-slate-200">
            {orderStatus === 'out_for_delivery'
              ? 'Driver on the way'
              : orderStatus === 'delivered'
              ? 'Order Delivered'
              : 'Driver assigned to restaurant'}
          </span>
        </div>
        <div className="bg-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs font-bold text-amber-400 tabular-nums">
          {orderStatus === 'delivered' ? 'Completed' : orderStatus === 'out_for_delivery' ? '12 mins away' : '25 mins'}
        </div>
      </div>

      {/* SVG Map Canvas */}
      <div className="w-full h-56 sm:h-64 relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
        <svg className="w-full h-full" viewBox="0 0 480 220" fill="none">
          {/* Subtle grid roads */}
          <path d="M 0 100 Q 240 80 480 120" stroke="#334155" strokeWidth="6" opacity="0.4" />
          <path d="M 120 0 Q 180 110 240 220" stroke="#334155" strokeWidth="4" opacity="0.3" />
          <path d="M 320 0 Q 300 110 360 220" stroke="#334155" strokeWidth="4" opacity="0.3" />

          {/* Planned Delivery Route */}
          <path
            d="M 70 150 Q 230 50 410 140"
            stroke="#475569"
            strokeWidth="4"
            strokeDasharray="6 6"
          />

          {/* Traveled Route in Zomato Red */}
          <path
            d="M 70 150 Q 230 50 410 140"
            stroke="#E23744"
            strokeWidth="4"
            strokeDasharray="400"
            strokeDashoffset={400 - (400 * progress) / 100}
            className="transition-all duration-700"
          />

          {/* Restaurant Origin Node */}
          <g transform="translate(70, 150)">
            <circle r="16" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
            <circle r="6" fill="#E23744" />
          </g>

          {/* Customer Destination Node */}
          <g transform="translate(410, 140)">
            <circle r="16" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
            <circle r="6" fill="#10b981" />
          </g>

          {/* Driver Vehicle Marker */}
          <g transform={`translate(${driverX}, ${driverY})`} className="transition-all duration-700">
            <circle r="18" fill="#E23744" className="shadow-lg animate-pulse opacity-20" />
            <circle r="13" fill="#E23744" stroke="#ffffff" strokeWidth="2" />
          </g>
        </svg>

        {/* Labels pinned to DOM */}
        <div className="absolute left-6 bottom-4 flex items-center gap-2 bg-slate-800/90 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-slate-700 text-[11px]">
          <Store className="w-3.5 h-3.5 text-[#E23744]" />
          <span className="font-semibold truncate max-w-[120px]">{restaurantName}</span>
        </div>

        <div className="absolute right-6 bottom-4 flex items-center gap-2 bg-slate-800/90 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-slate-700 text-[11px]">
          <Home className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold truncate max-w-[120px]">{deliveryAddress}</span>
        </div>
      </div>

      {/* Driver Footer strip */}
      <div className="px-6 py-3.5 bg-slate-850 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-750 flex items-center justify-center text-slate-300 border border-slate-700">
            <Bike className="w-5 h-5 text-[#E23744]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-100">{driverName}</span>
              <span className="text-[10px] text-amber-400 font-bold">★ 4.8</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">{vehicleNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {orderStatus === 'delivered' ? (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Delivered
            </span>
          ) : (
            <button
              onClick={() => alert(`Calling driver ${driverName} at +91 98450 44321`)}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-650 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              Contact Driver
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
