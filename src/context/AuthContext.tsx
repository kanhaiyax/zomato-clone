import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, SavedAddress } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string, phone?: string, role?: 'customer' | 'owner') => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string, phone: string) => Promise<void>;
  addAddress: (address: Omit<SavedAddress, 'id'>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  switchDemoAccount: (role: 'customer' | 'owner' | 'admin') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    // Check current session
    api.get<{ success: boolean; user: User }>('/api/auth/me')
      .then((res) => {
        if (res.success && res.user) {
          setUser(res.user);
        }
      })
      .catch(() => {
        // Not logged in or expired
        localStorage.removeItem('zomato_auth_token');
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (email: string, pass: string) => {
    const res = await api.post<{ success: boolean; user: User; token: string }>('/api/auth/login', {
      email,
      password: pass,
    });
    if (res.success && res.user) {
      setUser(res.user);
      if (res.token) {
        localStorage.setItem('zomato_auth_token', res.token);
      }
      closeAuthModal();
    }
  };

  const register = async (
    name: string,
    email: string,
    pass: string,
    phone?: string,
    role: 'customer' | 'owner' = 'customer'
  ) => {
    const res = await api.post<{ success: boolean; user: User; token: string }>('/api/auth/register', {
      name,
      email,
      password: pass,
      phone,
      role,
    });
    if (res.success && res.user) {
      setUser(res.user);
      if (res.token) {
        localStorage.setItem('zomato_auth_token', res.token);
      }
      closeAuthModal();
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('zomato_auth_token');
    setUser(null);
  };

  const updateProfile = async (name: string, phone: string) => {
    const res = await api.put<{ success: boolean; user: User }>('/api/auth/profile', { name, phone });
    if (res.success && res.user) {
      setUser(res.user);
    }
  };

  const addAddress = async (address: Omit<SavedAddress, 'id'>) => {
    const res = await api.post<{ success: boolean; savedAddresses: SavedAddress[] }>('/api/auth/addresses', address);
    if (res.success && user) {
      setUser({ ...user, savedAddresses: res.savedAddresses });
    }
  };

  const deleteAddress = async (id: string) => {
    const res = await api.delete<{ success: boolean; savedAddresses: SavedAddress[] }>(`/api/auth/addresses/${id}`);
    if (res.success && user) {
      setUser({ ...user, savedAddresses: res.savedAddresses });
    }
  };

  const switchDemoAccount = async (role: 'customer' | 'owner' | 'admin') => {
    const credentials = {
      customer: { email: 'alex@example.com', pass: 'password123' },
      owner: { email: 'chef@paradise.com', pass: 'password123' },
      admin: { email: 'admin@zomato.com', pass: 'admin123' },
    };

    const target = credentials[role];
    await login(target.email, target.pass);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        updateProfile,
        addAddress,
        deleteAddress,
        switchDemoAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
