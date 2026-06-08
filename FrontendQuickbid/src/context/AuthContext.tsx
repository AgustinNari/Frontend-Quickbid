import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  authApi,
  EstadoCuenta,
  LoginResponse,
  UsuarioSesion,
} from '../api/auth';
import {
  configureSessionHandlers,
  RefreshedSession,
  setSessionTokens,
} from '../api/client';

const STORAGE_KEY = '@quickbid_auth';

type AuthMode = 'anonymous' | 'guest' | 'authenticated';

interface AuthSession {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  estadoCuenta: EstadoCuenta;
  usuario: UsuarioSesion;
}

interface PersistedAuth {
  mode: Exclude<AuthMode, 'anonymous'>;
  session: AuthSession | null;
}

interface AuthContextValue {
  mode: AuthMode;
  session: AuthSession | null;
  user: UsuarioSesion | null;
  accessToken: string | null;
  refreshToken: string | null;
  estadoCuenta: EstadoCuenta | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isRestoring: boolean;
  canNavigate: boolean;
  canPerformEconomicActions: boolean;
  login: (response: LoginResponse) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  clearSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function asAuthSession(response: LoginResponse): AuthSession {
  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    tokenType: response.tokenType,
    expiresIn: response.expiresIn,
    estadoCuenta: response.estadoCuenta,
    usuario: response.usuario,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AuthMode>('anonymous');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  const persistAuthenticated = useCallback(async (nextSession: AuthSession) => {
    setSession(nextSession);
    setMode('authenticated');
    setSessionTokens(nextSession.accessToken, nextSession.refreshToken);
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ mode: 'authenticated', session: nextSession }),
    );
  }, []);

  const clearSession = useCallback(async () => {
    setSession(null);
    setMode('anonymous');
    setSessionTokens(null, null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const applyRefresh = useCallback(
    async (refreshed: RefreshedSession) => {
      await persistAuthenticated(asAuthSession(refreshed as LoginResponse));
    },
    [persistAuthenticated],
  );

  useEffect(() => {
    configureSessionHandlers({
      onRefreshed: applyRefresh,
      onExpired: clearSession,
    });
  }, [applyRefresh, clearSession]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (!raw) return;
        const saved = JSON.parse(raw) as PersistedAuth;
        if (saved.mode === 'guest') {
          setMode('guest');
          return;
        }
        if (saved.mode === 'authenticated' && saved.session) {
          setSession(saved.session);
          setMode('authenticated');
          setSessionTokens(
            saved.session.accessToken,
            saved.session.refreshToken,
          );
        }
      })
      .catch(() => clearSession())
      .finally(() => setIsRestoring(false));
  }, [clearSession]);

  const login = useCallback(
    async (response: LoginResponse) => {
      await persistAuthenticated(asAuthSession(response));
    },
    [persistAuthenticated],
  );

  const continueAsGuest = useCallback(async () => {
    setSession(null);
    setMode('guest');
    setSessionTokens(null, null);
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ mode: 'guest', session: null }),
    );
  }, []);

  const refreshSession = useCallback(async () => {
    if (!session?.refreshToken) return false;
    try {
      const response = await authApi.refresh({
        refreshToken: session.refreshToken,
      });
      if (!response.data) {
        await clearSession();
        return false;
      }
      await persistAuthenticated(asAuthSession(response.data));
      return true;
    } catch {
      await clearSession();
      return false;
    }
  }, [clearSession, persistAuthenticated, session?.refreshToken]);

  const logout = useCallback(async () => {
    const refreshToken = session?.refreshToken;
    try {
      if (refreshToken) await authApi.logout({ refreshToken });
    } catch {
    } finally {
      await clearSession();
    }
  }, [clearSession, session?.refreshToken]);

  const value = useMemo<AuthContextValue>(() => {
    const estadoCuenta = session?.estadoCuenta ?? null;
    return {
      mode,
      session,
      user: session?.usuario ?? null,
      accessToken: session?.accessToken ?? null,
      refreshToken: session?.refreshToken ?? null,
      estadoCuenta,
      isAuthenticated: mode === 'authenticated' && !!session,
      isGuest: mode === 'guest',
      isRestoring,
      canNavigate:
        mode === 'authenticated' && estadoCuenta !== 'bloqueada_permanente',
      canPerformEconomicActions:
        mode === 'authenticated' && estadoCuenta === 'activa',
      login,
      logout,
      continueAsGuest,
      refreshSession,
      clearSession,
    };
  }, [
    clearSession,
    continueAsGuest,
    isRestoring,
    login,
    logout,
    mode,
    refreshSession,
    session,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
