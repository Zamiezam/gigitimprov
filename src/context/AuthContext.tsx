// AuthContext.tsx - Fixed role management
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

interface AuthContextType {
  user: User | null;
  userRole: 'worker' | 'employer' | null;
  loading: boolean;
  signUpWithEmail: (email: string, password: string, fullName: string, role: 'worker' | 'employer', extraData?: Record<string, any>) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  switchRole: (role: 'worker' | 'employer') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'worker' | 'employer' | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user role from profiles table
  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (!error && data) {
      setUserRole(data.role);
      localStorage.setItem('userRole', data.role);
    }
  };

  useEffect(() => {
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

  const signUpWithEmail = async (email: string, password: string, fullName: string, role: 'worker' | 'employer', extraData?: Record<string, any>) => {
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
      
      if (profile) {
        // If extraData is provided, update the profile with it
        if (extraData && Object.keys(extraData).length > 0) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update(extraData)
            .eq('id', authData.user?.id);
            
          if (updateError) {
            console.error('Error updating profile with extraData:', updateError);
          }
        }
        break;
      }
      retries++;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      localStorage.removeItem('userRole');
      setUser(null);
      setUserRole(null);
      sessionStorage.clear();
      
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('userRole');
      setUser(null);
      setUserRole(null);
    }
  };

  const switchRole = async (role: 'worker' | 'employer') => {
    if (!user) throw new Error('No user logged in');
    
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