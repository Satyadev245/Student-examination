import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('datapro_auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const { user: fetchedUser } = await apiService.getMe();
        setUser(fetchedUser);
      } catch (err) {
        console.error('Session expired or invalid:', err);
        localStorage.removeItem('datapro_auth_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (identifier: string, pass: string) => {
    const res = await apiService.login(identifier, pass);
    localStorage.setItem('datapro_auth_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      localStorage.removeItem('datapro_auth_token');
      setToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const { user: fetchedUser } = await apiService.getMe();
      setUser(fetchedUser);
    } catch (e) {
      console.error('Error refreshing user:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
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
