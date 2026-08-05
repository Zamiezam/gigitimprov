import { useState, useMemo, useEffect, useCallback } from 'react';
import { AppView, Gig } from '../types';
import { initialGigs } from '../data';
import { api, supabase } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import ClockInOut from './ClockInOut';
import WorkerProfileSettings from './WorkerProfileSettings';
import WorkerApplicationsTab from './WorkerApplicationsTab';
import EmployerInsightsModal from './EmployerInsightsModal';
import JSSBadge from './JSSBadge';
import DirectMessaging from './DirectMessaging';
import {
  Bell,
  User,
  MapPin,
  Clock,
  Award,
  CheckCircle,
  Sliders,
  X,
  Play,
  Check,
  Zap,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  CreditCard,
  HelpCircle,
  Bookmark,
  MessageSquare,
  BookmarkCheck,
  Star,
  Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import WorkerReliabilityView from './WorkerReliabilityView';

// ── Leaflet default-icon fix (required when bundled with Vite) ────────────────
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// ── Props ─────────────────────────────────────────────────────────────────────
interface WorkerBrowseViewProps {
  onNavigate: (view: AppView) => void;
  fallbackGigs?: Gig[];
  initialTab?: string;
  onLogout?: () => void;
  onSwitchToEmployer?: () => void;
}

export default function WorkerBrowseView({
  onNavigate,
  fallbackGigs = initialGigs,
  initialTab,
  onLogout,
}: WorkerBrowseViewProps) {
  const { user, logOut } = useAuth();

  // ── UI state ────────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState<string>('All Types');
  const [activeTab, setActiveTab] = useState<string>(initialTab ?? 'Dashboard');
  const [showInsightsForEmployer, setShowInsightsForEmployer] = useState<string | null>(null);
  const [userGigs, setUserGigs] = useState<Record<string, 'Applied' | 'Booked'>>({});
  const [showMapOnMobile, setShowMapOnMobile] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Upwork Features State ────────────────────────────────────
  const [savedGigIds, setSavedGigIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('gigit_saved_gigs') || '[]')); }
    catch { return new Set(); }
  });
  const [isAvailable, setIsAvailable] = useState<boolean>(() => {
    return localStorage.getItem('gigit_available') === 'true';
  });

  // ── Integration state ─────────────────────────────────────────────
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [appliedGigs, setAppliedGigs] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<any>(null);
  const [activeShift, setActiveShift] = useState<any>(null);

  // Earnings calculations
  const [earningsData, setEarningsData] = useState({
    availableBalance: 480.00,
    pendingRelease: 132.00,
    semesterTotal: 2140.00,
    history: [] as any[]
  });

  // ── Fetch user profile ──────
  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        if (data) setProfile(data);
      });
    }
  }, [user]);

  // ── Fetch active clocked in shifts ──────
  const fetchActiveShift = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('hired_workers')
        .select('*')
        .eq('worker_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setActiveShift(data[0]);
      } else {
        setActiveShift(null);
      }
    } catch (err) {
      console.error('Error fetching active shift:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchActiveShift();
      const interval = setInterval(fetchActiveShift, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // ── Fetch applied gigs to sync status ──────
  useEffect(() => {
    if (!user) return;
    async function loadUserApps() {
      try {
        const { data, error } = await supabase
          .from('applicants')
          .select('gig_id, status')
          .eq('worker_id', user.id);
        
        if (!error && data) {
          const syncState: Record<string, 'Applied' | 'Booked'> = {};
          data.forEach(app => {
            syncState[app.gig_id] = app.status === 'Hired' ? 'Booked' : 'Applied';
          });
          setUserGigs(syncState);
        }
      } catch (err) {
        console.error('Failed to sync applications', err);
      }
    }
    loadUserApps();
  }, [user]);

  // ── Fetch real gigs from Supabase + Subscribe ──────
  useEffect(() => {
    async function loadGigs() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getGigs();
        setGigs(data.length > 0 ? data : fallbackGigs);
      } catch (err) {
        console.error('Database connection failure:', err);
        setError('Could not connect to database. Showing cached listings.');
        setGigs(fallbackGigs);
      } finally {
        setLoading(false);
      }
    }

    loadGigs();

    // Subscribe to Postgres changes for gigs table
    const channel = supabase
      .channel('public:gigs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gigs' }, () => {
        console.log('Real-time gig update detected!');
        loadGigs();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fallbackGigs]);

  // ── Fetch earnings dynamically ──────
  const fetchEarnings = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('hired_workers')
        .select('*')
        .eq('worker_id', user.id);

      if (!error && data) {
        const cleared = data
          .filter(s => s.payment_status === 'paid')
          .reduce((sum, s) => sum + (s.amount || 0), 0);

        const pending = data
          .filter(s => s.status === 'verified' && s.payment_status === 'pending')
          .reduce((sum, s) => sum + (s.amount || 0), 0);

        const total = data
          .filter(s => s.status === 'verified' || s.status === 'completed' || s.payment_status === 'paid')
          .reduce((sum, s) => sum + (s.amount || 0), 0);

        const historyList = data
          .filter(s => s.status === 'verified' || s.payment_status === 'paid')
          .map(s => ({
            title: s.gig_title,
            sub: `${s.employer_name || 'Local SME'} • ${new Date(s.clock_in_time || s.created_at).toLocaleDateString()}`,
            amount: `+RM ${s.amount?.toFixed(2)}`,
            status: s.payment_status === 'paid' ? 'Paid' : 'Cleared'
          }));

        setEarningsData({
          availableBalance: cleared > 0 ? cleared : 480.00,
          pendingRelease: pending > 0 ? pending : 132.00,
          semesterTotal: total > 0 ? total : 2140.00,
          history: historyList.length > 0 ? historyList : [
            { title: 'Barista Assistant Shift', sub: 'Damai Bistro • May 28, 2026', amount: '+RM 72.00', status: 'Paid' },
            { title: 'Event Assistant Crew',    sub: 'ICC KK Hall • May 14, 2026',  amount: '+RM 180.00', status: 'Paid' },
            { title: 'Warehouse Logistics Sorting', sub: 'Sabah Logistic Depot • May 04, 2026', amount: '+RM 228.00', status: 'Paid' }
          ]
        });
      }
    } catch (err) {
      console.error('Error fetching earnings:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'Earnings') {
      fetchEarnings();
    }
  }, [activeTab, user]);

  // ── Category filter chips ───────────────────────────────────
  const categories = [
    { name: 'All Types',  count: gigs.length },
    { name: 'Event',      count: gigs.filter(g => g.category === 'Event').length },
    { name: 'F&B',        count: gigs.filter(g => g.category === 'F&B').length },
    { name: 'Logistics',  count: gigs.filter(g => g.category === 'Logistics').length },
    { name: '< 3km Away', count: gigs.filter(g => parseFloat(g.distance) < 3.0).length },
  ];

  const filteredGigs = useMemo(() => {
    if (selectedCategory === 'All Types') return gigs;
    if (selectedCategory === '< 3km Away') {
      return gigs.filter(g => parseFloat(g.distance.replace('km away', '').trim()) < 3.0);
    }
    return gigs.filter(g => g.category === selectedCategory);
  }, [selectedCategory, gigs]);

  // ── handleApply: write real Supabase applicant records ───────────
  const handleApply = async (id: string, title: string, isInstant: boolean) => {
    if (!user) {
      toast('⚠️ Please log in to apply for gigs.');
      return;
    }

    try {
      const gig = gigs.find(g => g.id === id);
      if (!gig) return;

      const durationHours = gig.duration ? parseInt(gig.duration.replace(/[^0-9]/g, '')) || 6 : 6;
      const rateNum = gig.rate ? parseInt(gig.rate.replace(/[^0-9]/g, '')) || 12 : 12;
      const totalAmount = rateNum * durationHours;

      // 1. Create applicant record
      const { error: appErr } = await supabase
        .from('applicants')
        .insert({
          gig_id: id,
          worker_id: user.id,
          employer_id: gig.employer_id || 'employer-placeholder',
          cover_letter: profile?.bio || 'Student helper interested in this role.',
          status: isInstant ? 'Hired' : 'Pending',
          created_at: new Date().toISOString(),
        });

      if (appErr) throw appErr;

      // 2. If instant booking, also create a hired worker record
      if (isInstant) {
        const { error: hireErr } = await supabase
          .from('hired_workers')
          .insert({
            worker_id: user.id,
            worker_name: profile?.full_name || user.email?.split('@')[0] || 'Student Worker',
            worker_avatar: profile?.avatar_url || 'https://randomuser.me/api/portraits/men/32.jpg',
            employer_id: gig.employer_id || 'employer-placeholder',
            employer_name: gig.employer || 'KK Business',
            gig_title: gig.title,
            gig_id: gig.id,
            amount: totalAmount,
            status: 'active',
            payment_status: 'pending',
            rating_given: false,
            clock_in_time: null,
            clock_out_time: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (hireErr) throw hireErr;
        fetchActiveShift();
      }

      setUserGigs(prev => ({ ...prev, [id]: isInstant ? 'Booked' : 'Applied' }));
      setAppliedGigs(prev => { const n = new Set(prev); n.add(id); return n; });

      const verb = isInstant ? 'booked instantly! Shift ready to clock in.' : 'application submitted!';
      toast(`Success! "${title}" ${verb}`);
    } catch (err) {
      console.error('Apply error:', err);
      toast('❌ Failed to submit application. Try again.');
    }
  };

  const toast = (msg: string, delay = 4000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), delay);
  };

  // ── Saved Gigs helpers ───────────────────────────────────────
  const toggleSaveGig = useCallback((gigId: string) => {
    setSavedGigIds(prev => {
      const next = new Set(prev);
      if (next.has(gigId)) { next.delete(gigId); toast('Gig removed from saved list.'); }
      else { next.add(gigId); toast('📌 Gig saved! View in Saved Gigs tab.'); }
      localStorage.setItem('gigit_saved_gigs', JSON.stringify([...next]));
      return next;
    });
  }, []);

  // ── Availability toggle ──────────────────────────────────────
  const toggleAvailability = useCallback(async () => {
    const next = !isAvailable;
    setIsAvailable(next);
    localStorage.setItem('gigit_available', String(next));
    if (user) await api.setAvailability(user.id, next);
    toast(next ? '🟢 You are now marked as Available!' : '🔴 Availability set to Offline.');
  }, [isAvailable, user]);

  // ── JSS Score from reliability score ────────────────────────
  const jssScore = Math.round(parseFloat(profile?.reliability_score || '4.8') * 20);

  const workerName = profile?.full_name || user?.email?.split('@')[0] || 'Worker';
  const workerAvatar = profile?.avatar_url || 'https://randomuser.me/api/portraits/men/32.jpg';

  return (
    <div className="bg-background min-h-screen text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container">

      {/* ── Top Header ──────────────────────────────────────── */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-8 h-16 bg-surface border-b border-outline-variant shadow-xs">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate(AppView.Landing)}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg font-display">G</div>
          <span className="font-display font-bold text-xl text-primary tracking-tight">GigIT</span>
        </div>

        <div className="hidden lg:flex items-center gap-6">
          <button onClick={() => onNavigate(AppView.Landing)} className="text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold tracking-wide cursor-pointer">Kota / Home</button>
          <button onClick={() => { setActiveTab('Dashboard'); onNavigate(AppView.WorkerBrowse); }} className="text-primary font-bold border-b-2 border-primary py-1 text-sm tracking-wide cursor-pointer">Find Opportunities</button>
          <button onClick={() => onNavigate(AppView.EmployerDashboard)} className="text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold tracking-wide cursor-pointer">Hire Trusted Talent</button>
          <button onClick={() => { setActiveTab('Reliability'); onNavigate(AppView.WorkerBrowse); }} className="text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold tracking-wide cursor-pointer">Trust Dashboard</button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onLogout || logOut}
            className="hidden md:block border border-primary text-primary hover:bg-primary/5 py-1.5 px-5 rounded-full font-semibold transition-all active:scale-95 cursor-pointer text-sm"
          >
            Logout
          </button>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors relative cursor-pointer">
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-secondary rounded-full" />
              <Bell size={20} className="text-on-surface-variant" />
            </button>
            <button onClick={() => setActiveTab('Profile')} className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer">
              <User size={20} className="text-on-surface-variant" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main body ──────────────────────────────────────────────────────────── */}
      <div className="flex pt-16">

        {/* ── Left Sidebar ───────────────────────────────────── */}
        <aside className="hidden md:flex flex-col h-[calc(100vh-64px)] fixed left-0 top-16 w-64 py-6 bg-surface-container-lowest border-r border-outline-variant shadow-xs overflow-y-auto">

          {/* Profile + reliability */}
          <div className="px-6 mb-6">
            <div
              className="flex items-center gap-3 mb-4 cursor-pointer hover:bg-surface-container-low p-2 rounded-xl transition-colors"
              onClick={() => setActiveTab('Profile')}
            >
              <img
                alt="Worker profile"
                className="w-12 h-12 rounded-full border-2 border-primary-container object-cover shadow-xs"
                src={workerAvatar}
              />
              <div>
                <p className="font-semibold text-sm text-on-surface truncate max-w-[130px]">{workerName}</p>
                <p className="text-[11px] text-on-surface-variant font-medium">{profile?.is_verified ? 'Verified Student' : 'Unverified Account'}</p>
              </div>
            </div>

            <div className="bg-secondary/5 p-4 rounded-xl border border-secondary/20">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] text-secondary font-bold uppercase tracking-wider">SWEAT™️ Score</span>
                <span className="text-sm font-bold text-secondary flex items-center gap-0.5">
                  <Award size={14} fill="currentColor" />4.8
                </span>
              </div>
              <div className="w-full bg-outline-variant h-1.5 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: '92%' }} />
              </div>
              <div className="flex gap-1 mt-2.5">
                <span className="text-[9px] bg-tertiary-container/25 text-on-tertiary-container px-2 py-0.5 rounded-full font-bold">Punctual</span>
                <span className="text-[9px] bg-tertiary-container/25 text-on-tertiary-container px-2 py-0.5 rounded-full font-bold">Hardworking</span>
              </div>
            </div>
          </div>

          {/* JSS Badge in sidebar */}
          <div className="px-6 mb-4">
            <div className="bg-surface border border-outline-variant rounded-2xl p-3">
              <JSSBadge score={jssScore} size="sm" showLabel={true} />
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 space-y-1">
            {[
              { id: 'Dashboard',      icon: 'dashboard',      label: 'Dashboard'      },
              { id: 'MyApplications', icon: 'list_alt',       label: 'My Gigs/Apps'   },
              { id: 'SavedGigs',      icon: 'bookmarks',      label: `Saved Opportunities (${savedGigIds.size})`  },
              { id: 'Messages',       icon: 'chat',           label: 'Messages'       },
              { id: 'Reliability',    icon: 'verified_user',  label: 'Trust Dashboard' },
              { id: 'Earnings',       icon: 'payments',       label: 'Earnings'       },
              { id: 'Profile',        icon: 'person',         label: 'My Profile'     },
              { id: 'Support',        icon: 'support_agent',  label: 'Support'        },
            ].map(({ id, icon, label }) => (
              <a
                key={id}
                href="#"
                onClick={e => { e.preventDefault(); setActiveTab(id); }}
                className={`flex items-center gap-3 px-6 py-3 mx-2 rounded-xl text-sm ${
                  activeTab === id
                    ? 'bg-primary text-white font-bold shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container-low transition-all'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{icon}</span>
                <span>{label}</span>
              </a>
            ))}
          </nav>

          {/* Clock-in widget connected to Supabase */}
          <div className="px-6 mt-auto pb-4">
            {activeShift ? (
              <ClockInOut 
                gigTitle={activeShift.gig_title}
                gigLocation={activeShift.employer_name || 'KK Cafe'}
                key={activeShift.id}
                onClockIn={async (time) => {
                  try {
                    await supabase
                      .from('hired_workers')
                      .update({ 
                        clock_in_time: time.toISOString(),
                        updated_at: new Date().toISOString()
                      })
                      .eq('id', activeShift.id);
                    toast(`Clocked in! Have a great shift at ${activeShift.gig_title}! 🎉`);
                    fetchActiveShift();
                  } catch (err) {
                    console.error(err);
                  }
                }}
                onClockOut={async (time, duration) => {
                  try {
                    await supabase
                      .from('hired_workers')
                      .update({ 
                        clock_out_time: time.toISOString(),
                        status: 'completed',
                        updated_at: new Date().toISOString()
                      })
                      .eq('id', activeShift.id);
                    toast(`Clocked out! Shift duration: ${duration.toFixed(2)} hours. Payment cleared. 💸`);
                    fetchActiveShift();
                  } catch (err) {
                    console.error(err);
                  }
                }}
              />
            ) : (
              <div className="bg-white rounded-xl border border-outline-variant p-4 text-center">
                <Clock size={16} className="text-on-surface-variant mx-auto mb-2" />
                <p className="text-xs font-bold text-on-surface">No Active Shifts</p>
                <p className="text-[10px] text-on-surface-variant mt-1 leading-normal">
                  Approved shift cards will allow you to clock in dynamically.
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main content ───────────────────────────────────────────────────── */}
        <main className="flex-1 md:ml-64 pb-28 md:pb-12 min-h-screen">

          {/* Toast */}
          <div className="relative z-50">
            <AnimatePresence>
              {toastMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 15, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.98 }}
                  className="bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between z-50 fixed top-4 right-4 max-w-md"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-teal-400 shrink-0" />
                    <p className="text-xs font-semibold leading-relaxed font-sans">{toastMessage}</p>
                  </div>
                  <button onClick={() => setToastMessage(null)} className="text-neutral-400 hover:text-white pl-3 hover:scale-105 transition-all">
                    <X size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* DB error banner */}
          {error && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
              <p className="text-xs text-amber-700 font-medium">{error}</p>
            </div>
          )}

          {/* ── TAB: Dashboard ─────────────────────────────────────────────── */}
          {activeTab === 'Dashboard' && (
            <>
              {/* Real Leaflet map replacing static map */}
              {loading ? (
                <div className={`flex items-center justify-center gap-3 border-b border-outline-variant ${
                  showMapOnMobile ? 'h-[calc(100vh-140px)]' : 'hidden md:flex md:h-[350px]'
                }`}>
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-on-surface-variant font-medium">Loading gigs near you…</span>
                </div>
              ) : (
                <div className={`relative w-full overflow-hidden border-b border-outline-variant shadow-xs transition-all ${
                  showMapOnMobile ? 'h-[calc(100vh-140px)] block' : 'hidden md:block md:h-[350px]'
                }`}>
                  {/* Leaflet map — real GPS coords */}
                  <MapContainer center={[6.0367, 116.1186]} zoom={13} className="w-full h-full" zoomControl={false}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {filteredGigs
                      .filter(g => g.coords?.lat && g.coords?.lng)
                      .map(g => (
                        <Marker
                          key={g.id}
                          position={[g.coords.lat, g.coords.lng]}
                          eventHandlers={{ click: () => setSelectedGig(g) }}
                        >
                          <Popup>
                            <div className="p-1 font-sans">
                              <h4 className="font-bold text-sm text-primary">{g.title}</h4>
                              <p className="text-xs font-semibold text-gray-600">{g.rate} • {g.employer}</p>
                              <p className="text-[11px] mt-1 text-gray-500">{g.locationName}</p>
                              <button onClick={() => setSelectedGig(g)} className="mt-2 w-full text-center text-xs font-bold text-primary hover:underline">
                                View Details →
                              </button>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                  </MapContainer>

                  {/* Map overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-4 md:p-8 flex flex-col justify-end bg-gradient-to-t from-background via-background/40 to-transparent pointer-events-none z-[400]">
                    <div className="max-w-7xl mx-auto w-full flex flex-wrap items-end justify-between gap-4">
                      <div className="space-y-1">
                        <h1 className="font-sans font-bold text-lg md:text-2xl text-primary drop-shadow-xs">Gigs Around Kota Kinabalu</h1>
                        <p className="text-[11px] md:text-xs text-on-surface-variant max-w-sm leading-normal font-medium">
                          Find student gig locations within 5km of UMS College Campus.
                        </p>
                      </div>
                      <div className="flex gap-2 pointer-events-auto">
                        <button onClick={() => setSelectedCategory('All Types')} className="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-full shadow-xs border border-outline-variant text-[10px] md:text-[11px] font-bold hover:bg-surface-container-low transition-colors cursor-pointer select-none">
                          <Sliders size={12} className="text-primary" /><span>All Areas</span>
                        </button>
                        <button onClick={() => setActiveTab('Reliability')} className="flex items-center gap-1.5 bg-primary text-white px-3.5 py-2 rounded-full shadow-md text-[10px] md:text-[11px] font-bold hover:bg-primary/95 transition-all cursor-pointer select-none">
                          <Award size={12} /><span>My Scorecard</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
                <div className={showMapOnMobile ? 'hidden md:block' : 'block'}>

                  {/* Category chips */}
                  <div className="overflow-x-auto select-none no-scrollbar pb-3">
                    <div className="flex gap-2 whitespace-nowrap">
                      {categories.map(cat => (
                        <button
                          key={cat.name}
                          onClick={() => setSelectedCategory(cat.name)}
                          className={`px-4 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                            selectedCategory === cat.name
                              ? 'bg-primary text-white border-primary font-semibold'
                              : 'bg-white border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-low'
                          }`}
                        >
                          {cat.name} {cat.count > 0 && `(${cat.count})`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-on-surface-variant mt-2 mb-4">
                    <span className="text-primary font-bold">{filteredGigs.length}</span> gig{filteredGigs.length !== 1 ? 's' : ''} available
                    {selectedCategory !== 'All Types' && <span> in {selectedCategory}</span>}
                  </p>

                  {/* Gig cards */}
                  <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                    {filteredGigs.map(g => {
                      const isFeatured = g.id === 'gig-1';
                      const status = userGigs[g.id];

                      if (isFeatured) {
                        return (
                          <div key={g.id} className="md:col-span-2 group relative overflow-hidden rounded-2xl bg-white border border-outline-variant hover:shadow-lg transition-all duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-12 h-full">
                              <div className="md:col-span-5 h-48 md:h-full relative overflow-hidden bg-surface">
                                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={g.imageUrl} alt={g.title} />
                                <div className="absolute top-3.5 left-3.5 bg-tertiary-container/90 text-white text-[9px] font-bold px-3 py-1 rounded-full flex items-center gap-1 backdrop-blur-xs">
                                  <Zap size={10} fill="currentColor" /><span>INSTANT BOOKING</span>
                                </div>
                              </div>

                              <div className="md:col-span-7 p-6 flex flex-col justify-between space-y-4">
                                <div>
                                  <div className="flex justify-between items-start">
                                    <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{g.category} Support</span>
                                    <span className="font-display font-bold text-lg text-secondary leading-none">{g.rate}</span>
                                  </div>
                                  <h3 className="font-display font-bold text-lg text-on-surface mt-2 group-hover:text-primary transition-colors">{g.title}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs text-on-surface-variant font-medium flex items-center gap-1.5">
                                      {g.employer}
                                      <span className="flex items-center gap-0.5 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border border-blue-200">
                                        <Shield size={10} /> Verified Partner
                                      </span>
                                    </p>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setShowInsightsForEmployer(g.employer); }}
                                      className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full hover:bg-primary/20 transition-colors cursor-pointer flex items-center gap-1"
                                    >
                                      <Star size={10} /> Insights
                                    </button>
                                  </div>
                                  <p className="text-xs text-on-surface-variant mt-2 font-sans leading-relaxed">{g.description}</p>
                                </div>

                                <div className="space-y-3">
                                  <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant font-medium">
                                    <div className="flex items-center gap-1.5"><MapPin size={14} className="text-primary" /><span>{g.distance} ({g.locationName})</span></div>
                                    {g.duration && <div className="flex items-center gap-1.5"><Clock size={14} className="text-primary" /><span>{g.duration}</span></div>}
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setSelectedGig(g)}
                                      className="flex-1 border border-outline-variant py-2.5 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container transition-all cursor-pointer"
                                    >
                                      Details
                                    </button>
                                    {status ? (
                                      <div className="flex-1 text-center py-2.5 bg-tertiary/10 border border-tertiary/30 text-tertiary rounded-xl font-bold text-xs flex items-center justify-center gap-1.5">
                                        <Check size={14} /><span>Booked!</span>
                                      </div>
                                    ) : (
                                      <button onClick={() => handleApply(g.id, g.title, g.isInstant)} className="flex-1 bg-primary hover:bg-primary/95 text-white py-2.5 rounded-xl font-bold active:scale-95 transition-transform text-xs cursor-pointer shadow-xs">
                                        Book Instantly
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={g.id} className={`flex flex-col justify-between rounded-xl bg-white border border-outline-variant p-5 hover:shadow-md transition-all ${g.isInstant ? 'border-l-4 border-l-tertiary-container' : ''}`}>
                          <div>
                            <div className="flex justify-between items-start">
                              <div className="p-2.5 bg-surface-container rounded-lg">
                                <span className="material-symbols-outlined text-primary leading-none text-base">
                                  {g.category === 'F&B' ? 'restaurant' : g.category === 'Logistics' ? 'local_shipping' : g.category === 'Cleaning' ? 'cleaning_services' : 'campaign'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleSaveGig(g.id); }}
                                  title={savedGigIds.has(g.id) ? 'Remove bookmark' : 'Save gig'}
                                  className="p-1.5 rounded-full hover:bg-surface-container-high transition-colors cursor-pointer"
                                >
                                  {savedGigIds.has(g.id)
                                    ? <BookmarkCheck size={16} className="text-primary" fill="currentColor" />
                                    : <Bookmark size={16} className="text-on-surface-variant" />}
                                </button>
                                <span className="font-display font-semibold text-base text-secondary">{g.rate}</span>
                              </div>
                            </div>

                            <h3 className="font-semibold text-on-surface text-sm mt-4">{g.title}</h3>
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-[11px] font-medium text-on-surface-variant flex items-center gap-1.5">
                                {g.employer}
                                <span className="flex items-center gap-0.5 bg-blue-50 text-blue-700 px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider border border-blue-200">
                                  <Shield size={8} /> Verified
                                </span>
                              </p>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setShowInsightsForEmployer(g.employer); }}
                                className="text-[9px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded-full hover:bg-primary/20 transition-colors cursor-pointer flex items-center gap-0.5"
                              >
                                <Star size={9} /> Insights
                              </button>
                            </div>

                            <div className="flex flex-wrap gap-1.5 mt-4">
                              <span className="bg-surface-container text-on-surface-variant text-[10px] px-2.5 py-1 rounded-full font-semibold">{g.distance}</span>
                              {g.tags?.map(tag => (
                                <span key={tag} className="bg-surface-container text-on-surface-variant text-[10px] px-2.5 py-1 rounded-full font-semibold">{tag}</span>
                              ))}
                            </div>
                          </div>

                          <div className="mt-5 pt-4 border-t border-surface-container-high flex gap-2">
                            <button
                              onClick={() => setSelectedGig(g)}
                              className="flex-1 py-2 border border-outline-variant rounded-lg text-xs font-bold text-on-surface hover:bg-surface-container transition-all cursor-pointer"
                            >
                              Details
                            </button>
                            {status ? (
                              <div className="flex-1 text-center py-2 bg-tertiary/10 border border-tertiary/30 text-tertiary rounded-lg font-bold text-xs flex items-center justify-center gap-1">
                                <Check size={14} /><span>{status === 'Applied' ? 'Sent' : 'Booked!'}</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleApply(g.id, g.title, g.isInstant)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold active:scale-95 transition-transform cursor-pointer ${
                                  g.isInstant ? 'bg-primary text-white' : 'border border-primary text-primary hover:bg-primary/5 bg-white'
                                }`}
                              >
                                {g.isInstant ? 'Book Now' : 'Apply Now'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </section>
                </div>
              </div>
            </>
          )}

          {/* ── TAB: MyApplications ─────────────────────────────────────────── */}
          {activeTab === 'MyApplications' && (
            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-4">
              <WorkerApplicationsTab />
            </div>
          )}

          {/* ── TAB: SavedGigs ─────────────────────────────────────────────── */}
          {activeTab === 'SavedGigs' && (
            <div className="max-w-5xl mx-auto px-4 md:px-8 mt-4">
              <div className="border-b border-outline-variant pb-4 mb-6">
                <h1 className="font-display font-bold text-xl md:text-2xl text-primary flex items-center gap-2">
                  <BookmarkCheck size={22} /> Saved Opportunities
                </h1>
                <p className="text-xs text-on-surface-variant mt-1 font-medium">Opportunities you've bookmarked for later. {savedGigIds.size} saved.</p>
              </div>
              {savedGigIds.size === 0 ? (
                <div className="text-center py-16 bg-surface-container-lowest border border-outline-variant rounded-2xl border-dashed">
                  <Bookmark size={40} className="mx-auto text-on-surface-variant mb-3" />
                  <p className="text-sm font-bold text-on-surface">No saved opportunities yet</p>
                  <p className="text-xs text-on-surface-variant mt-1">Click the bookmark icon on any gig to save it here.</p>
                  <button onClick={() => setActiveTab('Dashboard')} className="mt-4 bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors cursor-pointer">Find Opportunities</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gigs.filter(g => savedGigIds.has(g.id)).map(g => (
                    <div key={g.id} className="flex flex-col justify-between rounded-xl bg-white border border-primary/30 p-5 hover:shadow-md transition-all border-l-4 border-l-primary">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">📌 Saved</span>
                          <button onClick={() => toggleSaveGig(g.id)} className="p-1 hover:bg-surface-container rounded-full cursor-pointer">
                            <BookmarkCheck size={14} className="text-primary" fill="currentColor" />
                          </button>
                        </div>
                        <h3 className="font-semibold text-on-surface text-sm mt-3">{g.title}</h3>
                        <p className="text-[11px] font-medium text-on-surface-variant mt-0.5">{g.employer}</p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          <span className="bg-surface-container text-on-surface-variant text-[10px] px-2.5 py-1 rounded-full font-semibold">{g.rate}</span>
                          <span className="bg-surface-container text-on-surface-variant text-[10px] px-2.5 py-1 rounded-full font-semibold">{g.distance}</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-surface-container-high flex gap-2">
                        <button onClick={() => setSelectedGig(g)} className="flex-1 py-2 border border-outline-variant rounded-lg text-xs font-bold text-on-surface hover:bg-surface-container transition-all cursor-pointer">Details</button>
                        <button onClick={() => handleApply(g.id, g.title, g.isInstant)} className="flex-1 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 cursor-pointer transition-colors">{g.isInstant ? 'Book Now' : 'Apply'}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: Messages ──────────────────────────────────────────────── */}
          {activeTab === 'Messages' && (
            <div className="max-w-5xl mx-auto px-4 md:px-8 mt-4">
              <div className="border-b border-outline-variant pb-4 mb-6">
                <h1 className="font-display font-bold text-xl md:text-2xl text-primary flex items-center gap-2">
                  <MessageSquare size={22} /> Direct Messages
                </h1>
                <p className="text-xs text-on-surface-variant mt-1 font-medium">Chat with employers about your gigs.</p>
              </div>
              <DirectMessaging />
            </div>
          )}

          {/* ── TAB: Reliability ───────────────────────────────────────────── */}
          {activeTab === 'Reliability' && (
            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-4">
              <WorkerReliabilityView onNavigate={onNavigate} isEmbedded={true} />
            </div>
          )}

          {/* ── TAB: Profile ───────────────────────────────────────────────── */}
          {activeTab === 'Profile' && (
            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-4">
              <WorkerProfileSettings />
            </div>
          )}

          {/* ── TAB: Earnings ──────────────────────────────────────────────── */}
          {activeTab === 'Earnings' && (
            <div className="max-w-5xl mx-auto px-4 md:px-8 mt-4 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant pb-4">
                <div>
                  <h1 className="font-display font-bold text-xl md:text-2xl text-primary">Student Earnings Center</h1>
                  <p className="text-xs text-on-surface-variant">Track completed shifts, pending clearances, and withdraw funds.</p>
                </div>
                <div className="bg-primary/5 px-4 md:px-5 py-2 rounded-2xl border border-primary/10 text-center">
                  <p className="text-[10px] text-primary font-bold uppercase tracking-wide">Connected Bank</p>
                  <p className="font-mono text-xs font-semibold text-on-surface mt-0.5">Bank Islam •••• 8103</p>
                </div>
              </div>

              {/* Wallet cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-950 text-white p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between h-[160px] shadow-md">
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-indigo-100 font-bold uppercase tracking-wider">Available Balance</span>
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <h2 className="font-display font-black text-3xl">RM {earningsData.availableBalance.toFixed(2)}</h2>
                    <p className="text-[10.5px] text-teal-300 mt-1 font-bold">Cleared for Instant DuitNow Transfer ⚡</p>
                  </div>
                </div>
                <div className="bg-white border border-neutral-100 p-6 rounded-3xl flex flex-col justify-between h-[160px] shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">Pending Release</span>
                    <Clock size={16} className="text-primary animate-pulse" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-3xl text-on-surface">RM {earningsData.pendingRelease.toFixed(2)}</h2>
                    <p className="text-[10px] text-primary font-semibold mt-1">Pending employer clearance</p>
                  </div>
                </div>
                <div className="bg-white border border-neutral-100 p-6 rounded-3xl flex flex-col justify-between h-[160px] shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">Semester Total</span>
                    <TrendingUp size={16} className="text-teal-600" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-3xl text-on-surface">RM {earningsData.semesterTotal.toFixed(2)}</h2>
                    <p className="text-[10px] text-on-surface-variant mt-1">Total accumulated earnings</p>
                  </div>
                </div>
              </div>

              {/* Payout CTA */}
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/40 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="font-display font-bold text-sm text-teal-900">Need funds immediately?</h3>
                  <p className="text-[11px] text-teal-800 font-medium">GigIT pays direct to local Malaysian banks in under 5 minutes. Zero fees.</p>
                </div>
                <button
                  onClick={() => toast(`Transfer Initiated! RM ${earningsData.availableBalance.toFixed(2)} routed to Bank Islam •••• 8103. ⚡`, 5000)}
                  className="bg-primary hover:bg-primary/95 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                >
                  Withdraw to Bank Islam
                </button>
              </div>

              {/* Payout history */}
              <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-display font-bold text-sm text-on-surface">Payout History</h3>
                <div className="divide-y divide-neutral-100">
                  {earningsData.history.map((item, idx) => (
                    <div key={idx} className="py-3.5 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                          <Check size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-on-surface">{item.title}</p>
                          <p className="text-[10px] text-on-surface-variant font-medium">{item.sub}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-teal-700 font-mono">{item.amount}</p>
                        <span className="text-[8px] bg-teal-50 border border-teal-200/50 text-teal-700 font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">{item.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Support ───────────────────────────────────────────────── */}
          {activeTab === 'Support' && (
            <div className="max-w-5xl mx-auto px-4 md:px-8 mt-4 space-y-6 font-sans">
              <div className="border-b border-outline-variant pb-4">
                <h1 className="font-display font-bold text-xl md:text-2xl text-primary">Student Support Desk</h1>
                <p className="text-xs text-on-surface-variant font-medium">Emergency cancellations, travel/fuel claims, or manual academic verification.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                <div className="bg-white border border-neutral-100 p-6 rounded-3xl shadow-sm space-y-3 hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><HelpCircle size={18} /></div>
                    <div>
                      <h3 className="font-display font-bold text-sm text-on-surface">Academic Verification Portal</h3>
                      <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed mt-1">Upload your UMS/UiTM student ID copy for verification auditing.</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('Profile')} className="text-xs text-primary font-bold hover:underline cursor-pointer text-left mt-3">Go to Verification →</button>
                </div>

                <div className="bg-white border border-neutral-100 p-6 rounded-3xl shadow-sm space-y-3 hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center"><AlertCircle size={18} /></div>
                    <div>
                      <h3 className="font-display font-bold text-sm text-on-surface">Emergency Transit & Fuel Subsidy Claim</h3>
                      <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed mt-1">Traveling over 5km for a gig? Claim transit expenses here.</p>
                    </div>
                  </div>
                  <button onClick={() => toast('Travel Claims dashboard initialized! Upload your petrol receipts.', 4000)} className="text-xs text-primary font-bold hover:underline cursor-pointer text-left mt-3">Submit petrol expense receipt →</button>
                </div>
              </div>

              {/* Chat bot */}
              <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                  <h3 className="font-display font-bold text-sm text-on-surface">Interactive Help Center Bot</h3>
                </div>
                <div className="bg-neutral-50/50 border border-neutral-100 p-5 rounded-2xl min-h-[140px] flex flex-col justify-between">
                  <div className="space-y-3.5 max-h-[220px] overflow-y-auto">
                    <div className="flex gap-2.5 items-start text-xs pr-4">
                      <div className="w-6 h-6 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">Bot</div>
                      <div className="bg-white border border-neutral-100 p-2.5 rounded-2xl text-on-surface shadow-sm leading-relaxed font-medium">
                        Hello {workerName.split(' ')[0]}! I'm your GigIT Assist Bot. How can I help with attendance scorecards, fuel vouchers, or payouts?
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 pt-3.5 border-t border-outline-variant flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Type your question…"
                      className="flex-1 bg-white border border-outline-variant/60 outline-none text-xs rounded-xl px-4 py-3 text-on-surface focus:border-primary font-medium"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const v = (e.currentTarget as HTMLInputElement).value.trim();
                          if (!v) return;
                          e.currentTarget.value = '';
                          toast('Thanks! Support request filed. We\'ll reply within 10 minutes.', 5000);
                        }
                      }}
                    />
                    <button
                      onClick={() => toast('Thanks! Support request filed. We\'ll reply within 10 minutes.', 5000)}
                      className="bg-primary hover:bg-primary/95 text-white px-4 py-3 rounded-xl transition-all text-xs font-bold cursor-pointer"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── Gig Detail Modal ─────────────────────────────────────────── */}
      {selectedGig && (
        <div
          className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedGig(null)}
        >
          <div
            className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl overflow-hidden shadow-2xl border border-outline-variant max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {selectedGig.imageUrl && (
              <div className="w-full h-48 bg-surface-container">
                <img src={selectedGig.imageUrl} alt={selectedGig.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h2 className="font-bold text-xl text-on-surface leading-tight">{selectedGig.title}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-on-surface-variant font-medium flex items-center gap-2">
                      {selectedGig.employer}
                      <span className="flex items-center gap-0.5 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-blue-200">
                        <Shield size={10} /> Verified Partner
                      </span>
                    </p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowInsightsForEmployer(selectedGig.employer); }}
                      className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full hover:bg-primary/20 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Star size={10} /> Insights
                    </button>
                  </div>
                </div>
                <button onClick={() => setSelectedGig(null)} className="text-on-surface-variant hover:text-on-surface p-1 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-low rounded-xl p-3">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-bold">Pay Rate</p>
                  <p className="font-bold text-primary text-lg mt-0.5">{selectedGig.rate}</p>
                </div>
                <div className="bg-surface-container-low rounded-xl p-3">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-bold">Duration</p>
                  <p className="font-bold text-on-surface text-lg mt-0.5">{selectedGig.duration ?? 'TBC'}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-on-surface-variant">
                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-primary" />{selectedGig.locationName} • {selectedGig.distance}</span>
                {selectedGig.isInstant && (
                  <span className="flex items-center gap-1 text-amber-600 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Zap size={11} />Instant Hire
                  </span>
                )}
                <span className="text-xs bg-surface-container-low px-2 py-0.5 rounded-full border border-outline-variant">{selectedGig.category}</span>
              </div>

              {selectedGig.description && (
                <div>
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wide mb-1">About This Gig</p>
                  <p className="text-sm text-on-surface leading-relaxed">{selectedGig.description}</p>
                </div>
              )}

              {selectedGig.tags && selectedGig.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedGig.tags.map(tag => (
                    <span key={tag} className="text-xs bg-primary/5 text-primary px-2.5 py-1 rounded-full border border-primary/20 font-medium">{tag}</span>
                  ))}
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button onClick={() => setSelectedGig(null)} className="flex-1 py-3 border border-outline-variant rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container transition-all cursor-pointer">
                  Close
                </button>
                <button
                  onClick={() => { handleApply(selectedGig.id, selectedGig.title, selectedGig.isInstant); setSelectedGig(null); }}
                  disabled={appliedGigs.has(selectedGig.id)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                    appliedGigs.has(selectedGig.id)
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                      : 'bg-primary text-white hover:bg-primary/90 shadow-md'
                  }`}
                >
                  {appliedGigs.has(selectedGig.id) ? '✓ Already Applied' : 'Apply for This Gig'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile FAB — map/list toggle ─────────────────────── */}
      <div className="md:hidden fixed bottom-24 right-4 z-50">
        <button
          onClick={() => setShowMapOnMobile(!showMapOnMobile)}
          className="bg-primary filter drop-shadow-xl hover:bg-primary/95 text-white p-3.5 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 border border-primary-container"
          title={showMapOnMobile ? 'Switch to List View' : 'Switch to Map View'}
        >
          <span className="material-symbols-outlined text-xl text-white">
            {showMapOnMobile ? 'list_alt' : 'map'}
          </span>
        </button>
      </div>

      {/* ── Bottom nav bar — mobile ────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-surface border-t border-outline-variant py-2 flex justify-around items-center shadow-lg font-sans">
        <button onClick={() => onNavigate(AppView.Landing)} className="flex flex-col items-center text-on-surface-variant">
          <span className="material-symbols-outlined text-xl">home</span>
          <span className="text-[10px] mt-0.5">Home</span>
        </button>
        <button onClick={() => setActiveTab('Dashboard')} className={`flex flex-col items-center ${activeTab === 'Dashboard' ? 'text-primary' : 'text-on-surface-variant'}`}>
          <div className={`p-1 px-4 rounded-full ${activeTab === 'Dashboard' ? 'bg-primary/10' : ''}`}>
            <span className="material-symbols-outlined text-md">work</span>
          </div>
          <span className="text-[10px] font-semibold mt-1">Gigs</span>
        </button>
        <button onClick={() => setActiveTab('Messages')} className={`flex flex-col items-center ${activeTab === 'Messages' ? 'text-primary' : 'text-on-surface-variant'}`}>
          <div className={`p-1 px-4 rounded-full ${activeTab === 'Messages' ? 'bg-primary/10' : ''}`}>
            <span className="material-symbols-outlined text-md">chat</span>
          </div>
          <span className="text-[10px] font-semibold mt-1">Messages</span>
        </button>
        <button onClick={() => setActiveTab('SavedGigs')} className={`flex flex-col items-center ${activeTab === 'SavedGigs' ? 'text-primary' : 'text-on-surface-variant'}`}>
          <div className={`p-1 px-4 rounded-full ${activeTab === 'SavedGigs' ? 'bg-primary/10' : ''}`}>
            <span className="material-symbols-outlined text-md">bookmarks</span>
          </div>
          <span className="text-[10px] font-semibold mt-1">Saved</span>
        </button>
        <button onClick={() => setActiveTab('Reliability')} className={`flex flex-col items-center ${activeTab === 'Reliability' ? 'text-primary' : 'text-on-surface-variant'}`}>
          <div className={`p-1 px-4 rounded-full ${activeTab === 'Reliability' ? 'bg-primary/10' : ''}`}>
            <span className="material-symbols-outlined text-md">verified_user</span>
          </div>
          <span className="text-[10px] font-semibold mt-1">Trust</span>
        </button>
      </div>

      {showInsightsForEmployer && (
        <EmployerInsightsModal 
          employerName={showInsightsForEmployer} 
          onClose={() => setShowInsightsForEmployer(null)} 
        />
      )}
    </div>
  );
}