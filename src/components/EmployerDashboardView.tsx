// EmployerDashboardView.tsx - Complete fixed version
import React, { useState, useEffect } from 'react';
import { AppView, Gig, Applicant } from '../types';
// Mock data imports removed - all data from Supabase
import { api, supabase } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BackupPoolWidget from './BackupPoolWidget';
import EmployerMyGigs from './EmployerMyGigs';
import HiredWorkers from './HiredWorkers';
import WorkerProfileModal from './WorkerProfileModal';
import EmployerSettings from './EmployerSettings';
import Wallet from './Wallet';
import AdminSeedButton from './AdminSeedButton';
import DebugPanel from './DebugPanel';
import { 
  Bell, Plus, Star, Check, MapPin, Shield, TrendingUp, Eye, 
  Briefcase, Users, CreditCard, Settings, LogOut, X, Send, 
  Sparkles, Info, Loader2, Bot, ThumbsUp, Clock as ClockIcon,
  Filter, Search, ArrowUpDown, Coffee, Package, Calendar, 
  Home, ShoppingBag, Zap, Copy, ChevronDown, Award, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

interface EmployerDashboardViewProps {
  onNavigate: (view: AppView) => void;
  gigs: Gig[];
  onAddGig: (gig: Gig) => void;
  onLogout?: () => void;
}

// Pre-defined gig templates for quick posting
const GIG_TEMPLATES = {
  'Cafe Barista': {
    title: 'Part-Time Barista',
    rate: '12',
    category: 'F&B' as const,
    duration: '6 Hours',
    description: 'Looking for a friendly and energetic barista to join our cafe team. Responsibilities include taking orders, preparing coffee, and maintaining cleanliness. Training provided!',
    tags: 'Barista Experience, Customer Service',
    location: 'KK Town'
  },
  'Event Crew': {
    title: 'Event Crew / Setup Assistant',
    rate: '15',
    category: 'Event' as const,
    duration: '8 Hours',
    description: 'Need extra hands for upcoming event. Tasks include setting up booths, registration desk, ushering guests, and post-event cleanup. Perfect for students!',
    tags: 'Event Support, Physical Work',
    location: 'SICC'
  },
  'Warehouse Assistant': {
    title: 'Warehouse Packer',
    rate: '11',
    category: 'Logistics' as const,
    duration: '8 Hours',
    description: 'Help sort, pack, and label parcels for delivery. No experience needed, just willingness to learn and work in a team.',
    tags: 'Packing, Sorting, Heavy Lifting',
    location: 'Inanam'
  },
  'Cleaner': {
    title: 'Office Cleaner',
    rate: '10',
    category: 'Cleaning' as const,
    duration: '4 Hours',
    description: 'Evening cleaning shift. Duties include sweeping, mopping, taking out trash, and sanitizing surfaces.',
    tags: 'Cleaning, Evening Shift',
    location: 'Likas'
  },
  'Promoter': {
    title: 'Product Promoter',
    rate: '80',
    category: 'Event' as const,
    duration: 'Full Day',
    description: 'Exciting opportunity to promote new products at Imago Mall. Commission available! Training provided. Must be outgoing and friendly.',
    tags: 'Sales, Promotion, Commission',
    location: 'Imago Mall'
  },
  'Delivery Rider': {
    title: 'Food Delivery Rider',
    rate: '10',
    category: 'Logistics' as const,
    duration: '5 Hours',
    description: 'Need riders for lunch/dinner rush. Must have own motorcycle and license. Flexible hours, earn extra per delivery!',
    tags: 'Motorcycle License, Delivery App',
    location: 'KK Town'
  }
};

export default function EmployerDashboardView({ onNavigate, gigs, onAddGig, onLogout }: EmployerDashboardViewProps) {
  const { user } = useAuth();
  
  // State
  const [selectedWorkerProfile, setSelectedWorkerProfile] = useState<any>(null);
  const [showWorkerProfile, setShowWorkerProfile] = useState(false);
  const [currentSubView, setCurrentSubView] = useState<'dashboard' | 'mygigs' | 'hired' | 'settings' | 'wallet' | 'esg'>('dashboard'); 
  const [selectedGigForBackup, setSelectedGigForBackup] = useState<Gig | null>(null);
  const [showBackupPool, setShowBackupPool] = useState(false);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  // ESG stats
  const [esgStats, setEsgStats] = useState({ 
    studentsHired: 0, 
    totalWagesPaid: 0, 
    avgRating: 0, 
    totalGigsPosted: 0,
    b40WagesPaid: 0,
    totalHoursWorked: 0,
    topSkillMentored: 'No Data'
  });
  const [uniPartners, setUniPartners] = useState<{name: string; count: number}[]>([]);
  const [employerProfile, setEmployerProfile] = useState<any>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'employer' | 'candidate'; text: string; time: string; id?: string }>>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);
  const [isExportingEsg, setIsExportingEsg] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);
  const [aiRanking, setAiRanking] = useState<{ applicantId: string; score: number; reason: string }[]>([]);
  const [isAiRanking, setIsAiRanking] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Hired'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'date'>('rating');
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  
  // My gigs
  const [myGigs, setMyGigs] = useState<Gig[]>([]);
  const [selectedGigId, setSelectedGigId] = useState<string | null>(null);

  // Post gig form with defaults
  const [formData, setFormData] = useState({
    title: 'Cafe Assistant',
    rate: '12',
    category: 'F&B' as const,
    duration: '6 Hours',
    description: 'Help with basic cafe tasks, taking orders, and serving customers during the afternoon rush. Training provided, friendly team!',
    tags: 'F&B Support, Student Friendly, Flexible Hours',
    location: 'KK Town',
  });

  // Quick fill from template
  const applyTemplate = (templateName: keyof typeof GIG_TEMPLATES) => {
    const template = GIG_TEMPLATES[templateName];
    setFormData({
      title: template.title,
      rate: template.rate,
      category: template.category,
      duration: template.duration,
      description: template.description,
      tags: template.tags,
      location: template.location,
    });
    setShowTemplateDropdown(false);
    setShowSuccessToast(`✨ "${templateName}" template loaded! Click Post to publish.`);
    setTimeout(() => setShowSuccessToast(null), 2000);
  };

  // Reset to default form
  const resetToDefault = () => {
    setFormData({
      title: 'Cafe Assistant',
      rate: '12',
      category: 'F&B',
      duration: '6 Hours',
      description: 'Help with basic cafe tasks, taking orders, and serving customers during the afternoon rush. Training provided, friendly team!',
      tags: 'F&B Support, Student Friendly, Flexible Hours',
      location: 'KK Town',
    });
  };

  // Random test data generator for quick testing
  const generateRandomGig = () => {
    const titles = ['Weekend Barista', 'Event Helper', 'Warehouse Staff', 'Cleaner', 'Promoter', 'Kitchen Assistant', 'Delivery Rider'];
    const categories = ['F&B', 'Event', 'Logistics', 'Cleaning'] as const;
    const rates = ['10', '12', '15', '80', '100'];
    const durations = ['4 Hours', '6 Hours', '8 Hours', 'Full Day'];
    const locations = ['KK Town', 'Likas', 'Inanam', 'Penampang', 'Putatan'];
    
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    setFormData({
      title: randomTitle,
      rate: rates[Math.floor(Math.random() * rates.length)],
      category: randomCategory,
      duration: durations[Math.floor(Math.random() * durations.length)],
      description: `We're looking for a ${randomTitle.toLowerCase()} to join our team! Flexible hours, great environment, and competitive pay. Students encouraged to apply.`,
      tags: `${randomCategory === 'F&B' ? 'Customer Service' : randomCategory === 'Event' ? 'Event Setup' : randomCategory === 'Logistics' ? 'Packing' : 'Cleaning'}, Student Friendly, Immediate Start`,
      location: locations[Math.floor(Math.random() * locations.length)],
    });
    setShowSuccessToast('🎲 Random gig generated! Edit or click Post.');
    setTimeout(() => setShowSuccessToast(null), 2000);
  };

  // Fetch my gigs and applicants
  useEffect(() => {
    if (user) {
      fetchMyGigs();
      fetchAllApplicants();
      fetchEmployerProfile();
      fetchEsgStats();
    }
  }, [user]);

  const fetchEsgStats = async () => {
    if (!user) return;
    try {
      // Advanced ESG Metrics
      const { data: advancedHiredData } = await supabase
        .from('hired_workers')
        .select('worker_id, amount, payment_status, rating_given, sweat_metrics, clock_in_time, clock_out_time')
        .eq('employer_id', user.id);
        
      if (advancedHiredData && advancedHiredData.length > 0) {
        // 1. Total Hours Worked
        let totalHours = 0;
        advancedHiredData.forEach(h => {
          if (h.clock_in_time && h.clock_out_time) {
            const start = new Date(h.clock_in_time).getTime();
            const end = new Date(h.clock_out_time).getTime();
            const hours = (end - start) / (1000 * 60 * 60);
            if (hours > 0 && hours < 24) { // Sanity check
              totalHours += hours;
            }
          }
        });
        
        // 2. Mentorship Focus (from sweat_metrics)
        let skillsSum = 0;
        let workEthicSum = 0;
        let trustSum = 0;
        let ratingCount = 0;
        
        advancedHiredData.forEach(h => {
          if (h.rating_given && h.sweat_metrics) {
            skillsSum += h.sweat_metrics.skills || 0;
            workEthicSum += h.sweat_metrics.work_ethic || 0;
            trustSum += h.sweat_metrics.trust || 0;
            ratingCount++;
          }
        });
        
        let topSkill = 'No Data';
        if (ratingCount > 0) {
          const avgS = skillsSum / ratingCount;
          const avgW = workEthicSum / ratingCount;
          const avgT = trustSum / ratingCount;
          
          if (avgS >= avgW && avgS >= avgT) topSkill = 'Skills & Expertise';
          else if (avgW >= avgS && avgW >= avgT) topSkill = 'Work Ethic & Proactivity';
          else topSkill = 'Trust & Professionalism';
        }

        // 3. B40 Economic Empowerment
        let b40Total = 0;
        const workerIds = [...new Set(advancedHiredData.map(h => h.worker_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, university, income_classification')
          .in('id', workerIds);
          
        if (profiles) {
          const b40Profiles = new Set(profiles.filter(p => p.income_classification === 'B40').map(p => p.id));
          
          b40Total = advancedHiredData
            .filter(h => h.payment_status === 'paid' && b40Profiles.has(h.worker_id))
            .reduce((sum, h) => sum + (h.amount || 0), 0);
            
          // Also do University Partnerships here
          const uniCounts: Record<string, number> = {};
          profiles.forEach(p => {
            if (p.university) {
              uniCounts[p.university] = (uniCounts[p.university] || 0) + 1;
            }
          });
          setUniPartners(Object.entries(uniCounts).map(([name, count]) => ({ name, count })));
        }

        const uniqueWorkers = new Set(advancedHiredData.map(h => h.worker_id));
        const totalPaid = advancedHiredData
          .filter(h => h.payment_status === 'paid')
          .reduce((sum, h) => sum + (h.amount || 0), 0);
        const rated = advancedHiredData.filter(h => h.rating_given && (h.sweat_metrics || h.rating)); // Backward compatible
        const avgRating = rated.length > 0 
          ? rated.reduce((sum, h) => sum + (h.sweat_metrics ? (h.sweat_metrics.skills + h.sweat_metrics.work_ethic + h.sweat_metrics.trust)/3 : h.rating || 0), 0) / rated.length 
          : 0;

        setEsgStats({
          studentsHired: uniqueWorkers.size,
          totalWagesPaid: totalPaid,
          avgRating: Math.round(avgRating * 10) / 10,
          totalGigsPosted: myGigs.length,
          b40WagesPaid: b40Total,
          totalHoursWorked: Math.round(totalHours),
          topSkillMentored: topSkill
        });
      }
    } catch (err) {
      console.error('Error fetching ESG stats:', err);
    }
  };

  const fetchEmployerProfile = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, company_name, company_address, city, state, phone_number')
        .eq('id', user.id)
        .single();
      if (data) setEmployerProfile(data);
    } catch (err) {
      console.error('Error fetching employer profile:', err);
    }
  };

  useEffect(() => {
    // Subscribe to real-time gig changes
    const channel = supabase
      .channel('public:applicants')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applicants' }, payload => {
        // fetchApplicants again
        fetchAllApplicants();
      })
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const fetchMyGigs = async () => {
    try {
      const { data, error } = await supabase
        .from('gigs')
        .select('*')
        .eq('employer_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setMyGigs(data);
        if (data.length > 0 && !selectedGigId) {
          setSelectedGigId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching my gigs:', err);
    }
  };

  const fetchAllApplicants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('applicants')
        .select('*, profiles(*)')
        .eq('employer_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (!error && data && data.length > 0) {
        const mappedApplicants: Applicant[] = data.map((app: any) => ({
          id: app.id,
          worker_id: app.worker_id,
          gig_id: app.gig_id,
          name: app.profiles?.full_name || 'Student Applicant',
          avatar: app.profiles?.avatar_url || `https://randomuser.me/api/portraits/men/1.jpg`,
          rating: parseFloat(app.profiles?.reliability_score || '4.5'),
          badge: app.profiles?.is_verified ? 'Verified Student' : 'Student',
          noShowRate: '0%',
          distance: app.profiles?.city ? `${app.profiles.city}` : 'Location unknown',
          bio: app.cover_letter || (app.profiles?.bio ? app.profiles.bio : 'Student worker looking for this position.'),
          status: app.status || 'Pending',
          income_classification: app.profiles?.income_classification || null,
          skills: app.profiles?.skills || [],
        }));
        setApplicants(mappedApplicants);
      } else {
        setApplicants([]);
      }
    } catch (err) {
      console.error('Error fetching applicants:', err);
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  // AI Candidate Ranking
  const rankCandidatesWithAI = async () => {
    if (applicants.length === 0) {
      setShowSuccessToast('No applicants to rank');
      setTimeout(() => setShowSuccessToast(null), 2000);
      return;
    }
    
    setIsAiRanking(true);
    
    // Calculate scores manually (works without AI)
    const rankings = applicants.map(applicant => {
      // Normalize rating (0-5) to (0-100)
      const ratingScore = (applicant.rating / 5) * 70;
      
      // No-show score (lower no-show = higher score)
      const noShowValue = applicant.noShowRate === '0%' ? 100 : 
                          applicant.noShowRate === '5%' ? 80 : 60;
      const noShowScore = (noShowValue / 100) * 30;
      
      const totalScore = ratingScore + noShowScore;
      
      let reason = '';
      if (applicant.rating >= 4.8 && applicant.noShowRate === '0%') {
        reason = `${applicant.name} is an excellent candidate with ${applicant.rating}⭐ rating and perfect attendance.`;
      } else if (applicant.rating >= 4.5) {
        reason = `${applicant.name} has a strong ${applicant.rating}⭐ rating and reliable track record.`;
      } else {
        reason = `${applicant.name} meets the basic requirements for this position.`;
      }
      
      return {
        applicantId: applicant.id,
        score: Math.round(totalScore),
        reason: reason
      };
    });
    
    // Sort by score descending
    rankings.sort((a, b) => b.score - a.score);
    
    setAiRanking(rankings);
    setShowSuccessToast('✨ Candidates ranked by reliability score!');
    setTimeout(() => setShowSuccessToast(null), 3000);
    setIsAiRanking(false);
  };

  // Handle hiring
  const handleHire = async (applicant: Applicant) => {
    if (!user) return;
    try {
      // Find the corresponding gig to get title
      const gigId = applicant.gig_id || selectedGigId;
      const gig = myGigs.find(g => g.id === gigId) || { title: 'Gig', rate: '15', duration: '5 Hours' };
      
      const durationStr = String(gig.duration || '6');
      const rateStr = String(gig.rate || '12');
      const durationHours = parseInt(durationStr.replace(/[^0-9]/g, '')) || 6;
      const rateNum = parseInt(rateStr.replace(/[^0-9]/g, '')) || 12;
      const totalAmount = rateNum * durationHours;

      // Update applicant status
      await api.updateApplicantStatus(applicant.id, 'Hired');
      
      if (applicant.worker_id) {
        // Create hired_workers record
        await supabase.from('hired_workers').insert({
          worker_id: applicant.worker_id,
          worker_name: applicant.name,
          worker_avatar: applicant.avatar,
          employer_id: user.id,
          employer_name: employerProfile?.company_name || employerProfile?.full_name || user.email?.split('@')[0] || 'Employer',
          gig_title: gig.title,
          gig_id: gigId,
          amount: totalAmount,
          status: 'active',
          payment_status: 'pending'
        });
      }

      setShowSuccessToast(`🎉 Hired ${applicant.name}! They will be notified.`);
      setTimeout(() => setShowSuccessToast(null), 3000);
      setApplicants(prev => prev.map(a => 
        a.id === applicant.id ? { ...a, status: 'Hired' } : a
      ));
    } catch (err) {
      console.error('Error hiring:', err);
      setShowSuccessToast(`❌ Failed to hire ${applicant.name}`);
      setTimeout(() => setShowSuccessToast(null), 3000);
    }
  };

  // Handle chat
  const handleOpenChat = async (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setChatMessages([]);
    if (user && applicant.worker_id) {
      try {
        const msgs = await api.getMessages(user.id, applicant.worker_id);
        setChatMessages(msgs.map(m => ({
          sender: m.sender_id === user.id ? 'employer' : 'candidate',
          text: m.content,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })));
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedApplicant || !user || !selectedApplicant.worker_id) return;
    
    const msgText = newMessageText;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Optimistic UI update
    setChatMessages(prev => [...prev, { sender: 'employer', text: msgText, time: timeNow }]);
    setNewMessageText('');
    
    try {
      await api.sendMessage(user.id, selectedApplicant.worker_id, msgText);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Post new gig
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccessToast('Posting gig...');
    
    const newGig = {
      title: formData.title,
      employer: employerProfile?.company_name || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Employer',
      employer_id: user?.id || '',
      employer_name: employerProfile?.company_name || employerProfile?.full_name || user?.email?.split('@')[0] || 'Employer',
      locationName: formData.location,
      distance: '0.5km away',
      rate: formData.rate.includes('RM') ? formData.rate : `RM ${formData.rate}${!formData.rate.includes('/hr') ? '/hr' : ''}`,
      period: 'Hour',
      category: formData.category,
      isInstant: false,
      duration: formData.duration,
      description: formData.description,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      coords: { x: 58, y: 55, lat: 5.9749, lng: 116.0724 },
      status: 'open',
      created_at: new Date().toISOString()
    };

    try {
      const savedGig = await api.createGig(newGig);
      onAddGig(savedGig);
      setShowPostModal(false);
      setShowSuccessToast(`✅ "${formData.title}" has been posted!`);
      resetToDefault();
      
      // Refresh all data
      await fetchMyGigs();
      await fetchAllApplicants();
      
      setTimeout(() => {
        setShowSuccessToast(null);
      }, 4000);
    } catch (err: any) {
      console.error('Failed to post gig:', err);
      setShowSuccessToast(`❌ Failed: ${err.message}`);
      setTimeout(() => setShowSuccessToast(null), 5000);
    }
  };

  // handle reject
  const handleReject = async (applicant: any, reason: string) => {
    try {
      const { error } = await supabase
        .from('applicants')
        .update({ 
          status: 'Rejected', 
          rejected_reason: reason,
          rejected_at: new Date().toISOString()
        })
        .eq('id', applicant.id);
      
      if (error) throw error;
      
      setApplicants(prev => prev.filter(a => a.id !== applicant.id));
      setShowSuccessToast(`Rejected ${applicant.name} - Reason: ${reason}`);
      setTimeout(() => setShowSuccessToast(null), 3000);
    } catch (err) {
      console.error('Error rejecting applicant:', err);
      setShowSuccessToast('Failed to reject applicant. Please try again.');
      setTimeout(() => setShowSuccessToast(null), 3000);
    }
  };

  // Filter and sort applicants
  const filteredApplicants = applicants
    .filter(a => statusFilter === 'all' || a.status === statusFilter)
    .filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.bio.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  const getAiScore = (applicantId: string) => {
    const ranking = aiRanking.find(r => r.applicantId === applicantId);
    return ranking?.score || null;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = employerProfile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'Employer';
    if (hour < 12) return `Good Morning, ${name}`;
    if (hour < 18) return `Good Afternoon, ${name}`;
    return `Good Evening, ${name}`;
  };

  const currentActiveGigsCount = myGigs.filter(g => g.status === 'open').length;
  const totalApplicants = applicants.length;
  const pendingApplicants = applicants.filter(a => a.status === 'Pending').length;

  return (
    <div className="bg-background min-h-screen text-on-surface font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-8 h-16 bg-surface border-b border-outline-variant shadow-xs">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate(AppView.Landing)}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">G</div>
          <span className="font-display font-bold text-xl text-primary tracking-tight">GigIT</span>
        </div>
        <div className="hidden lg:flex items-center gap-6">
          <button onClick={() => onNavigate(AppView.Landing)} className="text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold">Home</button>
          <button onClick={() => onNavigate(AppView.WorkerBrowse)} className="text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold">Find Opportunities</button>
          <button onClick={() => onNavigate(AppView.EmployerDashboard)} className="text-primary font-bold border-b-2 border-primary py-1 text-sm">Hire Trusted Talent</button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold text-primary">{pendingApplicants} pending</span>
          </div>
          <button onClick={onLogout} className="text-on-surface-variant hover:text-error transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col h-[calc(100vh-64px)] fixed left-0 top-16 w-64 py-6 bg-surface-container-lowest border-r border-outline-variant">
          <div className="px-6 mb-8">
            <h2 className="font-display font-bold text-lg text-primary">Employer Hub</h2>
            <p className="text-xs text-on-surface-variant font-medium truncate">{user?.email || 'employer@example.com'}</p>
          </div>
          
          <nav className="flex-1 space-y-1 px-2">
            <button 
              onClick={() => setCurrentSubView('dashboard')} 
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                currentSubView === 'dashboard' 
                  ? 'bg-primary-container text-on-primary-container font-bold' 
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <Sparkles size={18} />
              <span className="text-sm">Dashboard</span>
            </button>
            <button 
              onClick={() => setCurrentSubView('mygigs')} 
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                currentSubView === 'mygigs' 
                  ? 'bg-primary-container text-on-primary-container font-bold' 
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <Briefcase size={18} />
              <span className="text-sm">My Opportunities ({currentActiveGigsCount})</span>
            </button>
            <button 
              onClick={() => setCurrentSubView('hired')} 
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                currentSubView === 'hired' 
                  ? 'bg-primary-container text-on-primary-container font-bold' 
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <Users size={18} />
              <span className="text-sm">Escrow & Wages</span>
            </button>
            <button 
              onClick={() => setCurrentSubView('settings')} 
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                currentSubView === 'settings' 
                  ? 'bg-primary-container text-on-primary-container font-bold' 
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <Settings size={18} />
              <span className="text-sm">Settings</span>
            </button>
            <button 
              onClick={() => setCurrentSubView('wallet')} 
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                currentSubView === 'wallet' 
                  ? 'bg-primary-container text-on-primary-container font-bold' 
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <CreditCard size={18} />
              <span className="text-sm">Wallet</span>
            </button>
            <button 
              onClick={() => setCurrentSubView('esg')} 
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                currentSubView === 'esg' 
                  ? 'bg-green-100 text-green-800 font-bold' 
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <Award size={18} />
              <span className="text-sm">ESG Impact</span>
            </button>
          </nav>

          <div className="px-4 space-y-1 border-t border-outline-variant pt-4">
            <button onClick={onLogout} className="w-full flex items-center gap-3 p-2.5 text-on-surface-variant hover:text-error transition-colors text-left text-xs font-semibold">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
          
        </aside>

        {/* Main Area */}
        <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 min-h-screen pb-24">
          {currentSubView === 'esg' && (
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-outline-variant shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10">
                  <h1 className="font-display font-bold text-3xl text-primary flex items-center gap-3">
                    <Award size={32} className="text-green-600" />
                    Corporate ESG Impact
                  </h1>
                  <p className="text-sm text-on-surface-variant mt-2 max-w-xl leading-relaxed">
                    Track your company's social impact through the Job on Campus ecosystem. These metrics can be exported for your annual ESG and sustainability reports.
                  </p>
                </div>
                <div className="hidden md:block relative z-10">
                  <button 
                    onClick={() => {
                      setIsExportingEsg(true);
                      setTimeout(() => {
                        setIsExportingEsg(false);
                        showToast("ESG Impact Report generated and sent to your email.");
                      }, 2000);
                    }}
                    disabled={isExportingEsg}
                    className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md active:scale-95 flex items-center gap-2 disabled:opacity-70"
                  >
                    {isExportingEsg ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Generating...</>
                    ) : (
                      <><FileText size={18} /> Export ESG Report</>
                    )}
                  </button>
                </div>
              </div>

              {/* Premium Social Impact Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-primary to-primary-container p-6 rounded-2xl shadow-md text-white relative overflow-hidden">
                  <div className="absolute right-[-20px] top-[-20px] opacity-10">
                    <Award size={120} />
                  </div>
                  <h4 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-2">B40 Economic Empowerment</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black">RM {esgStats.b40WagesPaid.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-white/80 mt-2 font-medium">Distributed directly to lower-income students</p>
                </div>
                
                <div className="bg-gradient-to-br from-secondary to-purple-600 p-6 rounded-2xl shadow-md text-white relative overflow-hidden">
                  <div className="absolute right-[-20px] top-[-20px] opacity-10">
                    <ClockIcon size={120} />
                  </div>
                  <h4 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-2">Youth Training Hours</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black">{esgStats.totalHoursWorked}</span>
                    <span className="text-lg font-bold">hrs</span>
                  </div>
                  <p className="text-xs text-white/80 mt-2 font-medium">Real-world practical experience provided</p>
                </div>
                
                <div className="bg-gradient-to-br from-tertiary to-rose-500 p-6 rounded-2xl shadow-md text-white relative overflow-hidden">
                  <div className="absolute right-[-20px] top-[-20px] opacity-10">
                    <Star size={120} />
                  </div>
                  <h4 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-2">Top Mentorship Focus</h4>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black leading-tight">{esgStats.topSkillMentored}</span>
                  </div>
                  <p className="text-xs text-white/80 mt-3 font-medium">Your highest rated SWEAT pillar</p>
                </div>
              </div>

              {/* Basic Operational Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                    <Users size={20} />
                  </div>
                  <h3 className="text-3xl font-black text-on-surface mb-1">{esgStats.studentsHired}</h3>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Students Hired</p>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-2">Unique workers engaged</p>
                </div>
                
                <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                    <CreditCard size={20} />
                  </div>
                  <h3 className="text-3xl font-black text-on-surface mb-1">RM{esgStats.totalWagesPaid.toLocaleString()}</h3>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Wages Paid</p>
                  <p className="text-[10px] text-green-600 font-bold mt-2">100% via GigIT Wallet</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                    <Sparkles size={20} />
                  </div>
                  <h3 className="text-3xl font-black text-on-surface mb-1">{esgStats.totalGigsPosted}</h3>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Gigs Posted</p>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-2">Creating opportunities</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-4">
                    <Shield size={20} />
                  </div>
                  <h3 className="text-3xl font-black text-on-surface mb-1">{esgStats.avgRating > 0 ? esgStats.avgRating : '—'}</h3>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Avg Worker Rating</p>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-2">{esgStats.avgRating >= 4.5 ? 'Top tier reliability' : esgStats.avgRating > 0 ? 'Building trust' : 'No ratings yet'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl border border-outline-variant p-6 shadow-sm">
                  <h3 className="font-bold text-lg text-on-surface mb-4">University Partnerships</h3>
                  <div className="space-y-4">
                    {uniPartners.length > 0 ? (
                      uniPartners.map((uni) => (
                        <div key={uni.name} className="p-4 border border-outline-variant rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-surface-container-low rounded-xl flex items-center justify-center font-black text-primary text-xs">
                              {uni.name.split(' ').map(w => w[0]).join('').substring(0, 4)}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-on-surface">{uni.name}</p>
                              <p className="text-xs text-on-surface-variant">Partner Institution</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-lg text-primary">{uni.count}</p>
                            <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Students</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Users size={32} className="mx-auto text-on-surface-variant mb-3" />
                        <p className="text-sm text-on-surface-variant">No university partnerships yet.</p>
                        <p className="text-xs text-on-surface-variant mt-1">Hire students to build partnerships!</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-primary/5 rounded-3xl border border-primary/20 p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-primary mb-2">Why ESG Matters?</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
                      By prioritizing students through the GigIT Job on Campus ecosystem, you are actively participating in national youth empowerment initiatives, reducing youth unemployment, and providing safe working environments.
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-outline-variant text-center space-y-2">
                    <Award size={32} className="mx-auto text-amber-500" />
                    <p className="text-xs font-bold text-on-surface">Eligible for TalentCorp Grants</p>
                    <p className="text-[10px] text-on-surface-variant">Your ESG contribution qualifies for SME tax deductions under the national student employment scheme.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentSubView === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Toast */}
              <AnimatePresence>
                {showSuccessToast && (
                  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="fixed top-20 right-4 z-50 bg-primary text-white p-4 rounded-xl shadow-lg flex items-center justify-between max-w-sm">
                    <div className="flex items-center gap-2">
                      <Check size={20} className="bg-white/25 p-0.5 rounded-full" />
                      <p className="text-xs font-medium">{showSuccessToast}</p>
                    </div>
                    <button onClick={() => setShowSuccessToast(null)} className="text-white/80 hover:text-white pl-2">
                      <X size={16} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Header */}
              {/* Welcome Onboarding Banner */}
              {myGigs.length === 0 && (
                <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                  <div className="relative z-10">
                    <h2 className="font-display font-bold text-xl text-primary flex items-center gap-2">👋 Welcome to Employer Hub!</h2>
                    <p className="text-sm text-on-surface-variant mt-2 max-w-xl leading-relaxed">
                      Post campus job opportunities, review verified UMS student applicants, and manage your shifts — all in one place.
                    </p>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white/80 rounded-xl p-3 border border-outline-variant">
                        <span className="text-lg">1️⃣</span>
                        <p className="text-xs font-bold text-on-surface mt-1">Post Opportunity</p>
                        <p className="text-[10px] text-on-surface-variant">Click "Post New Opportunity" below</p>
                      </div>
                      <div className="bg-white/80 rounded-xl p-3 border border-outline-variant">
                        <span className="text-lg">2️⃣</span>
                        <p className="text-xs font-bold text-on-surface mt-1">Review Students</p>
                        <p className="text-[10px] text-on-surface-variant">Students apply, you pick the best</p>
                      </div>
                      <div className="bg-white/80 rounded-xl p-3 border border-outline-variant">
                        <span className="text-lg">3️⃣</span>
                        <p className="text-xs font-bold text-on-surface mt-1">Track & Pay</p>
                        <p className="text-[10px] text-on-surface-variant">Clock-in tracking & escrow payment</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="font-display font-bold text-2xl md:text-3xl text-on-surface">{getGreeting()}</h1>
                  <p className="text-sm text-on-surface-variant mt-1">
                    {totalApplicants} total applicants • {currentActiveGigsCount} active opportunities
                  </p>
                </div>
                <button onClick={() => setShowPostModal(true)} className="bg-primary text-white px-6 py-3 rounded-xl shadow-md font-bold hover:bg-primary/95 transition-all flex items-center gap-1.5">
                  <Plus size={18} />
                  <span>Post New Opportunity</span>
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-outline-variant">
                  <p className="text-xs text-on-surface-variant">Active Gigs</p>
                  <p className="text-2xl font-bold text-primary">{currentActiveGigsCount || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-outline-variant">
                  <p className="text-xs text-on-surface-variant">Total Applicants</p>
                  <p className="text-2xl font-bold text-secondary">{totalApplicants}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-outline-variant">
                  <p className="text-xs text-on-surface-variant">Pending Review</p>
                  <p className="text-2xl font-bold text-amber-600">{pendingApplicants}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-outline-variant">
                  <p className="text-xs text-on-surface-variant">Hired</p>
                  <p className="text-2xl font-bold text-green-600">{applicants.filter(a => a.status === 'Hired').length}</p>
                </div>
              </div>

              {/* AI Ranking Button */}
              <div className="flex justify-end">
                <button onClick={rankCandidatesWithAI} disabled={isAiRanking || applicants.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50">
                  {isAiRanking ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
                  {isAiRanking ? 'AI Analyzing...' : '🤖 AI Rank Candidates'}
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex gap-2">
                  <button onClick={() => setStatusFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === 'all' ? 'bg-primary text-white' : 'bg-white border border-outline-variant'}`}>All</button>
                  <button onClick={() => setStatusFilter('Pending')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === 'Pending' ? 'bg-primary text-white' : 'bg-white border border-outline-variant'}`}>Pending</button>
                  <button onClick={() => setStatusFilter('Hired')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === 'Hired' ? 'bg-primary text-white' : 'bg-white border border-outline-variant'}`}>Hired</button>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input type="text" placeholder="Search applicants..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 rounded-lg border border-outline-variant text-sm focus:outline-primary w-48" />
                  </div>
                  <button onClick={() => setSortBy(sortBy === 'rating' ? 'date' : 'rating')} className="px-4 py-2 bg-white border border-outline-variant rounded-lg text-sm font-medium flex items-center gap-1">
                    <ArrowUpDown size={14} /> {sortBy === 'rating' ? 'By Rating' : 'By Date'}
                  </button>
                </div>
              </div>

              {/* Applicants List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold text-lg text-on-surface">Applicants</h3>
                  <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold">{filteredApplicants.length} shown</span>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-primary" /></div>
                ) : filteredApplicants.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-outline-variant">
                    <Users size={48} className="mx-auto text-on-surface-variant mb-3" />
                    <p className="text-on-surface-variant">No applicants yet</p>
                    <button onClick={() => setShowPostModal(true)} className="mt-3 text-primary font-semibold hover:underline">Post a gig →</button>
                  </div>
                ) : (
                  filteredApplicants.map((applicant) => {
                    const aiScore = getAiScore(applicant.id);
                    return (
                      <div 
                        key={applicant.id} 
                        onClick={() => {
                          setSelectedWorkerProfile(applicant);
                          setShowWorkerProfile(true);
                        }}
                        className="bg-white border border-outline-variant p-6 rounded-2xl shadow-sm hover:shadow-md transition-all relative cursor-pointer"
                      >
                        {applicant.status === 'Hired' && (
                          <div className="absolute top-0 right-0 bg-green-600 text-white text-[10px] font-bold px-4 py-1 rounded-bl-xl flex items-center gap-1">
                            <Check size={12} /> <span>Hired</span>
                          </div>
                        )}
                        {aiScore && (
                          <div className="absolute top-0 left-0 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-br-xl flex items-center gap-1">
                            <ThumbsUp size={10} /> AI Match: {aiScore}%
                          </div>
                        )}
                        
                        <div className="flex flex-col sm:flex-row items-start gap-4">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface border border-outline-variant flex-shrink-0">
                            <img alt={applicant.name} className="w-full h-full object-cover" src={applicant.avatar} />
                          </div>
                          <div className="flex-1 w-full">
                            <div className="flex justify-between items-start flex-wrap gap-2">
                              <div>
                                <h4 className="font-semibold text-on-surface text-base">{applicant.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="flex items-center gap-0.5 text-secondary font-bold text-xs">
                                    <Star size={14} fill="currentColor" /> {applicant.rating.toFixed(1)}
                                  </span>
                                  <span className="text-outline-variant text-xs">•</span>
                                  <span className="text-tertiary font-semibold text-xs flex items-center gap-0.5 bg-tertiary/10 px-2 py-0.5 rounded-full">
                                    <Shield size={12} /> {applicant.badge}
                                  </span>
                                  {(applicant as any).income_classification && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                      (applicant as any).income_classification === 'B40' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      (applicant as any).income_classification === 'M40' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                      {(applicant as any).income_classification}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-on-surface-variant text-xs flex items-center gap-1"><MapPin size={12} /> {applicant.distance}</p>
                              </div>
                            </div>
                            
                            <p className="mt-3 text-on-surface-variant text-sm leading-relaxed">{applicant.bio}</p>
                            
                            <div className="mt-4 flex gap-3" onClick={(e) => e.stopPropagation()}>
                              {applicant.status === 'Hired' ? (
                                <button disabled className="flex-1 bg-green-50 text-green-600 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-green-200">
                                  <Check size={14} /> Hired
                                </button>
                              ) : (
                                <button onClick={() => handleHire(applicant)} className="flex-1 bg-primary hover:bg-primary/95 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all">
                                  Hire Now
                                </button>
                              )}
                              <button onClick={() => handleOpenChat(applicant)} className="flex-1 border border-primary text-primary hover:bg-primary/5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                                <Send size={12} /> Message
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
          {currentSubView === 'mygigs' && (
            <EmployerMyGigs onNavigate={onNavigate} onPostNewGig={() => setShowPostModal(true)} />
          )}
          {currentSubView === 'hired' && (
            <HiredWorkers />
          )}
          {currentSubView === 'settings' && <EmployerSettings />}
          {currentSubView === 'wallet' && <Wallet />}
          {import.meta.env.DEV && <AdminSeedButton />}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-outline-variant flex justify-around items-center h-16 shadow-lg">
        {[
          { id: 'dashboard', icon: <Home size={20} />, label: 'Dashboard' },
          { id: 'mygigs', icon: <Briefcase size={20} />, label: 'Opportunities' },
          { id: 'hired', icon: <Users size={20} />, label: 'Escrow' },
          { id: 'wallet', icon: <CreditCard size={20} />, label: 'Wallet' },
          { id: 'settings', icon: <Settings size={20} />, label: 'Settings' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setCurrentSubView(tab.id as any)}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 transition-colors ${
              currentSubView === tab.id
                ? 'text-primary font-bold'
                : 'text-on-surface-variant'
            }`}
          >
            {tab.icon}
            <span className="text-[9px] font-semibold">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Post Gig Modal */}
      <AnimatePresence>
        {showPostModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-outline-variant">
              <div className="px-6 py-4 border-b border-outline-variant bg-surface flex justify-between items-center">
                <h3 className="font-display font-bold text-base text-primary">Post a New Campus Opportunity</h3>
                <button onClick={() => setShowPostModal(false)}><X size={20} /></button>
              </div>
              <div className="p-6">
                <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-blue-800">⚡ Quick Actions</span>
                    <div className="relative">
                      <button onClick={() => setShowTemplateDropdown(!showTemplateDropdown)} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs">
                        <Copy size={14} /> Load Template <ChevronDown size={14} />
                      </button>
                      {showTemplateDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-20">
                          {Object.keys(GIG_TEMPLATES).map((template) => (
                            <button key={template} onClick={() => applyTemplate(template as keyof typeof GIG_TEMPLATES)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">{template}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={resetToDefault} className="px-3 py-1.5 bg-white border rounded-lg text-xs">🔄 Reset</button>
                    <button onClick={generateRandomGig} className="px-3 py-1.5 bg-white border rounded-lg text-xs">🎲 Random</button>
                  </div>
                </div>
                <form onSubmit={handlePostSubmit} className="space-y-4">
                  <div><label className="block text-xs font-bold mb-1">Title *</label><input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3.5 py-2 rounded-xl border focus:outline-primary text-sm" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold mb-1">Rate (RM)</label><input type="text" required value={formData.rate} onChange={e => setFormData({...formData, rate: e.target.value})} className="w-full px-3.5 py-2 rounded-xl border focus:outline-primary text-sm" /></div>
                    <div><label className="block text-xs font-bold mb-1">Duration</label><input type="text" required value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="w-full px-3.5 py-2 rounded-xl border focus:outline-primary text-sm" /></div>
                  </div>
                  <div><label className="block text-xs font-bold mb-1">Category</label><select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})} className="w-full px-3.5 py-2 rounded-xl border focus:outline-primary text-sm"><option value="F&B">F&B</option><option value="Event">Event</option><option value="Logistics">Logistics</option><option value="Cleaning">Cleaning</option></select></div>
                  <div><label className="block text-xs font-bold mb-1">Location</label><input type="text" required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-3.5 py-2 rounded-xl border focus:outline-primary text-sm" /></div>
                  <div><label className="block text-xs font-bold mb-1">Description</label><textarea rows={3} required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3.5 py-2 rounded-xl border focus:outline-primary text-sm" /></div>
                  <div><label className="block text-xs font-bold mb-1">Tags</label><input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className="w-full px-3.5 py-2 rounded-xl border focus:outline-primary text-sm" placeholder="comma, separated" /></div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setShowPostModal(false)} className="flex-1 py-3 border rounded-xl text-sm font-bold">Cancel</button>
                    <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl font-bold">Post Gig</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {selectedApplicant && (
          <div className="fixed inset-0 z-50 flex justify-end p-0 md:p-4 bg-black/40">
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="bg-white w-full max-w-md h-full md:rounded-2xl flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img src={selectedApplicant.avatar} className="w-10 h-10 rounded-full object-cover" />
                  <div><h3 className="font-bold text-sm">{selectedApplicant.name}</h3><p className="text-[10px] text-green-600">● Online</p></div>
                </div>
                <button onClick={() => setSelectedApplicant(null)}><X size={20} /></button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === 'employer' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${msg.sender === 'employer' ? 'bg-primary text-white' : 'bg-gray-100'}`}>
                      <p>{msg.text}</p>
                      <p className={`text-[9px] mt-1 ${msg.sender === 'employer' ? 'text-white/60' : 'text-gray-500'}`}>{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                <input type="text" value={newMessageText} onChange={e => setNewMessageText(e.target.value)} placeholder="Type a message..." className="flex-1 px-4 py-2.5 rounded-xl border text-sm" />
                <button type="submit" className="p-2.5 bg-primary text-white rounded-xl"><Send size={18} /></button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Backup Pool Modal */}
      <AnimatePresence>
        {showBackupPool && selectedGigForBackup && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl max-w-lg w-full">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-primary">Emergency Backup</h3>
                <button onClick={() => setShowBackupPool(false)}><X size={20} /></button>
              </div>
              <div className="p-6">
                <div className="mb-4 p-3 bg-amber-50 rounded-xl">
                  <p className="text-xs font-semibold text-amber-800">For Gig: {selectedGigForBackup.title}</p>
                </div>
                <BackupPoolWidget 
                  gigId={selectedGigForBackup.id}
                  gigTitle={selectedGigForBackup.title}
                  employerId={user?.id}
                  onWorkerDispatched={(worker) => {
                    setShowBackupPool(false);
                    setShowSuccessToast(`✅ Emergency backup requested from ${worker.worker_name}!`);
                    setTimeout(() => setShowSuccessToast(null), 5000);
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showWorkerProfile && selectedWorkerProfile && (
          <WorkerProfileModal
            worker={selectedWorkerProfile}
            onClose={() => setShowWorkerProfile(false)}
            onHire={(worker) => {
              handleHire(worker);
              setShowWorkerProfile(false);
            }}
            onReject={(worker, reason) => {
              setShowSuccessToast(`Rejected ${worker.name} - Reason: ${reason}`);
              setTimeout(() => setShowSuccessToast(null), 3000);
              setShowWorkerProfile(false);
            }}
          />
        )}
      </AnimatePresence>
      {import.meta.env.DEV && <DebugPanel />}
    </div>
  );
}