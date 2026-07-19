'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const savedToken = localStorage.getItem('sechub_token');
      const savedUser = localStorage.getItem('sechub_user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        const cachedUser = JSON.parse(savedUser);
        setUser(cachedUser);
        try {
          const res = await api.users.getMe();
          if (mounted && res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('sechub_user', JSON.stringify(res.data));
          }
        } catch {
          // The request helper dispatches sechub_logout for expired sessions.
        }
      }

      if (mounted) {
        setLoading(false);
      }
    };

    loadSession();

    // Event listener for auto-logout (e.g. on 401 response)
    const handleAutoLogout = () => {
      setToken(null);
      setUser(null);
      setLoading(false);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    };
    window.addEventListener('sechub_logout', handleAutoLogout);
    return () => {
      mounted = false;
      window.removeEventListener('sechub_logout', handleAutoLogout);
    };
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.auth.login(username, password);
      if (res.success && res.data) {
        setToken(res.data.token);
        setUser(res.data.user);
      } else {
        throw new Error(res.message || 'Đăng nhập không thành công');
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.auth.register(username, email, password);
      if (res.success && res.data) {
        setToken(res.data.token);
        setUser(res.data.user);
      } else {
        throw new Error(res.message || 'Đăng ký không thành công');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.auth.logout();
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('sechub_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
