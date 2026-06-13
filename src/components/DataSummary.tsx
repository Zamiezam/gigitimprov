// components/DataSummary.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Briefcase, DollarSign, CheckCircle, Clock } from 'lucide-react';

export default function DataSummary() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalGigs: 0,
    hiredWorkers: 0,
    pendingPayments: 0,
    totalPaid: 0,
    walletBalance: 0,
  });

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    // Get gig count
    const { count: gigCount } = await supabase
      .from('gigs')
      .select('*', { count: 'exact', head: true })
      .eq('employer_id', user?.id);

    // Get hired workers count
    const { count: hiredCount } = await supabase
      .from('hired_workers')
      .select('*', { count: 'exact', head: true })
      .eq('employer_id', user?.id);

    // Get pending payments
    const { data: pendingWorkers } = await supabase
      .from('hired_workers')
      .select('amount')
      .eq('employer_id', user?.id)
      .eq('payment_status', 'pending')
      .eq('status', 'verified');

    const pendingTotal = pendingWorkers?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;

    // Get wallet balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user?.id)
      .single();

    setStats({
      totalGigs: gigCount || 0,
      hiredWorkers: hiredCount || 0,
      pendingPayments: pendingTotal,
      totalPaid: 0, // Calculate from transactions
      walletBalance: wallet?.balance || 0,
    });
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl p-4">
        <p className="text-xs opacity-90">Wallet Balance</p>
        <p className="text-2xl font-bold">RM {stats.walletBalance.toFixed(2)}</p>
      </div>
      <div className="bg-white rounded-xl border p-4">
        <Briefcase size={20} className="text-primary mb-2" />
        <p className="text-2xl font-bold">{stats.totalGigs}</p>
        <p className="text-xs text-on-surface-variant">Active Gigs</p>
      </div>
      <div className="bg-white rounded-xl border p-4">
        <Users size={20} className="text-secondary mb-2" />
        <p className="text-2xl font-bold">{stats.hiredWorkers}</p>
        <p className="text-xs text-on-surface-variant">Hired Workers</p>
      </div>
      <div className="bg-white rounded-xl border p-4">
        <Clock size={20} className="text-amber-600 mb-2" />
        <p className="text-2xl font-bold">RM {stats.pendingPayments.toFixed(2)}</p>
        <p className="text-xs text-on-surface-variant">Pending Payments</p>
      </div>
      <div className="bg-white rounded-xl border p-4">
        <DollarSign size={20} className="text-green-600 mb-2" />
        <p className="text-2xl font-bold">{stats.hiredWorkers}</p>
        <p className="text-xs text-on-surface-variant">Workers Paid</p>
      </div>
    </div>
  );
}