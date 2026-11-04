import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LoginCredentials, SignUpCredentials } from '../types/auth';
import {
  getStoredSession,
  loginUser,
  signUpUser,
  logoutUser,
} from '../services/authStorage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load session from AsyncStorage on app mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = await getStoredSession();
        if (session) {
          setToken(session.token);
          setUser(session.user);
        }
      } catch (error) {
        console.error('Failed to restore auth session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const session = await loginUser(credentials);
    setToken(session.token);
    setUser(session.user);
  }, []);

  const signUp = useCallback(async (credentials: SignUpCredentials) => {
    const session = await signUpUser(credentials);
    setToken(session.token);
    setUser(session.user);
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isLoading,
        login,
        signUp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
