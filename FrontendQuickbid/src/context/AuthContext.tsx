import React, { createContext, useContext, useState, useCallback } from 'react';
import { setAuthToken } from '../api/client';
import type { LoginResponse } from '../api/auth';

interface AuthUser {
  email: string;
  nombre: string;
  apellido: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (response: LoginResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]   = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = useCallback((response: LoginResponse) => {
    setUser({ email: response.email, nombre: response.nombre, apellido: response.apellido });
    setToken(response.token);
    setAuthToken(response.token); // inyecta el token en todos los futuros fetch
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
