import React, { createContext, useContext, useState } from 'react';

export interface LocationArea {
  name: string;
  city: string;
  lat: number;
  lng: number;
}

export const POPULAR_LOCATIONS: LocationArea[] = [
  { name: 'Indiranagar', city: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Koramangala', city: 'Bengaluru', lat: 12.9352, lng: 77.6245 },
  { name: 'HSR Layout', city: 'Bengaluru', lat: 12.9116, lng: 77.6476 },
  { name: 'Church Street', city: 'Bengaluru', lat: 12.9752, lng: 77.6033 },
  { name: 'MG Road', city: 'Bengaluru', lat: 12.9756, lng: 77.6186 },
  { name: 'Whitefield', city: 'Bengaluru', lat: 12.9698, lng: 77.7499 },
];

interface LocationContextType {
  currentLocation: LocationArea;
  setLocation: (loc: LocationArea) => void;
  isLocationModalOpen: boolean;
  openLocationModal: () => void;
  closeLocationModal: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<LocationArea>(() => {
    try {
      const stored = localStorage.getItem('zomato_current_location');
      return stored ? JSON.parse(stored) : POPULAR_LOCATIONS[0];
    } catch {
      return POPULAR_LOCATIONS[0];
    }
  });

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const setLocation = (loc: LocationArea) => {
    setCurrentLocation(loc);
    localStorage.setItem('zomato_current_location', JSON.stringify(loc));
    setIsLocationModalOpen(false);
  };

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        setLocation,
        isLocationModalOpen,
        openLocationModal: () => setIsLocationModalOpen(true),
        closeLocationModal: () => setIsLocationModalOpen(false),
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
