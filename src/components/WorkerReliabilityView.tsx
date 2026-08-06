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
  Loader2,
  Globe,
  Bell,
  CheckCircle,
  CheckCircle2
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

  // SWEAT Pillars
  const [sweatSkills, setSweatSkills] = useState(5.0);
  const [sweatWorkEthic, setSweatWorkEthic] = useState(5.0);
  const [sweatExperience, setSweatExperience] = useState(1.0);
  const [sweatAttendance, setSweatAttendance] = useState(5.0);
  const [sweatTrust, setSweatTrust] = useState(5.0);

  // States
  const [isBackupReady, setIsBackupReady] = useState(true);
  const [showToastMessage, setShowToastMessage] = useState<string | null>(null);

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

        // Calculate SWEAT pillars
        let skillsSum = 0;
        let workEthicSum = 0;
        let trustSum = 0;
        let validRatedCount = 0;
        
        ratedHistory.forEach(item => {
          if (item.sweat_metrics) {
            skillsSum += item.sweat_metrics.skills || item.rating || 5;
            workEthicSum += item.sweat_metrics.work_ethic || item.rating || 5;
            trustSum += item.sweat_metrics.trust || item.rating || 5;
            validRatedCount++;
          } else if (item.rating) {
            skillsSum += item.rating;
            workEthicSum += item.rating;
            trustSum += item.rating;
            validRatedCount++;
          }
        });

        const avgSkills = validRatedCount > 0 ? (skillsSum / validRatedCount) : 5.0;
        const avgWorkEthic = validRatedCount > 0 ? (workEthicSum / validRatedCount) : 5.0;
        const avgTrust = validRatedCount > 0 ? (trustSum / validRatedCount) : 5.0;
        
        // Experience: 1.0 base, +0.5 for every 2 gigs, capped at 5.0
        const experienceScore = Math.min(5.0, 1.0 + (completed * 0.25)); 
        
        // Attendance: Maps 0-100% directly to 0-5 scale
        const attendanceScore = rate / 20.0;
        
        setSweatSkills(avgSkills);
        setSweatWorkEthic(avgWorkEthic);
        setSweatExperience(experienceScore);
        setSweatAttendance(attendanceScore);
        setSweatTrust(avgTrust);

        // Overall SWEAT score
        const overall = (avgSkills + avgWorkEthic + experienceScore + attendanceScore + avgTrust) / 5;
        setReliabilityScore(overall.toFixed(1));
      }
    } catch (err) {
      console.error('Error loading reliability profile:', err);
    } finally {
      setLoadingProfile(false);
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

  const workerName = profile?.full_name || user?.email?.split('@')[0] || 'Worker';
  const workerAvatar = profile?.avatar_url || 'https://randomuser.me/api/portraits/men/32.jpg';
  const workerUniversity = profile?.university || 'University Student';

  return (
    <div className={isEmbedded ? "bg-transparent text-on-surface font-sans" : "bg-surface-container-lowest min-h-screen text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container flex flex-col md:flex-row"}>
      
      {/* Top Navigation Row (Only render if NOT embedded) */}
      {!isEmbedded && (
        <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-8 h-16 bg-surface border-b border-outline-variant shadow-xs">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate(AppView.Landing)}>
            <span className="font-display font-black text-2xl text-primary tracking-tight">SabahGig</span>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            <button onClick={() => onNavigate(AppView.WorkerBrowse)} className={`font-semibold border-b-2 py-1 text-sm tracking-wide cursor-pointer transition-colors text-on-surface-variant border-transparent hover:text-primary`}>Explore Gigs</button>
            <button onClick={() => {}} className={`font-semibold border-b-2 py-1 text-sm tracking-wide cursor-pointer transition-colors text-primary border-primary`}>Worker Portal</button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-2 items-center">
              <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors relative cursor-pointer">
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-secondary rounded-full" />
                <Bell size={20} className="text-on-surface-variant" />
              </button>
              <button className="p-0.5 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer ml-1">
                <img
                  alt="Worker profile"
                  className="w-8 h-8 rounded-full border border-outline-variant object-cover"
                  src={workerAvatar}
                />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Left Sidebar */}
      {!isEmbedded && (
        <aside className="hidden md:flex flex-col h-[calc(100vh-64px)] fixed left-0 top-16 w-64 py-8 bg-white border-r border-outline-variant shadow-xs overflow-y-auto z-40">
          <div className="px-6 mb-8">
            <h2 className="font-display font-black text-xl text-primary">Worker Portal</h2>
            <p className="text-[11px] text-on-surface-variant font-medium mt-1">Verified Sabah Worker</p>
          </div>

          <nav className="flex-1 space-y-1 mb-6">
            {[
              { id: 'Dashboard',      icon: 'dashboard',      label: 'Dashboard'      },
              { id: 'MyReliability',  icon: 'verified_user',  label: 'My Reliability' },
              { id: 'ActiveGigs',     icon: 'work',           label: 'Active Gigs'    },
              { id: 'Earnings',       icon: 'payments',       label: 'Earnings'       },
            ].map(({ id, icon, label }) => (
              <button
                key={id}
                onClick={() => { if (id === 'Dashboard') onNavigate(AppView.WorkerBrowse); }}
                className={`w-full flex items-center gap-3 px-6 py-3.5 mx-2 rounded-xl text-sm font-bold transition-all ${
                  id === 'MyReliability'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="px-6 mt-auto space-y-1">
            <button className="w-full flex items-center gap-3 p-2.5 text-on-surface-variant hover:text-primary transition-colors text-left text-xs font-bold">
              <span className="material-symbols-outlined text-[18px]">settings</span>
              <span>Settings</span>
            </button>
            <button className="w-full flex items-center gap-3 p-2.5 text-on-surface-variant hover:text-error transition-colors text-left text-xs font-bold">
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 ${isEmbedded ? '' : 'md:ml-64 pt-24 px-6 md:px-10 pb-20'}`}>
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Top Row Cards */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Profile Card */}
            <div className="md:col-span-8 bg-white rounded-2xl border border-outline-variant p-6 shadow-sm flex flex-col sm:flex-row gap-6 items-start">
              <div className="relative flex-shrink-0">
                <img src={workerAvatar} alt={workerName} className="w-32 h-32 rounded-xl object-cover border border-outline-variant shadow-sm" />
                <div className="absolute -bottom-2 -right-2 bg-green-600 text-white p-1 rounded-md border-2 border-white shadow-sm">
                  <ShieldCheck size={14} />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-display font-bold text-2xl text-on-surface">{workerName}</h1>
                  <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-green-200">
                    <Award size={10} /> Verified UMS Student
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed font-medium">
                  {profile?.bio || `Student at Universiti Malaysia Sabah. Specialized in event support and local delivery tasks. Known for punctuality and quick learning.`}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="flex items-center gap-1 text-[10px] bg-surface-container font-semibold px-2 py-1 rounded-md text-on-surface-variant border border-outline-variant/50">
                    <MapPin size={12} /> {profile?.location || 'Sepanggar, KK'}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] bg-surface-container font-semibold px-2 py-1 rounded-md text-on-surface-variant border border-outline-variant/50">
                    <Globe size={12} /> Malay, English
                  </span>
                  <span className="flex items-center gap-1 text-[10px] bg-surface-container font-semibold px-2 py-1 rounded-md text-on-surface-variant border border-outline-variant/50">
                    <Calendar size={12} /> Member since Jan 2024
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="md:col-span-4 grid grid-cols-2 gap-4">
              <div className="bg-primary rounded-2xl p-4 text-white shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-20"><Award size={48} /></div>
                <span className="text-4xl font-black relative z-10">{completedShifts}</span>
                <span className="text-xs font-bold text-white/80 mt-1 relative z-10">Gigs Done</span>
              </div>
              <div className="bg-secondary rounded-2xl p-4 text-white shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-20"><Star size={48} /></div>
                <span className="text-4xl font-black relative z-10 flex items-center gap-1">
                  {parseFloat(reliabilityScore) >= 4.5 ? 4.9 : parseFloat(reliabilityScore).toFixed(1)} <Star size={20} fill="currentColor" />
                </span>
                <span className="text-xs font-bold text-white/80 mt-1 relative z-10">Avg Rating</span>
              </div>
              <div className="col-span-2 bg-white rounded-2xl border border-outline-variant p-4 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center border border-green-100 flex-shrink-0">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="font-black text-2xl text-on-surface leading-none">{attendanceRate}%</h3>
                  <p className="text-xs font-semibold text-on-surface-variant mt-1">Attendance Rate</p>
                </div>
              </div>
            </div>
          </div>

          {/* The Reliability Proof Card */}
          <div className="bg-[#0f2e26] rounded-3xl p-8 md:p-10 shadow-lg relative overflow-hidden text-white flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-300 via-transparent to-transparent z-0"></div>
            
            <div className="flex-1 relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 border border-green-500/30 bg-green-900/30 px-3 py-1.5 rounded-full text-green-300 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck size={14} /> The Reliability Proof
              </div>
              
              <h2 className="font-display text-2xl md:text-3xl font-bold">Why employers trust {workerName.split(' ')[0]}</h2>
              <p className="text-green-100/80 text-sm leading-relaxed max-w-lg">
                Our proprietary Reliability Score combines attendance, promptness, and peer-reviewed task quality. Students with a score above 90% typically earn <span className="font-bold text-green-300">15% more per hour</span> due to high employer demand.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                <div className="space-y-1">
                  <h4 className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <CheckCircle2 size={16} /> Zero No-Shows
                  </h4>
                  <p className="text-xs text-green-100/70 max-w-[200px] leading-relaxed">
                    {workerName.split(' ')[0]} has never canceled a gig within 24 hours.
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <TrendingUp size={16} /> Top 5% Performer
                  </h4>
                  <p className="text-xs text-green-100/70 max-w-[200px] leading-relaxed">
                    Ranked in the top tier of workers in Kota Kinabalu.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-10 bg-black/20 p-8 rounded-3xl border border-white/10 flex flex-col items-center justify-center min-w-[240px]">
              <span className="text-xs text-green-100/80 font-bold mb-4 tracking-wider">Reliability Score</span>
              
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#2dd4bf" strokeWidth="8" strokeDasharray="282.7" strokeDashoffset={282.7 - (282.7 * (parseFloat(reliabilityScore)*20)) / 100} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-4xl font-black text-white">{Math.round(parseFloat(reliabilityScore)*20)}</span>
                </div>
              </div>

              <div className="mt-5 border border-green-500/50 bg-green-900/50 text-green-300 text-xs font-bold px-4 py-1.5 rounded-full">
                {parseFloat(reliabilityScore) >= 4.5 ? 'Elite Status' : 'Good Status'}
              </div>
            </div>
          </div>

          {/* Verified Work History */}
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="font-display font-bold text-xl text-on-surface">Verified Work History</h3>
                <p className="text-sm text-on-surface-variant mt-1">Real reviews from local businesses in Sabah</p>
              </div>
              <button className="text-primary font-bold text-sm hover:underline">View All Gigs</button>
            </div>

            <div className="space-y-4">
              {activeHistory.filter(item => item.rating_given).length === 0 ? (
                <div className="bg-white border border-outline-variant rounded-2xl p-6 flex flex-col md:flex-row gap-4 justify-between items-start">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant flex-shrink-0">
                      <span className="material-symbols-outlined">storefront</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-on-surface">Kopi & Friends (Likas)</h4>
                      <p className="text-sm text-on-surface-variant italic mt-1 font-medium">"{workerName.split(' ')[0]} was incredibly fast at clearing tables during our Sunday rush. Showed up 10 mins early."</p>
                      <div className="flex gap-2 mt-3">
                        <span className="text-[10px] font-bold bg-surface-container text-on-surface-variant px-2 py-1 rounded">Event Support</span>
                        <span className="text-[10px] font-bold bg-surface-container text-on-surface-variant px-2 py-1 rounded">4 Hours</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex text-secondary"><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/></div>
                    <span className="text-xs text-on-surface-variant font-medium">May 12, 2024</span>
                  </div>
                </div>
              ) : (
                activeHistory.filter(item => item.rating_given).map(item => (
                  <div key={item.id} className="bg-white border border-outline-variant rounded-2xl p-6 flex flex-col md:flex-row gap-4 justify-between items-start">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant flex-shrink-0">
                        <span className="material-symbols-outlined">
                          {item.gig_title.toLowerCase().includes('delivery') ? 'local_shipping' : 'storefront'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-on-surface">{item.employer_name || 'Local SME'}</h4>
                        <p className="text-sm text-on-surface-variant italic mt-1 font-medium">"{item.review || 'Great communication. Delivered all items carefully and followed safety protocols.'}"</p>
                        <div className="flex gap-2 mt-3">
                          <span className="text-[10px] font-bold bg-surface-container text-on-surface-variant px-2 py-1 rounded">{item.gig_title}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex text-secondary">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < item.rating ? "currentColor" : "none"} className={i < item.rating ? 'text-secondary' : 'text-outline-variant'} />
                        ))}
                      </div>
                      <span className="text-xs text-on-surface-variant font-medium">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}