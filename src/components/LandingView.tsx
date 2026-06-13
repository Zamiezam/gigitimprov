import { useState } from 'react';
import { AppView } from '../types';
import { testimonials } from '../data';
import { 
  Briefcase, 
  User, 
  MapPin, 
  Clock, 
  Award, 
  CheckCircle, 
  Check, 
  ShieldCheck, 
  Zap, 
  DollarSign, 
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { motion } from 'motion/react';

interface LandingViewProps {
  onNavigate: (view: AppView) => void;
  onOpenSelector: () => void;
}

export default function LandingView({ onNavigate, onOpenSelector }: LandingViewProps) {
  // Simulator states for Card 1 (Verified Credentials)
  const [verificationState, setVerificationState] = useState<'idle' | 'auditing' | 'verified'>('idle');
  const [auditStep, setAuditStep] = useState<string>('');

  // Simulator states for Card 2 (Attendance Rating System)
  const [score, setScore] = useState(4.8);
  const [punctuality, setPunctuality] = useState(98.4);
  const [noShows, setNoShows] = useState(0);

  // Simulator states for Card 3 (Standby Backup Dispatch)
  const [dispatchState, setDispatchState] = useState<'idle' | 'reporting' | 'routing' | 'routed'>('idle');
  const [dispatchLog, setDispatchLog] = useState<string[]>([
    'Roster Active: 12 standby students in Likas/KK'
  ]);

  const runVerificationMock = () => {
    setVerificationState('auditing');
    setAuditStep('Connecting UMS Database');
    setTimeout(() => {
      setAuditStep('Parsing Matric ID');
      setTimeout(() => {
        setAuditStep('Confirming ACTIVE student status');
        setTimeout(() => {
          setVerificationState('verified');
        }, 500);
      }, 500);
    }, 500);
  };

  const handleModifyScore = (isPositive: boolean) => {
    if (isPositive) {
      setScore(prev => Math.min(5.0, Number((prev + 0.1).toFixed(1))));
      setPunctuality(prev => Math.min(100, Number((prev + 0.5).toFixed(1))));
    } else {
      setScore(prev => Math.max(1.0, Number((prev - 0.4).toFixed(1))));
      setPunctuality(prev => Math.max(50, Number((prev - 4.5).toFixed(1))));
      setNoShows(prev => prev + 1);
    }
  };

  const triggerDispatchSimulation = () => {
    setDispatchState('reporting');
    setDispatchLog(['10:30 AM - Lintas Coffee House reports no-show!']);
    
    setTimeout(() => {
      setDispatchState('routing');
      setDispatchLog(prev => [...prev, '10:31 AM - Scanning standby pool within 5km radius']);
      
      setTimeout(() => {
        setDispatchState('routed');
        setDispatchLog(prev => [...prev, '10:32 AM - Farhan J. (UiTM Student) accepted replacement shift! ⚡']);
      }, 1000);
    }, 900);
  };

  return (
    <div className="bg-background min-h-screen text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container">
      {/* Top Header Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-8 h-16 bg-surface-container-lowest border-b border-outline-variant shadow-xs">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate(AppView.Landing)}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg font-display">G</div>
          <span className="font-display font-bold text-xl text-primary tracking-tight">GigIT</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <button onClick={() => onNavigate(AppView.Landing)} className="text-primary font-bold border-b-2 border-primary py-1 text-sm tracking-wide">Home</button>
          <button onClick={() => onNavigate(AppView.WorkerBrowse)} className="text-on-surface-variant hover:text-primary transition-colors text-sm tracking-wide">Browse Gigs</button>
          <button onClick={() => onNavigate(AppView.EmployerDashboard)} className="text-on-surface-variant hover:text-primary transition-colors text-sm tracking-wide">Hire Staff</button>
          <button onClick={() => onNavigate(AppView.WorkerReliability)} className="text-on-surface-variant hover:text-primary transition-colors text-sm tracking-wide">Worker Portal</button>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onOpenSelector}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-white font-label-lg hover:bg-primary/95 shadow-xs transition-all cursor-pointer active:scale-95 text-sm"
          >
            <User size={16} />
            <span>Login/Sign Up</span>
          </button>
        </div>
      </nav>

      <main className="pt-16 overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative min-h-[680px] lg:min-h-[760px] flex items-center px-4 md:px-8 hero-gradient">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-center py-12">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-tertiary-container/35 text-on-tertiary-container font-medium text-xs">
                <ShieldCheck size={14} className="text-tertiary" />
                <span>Hyperlocal Gig Network in KK</span>
              </div>
              <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-5xl leading-tight tracking-tight text-on-surface">
                Sabah's Trusted <br />
                <span className="text-primary">Gig Network</span>
              </h1>
              <p className="text-base sm:text-lg text-on-surface-variant max-w-xl leading-relaxed">
                Empowering UMS and UiTM students with high-quality gigs while providing local SMEs with a verified, reliable backup staff pool.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={() => onNavigate(AppView.WorkerBrowse)}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 shadow-md hover:shadow-lg transition-all group active:scale-95 cursor-pointer"
                >
                  <span>Find Gigs</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => onNavigate(AppView.EmployerDashboard)}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-primary text-primary bg-white/40 backdrop-blur-xs rounded-xl font-bold hover:bg-primary/5 transition-all active:scale-95 cursor-pointer"
                >
                  <span>Hire Reliable Staff</span>
                </button>
              </div>
              <div className="flex items-center gap-4 pt-6">
                <div className="flex -space-x-3">
                  <img 
                    className="w-10 h-10 rounded-full border-2 border-white object-cover" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9URRNVhi7njv6wupYTTXBEBPc93r5c9lyUpASIzmo1jzFPwKQ2fGYaQUdZAlLrn7xSvS1Vtt_BcQSe36pzTS6UGQrhuv7ahMTiBYDoEAY3g6Bv2w5lIlVyJGhateIg8WQMOZkAhjH0_9595Ac50va9zNMc0fV4D3Dxlu9erC9kcQ0pTRq81eSu3S9t8yE0BFzUYWuwjLUnODoQ17iOecZ8HK4NgwCLZTuKhTcd3snrIxtLEQVJiDCz94BrSNDNCVIZH4miHJ3N64" 
                    alt="Active Student" 
                  />
                  <img 
                    className="w-10 h-10 rounded-full border-2 border-white object-cover" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAj-1BgYDZd9rj0cWlIQ8xhcdYL3G4CbjFlAOytGl0FguutZQ5V673dqYy-ty2tjxPd52fqRn7TC9_z3pY7Fg5cWzKJu0ME27RIYswSDtWxCzwVreBI0qiOZACJI81Yw0ckFoIPwAJa6QFvzCdz4bY0Ix6K1wmoxE7khRuXK6AA3Zat9BAsB6nYeW2nP1JiivG6fri7mbxdUWTUddo9kT2E_StPNeIxQbDLgHSlcDcGKkNos9ObO7myswq7ApjsEaNsBKP-7bb7TsI" 
                    alt="Active Student 2" 
                  />
                  <img 
                    className="w-10 h-10 rounded-full border-2 border-white object-cover" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZHXGWLcSxB-pNQJFnUZuiI4tWFTBaFvUGdRUlryOu0vQ6lAEpq8WaLqto0cgQh6Xr5LVQqdq28i6AopQVfrBi24wlJdgw9RYRNfcJ61I-vDRVrQvQbz6Ih5VLTutvl9glfZ-Te64XezI9oo5HoA8u72SYjXyaEGtPxinl0KAzl_FrEh8kIdrkV1WSwNoayKG8yMNXgH36YJWJt9eOPyvv4om3rNbKrMF0T-bRhD7fQGoxOa_KG4EHHdJyIo1TUQqE0cLBgb5XCOI" 
                    alt="SME Owner" 
                  />
                </div>
                <p className="text-sm font-medium text-on-surface-variant">
                  <span className="font-bold text-on-surface">500+</span> Verified Workers in KK
                </p>
              </div>
            </div>
            <div className="lg:col-span-5 relative hidden lg:block">
              <div className="relative w-full aspect-square bg-surface-container-high rounded-[2rem] overflow-hidden shadow-2xl">
                <img 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRZYGfGUgVQVI2mR4UZAlyEOzqd2dujD3hhkVFkS6LC-sHT8PpcXBOwzQZm3WCcblWjU2F_YyCaih7T_iYr_fBdG8lLKRDa5HDbfU_F-luvvooQaqhIY2Dwzuq5MpBxc4H2kle_H6oB_hGQK0YH0jJekwPOFLyTIDOwJuSSSn2yyT5IXzSrGFyt3DiWCr4hc2Y14giWROa9g34CB74sS0Gn1iLFHr1C3NPTP0zXmNDhzHVtFCufgbwUJ2CfPqclUp4T02A7KQg-Rg" 
                  alt="Kota Kinabalu skyline" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent"></div>
              </div>
              {/* Floating Proximity Badge */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute -bottom-6 -left-6 glass-card p-4 rounded-2xl shadow-xl max-w-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
                    <MapPin size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm tracking-tight">Lintas Square</p>
                    <p className="text-xs text-on-surface-variant">2 Staff Available Now</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Feature: Reliability Score Section */}
        <section className="py-16 md:py-24 px-4 md:px-8 bg-surface-container-lowest">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
              <h2 className="font-display font-bold text-3xl md:text-4xl text-on-surface tracking-tight">Trust &amp; Attendance Guard</h2>
              <p className="text-base text-on-surface-variant max-w-2xl mx-auto">
                GigIT is built on mutual trust. We verify identities and active academic enrollments, ensuring peace of mind for both students and local KK businesses.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {/* Card 1: Verified Credentials */}
              <div className="p-6 md:p-8 bg-white border border-neutral-100 rounded-3xl hover:shadow-[0_16px_40px_rgba(0,106,106,0.06)] hover:border-primary/25 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-10 h-10 bg-teal-50 text-primary rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-on-surface leading-tight tracking-tight">Verified Academic Credentials</h3>
                      <p className="text-[10px] text-primary/80 font-bold uppercase tracking-wider">Background Audited</p>
                    </div>
                  </div>
                  
                  {/* Student ID Card Mockup Element */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-teal-50/80 via-white to-sky-50 text-slate-800 rounded-2xl p-4 border border-teal-100/90 shadow-md my-4 group-hover:shadow-lg transition-all">
                    {/* Security glow line */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-200/25 rounded-full blur-2xl origin-top-right group-hover:bg-teal-200/45 transition-all"></div>
                    <div className="absolute right-3 top-3 w-4 h-4 bg-teal-150/40 rounded-full blur-xs flex items-center justify-center">
                      <div className="w-2 h-2 bg-teal-600 rounded-full animate-pulse"></div>
                    </div>
                    
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[9px] text-teal-700 font-extrabold tracking-widest leading-none uppercase">KAD MATRIK / STUDENT ID</p>
                        <p className="text-[11px] font-display font-bold text-slate-900 mt-0.5">Universiti Malaysia Sabah</p>
                      </div>
                      <div className="bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded text-[8px] font-mono border border-teal-200/30 uppercase">
                        AKTIF / ACTIVE
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 overflow-hidden flex items-center justify-center shrink-0">
                        <img 
                          alt="ID Photo" 
                          className="w-full h-full object-cover" 
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDR_yuEE9W4djP9NUe9iDVsrhbbqm4c33mAlfDjziC8BLi_t74hQq-KG0VktJpJg9e--D2XO_NUJzmL5quEgka7Um1OL0iazTpJDBk71rPxSF_7N91D4ACo2dyhpbQaQodHH1Y8V3o4TIlrZgWRvHjAC2X9e_dr4LNN0WjGpn_X8vOC3xbjAaAMLbuwKZJKr3YOmYSEML-QJ8N2QRPq864qy9TCjIv8nbsuGkNHlZbRcD8MLFgVDmT-5MVc6EdJ2JyyGQ_SQlnRwWQ"
                        />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-bold text-[11px] truncate text-slate-800">Ahmad Rosli</p>
                        <p className="text-[9px] text-slate-600 truncate font-semibold">Fakulti Komputeran &amp; Informatik</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3.5 border-t border-teal-100/80 flex justify-between items-center text-[8px] font-mono text-slate-600">
                      <div>
                        <p className="leading-none text-[7px] text-slate-400 uppercase">AUDIT PERSO_ID</p>
                        <p className="mt-0.5 leading-none font-bold text-teal-700 font-mono">#UMS-90218-SECURE</p>
                      </div>
                      <div className="text-right">
                        <p className="leading-none text-[7px] text-slate-400 uppercase">STATUS SEMAKAN</p>
                        <p className={`mt-0.5 leading-none font-extrabold flex items-center gap-0.5 font-mono ${
                          verificationState === 'verified' ? 'text-teal-700' :
                          verificationState === 'auditing' ? 'text-indigo-600 animate-pulse' : 'text-teal-700'
                        }`}>
                          {verificationState === 'verified' && <Check size={10} className="stroke-[3]" />}
                          {verificationState === 'verified' && 'DISAHKAN'}
                          {verificationState === 'auditing' && 'SEMAKAN'}
                          {verificationState === 'idle' && <Check size={10} className="stroke-[3]" />}
                          {verificationState === 'idle' && 'DISAHKAN'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-on-surface-variant leading-relaxed font-sans mt-3">
                    Instant programmatic validation with official university enrollments completely eliminates fake profiles, ensuring SMEs hire real students.
                  </p>

                  {/* Interactive Simulation Block */}
                  <div className="mt-4 pt-3 border-t border-neutral-100 flex flex-col gap-2">
                    <button 
                      onClick={runVerificationMock}
                      disabled={verificationState === 'auditing'}
                      className="w-full text-center py-2 px-3 bg-teal-50 hover:bg-teal-100 disabled:bg-neutral-100 text-primary hover:text-primary-high text-xs font-bold rounded-xl active:scale-97 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {verificationState === 'idle' && <span>Simulate Academic Lookup</span>}
                      {verificationState === 'auditing' && (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent animate-spin rounded-full inline-block"></span>
                          <span>{auditStep}...</span>
                        </>
                      )}
                      {verificationState === 'verified' && <span className="text-teal-800">✓ Academic Lookup Success</span>}
                    </button>
                    {verificationState === 'verified' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, y: 10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="text-[10px] text-teal-700 bg-teal-50/50 border border-teal-200/50 rounded-xl p-3 leading-relaxed font-sans overflow-hidden"
                      >
                        <p className="font-bold">Match found in UMS Registrar Database!</p>
                        <p className="mt-0.5 text-neutral-600">Bio-ID verified Ahmad Rosli as active student (Semester 4, Faculty of Computing). Registrar Status ID: #UMS-90218-SECURE.</p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 2: Dynamic Scores */}
              <div className="p-6 md:p-8 bg-white border border-neutral-100 rounded-3xl hover:shadow-[0_16px_40px_rgba(0,106,106,0.06)] hover:border-primary/25 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-on-surface leading-tight tracking-tight">Refining Attendance Scores</h3>
                      <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">Dynamic Calibration</p>
                    </div>
                  </div>
                  
                  {/* Scoreboard Telemetry Mockup */}
                  <div className="bg-surface-container-low border border-neutral-200/55 rounded-2xl p-4 my-4 space-y-3.5 relative overflow-hidden">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">Real-time Scorecard</span>
                      <span className="text-[8px] bg-primary/10 border border-primary/25 text-primary text-right font-bold px-1.5 py-0.5 rounded-full uppercase">
                        Calibrated Live
                      </span>
                    </div>
                    
                    <div className="flex items-end justify-between">
                      <div className="space-y-0.5">
                        <p className="text-[9px] text-on-surface-variant font-medium">Core score</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-display font-extrabold text-on-surface leading-none transition-all">{score}</span>
                          <span className="text-xs font-bold text-on-surface-variant">/5.0</span>
                        </div>
                      </div>
                      
                      {/* Interactive Graph/Meter approximation */}
                      <div className="flex items-end gap-1.5 h-10 bg-transparent px-2">
                        <motion.div 
                          className="w-2.5 bg-primary/20 rounded-full" 
                          animate={{ height: score * 5 }} 
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        />
                        <motion.div 
                          className="w-2.5 bg-primary/30 rounded-full" 
                          animate={{ height: score * 7 }} 
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        />
                        <motion.div 
                          className="w-2.5 bg-primary/40 rounded-full" 
                          animate={{ height: score * 6 }} 
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        />
                        <motion.div 
                          className="w-2.5 bg-primary rounded-full relative shadow-xs" 
                          animate={{ height: score * 8 }} 
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <div className="absolute top-1 left-0.5 w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                        </motion.div>
                      </div>
                    </div>
                    
                    {/* Performance Indicators */}
                    <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-neutral-200/70 text-[9px] font-medium font-sans">
                      <div className="bg-white p-2 rounded-lg border border-neutral-100 flex flex-col justify-center">
                        <p className="text-neutral-500 uppercase text-[7px]">Punctuality</p>
                        <p className="text-teal-700 font-bold mt-0.5">{punctuality}% On Time</p>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-neutral-100 flex flex-col justify-center">
                        <p className="text-neutral-500 uppercase text-[7px]">Cancellations</p>
                        <p className={`${noShows > 0 ? 'text-red-600' : 'text-emerald-700'} font-bold mt-0.5`}>
                          {noShows} Active {noShows === 1 ? 'Penalty' : 'Penalties'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-on-surface-variant leading-relaxed font-sans mt-3">
                    Scores elevate after each successful clock-out, capturing geo-fenced coordinates, duration loyalty, and rating parameters.
                  </p>

                  {/* Interactive Simulation Block */}
                  <div className="mt-4 pt-3 border-t border-neutral-100 flex gap-2">
                    <button 
                      onClick={() => handleModifyScore(true)}
                      className="flex-1 text-center py-2 px-1.5 bg-teal-50 hover:bg-teal-100/80 text-teal-900 border border-teal-200/40 rounded-xl font-bold text-[10.5px] cursor-pointer transition-all active:scale-95"
                    >
                      + Hadir / On-Time
                    </button>
                    <button 
                      onClick={() => handleModifyScore(false)}
                      className="flex-1 text-center py-2 px-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200/40 rounded-xl font-bold text-[10.5px] cursor-pointer transition-all active:scale-95"
                    >
                      - Gagal / No-Show
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 3: Standby Backup Pool */}
              <div className="p-6 md:p-8 bg-white border border-neutral-100 rounded-3xl hover:shadow-[0_16px_40px_rgba(0,106,106,0.06)] hover:border-primary/25 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-on-surface leading-tight tracking-tight">Standby Backup Pool</h3>
                      <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Zero No-Show Guarantee</p>
                    </div>
                  </div>
                  
                  {/* Standby Live Dispatch Mockup */}
                  <div className="bg-surface-container-low border border-neutral-200/55 rounded-2xl p-4 my-4 space-y-3 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">Live Standby Stream</span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                        <span className="text-[8px] text-neutral-500 font-sans font-bold">12 Active KK</span>
                      </span>
                    </div>
                    
                    {/* Live Roster Feed Stack / Dispatch Log Display */}
                    {dispatchState === 'idle' && (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="space-y-2 text-slate-800"
                      >
                        <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-neutral-100/80 text-[9px]">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-550"></span>
                            </span>
                            <span className="font-semibold text-on-surface">Farhan J. (UiTM Student)</span>
                          </div>
                          <span className="text-indigo-600 font-bold text-[8px] bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/40">1.2km away</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-neutral-100/80 text-[9px]">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-550"></span>
                            </span>
                            <span className="font-semibold text-on-surface">Zulaikha M. (UMS Student)</span>
                          </div>
                          <span className="text-indigo-600 font-bold text-[8px] bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/40">2.6km away</span>
                        </div>
                      </motion.div>
                    )}

                    {dispatchState === 'routing' && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative h-16 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-indigo-500/20 shadow-inner"
                      >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)]"></div>
                        {/* Concertric Radar Waves */}
                        <motion.div 
                          className="absolute border border-indigo-500/20 rounded-full w-12 h-12" 
                          animate={{ scale: [1, 2.2], opacity: [0.8, 0] }}
                          transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
                        />
                        <motion.div 
                          className="absolute border border-indigo-500/10 rounded-full w-24 h-24" 
                          animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut", delay: 0.6 }}
                        />
                        {/* Sweeper needle */}
                        <motion.div 
                          className="absolute w-1/2 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-indigo-400 origin-left left-1/2 top-1/2"
                          style={{ y: "-50%" }}
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                        />
                        <div className="relative z-10 flex flex-col items-center gap-0.5 pointer-events-none">
                          <span className="text-[9px] font-bold text-indigo-300 font-mono tracking-widest animate-pulse flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
                            KK_BACKUP_SEARCHING
                          </span>
                          <span className="text-[7.5px] text-slate-400 font-sans font-medium">Scanning standby pool within 5km...</span>
                        </div>
                      </motion.div>
                    )}

                    {(dispatchState === 'reporting' || dispatchState === 'routed') && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-2 bg-white rounded-lg border border-neutral-100 space-y-1 text-[8.5px] font-mono text-neutral-750 leading-tight min-h-[58px]"
                      >
                        {dispatchLog.map((log, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex gap-1 items-start"
                          >
                            <span className="text-indigo-600 font-bold shrink-0">&raquo;</span>
                            <span className="truncate">{log}</span>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                    
                    {/* Alert Dispatcher Bubble Overlay */}
                    <div className="bg-gradient-to-r from-indigo-500 to-indigo-650 text-white p-2.5 rounded-xl flex items-center justify-between shadow-xs text-[8.5px] font-sans">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Zap size={11} className="text-white shrink-0 animate-bounce" fill="currentColor" />
                        <p className="truncate font-medium">
                          {dispatchState === 'idle' && 'Standby System Armed: Active Watch'}
                          {dispatchState === 'reporting' && 'No-Show Emergency logged!'}
                          {dispatchState === 'routing' && 'Emergency Routing Standby Pool...'}
                          {dispatchState === 'routed' && 'Replacement Worker Routed!'}
                        </p>
                      </div>
                      <span className="shrink-0 font-bold bg-white/20 px-1.5 py-0.5 rounded uppercase font-mono tracking-wide text-[7px]">
                        {dispatchState === 'idle' ? 'STANDBY' : dispatchState.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-on-surface-variant leading-relaxed font-sans mt-3">
                    If an assigned worker cancels, our system alerts backup-pool standby students within 5km, saving cafes and retail from understaffing.
                  </p>

                  {/* Interactive Simulation Block */}
                  <div className="mt-4 pt-3 border-t border-neutral-100 flex flex-col gap-2">
                    <button 
                      onClick={triggerDispatchSimulation}
                      disabled={dispatchState === 'reporting' || dispatchState === 'routing'}
                      className="w-full text-center py-2 px-3 bg-indigo-50 hover:bg-indigo-100 disabled:bg-neutral-100 text-indigo-950 text-xs font-bold rounded-xl active:scale-97 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {dispatchState === 'idle' && <span>Simulate No-Show Event</span>}
                      {dispatchState === 'reporting' && (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent animate-spin rounded-full inline-block"></span>
                          <span>Logging No-Show...</span>
                        </>
                      )}
                      {dispatchState === 'routing' && (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent animate-spin rounded-full inline-block"></span>
                          <span>Routing backup pool...</span>
                        </>
                      )}
                      {dispatchState === 'routed' && <span className="text-emerald-700">✓ Replacement Dispatched!</span>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Hyperlocal Bento Grid */}
        <section className="py-16 md:py-24 px-4 md:px-8 bg-surface-container-low">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center md:text-left max-w-xl">
              <h2 className="font-display font-bold text-3xl text-on-surface mb-3">KK Hyperlocal Eco-System</h2>
              <p className="text-sm text-on-surface-variant">Connecting local students with nearest establishments to eliminate commute bottlenecks.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-none md:grid-rows-2 gap-6">
              {/* Box 1 (large image and matching tagline) */}
              <div className="md:col-span-2 md:row-span-2 relative rounded-3xl overflow-hidden bg-primary min-h-[300px] md:min-h-auto group shadow-md">
                <img 
                  className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCs-co9HfunSpC4PZToNqKPsNCknzSULiRthHBRzbjnvn-K_lKIbGmWZXUodDW_bUvYoi0ynxOBNbOoVpx9TsGlXgucTCRHzGz5x6jW5nJjygIU9DXXPFD137YIkUlHgyHDv9V9cLeKAp49UTz0QryFPIiNJNzfKBWirAf8Eb63CGMRJAs7WvbOy4N-Nfo2Q8qAIhmsOm7ffh29fPmwVK0Aphz7qhDSSCoVsrTTd_91JJA2titKM_Fso9Kv8FrfyJHlaXcg36uUyOA" 
                  alt="Kota Kinabalu Gaya Street" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent"></div>
                <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                  <h3 className="font-display font-bold text-2xl mb-2">Hyperlocal Matching</h3>
                  <p className="text-sm opacity-90 font-sans leading-relaxed">Find staff or gigs within 5km of your location. From Kolombong to Penampang in minutes.</p>
                </div>
              </div>

              {/* Box 2 (Active Gigs list) */}
              <div className="md:col-span-2 bg-white rounded-3xl p-8 flex flex-col justify-center border border-outline-variant shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-semibold text-lg text-on-surface">Active Gigs in KK</h4>
                  <span className="px-3 py-1 bg-primary text-white rounded-full font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    Live Now
                  </span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl border border-outline-variant hover:border-primary/30 transition-colors">
                    <span className="text-sm font-semibold text-on-surface">Event Assistant @ ICC</span>
                    <span className="text-primary font-bold text-sm">RM 80/Day</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl border border-outline-variant opacity-85 hover:border-primary/30 transition-colors">
                    <span className="text-sm font-semibold text-on-surface">Barista @ Gaya Street</span>
                    <span className="text-primary font-bold text-sm">RM 12/Hr</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl border border-outline-variant opacity-70 hover:border-primary/30 transition-colors">
                    <span className="text-sm font-semibold text-on-surface">Promoter @ Imago</span>
                    <span className="text-primary font-bold text-sm">RM 65/Day</span>
                  </div>
                </div>
              </div>

              {/* Box 3 (Fast Fill Tracker Dashboard) */}
              <div className="md:col-span-1 bg-gradient-to-br from-teal-50 to-indigo-50/60 text-on-surface rounded-3xl p-6 flex flex-col justify-between min-h-[220px] shadow-sm border border-teal-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-radial-gradient(circle at top right, rgba(20, 184, 166, 0.1), transparent 60%) pointer-events-none"></div>
                
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center border border-teal-500/15 group-hover:scale-105 transition-transform duration-300 shrink-0">
                    <Zap size={18} className="text-teal-600 animate-pulse" />
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] bg-teal-555/10 border border-teal-500/20 text-teal-700 font-bold px-2 py-0.5 rounded leading-none">
                      90% Success
                    </span>
                  </div>
                </div>

                <div className="my-3 space-y-2">
                  <h4 className="font-display font-bold text-sm tracking-tight text-teal-950 leading-none">Fast Fill Engine</h4>
                  <p className="text-[10px] text-teal-900/80 leading-normal font-medium">Nearest qualified students are alerted instantly to match pending gigs.</p>
                  
                  {/* Visual Timeline Match */}
                  <div className="bg-white/80 border border-teal-100/50 rounded-xl p-2 flex items-center justify-between text-[8.5px] font-mono mt-2 shadow-2xs">
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500"></span>
                      </span>
                      <span className="text-teal-950 font-sans">Gaya Brew Cafe</span>
                    </div>
                    <span className="text-teal-700 font-bold">&larr; Filled in 18m</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-[9px] text-teal-600 font-bold uppercase tracking-wider font-sans leading-none">Standard Fill Time</p>
                  <p className="text-lg font-bold text-teal-950 mt-1 leading-none font-display">Under 2 Hours</p>
                </div>
              </div>

              {/* Box 4 (Instant Pay Wallet Mockup) */}
              <div className="md:col-span-1 bg-white rounded-3xl p-6 flex flex-col justify-between min-h-[220px] shadow-sm border border-outline-variant hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute right-0 bottom-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
                
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center border border-outline-variant/60 group-hover:scale-105 transition-transform duration-300 shrink-0">
                    <DollarSign size={18} className="text-primary" />
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] bg-primary/10 border border-primary/25 text-primary font-bold px-1.5 py-0.5 rounded uppercase tracking-wide leading-none">
                      Instant DuitNow
                    </span>
                  </div>
                </div>

                <div className="my-2.5">
                  <h4 className="font-display font-bold text-sm tracking-tight text-on-surface leading-none">Instant Pay Wallet</h4>
                  
                  {/* Digital Payout Card Transaction */}
                  <div className="bg-surface-container rounded-xl p-2.5 mt-2.5 border border-outline-variant/40 space-y-1">
                    <div className="flex justify-between text-[8px] text-on-surface-variant font-medium">
                      <span>Payout Cleared</span>
                      <span className="text-emerald-700 font-bold font-mono">RM 132.00</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[7px] text-on-surface-variant font-mono">
                      <CheckCircle size={10} className="text-emerald-600" />
                      <span>Transferred to Bank Islam ⚡</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider font-sans leading-none">Transaction Fee</p>
                  <p className="text-lg font-bold text-primary mt-1 leading-none font-display">RM 0 (Zero Fees)</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 md:py-24 px-4 md:px-8 bg-surface-container-lowest border-t border-outline-variant">
          <div className="max-w-7xl mx-auto space-y-12">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-center text-on-surface">Trusted by Sabah's Best</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testimonials.map((test) => (
                <div key={test.id} className="glass-card p-8 rounded-3xl relative flex flex-col justify-between hover:shadow-md transition-shadow">
                  <span className="text-primary/15 font-serif text-8xl absolute top-4 left-4 select-none leading-none">“</span>
                  <p className="text-sm italic text-on-surface-variant relative z-10 pt-4 leading-relaxed font-sans mb-6">
                    "{test.quote}"
                  </p>
                  <div className="flex items-center gap-4 relative z-10">
                    <img className="w-12 h-12 rounded-full object-cover border border-outline-variant" src={test.avatar} alt={test.author} />
                    <div>
                      <p className="font-bold text-sm text-on-surface">{test.author}</p>
                      <p className="text-xs text-on-surface-variant">{test.authorSub}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-16 px-4 md:px-8">
          <div className="max-w-7xl mx-auto bg-primary-container text-white rounded-[2.5rem] p-8 md:p-16 text-center shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/15 via-transparent to-transparent pointer-events-none"></div>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-white">Ready to Gig in Sabah?</h2>
            <p className="text-white/90 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Join the thousands of students and hundreds of businesses building a stronger, more reliable local economy together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button 
                onClick={() => onNavigate(AppView.WorkerReliability)}
                className="px-8 py-3.5 bg-on-primary-container hover:bg-on-primary-container/90 text-white rounded-full font-bold shadow-md hover:scale-103 transition-all active:scale-95 cursor-pointer text-sm"
              >
                Download Student App
              </button>
              <button 
                onClick={() => onNavigate(AppView.EmployerDashboard)}
                className="px-8 py-3.5 border-2 border-white bg-white/10 hover:bg-white/15 text-white rounded-full font-bold shadow-md active:scale-95 transition-all cursor-pointer text-sm"
              >
                Post a Gig Now
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-16 px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 bg-surface-container-high border-t border-outline-variant">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-white font-bold text-xs font-display">G</div>
            <span className="font-display font-bold text-base text-on-surface">GigIT</span>
          </div>
          <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
            Connecting Sabah's students with local SMEs through trust, technology, and reliability.
          </p>
          <p className="text-[11px] text-on-surface-variant pt-2">© 2026 GigIT. Built for KK &amp; Beyond.</p>
        </div>
        <div>
          <h4 className="font-semibold text-xs text-on-surface mb-4 uppercase tracking-wider">Quick Links</h4>
          <ul className="space-y-2.5 text-xs text-on-surface-variant">
            <li><button onClick={() => onNavigate(AppView.Landing)} className="hover:text-primary hover:underline transition-all">About Us</button></li>
            <li><button onClick={() => onNavigate(AppView.Landing)} className="hover:text-primary hover:underline transition-all">Contact Support</button></li>
            <li><button onClick={() => onNavigate(AppView.Landing)} className="hover:text-primary hover:underline transition-all">Terms of Service</button></li>
            <li><button onClick={() => onNavigate(AppView.Landing)} className="hover:text-primary hover:underline transition-all">Local SME Resources</button></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-xs text-on-surface mb-4 uppercase tracking-wider">Sabah Locations</h4>
          <div className="flex flex-wrap gap-1.5">
            {['Kota Kinabalu', 'Penampang', 'Putatan', 'Sepanggar', 'Inanam', 'Damai'].map((loc) => (
              <span key={loc} className="px-3 py-1 bg-surface rounded-full text-xs text-on-surface-variant border border-outline-variant/50">
                {loc}
              </span>
            ))}
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (Mobile only, hidden on desktop) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-surface border-t border-outline-variant py-2 flex justify-around items-center shadow-lg">
        <button 
          onClick={() => onNavigate(AppView.Landing)}
          className="flex flex-col items-center text-primary"
        >
          <div className="p-1 px-4 bg-primary-container/20 text-primary rounded-full">
            <span className="material-symbols-outlined text-xl h-5 flex items-center justify-center">home</span>
          </div>
          <span className="text-[10px] font-bold mt-1">Home</span>
        </button>
        <button 
          onClick={() => onNavigate(AppView.WorkerBrowse)}
          className="flex flex-col items-center text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-xl">work</span>
          <span className="text-[10px] mt-0.5">My Gigs</span>
        </button>
        <button 
          onClick={() => onNavigate(AppView.WorkerReliability)}
          className="flex flex-col items-center text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-xl">person</span>
          <span className="text-[10px] mt-0.5">Profile</span>
        </button>
      </div>
    </div>
  );
}
