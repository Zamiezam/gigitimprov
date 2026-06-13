// components/HiredWorkers.tsx - Full database integration
import { useState, useEffect } from 'react';
import { supabase } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Clock, CheckCircle, Star, Send, X, Calendar, 
  MapPin, Award, ThumbsUp, MessageCircle, Filter, Search,
  DollarSign, CreditCard, Wallet, Check, AlertCircle, RefreshCw
} from 'lucide-react';
import { usePayment } from '../context/PaymentContext';

interface HiredWorker {
  id: string;
  worker_id: string;
  worker_name: string;
  worker_avatar: string;
  gig_title: string;
  gig_id: string;
  amount: number;
  clock_in_time: string;
  clock_out_time: string | null;
  status: 'active' | 'completed' | 'verified';
  payment_status: 'pending' | 'paid' | 'processing';
  rating_given: boolean;
  rating?: number;
  review?: string;
}

const DEFAULT_REVIEWS = [
  { text: 'Excellent worker! Very punctual and hardworking.', rating: 5 },
  { text: 'Great attitude, completed all tasks perfectly.', rating: 5 },
  { text: 'Professional and reliable. Would hire again.', rating: 5 },
  { text: 'Good communication skills, followed instructions well.', rating: 4 },
  { text: 'Satisfactory work, met all expectations.', rating: 4 },
  { text: 'Needs improvement in punctuality but good work ethic.', rating: 3 }
];

