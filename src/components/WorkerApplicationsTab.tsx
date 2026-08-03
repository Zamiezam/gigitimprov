import { useState, useEffect } from 'react';
import { supabase } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, Play, Square, CheckCircle, AlertCircle, XCircle, 
  MapPin, DollarSign, Calendar, Search, Star, Loader2, RefreshCw,
  Award, ArrowRight
} from 'lucide-react';
import ClockInOut from './ClockInOut';
import EmployerRatingModal from './EmployerRatingModal';

interface AppItem {
  id: string;
  gig_id: string;
  worker_id: string;
  status: string;
  cover_letter?: string;
  rejected_reason?: string;
  created_at: string;
  gig?: {
    id: string;
    title: string;
    employer: string;
    locationName: string;
    rate: string;
    duration?: string;
    description?: string;
  };
}

export default function WorkerApplicationsTab() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'completed' | 'rejected'>('approved');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [employerToRate, setEmployerToRate] = useState<string | null>(null);
  
  // DB states
  const [applications, setApplications] = useState<AppItem[]>([]);
  const [hiredShifts, setHiredShifts] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();

      // Subscribe to Postgres changes on applicants & hired_workers table
      const appChannel = supabase
        .channel('public:applicants')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'applicants', filter: `worker_id=eq.${user.id}` }, () => {
          console.log('Applicants updated!');
          fetchData();
        })
        .subscribe();

      const hiredChannel = supabase
        .channel('public:hired_workers')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'hired_workers', filter: `worker_id=eq.${user.id}` }, () => {
          console.log('Hired workers updated!');
          fetchData();
        })
        .subscribe();

      return () => {
        appChannel.unsubscribe();
        hiredChannel.unsubscribe();
      };
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch all gigs to map details
      const { data: gigsData, error: gigsErr } = await supabase
        .from('gigs')
        .select('*');

      if (gigsErr) throw gigsErr;

      // 2. Fetch user applications
      const { data: appsData, error: appsErr } = await supabase
        .from('applicants')
        .select('*')
        .eq('worker_id', user.id);

      if (appsErr) throw appsErr;

      // 3. Fetch user hired worker records (shifts)
      const { data: shiftsData, error: shiftsErr } = await supabase
        .from('hired_workers')
        .select('*')
        .eq('worker_id', user.id);

      if (shiftsErr) throw shiftsErr;

      // Map gigs to applications
      const mappedApps: AppItem[] = (appsData || []).map(app => {
        const gig = (gigsData || []).find(g => g.id === app.gig_id);
        return {
          ...app,
          gig: gig ? {
            id: gig.id,
            title: gig.title,
            employer: gig.employer,
            locationName: gig.location_name || gig.locationName || 'Kota Kinabalu',
            rate: gig.rate,
            duration: gig.duration || '6 Hours',
            description: gig.description || ''
          } : undefined
        };
      });

      const finalApps = mappedApps.length > 0 ? mappedApps : [
        {
          id: 'mock-app-1',
          gig_id: 'mock-gig-1',
          worker_id: user.id,
          status: 'Pending',
          created_at: new Date().toISOString(),
          gig: {
            id: 'mock-gig-1',
            title: 'Event Helper',
            employer: 'Sabah Convention Centre',
            locationName: 'Kota Kinabalu',
            rate: 'RM 12/hr',
            duration: '8 Hours'
          }
        }
      ];

      const finalShifts = (shiftsData && shiftsData.length > 0) ? shiftsData : [
        {
          id: 'mock-shift-1',
          gig_id: 'mock-gig-2',
          gig_title: 'Cafe Barista',
          employer_id: 'mock-emp',
          employer_name: 'Damai Bistro',
          worker_id: user.id,
          worker_name: 'Student',
          amount: 60,
          status: 'active',
          payment_status: 'pending',
          created_at: new Date().toISOString()
        }
      ];

      setApplications(finalApps as any);
      setHiredShifts(finalShifts as any);
    } catch (err) {
      console.error('Error fetching applications data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    showToast('✅ Applications list updated!');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Clock events triggered from inline ClockInOut inside the Approved tab
  const handleClockIn = async (shiftId: string, gigTitle: string, time: Date) => {
    try {
      const { error } = await supabase
        .from('hired_workers')
        .update({
          clock_in_time: time.toISOString(),
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', shiftId);

      if (error) throw error;
      showToast(`Clocked in successfully! Have a great shift at "${gigTitle}"! 🎉`);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('❌ Clock-in database update failed.');
    }
  };

  const handleClockOut = async (shiftId: string, time: Date) => {
    try {
      const { error } = await supabase
        .from('hired_workers')
        .update({
          clock_out_time: time.toISOString(),
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', shiftId);

      if (error) throw error;
      showToast('Clocked out successfully! Wages sent to Pending Release. 💸');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('❌ Clock-out database update failed.');
    }
  };

  // Filter lists based on tab
  const pendingApps = applications.filter(app => app.status === 'Pending' && app.gig);
  
  // Approved shifts: shifts in hired_workers that are 'active' (not yet clocked out)
  const approvedShifts = hiredShifts.filter(shift => shift.status === 'active');
  
  // Completed shifts: shifts in hired_workers that are 'completed', 'verified', or paid
  const completedShifts = hiredShifts.filter(shift => 
    shift.status === 'completed' || shift.status === 'verified' || shift.payment_status === 'paid'
  );

  // Rejected apps: applications with status 'Rejected'
  const rejectedApps = applications.filter(app => app.status === 'Rejected' && app.gig);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-outline-variant pb-4">
        <div>
          <h1 className="font-display font-bold text-xl md:text-2xl text-primary">My Shifts & Applications</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Track your ongoing shifts, pending requests, and payout clearances.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container border border-outline-variant text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-outline-variant/60">
        {[
          { id: 'approved',  label: 'Approved Shifts', count: approvedShifts.length,  color: 'text-primary' },
          { id: 'pending',   label: 'Pending Apps',    count: pendingApps.length,     color: 'text-amber-600' },
          { id: 'completed', label: 'Completed Shifts', count: completedShifts.length, color: 'text-green-600' },
          { id: 'rejected',  label: 'Rejected Apps',   count: rejectedApps.length,    color: 'text-red-500' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'border-primary text-primary bg-primary/5 font-extrabold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-surface-container-high ${tab.color}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content area */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={32} className="animate-spin text-primary" />
            <span className="text-xs text-on-surface-variant font-medium">Fetching database records...</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          
          {/* TAB: APPROVED SHIFTS (Clock in/out enabled) */}
          {activeTab === 'approved' && (
            approvedShifts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-outline-variant">
                <Clock size={36} className="mx-auto text-on-surface-variant mb-2" />
                <p className="text-xs font-bold text-on-surface">No Approved Shifts Yet</p>
                <p className="text-[10px] text-on-surface-variant mt-1 max-w-xs mx-auto leading-normal">
                  Approved gigs or instant bookings will show up here. You can clock in once the shift starts!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {approvedShifts.map((shift) => (
                  <div key={shift.id} className="bg-white rounded-2xl border border-outline-variant p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] bg-primary/10 border border-primary/20 text-primary font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Approved Shift</span>
                          <h3 className="font-bold text-base text-on-surface mt-1.5">{shift.gig_title}</h3>
                          <p className="text-xs font-medium text-on-surface-variant">{shift.employer_name || 'KK SME Cafe'}</p>
                        </div>
                        <span className="font-display font-semibold text-sm text-secondary">RM {shift.amount?.toFixed(2)}</span>
                      </div>

                      <div className="mt-4 space-y-2 border-t border-outline-variant/40 pt-3">
                        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
                          <MapPin size={14} className="text-primary shrink-0" />
                          <span>Kota Kinabalu, Sabah</span>
                        </div>
                        {shift.clock_in_time && (
                          <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                            <Clock size={14} className="shrink-0 animate-pulse" />
                            <span>Clocked In: {new Date(shift.clock_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5">
                      <ClockInOut 
                        gigTitle={shift.gig_title}
                        gigLocation={shift.employer_name || 'Sabah Area'}
                        key={shift.id}
                        onClockIn={(time) => handleClockIn(shift.id, shift.gig_title, time)}
                        onClockOut={(time, duration) => handleClockOut(shift.id, time)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* TAB: PENDING APPLICATIONS */}
          {activeTab === 'pending' && (
            pendingApps.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-outline-variant">
                <Search size={36} className="mx-auto text-on-surface-variant mb-2" />
                <p className="text-xs font-bold text-on-surface">No Pending Applications</p>
                <p className="text-[10px] text-on-surface-variant mt-1 leading-normal">
                  All your submitted applications are cleared. Go to Find Opportunities to apply for new opportunities!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingApps.map((app) => (
                  <div key={app.id} className="bg-white rounded-xl border border-outline-variant p-4 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] bg-amber-50 border border-amber-200 text-amber-700 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Awaiting Employer Review</span>
                          <h3 className="font-bold text-sm text-on-surface mt-1.5">{app.gig?.title}</h3>
                          <p className="text-xs text-on-surface-variant font-medium">{app.gig?.employer}</p>
                        </div>
                        <span className="font-semibold text-xs text-secondary">{app.gig?.rate}</span>
                      </div>

                      <div className="mt-3.5 space-y-1 text-xs text-on-surface-variant font-medium">
                        <div className="flex items-center gap-1.5"><MapPin size={12} className="text-primary" /><span>{app.gig?.locationName}</span></div>
                        <div className="flex items-center gap-1.5"><Clock size={12} className="text-primary" /><span>{app.gig?.duration}</span></div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-outline-variant/40 flex justify-between items-center text-[10px] text-on-surface-variant font-medium">
                      <span>Applied: {new Date(app.created_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1 text-amber-600 font-semibold"><Clock size={10} /> Pending Audit</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* TAB: COMPLETED SHIFTS */}
          {activeTab === 'completed' && (
            completedShifts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-outline-variant">
                <CheckCircle size={36} className="mx-auto text-on-surface-variant mb-2" />
                <p className="text-xs font-bold text-on-surface">No Completed Shifts</p>
                <p className="text-[10px] text-on-surface-variant mt-1 leading-normal">
                  Once you clock out and complete your shifts, they will be listed here with employer feedback.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedShifts.map((shift) => (
                  <div key={shift.id} className="bg-white rounded-xl border border-outline-variant p-5 shadow-xs">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-on-surface">{shift.gig_title}</h3>
                          <span className="text-[9px] bg-green-50 border border-green-200 text-green-700 font-bold px-2 py-0.5 rounded uppercase tracking-wider">Completed</span>
                        </div>
                        <p className="text-xs font-semibold text-on-surface-variant">{shift.employer_name || 'KK Business'}</p>
                        <p className="text-[10px] text-outline font-medium">
                          Shift Date: {new Date(shift.clock_in_time || shift.created_at).toLocaleDateString()} • Cleared Wage: RM {shift.amount?.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {shift.payment_status === 'paid' ? (
                          <span className="px-2.5 py-1 bg-green-100 text-green-700 font-bold text-[10px] rounded-lg border border-green-200">Wages Paid ✓</span>
                        ) : shift.status === 'verified' ? (
                          <span className="px-2.5 py-1 bg-purple-100 text-purple-700 font-bold text-[10px] rounded-lg border border-purple-200">Cleared for Payout</span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold text-[10px] rounded-lg border border-amber-200">Verification Pending</span>
                        )}
                        <button 
                          onClick={() => setEmployerToRate(shift.employer_name || 'KK Business')}
                          className="text-[10px] bg-primary/10 text-primary hover:bg-primary/20 font-bold px-2 py-1 rounded-lg transition-colors border border-primary/20 flex items-center gap-1 cursor-pointer mt-1"
                        >
                          <Star size={10} /> Rate Employer
                        </button>
                      </div>
                    </div>

                    {/* Employer Review Section if rated */}
                    {shift.rating_given && (
                      <div className="mt-4 p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/60 space-y-1">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1"><Award size={12} className="text-primary" /> SME Feedback:</p>
                          <div className="flex items-center gap-0.5 text-secondary">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={12} fill={i < shift.rating ? "currentColor" : "none"} className={i < shift.rating ? 'text-secondary' : 'text-outline-variant'} />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs italic text-on-surface mt-1 leading-normal font-sans">"{shift.review}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {/* TAB: REJECTED APPLICATIONS */}
          {activeTab === 'rejected' && (
            rejectedApps.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-outline-variant">
                <CheckCircle size={36} className="mx-auto text-on-surface-variant mb-2" />
                <p className="text-xs font-bold text-on-surface">No Rejected Gigs</p>
                <p className="text-[10px] text-on-surface-variant mt-1 leading-normal">
                  All your applications are either pending review or hired! Perfect track record.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rejectedApps.map((app) => (
                  <div key={app.id} className="bg-white rounded-xl border border-outline-variant p-4 flex flex-col justify-between shadow-xs border-l-4 border-l-red-500">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] bg-red-50 border border-red-200 text-red-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Declined by Employer</span>
                          <h3 className="font-bold text-sm text-on-surface mt-1.5">{app.gig?.title}</h3>
                          <p className="text-xs text-on-surface-variant font-medium">{app.gig?.employer}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3.5 p-2.5 bg-red-50/50 border border-red-100 rounded-xl">
                      <p className="text-[10px] font-bold text-red-800">Reason for rejection:</p>
                      <p className="text-[10px] text-red-700 italic mt-0.5">"{app.rejected_reason || 'Rejection reason not specified'}"</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-outline-variant/40 flex justify-between items-center text-[9px] text-on-surface-variant">
                      <span>Applied: {new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

        </div>
      )}

      {/* Success Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-4 z-50 bg-slate-900 border border-slate-800 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {employerToRate && (
        <EmployerRatingModal
          employerName={employerToRate}
          onClose={() => setEmployerToRate(null)}
          onSubmitSuccess={() => {
            setEmployerToRate(null);
            showToast('Thank you for rating! Your review helps keep the community transparent. 🌟');
          }}
        />
      )}
    </div>
  );
}
