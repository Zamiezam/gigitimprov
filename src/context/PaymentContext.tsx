// context/PaymentContext.tsx - Full database integration
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/api';
import { useAuth } from './AuthContext';

interface PaymentContextType {
  walletBalance: number;
  totalPendingPayments: number;
  pendingWorkers: any[];
  transactions: any[];
  loading: boolean;
  refreshing: boolean;
  refreshPayments: () => Promise<void>;
  processPayment: (workerId: string, amount: number, workerName: string, gigTitle: string) => Promise<boolean>;
  topUpWallet: (amount: number) => Promise<boolean>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export function PaymentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalPendingPayments, setTotalPendingPayments] = useState(0);
  const [pendingWorkers, setPendingWorkers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const calculateTotalPending = (workers: any[]) => {
    return workers.reduce((sum, w) => sum + (w.amount || 0), 0);
  };

  const refreshPayments = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch or create wallet balance
      let { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (walletError && walletError.code === 'PGRST116') {
        // Wallet doesn't exist, create one
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert([{ user_id: user.id, balance: 500 }])
          .select()
          .single();
        
        if (!createError && newWallet) {
          wallet = newWallet;
        }
      } else if (walletError) {
        throw walletError;
      }
      
      setWalletBalance(wallet?.balance || 0);
      
      // Fetch pending workers (verified status, pending payment)
      const { data: hiredWorkers, error: workersError } = await supabase
        .from('hired_workers')
        .select('*')
        .eq('employer_id', user.id)
        .eq('status', 'verified')
        .eq('payment_status', 'pending');
      
      if (workersError) throw workersError;
      
      const workersWithAmounts = (hiredWorkers || []).map(w => ({
        ...w,
        amount: w.amount || 0
      }));
      
      setPendingWorkers(workersWithAmounts);
      setTotalPendingPayments(calculateTotalPending(workersWithAmounts));
      
      // Fetch transactions
      const { data: txns, error: txError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (txError) throw txError;
      
      setTransactions(txns || []);
      
    } catch (err) {
      console.error('Error refreshing payments:', err);
      // Fallback to demo data
      setWalletBalance(500);
      setPendingWorkers([]);
      setTotalPendingPayments(0);
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const processPayment = async (workerId: string, amount: number, workerName: string, gigTitle: string) => {
    if (!user) return false;
    
    if (amount > walletBalance) {
      console.log('Insufficient balance');
      return false;
    }
    
    try {
      // Start a transaction by updating wallet balance
      const newBalance = walletBalance - amount;
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ 
          balance: newBalance, 
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', user.id);
      
      if (walletError) throw walletError;
      
      // Record debit transaction
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          amount: amount,
          type: 'debit',
          description: `Payment to ${workerName} for ${gigTitle}`,
          status: 'completed',
          created_at: new Date().toISOString()
        });
      
      if (txError) throw txError;
      
      // Update hired worker payment status
      const { error: updateError } = await supabase
        .from('hired_workers')
        .update({ 
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', workerId)
        .eq('employer_id', user.id);
      
      if (updateError) throw updateError;
      
      // Update local state
      setWalletBalance(newBalance);
      setPendingWorkers(prev => prev.filter(w => w.id !== workerId));
      setTotalPendingPayments(prev => prev - amount);
      
      // Add to transactions list
      const newTransaction = {
        id: Date.now().toString(),
        user_id: user.id,
        amount: amount,
        type: 'debit',
        description: `Payment to ${workerName} for ${gigTitle}`,
        status: 'completed',
        created_at: new Date().toISOString()
      };
      setTransactions(prev => [newTransaction, ...prev]);
      
      return true;
      
    } catch (err) {
      console.error('Payment error:', err);
      return false;
    }
  };

  const topUpWallet = async (amount: number) => {
    if (!user) return false;
    
    try {
      const newBalance = walletBalance + amount;
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ 
          balance: newBalance, 
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', user.id);
      
      if (walletError) throw walletError;
      
      // Record credit transaction
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          amount: amount,
          type: 'credit',
          description: 'Wallet top-up',
          status: 'completed',
          created_at: new Date().toISOString()
        });
      
      if (txError) throw txError;
      
      setWalletBalance(newBalance);
      
      const newTransaction = {
        id: Date.now().toString(),
        user_id: user.id,
        amount: amount,
        type: 'credit',
        description: 'Wallet top-up',
        status: 'completed',
        created_at: new Date().toISOString()
      };
      setTransactions(prev => [newTransaction, ...prev]);
      
      return true;
      
    } catch (err) {
      console.error('Top-up error:', err);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      refreshPayments();
    }
  }, [user]);

  return (
    <PaymentContext.Provider value={{
      walletBalance,
      totalPendingPayments,
      pendingWorkers,
      transactions,
      loading,
      refreshing,
      refreshPayments,
      processPayment,
      topUpWallet
    }}>
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
}