export default function HiredWorkers() {
  const { user } = useAuth();
  const { processPayment, walletBalance, refreshPayments } = usePayment();
  const [hiredWorkers, setHiredWorkers] = useState<HiredWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<HiredWorker | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [selectedDefaultReview, setSelectedDefaultReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'verified'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchHiredWorkers();
    }
  }, [user]);

  const fetchHiredWorkers = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hired_workers')
        .select('*')
        .eq('employer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setHiredWorkers(data as HiredWorker[]);
      } else {
        // Create sample data for demo if no data exists
        const sampleWorkers = [
          {
            employer_id: user.id,
            worker_id: 'worker1',
            worker_name: 'Ahmad Rosli',
            worker_avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
            gig_title: 'Cafe Assistant',
            amount: 72,
            clock_in_time: new Date().toISOString(),
            clock_out_time: null,
            status: 'active',
            payment_status: 'pending',
            rating_given: false
          },
          {
            employer_id: user.id,
            worker_id: 'worker2',
            worker_name: 'Nurul Hidayah',
            worker_avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
            gig_title: 'Event Crew',
            amount: 120,
            clock_in_time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            clock_out_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            status: 'completed',
            payment_status: 'pending',
            rating_given: false
          },
          {
            employer_id: user.id,
            worker_id: 'worker3',
            worker_name: 'Jason Tan',
            worker_avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
            gig_title: 'Warehouse Assistant',
            amount: 88,
            clock_in_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            clock_out_time: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
            status: 'verified',
            payment_status: 'pending',
            rating_given: true
          }
        ];

        for (const worker of sampleWorkers) {
          await supabase.from('hired_workers').insert([worker]);
        }
        
        const { data: newData } = await supabase
          .from('hired_workers')
          .select('*')
          .eq('employer_id', user.id);
        
        setHiredWorkers((newData || []) as HiredWorker[]);
      }
    } catch (err) {
      console.error('Error fetching hired workers:', err);
      setToastMessage('❌ Failed to load workers');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHiredWorkers();
    setToastMessage('✅ Data refreshed!');
    setTimeout(() => setToastMessage(null), 2000);
    setRefreshing(false);
  };

  const handleVerify = (worker: HiredWorker) => {
    setSelectedWorker(worker);
    setRating(5);
    setReviewText('');
    setSelectedDefaultReview('');
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!selectedWorker || !user) return;
    
    setIsSubmitting(true);
    
    try {
      // Update hired_worker with review and change status to 'verified'
      const { error } = await supabase
        .from('hired_workers')
        .update({
          status: 'verified',
          rating_given: true,
          rating: rating,
          review: reviewText,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedWorker.id)
        .eq('employer_id', user.id);

      if (error) throw error;
      
      // Update local state
      setHiredWorkers(prev => prev.map(worker => 
        worker.id === selectedWorker.id 
          ? { ...worker, status: 'verified', rating_given: true, rating, review: reviewText }
          : worker
      ));
      
      setToastMessage(`✅ Review submitted! ${selectedWorker.worker_name} marked as verified.`);
      setTimeout(() => setToastMessage(null), 4000);
      
      setShowReviewModal(false);
      setSelectedWorker(null);
      
    } catch (err) {
      console.error('Error submitting review:', err);
      setToastMessage('❌ Failed to submit review. Please try again.');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyDefaultReview = (review: { text: string; rating: number }) => {
    setSelectedDefaultReview(review.text);
    setReviewText(review.text);
    setRating(review.rating);
  };

  const filteredWorkers = hiredWorkers
    .filter(w => statusFilter === 'all' || w.status === statusFilter)
    .filter(w => w.worker_name.toLowerCase().includes(searchTerm.toLowerCase()));

  const formatTime = (isoString: string) => {
    if (!isoString) return 'Not started';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString();
  };

  const calculateDuration = (clockIn: string, clockOut: string | null) => {
    if (!clockOut) return null;
    const start = new Date(clockIn).getTime();
    const end = new Date(clockOut).getTime();
    const hours = (end - start) / 1000 / 3600;
    return hours.toFixed(1);
  };

  const handlePayNow = async (worker: HiredWorker) => {
    if (!worker.amount) {
      setToastMessage('❌ No amount specified for this worker');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (worker.amount > walletBalance) {
      setToastMessage(`❌ Insufficient balance. Need RM ${worker.amount.toFixed(2)} but only have RM ${walletBalance.toFixed(2)}`);
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    const success = await processPayment(
      worker.id,
      worker.amount,
      worker.worker_name,
      worker.gig_title
    );

    if (success) {
      setToastMessage(`✅ Payment of RM ${worker.amount.toFixed(2)} sent to ${worker.worker_name}!`);
      // Refresh both hired workers and wallet
      await fetchHiredWorkers();
      await refreshPayments();
    } else {
      setToastMessage('❌ Payment failed. Please check your wallet balance.');
    }
    setTimeout(() => setToastMessage(null), 4000);
  };


  // Calculate stats from actual data
  const activeCount = hiredWorkers.filter(w => w.status === 'active').length;
  const completedCount = hiredWorkers.filter(w => w.status === 'completed').length;
  const verifiedCount = hiredWorkers.filter(w => w.status === 'verified').length;
  const pendingPayments = hiredWorkers.filter(w => w.payment_status === 'pending' && w.status === 'verified').length;
  const totalAmount = hiredWorkers
    .filter(w => w.payment_status === 'pending' && w.status === 'verified')
    .reduce((sum, w) => sum + (w.amount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Hired Workers</h2>
          <p className="text-sm text-on-surface-variant">Track worker attendance, submit reviews, and process payments</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-on-surface-variant">Active Shifts</p>
          <p className="text-2xl font-bold text-primary">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-on-surface-variant">Pending Review</p>
          <p className="text-2xl font-bold text-amber-600">{completedCount}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-on-surface-variant">Verified & Ready</p>
          <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-on-surface-variant">Pending Payments</p>
          <p className="text-2xl font-bold text-purple-600">{pendingPayments}</p>
        </div>
        <div className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl p-4">
          <p className="text-xs opacity-90">Total Payable</p>
          <p className="text-2xl font-bold">RM {totalAmount.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => setStatusFilter('all')} 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === 'all' ? 'bg-primary text-white' : 'bg-white border hover:border-primary'}`}
          >
            All ({hiredWorkers.length})
          </button>
          <button 
            onClick={() => setStatusFilter('active')} 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === 'active' ? 'bg-primary text-white' : 'bg-white border hover:border-primary'}`}
          >
            Active ({activeCount})
          </button>
          <button 
            onClick={() => setStatusFilter('completed')} 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === 'completed' ? 'bg-primary text-white' : 'bg-white border hover:border-primary'}`}
          >
            Pending Review ({completedCount})
          </button>
          <button 
            onClick={() => setStatusFilter('verified')} 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === 'verified' ? 'bg-primary text-white' : 'bg-white border hover:border-primary'}`}
          >
            Verified ({verifiedCount})
          </button>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input 
            type="text" 
            placeholder="Search workers..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-lg border text-sm w-64 focus:outline-primary" 
          />
        </div>
      </div>

      {/* Workers List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredWorkers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border">
          <Users size={48} className="mx-auto text-on-surface-variant mb-3" />
          <p className="text-on-surface-variant">No hired workers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredWorkers.map((worker) => {
            const duration = calculateDuration(worker.clock_in_time, worker.clock_out_time);
            return (
              <div key={worker.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-all">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={worker.worker_avatar || `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 70)}.jpg`} 
                      alt={worker.worker_name} 
                      className="w-14 h-14 rounded-full object-cover" 
                    />
                    <div>
                      <h3 className="font-semibold text-on-surface">{worker.worker_name}</h3>
                      <p className="text-sm text-on-surface-variant">{worker.gig_title}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-on-surface-variant">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>Clock In: {formatTime(worker.clock_in_time)}</span>
                        </div>
                        {worker.clock_out_time && (
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>Clock Out: {formatTime(worker.clock_out_time)}</span>
                          </div>
                        )}
                        {duration && (
                          <div className="flex items-center gap-1">
                            <span>Duration: {duration} hours</span>
                          </div>
                        )}
                        {worker.amount && (
                          <div className="flex items-center gap-1 text-primary font-semibold">
                            <DollarSign size={12} />
                            <span>RM {worker.amount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>{formatDate(worker.clock_in_time)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {worker.status === 'active' && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        Active
                      </span>
                    )}
                    {worker.status === 'completed' && !worker.rating_given && (
                      <button
                        onClick={() => handleVerify(worker)}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all flex items-center gap-1"
                      >
                        <ThumbsUp size={14} /> Verify & Review
                      </button>
                    )}
                    {worker.status === 'verified' && worker.payment_status === 'pending' && (
                      <button
                        onClick={() => handlePayNow(worker)}  // Change this
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-all flex items-center gap-1"
                      >
                        <Wallet size={14} /> Pay Now
                      </button>
                    )}
                    {worker.payment_status === 'paid' && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                        <CheckCircle size={12} /> Paid ✓
                      </span>
                    )}
                    {worker.status === 'verified' && worker.payment_status === 'pending' && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                        <CheckCircle size={12} /> Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && selectedWorker && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowReviewModal(false)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-primary">Verify & Review Worker</h3>
                <button onClick={() => setShowReviewModal(false)} className="p-1 hover:bg-gray-100 rounded-full transition">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                  <img src={selectedWorker.worker_avatar} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold">{selectedWorker.worker_name}</p>
                    <p className="text-xs text-on-surface-variant">{selectedWorker.gig_title}</p>
                    <p className="text-xs text-primary font-semibold mt-1">RM {selectedWorker.amount?.toFixed(2)}</p>
                  </div>
                </div>

                {/* Quick Review Templates */}
                <div className="mb-4">
                  <p className="text-xs font-semibold mb-2">Quick Templates:</p>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_REVIEWS.map((review, idx) => (
                      <button 
                        key={idx}
                        onClick={() => applyDefaultReview(review)} 
                        className="px-2 py-1 bg-gray-100 rounded-lg text-xs hover:bg-gray-200 transition"
                      >
                        {'⭐'.repeat(review.rating)} 
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div className="mb-4">
                  <label className="block text-xs font-bold mb-1">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setRating(star)} className="focus:outline-none">
                        <Star 
                          size={28} 
                          fill={star <= rating ? "currentColor" : "none"} 
                          className={star <= rating ? 'text-secondary' : 'text-gray-300'} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                <div className="mb-4">
                  <label className="block text-xs font-bold mb-1">Review Comment</label>
                  <textarea 
                    rows={3} 
                    value={reviewText} 
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border focus:outline-primary text-sm" 
                    placeholder="Write your review here..." 
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowReviewModal(false)} 
                    className="flex-1 py-2 border rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={submitReview} 
                    disabled={isSubmitting || !reviewText.trim()}
                    className="flex-1 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Review & Verify'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-4 z-50 bg-slate-800 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm max-w-xs"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}