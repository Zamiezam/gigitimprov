// components/Wallet.tsx - Using Payment Context
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePayment } from '../context/PaymentContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, Send, ArrowUpRight, ArrowDownRight, DollarSign, 
  Plus, History, RefreshCw, CheckCircle, AlertCircle, Users, X
} from 'lucide-react';
// import { X } from 'lucide-react';

export default function Wallet() {
  const { user } = useAuth();
  const { 
    walletBalance, 
    totalPendingPayments, 
    pendingWorkers, 
    transactions, 
    loading, 
    refreshPayments, 
    processPayment,
    topUpWallet 
  } = usePayment();
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [topupMethod, setTopupMethod] = useState('card');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshPayments();
    setToastMessage('✅ Data refreshed!');
    setTimeout(() => setToastMessage(null), 2000);
    setRefreshing(false);
  };

  const handleTopup = async () => {
    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount <= 0) {
      setToastMessage('Please enter a valid amount');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    
    const success = await topUpWallet(amount);
    if (success) {
      setToastMessage(`✅ RM ${amount.toFixed(2)} added to wallet!`);
      setShowTopupModal(false);
      setTopupAmount('');
    } else {
      setToastMessage('❌ Top-up failed. Please try again.');
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleProcessPayment = async () => {
    if (!selectedWorker) return;
    
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      setToastMessage('Please enter a valid amount');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    
    const success = await processPayment(
      selectedWorker.id, 
      amount, 
      selectedWorker.worker_name, 
      selectedWorker.gig_title
    );
    
    if (success) {
      setToastMessage(`✅ Payment of RM ${amount.toFixed(2)} sent to ${selectedWorker.worker_name}`);
      setShowPayoutModal(false);
      setSelectedWorker(null);
      setPayoutAmount('');
    } else {
      setToastMessage('❌ Payment failed. Insufficient balance or database error.');
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const totalSpent = transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Wallet & Payments</h2>
          <p className="text-sm text-on-surface-variant">Manage your wallet balance and pay workers</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-all"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>
      
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl p-6">
          <p className="text-sm opacity-90">Wallet Balance</p>
          <p className="text-3xl font-bold">RM {walletBalance.toFixed(2)}</p>
          <button 
            onClick={() => setShowTopupModal(true)}
            className="mt-4 px-4 py-2 bg-white/20 rounded-lg text-sm font-semibold hover:bg-white/30 transition-colors flex items-center gap-2"
          >
            <Plus size={14} /> Top Up
          </button>
        </div>
        <div className="bg-white rounded-2xl border p-6">
          <p className="text-sm text-on-surface-variant">Total Spent</p>
          <p className="text-2xl font-bold text-primary">RM {totalSpent.toFixed(2)}</p>
          <p className="text-xs text-on-surface-variant mt-1">Lifetime payments</p>
        </div>
        <div className="bg-white rounded-2xl border p-6">
          <p className="text-sm text-on-surface-variant">Pending Payments</p>
          <p className="text-2xl font-bold text-amber-600">RM {totalPendingPayments.toFixed(2)}</p>
          <p className="text-xs text-on-surface-variant mt-1">Total payable to workers</p>
        </div>
        <div className="bg-white rounded-2xl border p-6">
          <p className="text-sm text-on-surface-variant">Workers to Pay</p>
          <p className="text-2xl font-bold text-secondary">{pendingWorkers.length}</p>
          {pendingWorkers.length > 0 && (
            <button 
              onClick={() => setShowPayoutModal(true)}
              className="mt-3 w-full px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-1"
            >
              <Send size={12} /> Pay All ({pendingWorkers.length})
            </button>
          )}
        </div>
      </div>
      
      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <History size={18} /> Recent Transactions
        </h3>
        
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign size={40} className="mx-auto text-on-surface-variant mb-3" />
            <p className="text-on-surface-variant">No transactions yet</p>
            <button onClick={() => setShowTopupModal(true)} className="mt-2 text-primary text-sm font-semibold">Top up your wallet →</button>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 border-b hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  {tx.type === 'credit' ? <ArrowUpRight className="text-green-600" /> : <ArrowDownRight className="text-red-600" />}
                  <div>
                    <p className="font-semibold text-sm">{tx.description}</p>
                    <p className="text-xs text-on-surface-variant">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'credit' ? '+' : '-'} RM {tx.amount.toFixed(2)}
                  </p>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Top-up Modal */}
      <AnimatePresence>
        {showTopupModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowTopupModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-primary">Top Up Wallet</h3>
                <button onClick={() => setShowTopupModal(false)}><X size={20} /></button>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-xs font-bold mb-2">Select Amount</label>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {[50, 100, 200, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setTopupAmount(amt.toString())}
                        className={`py-2 rounded-xl border text-sm font-semibold transition-all ${
                          parseFloat(topupAmount) === amt 
                            ? 'bg-primary text-white border-primary' 
                            : 'border-outline-variant hover:border-primary'
                        }`}
                      >
                        RM {amt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    placeholder="Other amount"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border text-sm focus:outline-primary"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-xs font-bold mb-2">Payment Method</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                      <input type="radio" value="card" checked={topupMethod === 'card'} onChange={() => setTopupMethod('card')} />
                      <CreditCard size={18} />
                      <span className="text-sm">Credit/Debit Card</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                      <input type="radio" value="fpx" checked={topupMethod === 'fpx'} onChange={() => setTopupMethod('fpx')} />
                      <span className="text-sm">FPX / Online Banking</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                      <input type="radio" value="duitnow" checked={topupMethod === 'duitnow'} onChange={() => setTopupMethod('duitnow')} />
                      <span className="text-sm">DuitNow QR</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button onClick={() => setShowTopupModal(false)} className="flex-1 py-2 border rounded-xl text-sm font-medium">Cancel</button>
                  <button onClick={handleTopup} className="flex-1 py-2 bg-primary text-white rounded-xl text-sm font-semibold">
                    Top Up RM {topupAmount || '0'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Payout Modal */}
      <AnimatePresence>
        {showPayoutModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowPayoutModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b flex justify-between items-center sticky top-0 bg-white">
                <h3 className="font-bold text-primary">Pay Workers</h3>
                <button onClick={() => setShowPayoutModal(false)}><X size={20} /></button>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-xs font-bold mb-2">Select Worker</label>
                  {pendingWorkers.length === 0 ? (
                    <div className="text-center py-6">
                      <CheckCircle size={40} className="mx-auto text-green-500 mb-2" />
                      <p className="text-sm text-on-surface-variant">No pending payments!</p>
                      <p className="text-xs text-on-surface-variant mt-1">All workers have been paid.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {pendingWorkers.map((worker) => (
                        <div 
                          key={worker.id}
                          onClick={() => {
                            setSelectedWorker(worker);
                            setPayoutAmount(worker.amount?.toString() || '0');
                          }}
                          className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${
                            selectedWorker?.id === worker.id 
                              ? 'border-primary bg-primary/5' 
                              : 'border-outline-variant hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img 
                              src={worker.worker_avatar || 'https://randomuser.me/api/portraits/men/32.jpg'} 
                              alt={worker.worker_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <p className="font-semibold text-sm">{worker.worker_name}</p>
                              <p className="text-xs text-on-surface-variant">{worker.gig_title}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">RM {worker.amount || 0}</p>
                            <span className="text-[10px] text-amber-600">Pending</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {selectedWorker && (
                  <>
                    <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-on-surface-variant">Payment will be sent to:</p>
                      <p className="font-semibold text-sm">{selectedWorker.worker_name}</p>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-xs font-bold mb-2">Amount (RM)</label>
                      <input 
                        type="number" 
                        value={payoutAmount} 
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border text-sm font-semibold"
                      />
                      <div className="flex justify-between mt-1">
                        <p className="text-xs text-on-surface-variant">Wallet balance: RM {walletBalance.toFixed(2)}</p>
                        {parseFloat(payoutAmount) > walletBalance && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle size={10} /> Insufficient balance
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button onClick={() => setShowPayoutModal(false)} className="flex-1 py-2 border rounded-xl text-sm font-medium">Cancel</button>
                      <button 
                        onClick={handleProcessPayment} 
                        disabled={!selectedWorker || !payoutAmount || parseFloat(payoutAmount) > walletBalance}
                        className="flex-1 py-2 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                      >
                        Send Payment
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-4 z-50 bg-slate-800 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm max-w-xs">
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}