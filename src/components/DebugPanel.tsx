// components/DebugPanel.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Bug, RefreshCw, Database, Wallet, Users } from 'lucide-react';

export default function DebugPanel() {
  const { user } = useAuth();
  const [dbStatus, setDbStatus] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const checkDatabase = async () => {
    setLoading(true);
    const results: Record<string, any> = {};
    
    // Check wallets
    const { data: wallets, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user?.id);
    results.wallets = { data: wallets, error: walletError?.message };
    
    // Check wallet_transactions
    const { data: transactions, error: txError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user?.id);
    results.transactions = { count: transactions?.length || 0, error: txError?.message };
    
    // Check hired_workers
    const { data: hired, error: hiredError } = await supabase
      .from('hired_workers')
      .select('*')
      .eq('employer_id', user?.id);
    results.hiredWorkers = { count: hired?.length || 0, error: hiredError?.message };
    
    setDbStatus(results);
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-gray-900 text-white rounded-lg shadow-xl overflow-hidden">
        <button 
          onClick={() => setDbStatus(prev => Object.keys(prev).length ? {} : {})}
          className="px-3 py-2 bg-gray-800 hover:bg-gray-700 flex items-center gap-2 text-xs"
        >
          <Bug size={14} />
          Debug
        </button>
        
        {Object.keys(dbStatus).length > 0 && (
          <div className="p-3 max-w-md text-xs space-y-2 border-t border-gray-700">
            <div className="flex justify-between items-center">
              <span className="font-bold">Database Status</span>
              <button onClick={checkDatabase} disabled={loading} className="text-gray-400 hover:text-white">
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Wallet size={12} />
                <span>Wallet: {dbStatus.wallets?.data?.[0]?.balance || 'Not found'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Database size={12} />
                <span>Transactions: {dbStatus.transactions?.count || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={12} />
                <span>Hired Workers: {dbStatus.hiredWorkers?.count || 0}</span>
              </div>
              
              {(dbStatus.wallets?.error || dbStatus.transactions?.error || dbStatus.hiredWorkers?.error) && (
                <div className="text-red-400 mt-2 pt-2 border-t border-gray-700">
                  <p className="font-bold">Errors:</p>
                  {dbStatus.wallets?.error && <p>Wallets: {dbStatus.wallets.error}</p>}
                  {dbStatus.transactions?.error && <p>Transactions: {dbStatus.transactions.error}</p>}
                  {dbStatus.hiredWorkers?.error && <p>Hired Workers: {dbStatus.hiredWorkers.error}</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}