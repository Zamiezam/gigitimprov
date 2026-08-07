import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/api';
import { Gig } from '../types';
import { Search, User, MapPin, Clock, Calendar, CheckCircle, Percent, Plus, X, CalendarCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Worker {
  id: string;
  full_name: string;
  avatar_url: string;
  university: string;
  bio: string;
  skills: string[];
  reliability_score: string;
  schedules: any[];
}

interface HiringPortalProps {
  myGigs: Gig[]; // Used for matching keywords and offering jobs
}

export default function HiringPortal({ myGigs }: HiringPortalProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGigId, setSelectedGigId] = useState<string>('all');
  const [offeringJobTo, setOfferingJobTo] = useState<Worker | null>(null);
  const [offerSuccess, setOfferSuccess] = useState<string | null>(null);
  const [offerNotes, setOfferNotes] = useState('');

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      // Fetch all profiles with role = 'Worker'
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'Worker');

      if (!profilesData) return;

      // Fetch all schedules
      const { data: schedulesData } = await supabase
        .from('worker_schedules')
        .select('*');

      const workersList = profilesData.map((p: any) => {
        let skills = p.skills || [];
        // Extract skills from JSON bio if present
        if (p.bio && p.bio.startsWith('{')) {
          try {
            const parsed = JSON.parse(p.bio);
            skills = parsed.skills || skills;
            p.bio = parsed.bio || '';
          } catch(e) {}
        }
        
        return {
          id: p.id,
          full_name: p.full_name || 'Anonymous Student',
          avatar_url: p.avatar_url || 'https://randomuser.me/api/portraits/men/32.jpg',
          university: p.university || 'UMS',
          bio: p.bio || '',
          skills: skills,
          reliability_score: p.reliability_score || '4.8',
          schedules: (schedulesData || []).filter((s: any) => s.worker_id === p.id)
        };
      });

      setWorkers(workersList);
    } catch (err) {
      console.error('Error fetching workers', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedGig = myGigs.find(g => g.id === selectedGigId);

  // JS-based matching logic
  const calculateFitScore = (worker: Worker, gig: Gig | undefined) => {
    if (!gig) return { score: 0, highlights: [] };
    
    let score = 50; // Base score
    const highlights: string[] = [];
    const gigText = `${gig.title} ${gig.description} ${gig.tags} ${gig.category}`.toLowerCase();
    const workerText = `${worker.bio} ${worker.skills.join(' ')}`.toLowerCase();

    // Keyword matching
    const keywords = ['barista', 'event', 'cleaning', 'logistics', 'f&b', 'packing', 'cashier', 'customer service', 'waiter'];
    let matchedKeywords = 0;
    
    keywords.forEach(kw => {
      if (gigText.includes(kw) && workerText.includes(kw)) {
        score += 15;
        matchedKeywords++;
        if (!highlights.includes(kw)) highlights.push(`Matches on '${kw}'`);
      }
    });

    if (matchedKeywords > 0) {
      score += 10; // Bonus for having matching keywords
    } else {
      // Just check any word in tags
      const gigTags = (gig.tags || '').split(',').map(t => t.trim().toLowerCase());
      gigTags.forEach(tag => {
        if (tag && workerText.includes(tag)) {
          score += 10;
          if (!highlights.includes(tag)) highlights.push(`Matches on '${tag}'`);
        }
      });
    }

    // High reliability bonus
    if (parseFloat(worker.reliability_score) >= 4.5) {
      score += 10;
      highlights.push('Top Reliability Score');
    }

    // Schedules exist bonus
    if (worker.schedules.length > 0) {
      score += 5;
      highlights.push('Provided Schedule');
    }

    return {
      score: Math.min(score, 99),
      highlights
    };
  };

  const filteredWorkers = useMemo(() => {
    let result = workers;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(w => w.full_name.toLowerCase().includes(q) || w.bio.toLowerCase().includes(q) || w.skills.some(s => s.toLowerCase().includes(q)));
    }
    
    // Calculate and sort by fit score if a gig is selected
    if (selectedGig) {
      result = result.map(w => ({
        ...w,
        fit: calculateFitScore(w, selectedGig)
      })).sort((a: any, b: any) => b.fit.score - a.fit.score);
    }
    
    return result;
  }, [workers, searchTerm, selectedGig]);

  const generateGoogleCalendarUrl = (worker: Worker, gig: Gig) => {
    const text = encodeURIComponent(`Shift for ${worker.full_name} - ${gig.title}`);
    const details = encodeURIComponent(`Worker: ${worker.full_name}\nGig: ${gig.title}\nContact: Message in GigIT\n\nNotes: ${offerNotes}`);
    const location = encodeURIComponent(gig.location || 'Sabah');
    // We just create a generic event for "tomorrow" since we don't have a specific gig date picker yet
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0].replace(/-/g, '');
    const dates = `${dateStr}T090000Z/${dateStr}T170000Z`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&location=${location}&dates=${dates}`;
  };

  const handleSendOffer = () => {
    if (!offeringJobTo || !selectedGig) return;
    setOfferSuccess(`Job offer for "${selectedGig.title}" sent to ${offeringJobTo.full_name}!`);
    setTimeout(() => {
      setOfferSuccess(null);
      setOfferingJobTo(null);
      setOfferNotes('');
    }, 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-primary">Hiring Portal</h2>
          <p className="text-sm text-on-surface-variant">Find the perfect student worker for your gigs based on their schedules and skills.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
            <input 
              type="text" 
              placeholder="Search by name, skill..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-outline-variant rounded-xl text-sm focus:outline-primary w-full md:w-64"
            />
          </div>
          <select 
            value={selectedGigId}
            onChange={e => setSelectedGigId(e.target.value)}
            className="px-3 py-2 bg-white border border-outline-variant rounded-xl text-sm focus:outline-primary font-medium w-full md:w-auto"
          >
            <option value="all">Compare against...</option>
            {myGigs.map(g => (
              <option key={g.id} value={g.id}>{g.title}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkers.length === 0 ? (
            <div className="col-span-full py-12 text-center text-on-surface-variant">No workers found.</div>
          ) : (
            filteredWorkers.map(worker => {
              const fitInfo = (worker as any).fit;
              return (
                <div key={worker.id} className="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow">
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <img src={worker.avatar_url} alt="" className="w-12 h-12 rounded-full border border-outline-variant object-cover" />
                        <div>
                          <h4 className="font-bold text-sm text-on-surface line-clamp-1">{worker.full_name}</h4>
                          <p className="text-[10px] text-on-surface-variant flex items-center gap-1"><MapPin size={10} /> {worker.university}</p>
                        </div>
                      </div>
                      {fitInfo && (
                        <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-full border-4 ${fitInfo.score >= 80 ? 'border-green-500 bg-green-50 text-green-700' : fitInfo.score >= 60 ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                          <span className="font-black text-xs leading-none">{fitInfo.score}</span>
                          <span className="text-[8px] font-bold">FIT</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-on-surface-variant line-clamp-2 mb-3 h-8">{worker.bio || 'No bio provided.'}</p>
                    
                    {fitInfo && fitInfo.highlights.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1">
                        {fitInfo.highlights.map((h: string, i: number) => (
                          <span key={i} className="text-[9px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-medium">{h}</span>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-auto pt-3 border-t border-outline-variant/50">
                      <h5 className="text-[10px] font-bold text-on-surface uppercase tracking-wider mb-2 flex items-center gap-1"><Clock size={12} className="text-primary" /> Availability</h5>
                      {worker.schedules && worker.schedules.length > 0 ? (
                        <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                          {worker.schedules.map((s: any) => (
                            <div key={s.id} className="text-[10px] bg-surface-container-lowest border border-outline-variant px-2 py-1 rounded flex justify-between">
                              <span className="font-semibold text-on-surface">{s.day_of_week}</span>
                              <span className="text-on-surface-variant">{s.start_time} - {s.end_time}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-on-surface-variant italic">No schedule provided.</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-surface-container-lowest p-3 border-t border-outline-variant flex gap-2">
                    <button 
                      onClick={() => setOfferingJobTo(worker)}
                      disabled={!selectedGig}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${selectedGig ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                    >
                      Offer Job
                    </button>
                    <button className="px-3 py-1.5 bg-secondary/10 text-secondary rounded-lg hover:bg-secondary/20 transition-colors">
                      <User size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Offer Job Modal */}
      <AnimatePresence>
        {offeringJobTo && selectedGig && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative"
            >
              <button 
                onClick={() => setOfferingJobTo(null)}
                className="absolute top-6 right-6 p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full"
              >
                <X size={20} />
              </button>

              <h2 className="font-display font-bold text-2xl text-on-surface mb-6">Extend Job Offer</h2>
              
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6 flex items-center gap-4">
                <img src={offeringJobTo.avatar_url} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-bold text-on-surface">Offering to {offeringJobTo.full_name}</p>
                  <p className="text-xs text-on-surface-variant">Gig: <span className="font-bold">{selectedGig.title}</span></p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Add a personal message</label>
                  <textarea 
                    rows={3}
                    value={offerNotes}
                    onChange={e => setOfferNotes(e.target.value)}
                    placeholder="E.g., We saw your availability on Monday matches our gig perfectly!"
                    className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm focus:outline-primary bg-surface-container-lowest"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
                  <p className="text-[10px] text-blue-800 font-medium">
                    This will send a direct message to {offeringJobTo.full_name}. Once they accept, you can add this shift directly to your calendar!
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setOfferingJobTo(null)}
                  className="flex-1 py-2.5 font-bold text-on-surface-variant bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSendOffer}
                  className="flex-1 py-2.5 font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-md"
                >
                  Send Offer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Toast / Calendar Integration */}
      <AnimatePresence>
        {offerSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 md:left-1/2 md:-translate-x-1/2 bg-green-600 text-white p-4 rounded-xl shadow-xl z-[110] flex flex-col gap-3 max-w-sm w-full"
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={20} className="shrink-0" />
              <p className="text-sm font-bold">{offerSuccess}</p>
            </div>
            {offeringJobTo && selectedGig && (
              <a 
                href={generateGoogleCalendarUrl(offeringJobTo, selectedGig)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-white text-green-700 py-2 rounded-lg text-xs font-bold hover:bg-green-50 transition-colors"
              >
                <CalendarCheck size={14} /> Add Shift to Google Calendar
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
