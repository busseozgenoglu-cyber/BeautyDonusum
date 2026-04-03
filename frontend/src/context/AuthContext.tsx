import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setToken, removeToken } from '../utils/api';

type User = {
  user_id: string;
  email: string;
  name: string;
  subscription: string;
  analyses_count: number;
  role: string;
  picture?: string;
  language?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  googleLogin: (sessionId: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const { data } = await api.post('/auth/login', { email, password });
      await setToken(data.token);
      setUser(data.user);
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Giriş başarısız';
      setError(typeof msg === 'string' ? msg : 'Giriş başarısız');
      throw e;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setError(null);
      const { data } = await api.post('/auth/register', { email, password, name });
      await setToken(data.token);
      setUser(data.user);
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Kayıt başarısız';
      setError(typeof msg === 'string' ? msg : 'Kayıt başarısız');
      throw e;
    }
  };

  const googleLogin = async (sessionId: string) => {
    try {
      setError(null);
      const { data } = await api.post('/auth/google-session', { session_id: sessionId });
      await setToken(data.token);
      setUser(data.user);
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Google giriş başarısız';
      setError(typeof msg === 'string' ? msg : 'Google giriş başarısız');
      throw e;
    }
  };

  const logout = async () => {
    try {
      await removeToken();
    } finally {
      setUser(null);
      setError(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, clearError, login, register, googleLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
