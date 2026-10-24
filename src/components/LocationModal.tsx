import React, { useState } from 'react';
import { X, MapPin, Search, Check } from 'lucide-react';
import { useLocation, POPULAR_LOCATIONS, LocationArea } from '../context/LocationContext.js';

export const LocationModal: React.FC = () => {
  const { currentLocation, setLocation, isLocationModalOpen, closeLocationModal } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isLocationModalOpen) return null;

  const filteredLocations = POPULAR_LOCATIONS.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCustomLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const custom: LocationArea = {
      name: searchQuery.trim(),
      city: 'Bengaluru',
      lat: 12.9716,
      lng: 77.5946,
    };
    setLocation(custom);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#E23744]" />
            <h3 className="text-base font-bold text-slate-900">Select Delivery Location</h3>
          </div>
          <button
            onClick={closeLocationModal}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleCustomLocation} className="relative mb-5">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search delivery area or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E23744]/20 focus:border-[#E23744] transition-all"
            />
          </form>

          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Popular Areas in Bengaluru
          </p>

          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {filteredLocations.map((loc) => {
              const isSelected =
                loc.name.toLowerCase() === currentLocation.name.toLowerCase();
              return (
                <button
                  key={loc.name}
                  onClick={() => setLocation(loc)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-red-50 text-[#E23744] font-semibold border border-red-200'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className={`w-4 h-4 ${isSelected ? 'text-[#E23744]' : 'text-slate-400'}`} />
                    <div>
                      <p className="leading-tight">{loc.name}</p>
                      <p className="text-xs text-slate-400 font-normal">{loc.city}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#E23744]" />}
                </button>
              );
            })}

            {filteredLocations.length === 0 && searchQuery.trim() && (
              <button
                onClick={handleCustomLocation}
                className="w-full p-3 text-left rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sm text-slate-700 font-medium"
              >
                Deliver to &ldquo;<span className="font-bold text-slate-900">{searchQuery}</span>, Bengaluru&rdquo;
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
