'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, getCurrentUser, signInWithEmail, signUpWithEmail, signOut } from '@/lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  loginDemo: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const current = await getCurrentUser();
        setUser(current);
      } catch (err) {
        console.error('Failed to load user session:', err);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const logged = await signInWithEmail(email, pass);
    setUser(logged);
  };

  const register = async (email: string, pass: string, name: string) => {
    const created = await signUpWithEmail(email, pass, name);
    setUser(created);
  };

  const loginDemo = async () => {
    const demo = await signInWithEmail('student@gapfinder.ai', 'academic2026');
    setUser(demo);
  };

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
