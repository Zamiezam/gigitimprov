import React, { useState, useEffect } from 'react';
import { AppView, WorkHistoryItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase, submitGigReviewWithAI } from '../services/api';
import { 
  ArrowLeft, 
  Award, 
  Check, 
  MapPin, 
  ShieldCheck, 
  Star, 
  Plus, 
  Calendar,
  Clock,
  Sparkles,
  TrendingUp,
  Sliders,
  Shield,
  Lightbulb,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WorkerReliabilityViewProps {
  onNavigate: (view: AppView) => void;
  isEmbedded?: boolean;
}

export default function WorkerReliabilityView({ onNavigate, isEmbedded = false }: WorkerReliabilityViewProps) {
  const { user } = useAuth();

  // Profile data
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Stats
  const [activeHistory, setActiveHistory] = useState<any[]>([]);
  const [noShowCount, setNoShowCount] = useState(0);
  const [completedShifts, setCompletedShifts] = useState(0);
  const [reliabilityScore, setReliabilityScore] = useState('5.0');
  const [attendanceRate, setAttendanceRate] = useState(100);

  // Simulator states
  const [isBackupReady, setIsBackupReady] = useState(true);
  const [showToastMessage, setShowToastMessage] = useState<string | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);
  const [simSME, setSimSME] = useState('Damai Bistro');
  const [simRating, setSimRating] = useState(5);
  const [simComment, setSimComment] = useState('Excellent work ethic, arrived early and took charge immediately!');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfileAndStats();
    }
  }, [user]);

  const loadProfileAndStats = async () => {
    if (!user) return;
    setLoadingProfile(true);
    try {
      // 1. Fetch user profile
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (!profileErr && profileData) {
        setProfile(profileData);
      }

      // 2. Fetch completed gigs / hired workers history
      const { data: historyData, error: historyErr } = await supabase
        .from('hired_workers')
        .select('*')
        .eq('worker_id', user.id)
        .order('created_at', { ascending: false });

      if (!historyErr && historyData) {
        // Filter rated history items
        const ratedHistory = historyData.filter(item => item.rating_given);
        setActiveHistory(historyData);
        
        // Calculate stats
        const completed = historyData.filter(item => item.status === 'completed' || item.status === 'verified').length;
        setCompletedShifts(completed);

        // Calculate no show count from ratings <= 2
        const noShows = historyData.filter(item => item.rating_given && item.rating <= 2).length;
        setNoShowCount(noShows);

        // Compute attendance rate
        const totalAttempts = completed + noShows;
        const rate = totalAttempts > 0 ? Math.round((completed / totalAttempts) * 100) : 100;
        setAttendanceRate(rate);

        // Compute reliability score
        if (ratedHistory.length > 0) {
          const totalRating = ratedHistory.reduce((sum, item) => sum + (item.rating || 0), 0);
          const avgRating = totalRating / ratedHistory.length;
          // Apply a small penalty for no-shows
          const score = Math.max(1.0, Math.min(5.0, avgRating - (noShows * 0.5))).toFixed(1);
          setReliabilityScore(score);
        } else {
          setReliabilityScore('5.0'); // Base starting score
        }
      }
    } catch (err) {
      console.error('Error loading reliability profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsAnalyzing(true);
    
    try {
      // 1. Send the text to Gemini AI for sentiment / reliability modifier
      const aiAnalysis = await submitGigReviewWithAI(simRating, simComment);
      
      // Calculate amount based on rating
      const rateAmount = simRating * 12;

      // 2. Add the review to Supabase hired_workers
      const { error: insertErr } = await supabase
        .from('hired_workers')
        .insert({
          worker_id: user.id,
          worker_name: profile?.full_name || user.email?.split('@')[0] || 'Student Worker',
          worker_avatar: profile?.avatar_url || 'https://randomuser.me/api/portraits/men/32.jpg',
          employer_id: 'employer-id-placeholder', // Mock business ID
          employer_name: simSME,
          gig_title: `${simSME} Support Crew`,
          amount: rateAmount,
          status: 'verified',
          payment_status: 'paid',
          rating_given: true,
          rating: simRating,
          review: simComment,
          clock_in_time: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
          clock_out_time: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertErr) throw insertErr;

      // 3. Reload stats from DB
      await loadProfileAndStats();

      setShowSimulator(false);
      
      // 4. Show conclusion in toast
      const scoreModifier = aiAnalysis.modifier > 0 ? `+${aiAnalysis.modifier}` : aiAnalysis.modifier;
      showToast(`✨ Gemini AI processed review from ${simSME}. Reliability modifier: ${scoreModifier}. Scorecard updated!`);
      
    } catch (error) {
      console.error("AI Analysis / Review submit failed:", error);
      showToast("Failed to submit review. Review simulated locally.");
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleSimulateNoShow = async () => {
    if (!user) return;
    try {
      // Insert a negative review record to simulate a no-show
      const { error } = await supabase
        .from('hired_workers')
        .insert({
          worker_id: user.id,
          worker_name: profile?.full_name || 'Student Worker',
          worker_avatar: profile?.avatar_url || 'https://randomuser.me/api/portraits/men/32.jpg',
          employer_id: 'employer-id-placeholder',
          employer_name: 'Damai Bistro',
          gig_title: 'Server Shift',
          amount: 0,
          status: 'verified',
          payment_status: 'pending',
          rating_given: true,
          rating: 1,
          review: 'No-show incident reported. Worker did not arrive for the shift.',
          clock_in_time: null,
          clock_out_time: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      await loadProfileAndStats();
      showToast(`⚠️ Simulated cancellation! Penalty applied. Reliability Score updated.`);
    } catch (err) {
      console.error('Failed to simulate no-show:', err);
    }
  };

  const showToast = (msg: string) => {
    setShowToastMessage(msg);
    setTimeout(() => setShowToastMessage(null), 4000);
  };

  if (loadingProfile) {
    return (
      <div className="flex justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-on-surface-variant font-medium">Loading reliability data...</p>
        </div>
      </div>
    );
  }

  const workerName = profile?.full_name || user?.email?.split('@')[0] || 'Ahmad Rosli';
  const workerAvatar = profile?.avatar_url || 'https://randomuser.me/api/portraits/men/32.jpg';
  const workerUniversity = profile?.university || 'Universiti Malaysia Sabah (UMS)';

  return (
    <div className={isEmbedded ? "bg-transparent text-on-surface font-sans" : "bg-background min-h-screen text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container"}>
      
      {/* Top Navigation Row (Only render if NOT embedded) */}
      {!isEmbedded && (
        <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-8 h-16 bg-surface border-b border-outline-variant shadow-xs">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate(AppView.Landing)}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg font-display">G</div>
            <span className="font-display font-bold text-xl text-primary tracking-tight">GigIT</span>
          </div>

          <div className="hidden lg:flex items-center gap-6">
            <button onClick={() => onNavigate(AppView.WorkerBrowse)} className="text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold tracking-wide cursor-pointer">Find Gigs</button>
            <button onClick={() => onNavigate(AppView.WorkerReliability)} className="text-primary font-bold border-b-2 border-primary py-1 text-sm tracking-wide cursor-pointer">Reliability Portal</button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white font-bold cursor-pointer">
              {workerName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
      )}

      <main className={isEmbedded ? "space-y-8 pt-2 pb-16" : "pt-24 px-4 md:px-8 pb-24 max-w-7xl mx-auto space-y-8"}>
        
        {/* Success Alert Toast Notification */}
        <AnimatePresence>
          {showToastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-primary text-white p-4 rounded-xl shadow-lg flex items-center justify-between border border-primary-container z-50 fixed top-20 right-4 max-w-sm"
            >
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={18} className="text-white bg-white/20 p-px rounded-full" />
                <p className="text-xs font-semibold leading-normal">{showToastMessage}</p>
              </div>
              <button onClick={() => setShowToastMessage(null)} className="text-white/80 hover:text-white pl-3">
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Hero Header */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-outline-variant flex flex-col md:flex-row items-center gap-6 justify-between shadow-xs">
          <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary shadow-sm bg-outline-variant">
              <img 
                alt={workerName} 
                className="w-full h-full object-cover" 
                src={workerAvatar} 
              />
              <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-tertiary rounded-full border-2 border-white"></span>
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h1 className="font-display font-semibold text-xl text-on-surface">{workerName}</h1>
                <span className="bg-primary/10 text-primary-container font-semibold text-[10px] px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-xs">
                  <ShieldCheck size={12} />
                  {profile?.is_verified ? 'Verified Student' : 'Unverified Account'}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-medium flex items-center justify-center md:justify-start gap-1">
                <MapPin size={13} className="text-primary" />
                {workerUniversity} • Sabah, Malaysia
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5 w-full sm:w-auto justify-center md:justify-end">
            <button 
              onClick={() => setShowSimulator(true)}
              className="bg-primary hover:bg-primary/95 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 text-center"
              id="request-endorsement-btn"
            >
              <Plus size={14} />
              <span>Request SME Endorsement</span>
            </button>
            <button 
              onClick={() => {
                showToast("Attendance Policy loaded! Perfect records secure your priority placement in instant gigs.");
              }} 
              className="border border-outline text-on-surface hover:bg-surface-container-low font-bold text-xs py-2.5 px-4 rounded-xl transition-colors cursor-pointer bg-white"
              id="view-rules-btn"
            >
              Verify Attendance Rules
            </button>
          </div>
        </div>

        {/* Demo Controller Widget */}
        <div className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-6">
          <DemoControlPanel 
            onSimulateReview={() => setShowSimulator(true)}
            onSimulateNoShow={handleSimulateNoShow} 
          />
        </div>

        {/* Reliability stats cards grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main big Gauge scorecard */}
          <div className="lg:col-span-8 bg-white border border-outline-variant p-6 md:p-8 rounded-3xl space-y-6 shadow-sm">
            <div className="flex justify-between items-center bg-surface-container-low/50 p-4 rounded-2xl">
              <div>
                <h3 className="font-display font-semibold text-base text-on-surface">{workerName.split(' ')[0]}'s Reliability Score</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">Calculated from student portal records, attendance rates, and local feedback.</p>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-3xl text-secondary">{reliabilityScore} <span className="text-xs text-on-surface-variant font-mono">/ 5.0</span></p>
                <p className="text-xs text-tertiary font-bold flex items-center gap-0.5 justify-end mt-0.5">
                  <TrendingUp size={12} />
                  {parseFloat(reliabilityScore) >= 4.5 ? 'Top Tier Elite' : 'Good Standing'}
                </p>
              </div>
            </div>

            {/* Attendance Progress bar metrics */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-on-surface">Shift Attendance Rate</span>
                <span className="text-primary font-bold">{attendanceRate}% ({completedShifts}/{completedShifts + noShowCount} shifts)</span>
              </div>
              <div className="w-full bg-outline-variant h-2.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all duration-500 shadow-xs" style={{ width: `${attendanceRate}%` }}></div>
              </div>
            </div>

            {/* Secondary metrics highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="p-4 bg-surface rounded-2xl border border-outline-variant space-y-1">
                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wide">Punctuality</span>
                <p className="font-bold text-base text-on-surface">98% In-Time</p>
                <p className="text-[10px] text-tertiary-container font-semibold font-sans">Average 8m early arrivals</p>
              </div>
              <div className="p-4 bg-surface rounded-2xl border border-outline-variant space-y-1">
                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wide">No-Shows</span>
                <p className={`font-bold text-base ${noShowCount > 0 ? 'text-red-500' : 'text-tertiary'}`}>{noShowCount} Incidents</p>
                <p className="text-[10px] text-on-surface-variant font-medium">Automatic block at 3 incidents</p>
              </div>
              <div className="p-4 bg-surface rounded-2xl border border-outline-variant space-y-1">
                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wide">Perfect Streak</span>
                <p className="font-bold text-base text-secondary">{completedShifts} shifts</p>
                <p className="text-[10px] text-tertiary-container font-semibold">Verified by local merchants</p>
              </div>
            </div>

            {/* Proactive tip helper card */}
            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 flex gap-3">
              <Lightbulb className="text-primary flex-shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="font-bold text-xs text-primary uppercase tracking-wide">How to increase your score</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                  Keep your <strong>Emergency Backup Pool</strong> toggle active! Showing up immediately for local "Fast Fill" calls adds double loyalty multipliers to your student scorecard profile!
                </p>
              </div>
            </div>
          </div>

          {/* Backup Pool toggle column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-outline-variant space-y-4 shadow-xs">
              <div className="flex justify-between items-center">
                <span className="font-display font-semibold text-sm text-on-surface">Backup Pool Readiness</span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={isBackupReady}
                    onChange={() => {
                      setIsBackupReady(!isBackupReady);
                      showToast(isBackupReady ? "Emergency Profile set to Offline" : "Emergency Profile is LIVE! Local SMEs can call you up.");
                    }}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-outline-variant peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tertiary"></div>
                </label>
              </div>

              {isBackupReady ? (
                <div className="p-3 bg-tertiary/10 border border-tertiary/20 text-tertiary rounded-xl flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-ping"></span>
                  <span className="text-[11px] font-bold">READY FOR EMERGENCY BOOKING</span>
                </div>
              ) : (
                <div className="p-3 bg-surface-container border border-outline-variant text-on-surface-variant rounded-xl flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-outline"></span>
                  <span className="text-[11px] font-bold">OFFLINE MODE</span>
                </div>
              )}

              <p className="text-xs text-on-surface-variant leading-relaxed">
                Toggle your availability for instant emergency shift call-ups. When active, local cafes can hire you instantly if their staff cancels.
              </p>
              <div className="border-t border-outline-variant/60 pt-3 flex flex-col gap-2 text-xs">
                <div className="flex justify-between text-on-surface-variant font-medium">
                  <span>Current Range:</span>
                  <span className="font-bold text-on-surface">5km (Likas/KK Center)</span>
                </div>
                <div className="flex justify-between text-on-surface-variant font-medium">
                  <span>Contact Route:</span>
                  <span className="font-bold text-primary flex items-center gap-0.5">GigIT Chat / WhatsApp</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Business Reviews History list */}
        <section className="space-y-4">
          <h3 className="font-display font-semibold text-lg text-on-surface">What Sabah SMEs Say About {workerName.split(' ')[0]}</h3>
          {activeHistory.filter(item => item.rating_given).length === 0 ? (
            <div className="text-center py-8 bg-white border border-outline-variant rounded-2xl">
              <p className="text-sm text-on-surface-variant">No SME reviews found yet. Complete shifts to earn endorsements!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeHistory.filter(item => item.rating_given).map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-2xl border border-outline-variant space-y-4 shadow-xs relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-sm text-on-surface">{item.employer_name || 'Local SME'}</h4>
                      <span className="text-[10px] text-on-surface-variant font-medium flex items-center gap-1 mt-0.5 font-sans">
                        <Calendar size={12} className="text-primary-container" />
                        {new Date(item.created_at || item.clock_in_time).toLocaleDateString()} • {item.gig_title}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 text-secondary">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={15} fill={i < item.rating ? "currentColor" : "none"} className={i < item.rating ? 'text-secondary' : 'text-outline-variant'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs italic text-on-surface-variant leading-relaxed bg-surface/40 p-3 rounded-lg border border-outline-variant/40">
                    "{item.review || item.quote}"
                  </p>
                  <div className="flex justify-between items-center text-[10px] text-outline font-semibold">
                    <span className="bg-surface-container px-2.5 py-0.5 rounded-full">Completed Shift</span>
                    <span className="text-tertiary flex items-center gap-0.5">
                      <Check size={12} className="bg-tertiary/10 p-px rounded-full" />
                      Verified Shift Pay Completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SME Simulator dialog form overlay */}
        <AnimatePresence>
          {showSimulator && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-outline-variant"
              >
                <div className="px-6 py-4 border-b border-outline-variant bg-surface flex justify-between items-center">
                  <h3 className="font-display font-bold text-sm text-primary">Simulate Business Feedback</h3>
                  <button onClick={() => setShowSimulator(false)} className="text-on-surface-variant hover:text-on-surface">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleAddReview} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wide">SME Name</label>
                    <input 
                      type="text" 
                      required
                      value={simSME} 
                      onChange={e => setSimSME(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-outline-variant focus:outline-primary placeholder:text-outline-variant text-sm bg-surface-container-lowest"
                      placeholder="e.g. Gaya Cafe, Borneo Mart"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wide">Rating (out of 5 stars)</label>
                    <select 
                      value={simRating} 
                      onChange={e => setSimRating(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm bg-surface-container-lowest"
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                      <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                      <option value={3}>⭐⭐⭐ (3/5)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wide">Review Comment</label>
                    <textarea 
                      rows={3}
                      required
                      value={simComment} 
                      onChange={e => setSimComment(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-outline-primary placeholder:text-outline-variant text-sm bg-surface-container-lowest"
                      placeholder="Helpful comment feedback about worker's shift."
                    />
                  </div>
                  
                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setShowSimulator(false)}
                      className="flex-1 py-2.5 border border-outline-variant rounded-xl text-xs font-bold text-on-surface hover:bg-surface active:scale-95 transition-all text-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isAnalyzing}
                      className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-primary/95 hover:scale-102 active:scale-95 transition-all text-sm cursor-pointer disabled:opacity-70 flex justify-center items-center"
                    >
                      {isAnalyzing ? (
                        <span className="animate-pulse">Gemini is Analyzing...</span>
                      ) : (
                        "Publish SME Endorsement"
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile navigation menu spacer (Mobile Only) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-surface border-t border-outline-variant py-2 flex justify-around items-center shadow-lg">
        <button 
          onClick={() => onNavigate(AppView.Landing)}
          className="flex flex-col items-center text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-xl">home</span>
          <span className="text-[10px] mt-0.5 font-sans">Home</span>
        </button>
        <button 
          onClick={() => onNavigate(AppView.WorkerBrowse)}
          className="flex flex-col items-center text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-xl">work</span>
          <span className="text-[10px] mt-0.5 font-sans">Gigs</span>
        </button>
        <button 
          onClick={() => onNavigate(AppView.WorkerReliability)}
          className="flex flex-col items-center text-primary"
        >
          <div className="p-1 px-4 bg-primary-container/20 text-primary rounded-full">
            <span className="material-symbols-outlined text-md">person</span>
          </div>
          <span className="text-[10px] font-bold mt-1 font-sans">Profile</span>
        </button>
      </div>
    </div>
  );
}

interface DemoControlPanelProps {
  onSimulateReview: () => void;
  onSimulateNoShow: () => void;
}

function DemoControlPanel({ onSimulateReview, onSimulateNoShow }: DemoControlPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white border border-outline-variant shadow-xl rounded-2xl overflow-hidden max-w-[240px] md:max-w-xs transition-all duration-300">
      {/* Drawer Header */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest transition-colors font-sans text-[10px] font-bold text-primary tracking-wider uppercase select-none cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm animate-pulse text-secondary">science</span>
          <span>SANDBOX HELPERS</span>
        </div>
        <span className="material-symbols-outlined text-xs">
          {isOpen ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}
        </span>
      </button>

      {isOpen && (
        <div className="p-3.5 space-y-3 bg-white border-t border-outline-variant">
          <p className="text-[10px] text-on-surface-variant font-medium leading-normal">
            Easily test GigIT reactive status states:
          </p>
          <div className="space-y-2">
            <button 
              onClick={onSimulateReview}
              className="w-full text-left flex items-center justify-between p-2 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-all font-sans text-[10px] font-bold text-primary cursor-pointer select-none"
            >
              <span>Inject Mock SME Review</span>
              <span className="material-symbols-outlined text-xs">add</span>
            </button>
            <button 
              onClick={onSimulateNoShow}
              className="w-full text-left flex items-center justify-between p-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 transition-all font-sans text-[10px] font-bold text-red-600 cursor-pointer select-none"
            >
              <span>Apply Attendance Flag</span>
              <span className="material-symbols-outlined text-xs">warning</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}