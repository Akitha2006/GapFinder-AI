import { supabase, isSupabaseConfigured } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isDemo?: boolean;
}

const DEMO_USER_STORAGE_KEY = 'gapfinder_demo_user';

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        return {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Student',
          isDemo: false,
        };
      }
    } catch {
      // Fall through to local check
    }
  }

  // Check client-side localStorage if in browser
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(DEMO_USER_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
  }

  return null;
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("No user returned from Supabase Auth");

    return {
      id: data.user.id,
      email: data.user.email || email,
      name: data.user.user_metadata?.full_name || email.split('@')[0],
      isDemo: false,
    };
  }

  // Development / Demo Account Fallback
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  const demoUser: AuthUser = {
    id: 'demo-student-uuid-42',
    email,
    name: email.split('@')[0].toUpperCase(),
    isDemo: true,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(demoUser));
  }

  return demoUser;
}

export async function signUpWithEmail(email: string, password: string, fullName: string): Promise<AuthUser> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Could not create user account.");

    return {
      id: data.user.id,
      email: data.user.email || email,
      name: fullName || email.split('@')[0],
      isDemo: false,
    };
  }

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const demoUser: AuthUser = {
    id: `user-${Date.now().toString(36)}`,
    email,
    name: fullName || email.split('@')[0],
    isDemo: true,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(demoUser));
  }

  return demoUser;
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DEMO_USER_STORAGE_KEY);
  }
}
