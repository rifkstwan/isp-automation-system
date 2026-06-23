import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, AuthResponse } from '../api/services';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        try {
          const profile = await authApi.getProfile();
          setUser(profile.data);
        } catch {
          await AsyncStorage.removeItem('auth_token');
        }
      }
      setIsLoading(false);
    };
    checkToken();
  }, []);

  const login = async (email: string, password: string) => {
    const data: AuthResponse = await authApi.login({ email, password });
    setUser({
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.roles?.[0] ?? 'customer',
    });
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    await AsyncStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
