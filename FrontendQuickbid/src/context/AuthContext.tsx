import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '../api/client';
import type { LoginResponse } from '../api/auth';

const STORAGE_KEY = '@quickbid_auth';

interface AuthUser {
  email: string;
  nombre: string;
  categoria: string;
  estadoCuenta: string;
  requiereMedioPago: boolean;
  tieneMultasActivas: boolean;
}

interface PersistedAuth {
  token: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
  login: (response: LoginResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,        setUser]        = useState<AuthUser | null>(null);
  const [token,       setToken]       = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  // Restaurar sesión al iniciar
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (!raw) return;
        const saved: PersistedAuth = JSON.parse(raw);
        setUser(saved.user);
        setToken(saved.token);
        setAuthToken(saved.token);
      })
      .catch(() => { /* sesión corrupta — ignorar */ })
      .finally(() => setIsRestoring(false));
  }, []);

  const login = useCallback((response: LoginResponse) => {
    const u: AuthUser = {
      email:              response.email,
      nombre:             response.nombre,
      categoria:          response.categoria,
      estadoCuenta:       response.estadoCuenta,
      requiereMedioPago:  response.requiereMedioPago,
      tieneMultasActivas: response.tieneMultasActivas,
    };
    setUser(u);
    setToken(response.token);
    setAuthToken(response.token);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ token: response.token, user: u })).catch(() => {});
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isRestoring, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
