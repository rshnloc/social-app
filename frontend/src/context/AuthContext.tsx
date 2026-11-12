import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, displayName: string, email: string, password: string) => Promise<void>;
  loginAsDemo: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('nexus_token');
    if (token) {
      api.getMe()
        .then((userData) => setUser(userData))
        .catch(() => {
          localStorage.removeItem('nexus_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.login({ username, password });
    localStorage.setItem('nexus_token', res.access_token);
    setUser(res.user);
  };

  const register = async (username: string, displayName: string, email: string, password: string) => {
    const res = await api.register({
      username,
      display_name: displayName,
      email,
      password,
    });
    localStorage.setItem('nexus_token', res.access_token);
    setUser(res.user);
  };

  const loginAsDemo = async () => {
    await login('alex', 'password123');
  };

  const logout = () => {
    localStorage.removeItem('nexus_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginAsDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

