import React, { useState, useEffect } from 'react';
import { supabase } from '../services/api';
import { 
  Award, 
  MapPin, 
  ShieldCheck, 
  Star, 
  Calendar,
  Globe,
  Download
} from 'lucide-react';
import { motion } from 'motion/react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Mail, Phone, GraduationCap, Briefcase, Loader2 } from 'lucide-react';
import { AnimatePresence } from 'motion/react';

interface PublicProfileViewProps {
  workerId: string;
  attendanceMode?: boolean;
  onCloseAttendance?: () => void;
}

export default function PublicProfileView({ workerId, attendanceMode = false, onCloseAttendance }: PublicProfileViewProps) {
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

  // States
  const [activeTab, setActiveTab] = useState<'profile' | 'passport' | 'history'>('passport');
  const [badges, setBadges] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const resumeRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (workerId) {
      loadProfileAndStats();
    }
  }, [workerId]);

  const loadProfileAndStats = async () => {
    setLoadingProfile(true);
    setError(null);
    try {
      // 1. Fetch user profile
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', workerId)
        .single();
      
      if (profileErr || !profileData) {
        throw new Error('Worker profile not found.');
      }
      setProfile(profileData);

      // 2. Fetch completed gigs / hired workers history
      const { data: historyData, error: historyErr } = await supabase
        .from('hired_workers')
        .select('*')
        .eq('worker_id', workerId)
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

        // SWEAT
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
    } catch (err: any) {
      setError(err.message || 'An error occurred loading the profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-on-surface-variant font-medium">Loading Digital Profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center">
        <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
          <h2 className="text-xl font-bold text-error mb-2">Profile Not Found</h2>
          <p className="text-on-surface-variant text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const workerName = profile?.full_name || 'Worker';
  const workerAvatar = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(workerName)}&background=0D8ABC&color=fff`;
  const workerUniversity = profile?.university || 'University Student';

  const generatePDF = async () => {
    if (!resumeRef.current) return;
    setGenerating(true);
    try {
      // Use browser print dialog for PDF generation (avoids html2canvas oklab crash)
      resumeRef.current.style.display = 'block';
      window.print();
      resumeRef.current.style.display = 'none';
    } catch (err) {
      console.error('Error generating PDF', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest flex justify-center py-10 px-4">
      <div className="w-full max-w-[400px]">
        
        {/* Digital Profile Card / ID Concept */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-8 border-surface-container-lowest overflow-hidden flex flex-col relative min-h-[800px]">
          
          {/* Header / ID Top */}
          <div className="bg-gradient-to-b from-[#0f4a42] to-primary text-white p-8 pt-10 pb-24 relative rounded-b-[3rem]">
            <div className="absolute top-0 right-0 w-full h-full overflow-hidden rounded-b-[3rem]">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
              <div className="absolute -left-10 bottom-10 w-40 h-40 bg-secondary opacity-20 rounded-full blur-2xl"></div>
            </div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded bg-white text-primary flex items-center justify-center font-black text-xl">G</div>
                <span className="font-display font-black tracking-widest text-lg">GIGIT</span>
              </div>
              
              <div className="relative mb-4">
                <img src={workerAvatar} alt={workerName} className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg bg-white" />
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-white text-green-700 text-[10px] font-black px-3 py-1 rounded-full shadow-md whitespace-nowrap flex items-center gap-1 border border-green-100">
                  <ShieldCheck size={12} className="text-green-600" /> Verified Student
                </div>
              </div>
              
              <h1 className="font-display font-bold text-2xl mt-4 tracking-tight">{workerName.toUpperCase()}</h1>
              <p className="text-white/80 text-sm font-medium mt-1 tracking-wide">{workerUniversity}</p>
            </div>
            
            {/* Attendance Mode Overlay Animation */}
            <AnimatePresence>
              {attendanceMode && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -50 }}
                  transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0f4a42]/90 backdrop-blur-sm rounded-b-[3rem] p-6 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,197,94,0.6)]"
                  >
                    <ShieldCheck size={40} className="text-white" />
                  </motion.div>
                  <h2 className="text-4xl font-display font-black text-white mb-2 tracking-tight">
                    Hello, {workerName.split(' ')[0]}!
                  </h2>
                  <p className="text-green-100 font-bold text-lg mb-8">Attendance Recorded</p>
                  
                  {onCloseAttendance && (
                    <button 
                      onClick={onCloseAttendance}
                      className="px-6 py-2.5 bg-white text-[#0f4a42] rounded-full font-bold text-sm shadow-lg hover:bg-green-50 transition-colors"
                    >
                      Continue
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Score & Stats Card (Overlapping) */}
          <div className="relative z-20 -mt-16 mx-6 bg-white rounded-3xl shadow-xl border border-outline-variant/50 p-6 flex flex-col items-center">
            <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">SWEAT™ Trust Score</h3>
            
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-5xl font-black text-on-surface tracking-tighter">{parseFloat(reliabilityScore).toFixed(2)}</span>
              <span className="text-lg font-bold text-on-surface-variant">/5.00</span>
            </div>
            
            <div className="flex text-amber-400 gap-1 mb-2">
              {[1,2,3,4,5].map((star) => (
                <Star key={star} size={20} fill={star <= Math.round(parseFloat(reliabilityScore)) ? "currentColor" : "none"} className={star <= Math.round(parseFloat(reliabilityScore)) ? "" : "text-outline-variant"} />
              ))}
            </div>
            
            {(() => {
              const score = parseFloat(reliabilityScore);
              let desc = "Needs Improvement";
              let color = "text-error bg-error-container/30";
              if (score >= 4.5) { desc = "Excellent"; color = "text-green-700 bg-green-100"; }
              else if (score >= 3.5) { desc = "Good"; color = "text-blue-700 bg-blue-100"; }
              else if (score >= 2.5) { desc = "Average"; color = "text-amber-700 bg-amber-100"; }
              
              return (
                <span className={`text-xs font-bold px-3 py-1 rounded-full mt-1 ${color}`}>
                  {desc}
                </span>
              );
            })()}

            {/* Mini Stats Row */}
            <div className="w-full grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-outline-variant/50">
              <div className="flex flex-col items-center text-center">
                <span className="text-xl font-black text-on-surface">{completedShifts}</span>
                <span className="text-[9px] font-bold text-on-surface-variant uppercase mt-1">Completed Gigs</span>
              </div>
              <div className="flex flex-col items-center text-center border-x border-outline-variant/50">
                <span className="text-xl font-black text-on-surface">{attendanceRate}%</span>
                <span className="text-[9px] font-bold text-on-surface-variant uppercase mt-1">Attendance</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-xl font-black text-on-surface">{activeHistory.filter(i => i.rating_given).length}</span>
                <span className="text-[9px] font-bold text-on-surface-variant uppercase mt-1">Endorsements</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 px-6 mt-6">
            <button 
              onClick={() => window.location.href = `mailto:${profile?.email || 'hello@gigit.com'}`}
              className="flex-1 py-3 rounded-xl border-2 border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-colors cursor-pointer"
            >
              Contact Worker
            </button>
            <button 
              onClick={generatePDF}
              disabled={generating}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
              {generating ? 'Wait...' : 'Download PDF'}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex mt-8 px-6 border-b border-outline-variant">
            {[
              { id: 'profile', label: 'Profile' },
              { id: 'passport', label: 'Skills Passport' },
              { id: 'history', label: 'Work History' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wide transition-colors relative cursor-pointer ${activeTab === tab.id ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="publicactivetab" className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 flex-1 bg-surface-container-lowest">
            
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div>
                  <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2">About</h4>
                  <p className="text-sm text-on-surface leading-relaxed font-medium">
                    {profile?.bio || 'Student at Universiti Malaysia Sabah. Specialized in event support and local delivery tasks. Known for punctuality and quick learning.'}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2">Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm font-medium text-on-surface"><MapPin size={16} className="text-primary"/> {profile?.location || 'Sepanggar, KK'}</div>
                    <div className="flex items-center gap-3 text-sm font-medium text-on-surface"><Globe size={16} className="text-primary"/> Malay, English</div>
                    <div className="flex items-center gap-3 text-sm font-medium text-on-surface"><Calendar size={16} className="text-primary"/> Member since Jan 2024</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'passport' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                {/* Radar Chart Section */}
                <div>
                  <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-4 text-center">SWEAT™ Breakdown</h4>
                  <div className="h-64 w-full -ml-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                        { subject: 'Skills', A: sweatSkills, fullMark: 5 },
                        { subject: 'Work Ethic', A: sweatWorkEthic, fullMark: 5 },
                        { subject: 'Experience', A: sweatExperience, fullMark: 5 },
                        { subject: 'Attendance', A: sweatAttendance, fullMark: 5 },
                        { subject: 'Trust', A: sweatTrust, fullMark: 5 },
                      ]}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#0f4a42', fontSize: 10, fontWeight: 'bold' }} />
                        <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 9 }} tickCount={6} />
                        <Radar name={workerName} dataKey="A" stroke="#0f4a42" fill="#0f4a42" fillOpacity={0.5} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Badges Section */}
                <div>
                  <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-4 border-t border-outline-variant pt-6 text-center">Badges & Achievements</h4>
                  {badges.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4">
                      {badges.map((badge, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center">
                          <div className="w-14 h-14 rounded-2xl bg-[#0f4a42]/10 border border-[#0f4a42]/20 flex items-center justify-center text-[#0f4a42] shadow-sm mb-2">
                            <span className="material-symbols-outlined text-[28px]">{badge.icon}</span>
                          </div>
                          <span className="text-[10px] font-bold text-on-surface leading-tight">{badge.name}</span>
                          <span className="text-[9px] font-medium text-on-surface-variant mt-0.5">Level {badge.level}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant">
                      <Award className="mx-auto text-outline-variant mb-2" size={24} />
                      <p className="text-xs text-on-surface-variant font-medium">Complete gigs to earn badges!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                {activeHistory.filter(item => item.rating_given).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-on-surface-variant font-medium">No verified work history yet.</p>
                  </div>
                ) : (
                  activeHistory.filter(item => item.rating_given).map(item => (
                    <div key={item.id} className="bg-white border border-outline-variant rounded-xl p-4 flex gap-4 items-start shadow-sm">
                      <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                        <span className="material-symbols-outlined text-[20px]">
                          {item.gig_title.toLowerCase().includes('delivery') ? 'local_shipping' : 'storefront'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-on-surface truncate">{item.employer_name || 'Local SME'}</h4>
                        <p className="text-[10px] font-bold text-primary truncate">{item.gig_title}</p>
                        <p className="text-xs text-on-surface-variant italic mt-1.5 font-medium line-clamp-2">"{item.review || 'Great communication. Delivered all items carefully and followed safety protocols.'}"</p>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-outline-variant/50">
                          <div className="flex text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={12} fill={i < item.rating ? "currentColor" : "none"} className={i < item.rating ? 'text-amber-400' : 'text-outline-variant'} />
                            ))}
                          </div>
                          <span className="text-[10px] text-on-surface-variant font-medium">{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Hidden Resume Template for PDF Generation */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <div 
          ref={resumeRef}
          style={{ width: '210mm', minHeight: '297mm', padding: '40px', boxSizing: 'border-box', backgroundColor: 'white', display: 'none' }}
          className="text-black font-sans"
        >
          {/* Header */}
          <div className="flex items-center gap-6 border-b-2 border-[#0f4a42]/20 pb-8 mb-8">
            {profile?.avatar_url && (
              <img src={profile.avatar_url} alt="Profile" style={{ width: '128px', height: '128px', borderRadius: '50%', objectFit: 'cover' }} crossOrigin="anonymous" />
            )}
            <div className="flex-1">
              <h1 className="text-4xl font-black text-[#0f4a42] tracking-tight mb-2 uppercase">{workerName}</h1>
              <h2 className="text-xl font-bold text-gray-600 mb-4">{workerUniversity}</h2>
              
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-gray-600">
                {profile?.email && <div className="flex items-center gap-1.5"><Mail size={16} className="text-[#0f4a42]" /> {profile.email}</div>}
                {profile?.phone_number && <div className="flex items-center gap-1.5"><Phone size={16} className="text-[#0f4a42]" /> {profile.phone_number}</div>}
                {profile?.location && <div className="flex items-center gap-1.5"><MapPin size={16} className="text-[#0f4a42]" /> {profile.location}</div>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="col-span-1 space-y-8">
              {profile?.bio && (
                <div>
                  <h3 className="text-lg font-black text-[#0f4a42] uppercase tracking-wider mb-3 border-b border-gray-200 pb-1">Profile</h3>
                  <p className="text-sm leading-relaxed font-medium text-gray-800">{profile.bio}</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-black text-[#0f4a42] uppercase tracking-wider mb-3 border-b border-gray-200 pb-1">Education</h3>
                <div className="text-sm font-medium text-gray-800">
                  <p className="font-bold">{profile?.education_level || 'Higher Education'}</p>
                  <p className="text-gray-600">{workerUniversity}</p>
                </div>
              </div>

              {profile?.skills && profile.skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-black text-[#0f4a42] uppercase tracking-wider mb-3 border-b border-gray-200 pb-1">Skills</h3>
                  <div className="flex flex-col gap-1.5">
                    {profile.skills.map((skill: string, i: number) => (
                      <span key={i} className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0f4a42]" /> {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="col-span-2 space-y-8">
              <div>
                <h3 className="text-lg font-black text-[#0f4a42] uppercase tracking-wider mb-4 border-b border-gray-200 pb-1 flex items-center gap-2">
                  <Briefcase size={20} /> Verified Experience
                </h3>
                
                {activeHistory.filter(h => h.status === 'completed' || h.status === 'verified').length > 0 ? (
                  <div className="space-y-6">
                    {activeHistory.filter(h => h.status === 'completed' || h.status === 'verified').map((gig, idx) => (
                      <div key={idx} className="relative pl-4 border-l-2 border-[#0f4a42]/20">
                        <div className="absolute w-3 h-3 bg-white border-2 border-[#0f4a42] rounded-full -left-[7.5px] top-1"></div>
                        <h4 className="font-bold text-base text-gray-900">{gig.gig_title}</h4>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-[#0f4a42]">{gig.employer_name}</span>
                          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {new Date(gig.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        {gig.review && (
                          <p className="text-sm text-gray-600 italic leading-relaxed">"{gig.review}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 font-medium">No verified GigIT experience yet.</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-gray-200 text-center text-xs text-gray-400 font-medium flex justify-center items-center gap-1">
            Verified by <span className="font-bold text-[#0f4a42] flex items-center gap-0.5"><div className="w-3 h-3 bg-[#0f4a42] text-white rounded-[3px] text-[8px] flex items-center justify-center font-black">G</div> GigIT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
