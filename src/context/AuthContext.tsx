// AuthContext.tsx - Updated with role management
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

interface AuthContextType {
  user: User | null;
  userRole: 'worker' | 'employer' | 'both' | null;
  loading: boolean;
  signUpWithEmail: (email: string, password: string, fullName: string, role: 'worker' | 'employer') => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  switchRole: (role: 'worker' | 'employer') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'worker' | 'employer' | 'both' | null>(null);
  const [loading, setLoading] = useState(true);

  const isMockMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Fetch user role from profiles table
  const fetchUserRole = async (userId: string) => {
    if (isMockMode) {
      const storedRole = localStorage.getItem('userRole') as any;
      setUserRole(storedRole || 'both');
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (!error && data) {
      setUserRole(data.role);
      // Store in localStorage for quick access
      localStorage.setItem('userRole', data.role);
    }
  };

  useEffect(() => {
    if (isMockMode) {
      const mockUser = localStorage.getItem('mockUser');
      if (mockUser) {
        setUser(JSON.parse(mockUser));
        const storedRole = localStorage.getItem('userRole') as any;
        setUserRole(storedRole || 'both');
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await fetchUserRole(currentUser.id);
      } else {
        localStorage.removeItem('userRole');
        setUserRole(null);
      }
      
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await fetchUserRole(currentUser.id);
      } else {
        localStorage.removeItem('userRole');
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // AuthContext.tsx - Updated signUpWithEmail
  const signUpWithEmail = async (email: string, password: string, fullName: string, role: 'worker' | 'employer') => {
    if (isMockMode) {
      const mockUser = {
        id: `mock-user-${Date.now()}`,
        email,
        user_metadata: { 
          full_name: fullName,
          role: 'both' // Set 'both' in mock mode for dual-role testing
        }
      } as any;
      
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
      localStorage.setItem('userRole', 'both');
      setUser(mockUser);
      setUserRole('both');
      return;
    }

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          full_name: fullName,
          role: role 
        },
      },
    });
    
    if (signUpError) throw signUpError;
    
    // Wait for trigger and retry if needed
    let retries = 0;
    while (retries < 5) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user?.id)
        .single();
      
      if (profile) break;
      retries++;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (isMockMode) {
      const isEmployerInput = email.includes('employer');
      const mockUser = {
        id: isEmployerInput ? 'mock-employer-123' : 'mock-worker-123',
        email,
        user_metadata: {
          full_name: isEmployerInput ? 'Sabah Cafe Owner' : 'Ahmad Rosli',
          role: 'both' // Set 'both' in mock mode for dual-role testing
        }
      } as any;

      localStorage.setItem('mockUser', JSON.stringify(mockUser));
      localStorage.setItem('userRole', 'both');
      setUser(mockUser);
      setUserRole('both');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logOut = async () => {
    if (isMockMode) {
      localStorage.removeItem('mockUser');
      localStorage.removeItem('userRole');
      setUser(null);
      setUserRole(null);
      sessionStorage.clear();
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear all local state
      localStorage.removeItem('userRole');
      setUser(null);
      setUserRole(null);
      
      // Optional: Clear any other cached data
      sessionStorage.clear();
      
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if Supabase fails
      localStorage.removeItem('userRole');
      setUser(null);
      setUserRole(null);
    }
  };

  // Switch role (for users with dual roles - admin/employer)
  const switchRole = async (role: 'worker' | 'employer') => {
    if (!user) throw new Error('No user logged in');
    
    if (isMockMode) {
      setUserRole(role);
      localStorage.setItem('userRole', role);
      return;
    }

    // Verify user has this role (from profiles table)
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (error) throw error;
    
    if (data.role !== role && data.role !== 'both') {
      throw new Error(`User does not have ${role} role`);
    }
    
    setUserRole(role);
    localStorage.setItem('userRole', role);
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, signUpWithEmail, signInWithEmail, logOut, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}