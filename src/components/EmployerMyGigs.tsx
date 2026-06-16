// components/EmployerMyGigs.tsx - Add Backup Pool button
import { useState, useEffect } from 'react';
import { AppView, Gig } from '../types';
import { supabase } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BackupPoolWidget from './BackupPoolWidget';
import { 
  Briefcase, MapPin, Clock, DollarSign, Trash2, Edit, 
  Eye, Users, CheckCircle, XCircle, AlertCircle, 
  Search, Filter, Calendar, ChevronRight, Plus, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EmployerMyGigsProps {
  onNavigate: (view: AppView) => void;
  onPostNewGig: () => void;
}

export default function EmployerMyGigs({ onNavigate, onPostNewGig }: EmployerMyGigsProps) {
  const { user } = useAuth();
  const [myGigs, setMyGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [applicantsCount, setApplicantsCount] = useState<Record<string, number>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [gigApplicants, setGigApplicants] = useState<any[]>([]);
  
  // Backup Pool states
  const [showBackupPool, setShowBackupPool] = useState(false);
  const [selectedGigForBackup, setSelectedGigForBackup] = useState<Gig | null>(null);

  // Fetch employer's gigs
  useEffect(() => {
    fetchMyGigs();
  }, [user]);

  const fetchMyGigs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gigs')
        .select('*')
        .eq('employer_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setMyGigs(data);
        await fetchApplicantsCounts(data);
      }
    } catch (err) {
      console.error('Error fetching gigs:', err);
    } finally {
      setLoading(false);
    }
  };

  const seedDummyGigs = async () => {
    if (myGigs.length === 0 && !loading) {
      const dummyGigs = [
        {
          title: 'Weekend Barista',
          employer: user?.user_metadata?.full_name?.split(' ')[0] || 'Employer',
          employer_id: user?.id,
          employer_name: user?.user_metadata?.full_name || 'Employer',
          location_name: 'KK Town',
          distance: '0.5km away',
          rate: 'RM 12/hr',
          period: 'Hour',
          category: 'F&B',
          is_instant: false,
          duration: '6 Hours',
          description: 'Looking for a friendly barista for weekend morning shifts. Training provided!',
          tags: ['Barista', 'Weekend', 'Student Friendly'],
          coords: { x: 58, y: 55, lat: 5.9749, lng: 116.0724 },
          status: 'open',
          created_at: new Date().toISOString()
        },
        {
          title: 'Event Crew Needed',
          employer: user?.user_metadata?.full_name?.split(' ')[0] || 'Employer',
          employer_id: user?.id,
          employer_name: user?.user_metadata?.full_name || 'Employer',
          location_name: 'SICC',
          distance: '1.2km away',
          rate: 'RM 15/hr',
          period: 'Hour',
          category: 'Event',
          is_instant: false,
          duration: '8 Hours',
          description: 'Need 2 crew members for upcoming tech expo. Setup and registration duties.',
          tags: ['Event', 'Weekend', 'Immediate Start'],
          coords: { x: 67, y: 35, lat: 6.0400, lng: 116.1200 },
          status: 'open',
          created_at: new Date().toISOString()
        }
      ];
      
      for (const gig of dummyGigs) {
        await supabase.from('gigs').insert([gig]);
      }
      await fetchMyGigs();
    }
  };

  // Call it in useEffect
  useEffect(() => {
    if (user) {
      fetchMyGigs().then(() => seedDummyGigs());
    }
  }, [user]);
  const fetchApplicantsCounts = async (gigs: Gig[]) => {
    const counts: Record<string, number> = {};
    for (const gig of gigs) {
      const { count, error } = await supabase
        .from('applicants')
        .select('*', { count: 'exact', head: true })
        .eq('gig_id', gig.id);
      
      if (!error) {
        counts[gig.id] = count || 0;
      }
    }
    setApplicantsCount(counts);
  };

  const fetchApplicantsForGig = async (gig: Gig) => {
    setSelectedGig(gig);
    setShowApplicantsModal(true);
    
    const { data, error } = await supabase
      .from('applicants')
      .select('*')
      .eq('gig_id', gig.id)
      .order('applied_at', { ascending: false });
    
    if (!error && data) {
      setGigApplicants(data);
    } else {
      setGigApplicants([
        { id: '1', worker_name: 'Ahmad Rosli', worker_rating: 4.9, status: 'pending', applied_at: new Date().toISOString() },
        { id: '2', worker_name: 'Nurul Hidayah', worker_rating: 5.0, status: 'pending', applied_at: new Date().toISOString() }
      ]);
    }
  };

  const updateGigStatus = async (gigId: string, newStatus: 'open' | 'closed') => {
    try {
      setToastMessage(`Updating gig status...`);
      
      const { error } = await supabase
        .from('gigs')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', gigId);
      
      if (error) throw error;
      
      // Update local state immediately
      setMyGigs(prev => prev.map(gig => 
        gig.id === gigId ? { ...gig, status: newStatus } : gig
      ));
      
      setToastMessage(`✅ Gig ${newStatus === 'open' ? 'opened' : 'closed'} successfully!`);
      setTimeout(() => setToastMessage(null), 3000);
      
      // Refresh to ensure consistency
      await fetchMyGigs();
    } catch (err) {
      console.error('Error updating gig status:', err);
      setToastMessage('❌ Failed to update gig status. Please try again.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const deleteGig = async (gigId: string) => {
    try {
      setToastMessage('Deleting gig...');
      
      const { error } = await supabase
        .from('gigs')
        .delete()
        .eq('id', gigId);
      
      if (error) throw error;
      
      setMyGigs(prev => prev.filter(gig => gig.id !== gigId));
      setShowDeleteConfirm(null);
      setToastMessage('✅ Gig deleted successfully!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting gig:', err);
      setToastMessage('❌ Failed to delete gig');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };
  const filteredGigs = myGigs
    .filter(gig => statusFilter === 'all' || gig.status === statusFilter)
    .filter(gig => gig.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   gig.location_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-outline-variant px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-on-surface">My Gigs</h1>
              <p className="text-sm text-on-surface-variant mt-1">
                Manage your posted gigs and view applicants
              </p>
            </div>
            <button
              onClick={onPostNewGig}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all"
            >
              <Plus size={18} />
              Post New Gig
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-outline-variant p-4">
            <p className="text-xs text-on-surface-variant">Total Gigs</p>
            <p className="text-2xl font-bold text-primary">{myGigs.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-outline-variant p-4">
            <p className="text-xs text-on-surface-variant">Active Gigs</p>
            <p className="text-2xl font-bold text-green-600">{myGigs.filter(g => g.status === 'open').length}</p>
          </div>
          <div className="bg-white rounded-xl border border-outline-variant p-4">
            <p className="text-xs text-on-surface-variant">Closed Gigs</p>
            <p className="text-2xl font-bold text-gray-500">{myGigs.filter(g => g.status === 'closed').length}</p>
          </div>
          <div className="bg-white rounded-xl border border-outline-variant p-4">
            <p className="text-xs text-on-surface-variant">Total Applicants</p>
            <p className="text-2xl font-bold text-secondary">
              {Object.values(applicantsCount).reduce((a, b) => a + b, 0)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="flex gap-2">
            <button onClick={() => setStatusFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium ${statusFilter === 'all' ? 'bg-primary text-white' : 'bg-white border'}`}>All Gigs</button>
            <button onClick={() => setStatusFilter('open')} className={`px-4 py-2 rounded-lg text-sm font-medium ${statusFilter === 'open' ? 'bg-primary text-white' : 'bg-white border'}`}>Active</button>
            <button onClick={() => setStatusFilter('closed')} className={`px-4 py-2 rounded-lg text-sm font-medium ${statusFilter === 'closed' ? 'bg-primary text-white' : 'bg-white border'}`}>Closed</button>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input type="text" placeholder="Search by title or location..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-lg border border-outline-variant text-sm w-64 focus:outline-primary" />
            </div>
            <button 
              onClick={fetchMyGigs} 
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="Refresh"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Gigs List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredGigs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-outline-variant">
            <Briefcase size={48} className="mx-auto text-on-surface-variant mb-3" />
            <p className="text-on-surface-variant">No gigs found</p>
            <button onClick={onPostNewGig} className="mt-3 text-primary font-semibold hover:underline">
              Post your first gig →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredGigs.map((gig) => (
              <div key={gig.id} className="bg-white rounded-xl border border-outline-variant p-5 hover:shadow-md transition-all">
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                  {/* Left - Gig Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-on-surface">{gig.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        gig.status === 'open' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {gig.status === 'open' ? '● Active' : '● Closed'}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span>{gig.location_name || 'KK Town'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign size={14} />
                        <span>{gig.rate}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{gig.duration || 'Flexible'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{new Date(gig.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-on-surface-variant line-clamp-2">{gig.description}</p>
                    
                    {gig.tags && gig.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {gig.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                        {gig.tags.length > 3 && (
                          <span className="text-[10px] text-on-surface-variant">+{gig.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Right - Actions */}
                  <div className="flex flex-row md:flex-col gap-2">
                    <button
                      onClick={() => fetchApplicantsForGig(gig)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-lg text-sm font-semibold hover:bg-secondary/20 transition-all"
                    >
                      <Users size={16} />
                      <span>{applicantsCount[gig.id] || 0} Applicants</span>
                    </button>
                    
                    {/* Backup Pool Button - ADD THIS */}
                    <button
                      onClick={() => {
                        setSelectedGigForBackup(gig);
                        setShowBackupPool(true);
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition-all"
                    >
                      <Zap size={16} />
                      Backup Pool
                    </button>
                    
                    {gig.status === 'open' ? (
                      <button
                        onClick={() => updateGigStatus(gig.id, 'closed')}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-lg text-sm font-semibold hover:bg-amber-100 transition-all"
                      >
                        <XCircle size={16} />
                        Close Gig
                      </button>
                    ) : (
                      <button
                        onClick={() => updateGigStatus(gig.id, 'open')}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-semibold hover:bg-green-100 transition-all"
                      >
                        <CheckCircle size={16} />
                        Reopen Gig
                      </button>
                    )}
                    
                    <button
                      onClick={() => setShowDeleteConfirm(gig.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition-all"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Applicants Modal */}
      <AnimatePresence>
        {showApplicantsModal && selectedGig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-outline-variant bg-surface flex justify-between items-center sticky top-0 bg-white">
                <div>
                  <h3 className="font-display font-bold text-base text-primary">Applicants</h3>
                  <p className="text-xs text-on-surface-variant">For: {selectedGig.title}</p>
                </div>
                <button onClick={() => setShowApplicantsModal(false)} className="text-on-surface-variant hover:text-on-surface">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {gigApplicants.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={40} className="mx-auto text-on-surface-variant mb-3" />
                    <p className="text-on-surface-variant">No applicants yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {gigApplicants.map((applicant) => (
                      <div key={applicant.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-semibold text-on-surface">{applicant.worker_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-secondary">⭐ {applicant.worker_rating}</span>
                            <span className="text-xs text-on-surface-variant">
                              Applied: {new Date(applicant.applied_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90">
                          View Profile
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle size={24} className="text-red-500" />
                  <h3 className="font-bold text-lg text-on-surface">Delete Gig</h3>
                </div>
                <p className="text-on-surface-variant mb-6">
                  Are you sure you want to delete this gig? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 py-2 border border-outline-variant rounded-lg text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteGig(showDeleteConfirm)}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Backup Pool Modal - Updated to close on outside click */}
        <AnimatePresence>
        {showBackupPool && selectedGigForBackup && (
            <div 
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={() => setShowBackupPool(false)}  // ← Close when clicking outside
            >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}  // ← Prevent closing when clicking inside modal
            >
                <div className="px-6 py-4 border-b border-outline-variant bg-surface flex justify-between items-center">
                <h3 className="font-display font-bold text-base text-primary">Emergency Backup</h3>
                <button 
                    onClick={() => setShowBackupPool(false)} 
                    className="text-on-surface-variant hover:text-on-surface p-1 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>
                </div>
                <div className="p-6">
                <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-xs font-semibold text-amber-800">For Gig: {selectedGigForBackup.title}</p>
                    <p className="text-[10px] text-amber-700 mt-0.5">If your worker cancels, we'll find an immediate replacement</p>
                </div>
                <BackupPoolWidget 
                    gigId={selectedGigForBackup.id}
                    gigTitle={selectedGigForBackup.title}
                    employerId={user?.id}
                    onWorkerDispatched={(worker) => {
                    setShowBackupPool(false);
                    setToastMessage(`✅ Emergency backup requested from ${worker.worker_name}! They will be notified.`);
                    setTimeout(() => setToastMessage(null), 5000);
                    }}
                />
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
            className="fixed bottom-24 right-4 z-50 bg-slate-800 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Close icon component
const X = ({ size, className }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);