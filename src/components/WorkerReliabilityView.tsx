import React, { useState, useEffect } from 'react';
import { AppView, WorkHistoryItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/api';
import { 
  Award, 
  MapPin, 
  ShieldCheck, 
  Star, 
  Calendar,
  Globe,
  Bell,
  Download
} from 'lucide-react';
import { motion } from 'motion/react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface WorkerReliabilityViewProps {
  onNavigate: (view: AppView) => void;
  isEmbedded?: boolean;
  onLogout?: () => void;
}

export default function WorkerReliabilityView({ onNavigate, isEmbedded = false, onLogout }: WorkerReliabilityViewProps) {
  const { user } = useAuth();

  // Profile data
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Stats
  const [activeHistory, setActiveHistory] = useState<any[]>([]);
  const [completedShifts, setCompletedShifts] = useState(0);
  const [reliabilityScore, setReliabilityScore] = useState('5.00');
  const [attendanceRate, setAttendanceRate] = useState(100);

  // SWEAT Pillars
  const [sweatSkills, setSweatSkills] = useState(5.0);
  const [sweatWorkEthic, setSweatWorkEthic] = useState(5.0);
  const [sweatExperience, setSweatExperience] = useState(1.0);
  const [sweatAttendance, setSweatAttendance] = useState(5.0);
  const [sweatTrust, setSweatTrust] = useState(5.0);

  const [badges, setBadges] = useState<any[]>([]);

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
        const ratedHistory = historyData.filter(item => item.rating_given);
        setActiveHistory(historyData);
        
        const completed = historyData.filter(item => item.status === 'completed' || item.status === 'verified').length;
        setCompletedShifts(completed);

        const noShows = historyData.filter(item => item.rating_given && item.rating <= 2).length;
        const totalAttempts = completed + noShows;
        const rate = totalAttempts > 0 ? Math.round((completed / totalAttempts) * 100) : 100;
        setAttendanceRate(rate);

        // Calculate SWEAT pillars
        let skillsSum = 0; let workEthicSum = 0; let trustSum = 0; let validRatedCount = 0;
        
        ratedHistory.forEach(item => {
          if (item.sweat_metrics) {
            skillsSum += item.sweat_metrics.skills || item.rating || 5;
            workEthicSum += item.sweat_metrics.work_ethic || item.rating || 5;
            trustSum += item.sweat_metrics.trust || item.rating || 5;
            validRatedCount++;
          } else if (item.rating) {
            skillsSum += item.rating; workEthicSum += item.rating; trustSum += item.rating;
            validRatedCount++;
          }
        });

        const avgSkills = validRatedCount > 0 ? (skillsSum / validRatedCount) : 5.0;
        const avgWorkEthic = validRatedCount > 0 ? (workEthicSum / validRatedCount) : 5.0;
        const avgTrust = validRatedCount > 0 ? (trustSum / validRatedCount) : 5.0;
        const experienceScore = Math.min(5.0, 1.0 + (completed * 0.25)); 
        const attendanceScore = rate / 20.0;
        
        setSweatSkills(avgSkills);
        setSweatWorkEthic(avgWorkEthic);
        setSweatExperience(experienceScore);
        setSweatAttendance(attendanceScore);
        setSweatTrust(avgTrust);

        const overall = (avgSkills + avgWorkEthic + experienceScore + attendanceScore + avgTrust) / 5;
        setReliabilityScore(overall.toFixed(2));

        // Badges
        let fbCount = 0; let eventCount = 0; let logisticsCount = 0;
        
        historyData.forEach(item => {
          const t = (item.gig_title || '').toLowerCase();
          const c = (item.gig_category || '').toLowerCase();
          if (t.includes('waiter') || t.includes('cafe') || t.includes('barista') || t.includes('food') || c.includes('f&b')) fbCount++;
          else if (t.includes('event') || t.includes('usher') || t.includes('booth') || c.includes('event')) eventCount++;
          else if (t.includes('delivery') || t.includes('warehouse') || t.includes('packer') || c.includes('logistics')) logisticsCount++;
        });

        const derivedBadges = [];
        if (fbCount > 0) derivedBadges.push({ id: 'fb', icon: 'coffee', name: 'F&B Crew', level: Math.min(3, Math.ceil(fbCount / 2)) });
        if (eventCount > 0) derivedBadges.push({ id: 'event', icon: 'confirmation_number', name: 'Event Assistant', level: Math.min(3, Math.ceil(eventCount / 2)) });
        if (logisticsCount > 0) derivedBadges.push({ id: 'logistics', icon: 'local_shipping', name: 'Logistics Pro', level: Math.min(3, Math.ceil(logisticsCount / 2)) });
        if (rate >= 95 && completed > 0) derivedBadges.push({ id: 'reliable', icon: 'verified_user', name: 'Reliable', level: 3 });
        if (avgTrust >= 4.5 && completed > 0) derivedBadges.push({ id: 'team', icon: 'group', name: 'Team Player', level: 3 });

        setBadges(derivedBadges);
      }
    } catch (err) {
      console.error('Error loading reliability profile:', err);
    } finally {
      setLoadingProfile(false);
    }
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
  const workerAvatar = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(workerName)}&background=0D8ABC&color=fff`;
  const workerUniversity = profile?.university || 'University Student';

  return (
    <div className={isEmbedded ? "bg-transparent text-on-surface font-sans" : "bg-surface-container-lowest min-h-screen text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container flex flex-col md:flex-row"}>
      
      {/* Top Navigation Row */}
      {!isEmbedded && (
        <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-8 h-16 bg-surface border-b border-outline-variant shadow-xs">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate(AppView.Landing)}>
            <span className="font-display font-black text-2xl text-primary tracking-tight">GigIT</span>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            <button onClick={() => onNavigate(AppView.WorkerBrowse)} className={`font-semibold border-b-2 py-1 text-sm tracking-wide cursor-pointer transition-colors text-on-surface-variant border-transparent hover:text-primary`}>Explore Gigs</button>
            <button className={`font-semibold border-b-2 py-1 text-sm tracking-wide cursor-pointer transition-colors text-primary border-primary`}>Worker Portal</button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-2 items-center">
              <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors relative cursor-pointer">
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-secondary rounded-full" />
                <Bell size={20} className="text-on-surface-variant" />
              </button>
              <button className="p-0.5 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer ml-1">
                <img alt="Worker profile" className="w-8 h-8 rounded-full border border-outline-variant object-cover" src={workerAvatar} />
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
              { id: 'MyReliability',  icon: 'verified_user',  label: 'My Profile ID' },
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
            <button onClick={onLogout} className="w-full flex items-center gap-3 p-2.5 text-on-surface-variant hover:text-error transition-colors text-left text-xs font-bold">
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area (Desktop Layout) */}
      <main className={`flex-1 ${isEmbedded ? '' : 'md:ml-64 pt-24 px-6 md:px-10 pb-20'}`}>
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Top Banner / Identity */}
          <div className="bg-white rounded-3xl p-8 border border-outline-variant shadow-sm flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row items-center md:items-center gap-6 relative z-10">
              <div className="relative">
                <img src={workerAvatar} alt={workerName} className="w-24 h-24 rounded-2xl object-cover border-4 border-surface shadow-md" />
                <div className="absolute -bottom-3 -right-3 bg-white text-green-700 text-[10px] font-black px-3 py-1 rounded-full shadow-sm flex items-center gap-1 border border-green-100">
                  <ShieldCheck size={12} className="text-green-600" /> Verified
                </div>
              </div>
              
              <div className="text-center md:text-left">
                <h1 className="font-display font-black text-3xl tracking-tight text-on-surface">{workerName}</h1>
                <p className="text-on-surface-variant text-sm font-medium mt-1">{workerUniversity}</p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface"><MapPin size={14} className="text-primary"/> {profile?.location || 'Sepanggar, KK'}</div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface"><Globe size={14} className="text-primary"/> Malay, English</div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto relative z-10">
              <div className="bg-surface-container rounded-2xl px-6 py-4 flex flex-col items-center md:items-end w-full sm:w-auto">
                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">SWEAT™ Score</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-primary tracking-tighter">{parseFloat(reliabilityScore).toFixed(2)}</span>
                  <span className="text-sm font-bold text-on-surface-variant">/5.0</span>
                </div>
              </div>
              <button 
                onClick={() => window.open(`/?nfc=${user?.id}`, '_blank')}
                className="w-full sm:w-auto py-3 px-6 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                View Public Profile
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Col: SWEAT Radar */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-white rounded-3xl p-6 border border-outline-variant shadow-sm flex flex-col items-center">
                <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-6 w-full text-left">SWEAT™ Breakdown</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                      { subject: 'Skills', A: sweatSkills, fullMark: 5 },
                      { subject: 'Work Ethic', A: sweatWorkEthic, fullMark: 5 },
                      { subject: 'Experience', A: sweatExperience, fullMark: 5 },
                      { subject: 'Attendance', A: sweatAttendance, fullMark: 5 },
                      { subject: 'Trust', A: sweatTrust, fullMark: 5 },
                    ]}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#0f4a42', fontSize: 11, fontWeight: 'bold' }} />
                      <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 9 }} tickCount={6} />
                      <Radar name={workerName} dataKey="A" stroke="#0f4a42" fill="#0f4a42" fillOpacity={0.5} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="bg-white rounded-3xl p-6 border border-outline-variant shadow-sm grid grid-cols-2 gap-4">
                <div className="bg-surface-container rounded-2xl p-4 flex flex-col items-center text-center">
                  <span className="text-2xl font-black text-on-surface">{completedShifts}</span>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase mt-1 tracking-wide">Gigs Done</span>
                </div>
                <div className="bg-surface-container rounded-2xl p-4 flex flex-col items-center text-center">
                  <span className="text-2xl font-black text-on-surface">{attendanceRate}%</span>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase mt-1 tracking-wide">Attendance</span>
                </div>
              </div>
            </div>

            {/* Middle Col: Badges & About */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-white rounded-3xl p-6 border border-outline-variant shadow-sm">
                <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-4">Skills Passport</h3>
                {badges.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {badges.map((badge, idx) => (
                      <div key={idx} className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-[#0f4a42]/10 flex items-center justify-center text-[#0f4a42] mb-3">
                          <span className="material-symbols-outlined text-[24px]">{badge.icon}</span>
                        </div>
                        <span className="text-xs font-bold text-on-surface leading-tight">{badge.name}</span>
                        <span className="text-[10px] font-bold text-primary mt-1">Level {badge.level}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-surface-container rounded-2xl border border-dashed border-outline-variant">
                    <Award className="mx-auto text-outline-variant mb-2" size={32} />
                    <p className="text-sm text-on-surface-variant font-medium">Complete gigs to earn badges!</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl p-6 border border-outline-variant shadow-sm">
                <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-4">About Me</h3>
                <p className="text-sm text-on-surface leading-relaxed font-medium">
                  {profile?.bio || 'Student at Universiti Malaysia Sabah. Specialized in event support and local delivery tasks. Known for punctuality and quick learning. Ready to help out with any local SME needs.'}
                </p>
              </div>
            </div>

            {/* Right Col: Work History */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl p-6 border border-outline-variant shadow-sm h-full max-h-[800px] flex flex-col">
                <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-6">Verified Work History</h3>
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                  {activeHistory.filter(item => item.rating_given).length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="mx-auto text-outline-variant mb-3 opacity-50" size={32} />
                      <p className="text-sm text-on-surface-variant font-medium">No verified work history yet.</p>
                    </div>
                  ) : (
                    activeHistory.filter(item => item.rating_given).map(item => (
                      <div key={item.id} className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-4 flex flex-col gap-3 hover:border-primary/30 transition-colors">
                        <div className="flex gap-3 items-start">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <span className="material-symbols-outlined text-[20px]">
                              {item.gig_title.toLowerCase().includes('delivery') ? 'local_shipping' : 'storefront'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-on-surface truncate">{item.employer_name || 'Local SME'}</h4>
                            <p className="text-[11px] font-bold text-primary truncate">{item.gig_title}</p>
                          </div>
                          <span className="text-[10px] text-on-surface-variant font-medium flex-shrink-0 bg-surface-container px-2 py-1 rounded-md">{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        <p className="text-xs text-on-surface-variant italic font-medium leading-relaxed bg-surface-container p-3 rounded-xl border border-outline-variant/30 relative">
                          <span className="text-xl text-primary/20 absolute -top-1 -left-1">"</span>
                          {item.review || 'Great communication. Delivered all items carefully and followed safety protocols.'}
                        </p>
                        
                        <div className="flex justify-between items-center mt-1">
                          <div className="flex text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} fill={i < item.rating ? "currentColor" : "none"} className={i < item.rating ? 'text-amber-400' : 'text-outline-variant/50'} />
                            ))}
                          </div>
                          <div className="flex gap-2">
                            {item.sweat_metrics && (
                              <span className="text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded text-center">SWEAT Verified</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}