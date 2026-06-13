// WorkerProfileModal.tsx
import { useState, useEffect } from 'react';
import { X, Star, Shield, Clock, Award, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../services/api';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || 'placeholder-api-key' });

interface WorkerProfileModalProps {
  worker: any;
  onClose: () => void;
  onHire?: (worker: any) => void;
  onReject?: (worker: any, reason: string) => void;
}

const REJECTION_REASONS = ['Not enough experience', 'Schedule conflict', 'Distance too far', 'Rate expectation mismatch', 'Incomplete profile', 'Low reliability score', 'Other'];

export default function WorkerProfileModal({ worker, onClose, onHire, onReject }: WorkerProfileModalProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [workerReviews, setWorkerReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchWorkerReviews();
  }, [worker.id]);

  const fetchWorkerReviews = async () => {
    try {
      const { data } = await supabase.from('reviews').select('*').eq('worker_id', worker.id).order('created_at', { ascending: false });
      if (data && data.length > 0) {
        setWorkerReviews(data);
        await analyzeReviewsWithAI(data);
      } else {
        setWorkerReviews([
          { id: 1, employer_name: 'KK Cafe', rating: 5, comment: 'Excellent worker, very punctual!', created_at: new Date().toISOString() },
          { id: 2, employer_name: 'Borneo Mart', rating: 4, comment: 'Good attitude, completed all tasks.', created_at: new Date().toISOString() },
        ]);
        await analyzeReviewsWithAI([
          { comment: 'Excellent worker, very punctual!', rating: 5 },
          { comment: 'Good attitude, completed all tasks.', rating: 4 }
        ]);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeReviewsWithAI = async (reviews: any[]) => {
    setAnalyzing(true);
    try {
      const prompt = `Analyze these worker reviews and provide a concise summary (2-3 sentences) of the worker's strengths and areas for improvement:
${reviews.map(r => `Rating ${r.rating}/5: "${r.comment}"`).join('\n')}

Return ONLY a JSON object: { "summary": "string", "strengths": ["string"], "weaknesses": ["string"] }`;

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const result = JSON.parse(response.text);
      setAiSummary(result.summary);
    } catch (err) {
      console.error('AI analysis failed:', err);
      setAiSummary('Worker has positive reviews with good ratings.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReject = () => {
    const finalReason = rejectReason === 'Other' ? customReason : rejectReason;
    if (!finalReason) { alert('Please select a reason'); return; }
    onReject?.(worker, finalReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        
        <div className="px-6 py-4 border-b bg-surface flex justify-between items-center sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <img src={worker.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-primary" />
            <div><h3 className="font-bold text-lg">{worker.name}</h3>
              <div className="flex items-center gap-2"><Star size={14} fill="currentColor" className="text-secondary" /><span className="font-semibold">{worker.rating}</span>
                <span className="text-xs text-on-surface-variant">• {worker.distance}</span>
                {worker.badge === 'Verified Student' && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Verified</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="mb-6"><h4 className="font-semibold text-sm mb-2">About</h4><p className="text-sm text-on-surface-variant">{worker.bio}</p></div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gray-50 p-3 rounded-xl text-center"><Shield size={16} className="mx-auto text-primary mb-1" /><p className="text-xs font-bold">{worker.badge || 'Student'}</p></div>
            <div className="bg-gray-50 p-3 rounded-xl text-center"><Clock size={16} className="mx-auto text-primary mb-1" /><p className="text-xs font-bold">No-Show: {worker.noShowRate}</p></div>
            <div className="bg-gray-50 p-3 rounded-xl text-center"><Award size={16} className="mx-auto text-primary mb-1" /><p className="text-xs font-bold">{worker.completedGigs || 12} Gigs</p></div>
          </div>
          
          {/* Custom details */}
          {(worker.transport || (worker.skills && worker.skills.length > 0) || worker.experience) && (
            <div className="mb-6 space-y-4 border-t border-b border-gray-100 py-4">
              {worker.transport && (
                <div>
                  <h4 className="font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Transportation</h4>
                  <p className="text-sm font-medium text-gray-800">{worker.transport}</p>
                </div>
              )}
              {worker.skills && worker.skills.length > 0 && (
                <div>
                  <h4 className="font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1.5">Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {worker.skills.map((skill: string) => (
                      <span key={skill} className="bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-1 rounded-full border border-primary/20">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {worker.experience && (
                <div>
                  <h4 className="font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Experience</h4>
                  <p className="text-xs text-gray-650 leading-relaxed font-sans">{worker.experience}</p>
                </div>
              )}
            </div>
          )}

          {/* AI Summary */}
          {(aiSummary || analyzing) && (
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
              <div className="flex items-center gap-2 mb-2"><Sparkles size={16} className="text-purple-600" /><h4 className="font-semibold text-sm text-purple-800">AI Analysis</h4></div>
              {analyzing ? <p className="text-xs text-purple-600">Analyzing reviews...</p> : <p className="text-xs text-purple-700">{aiSummary}</p>}
            </div>
          )}

          {/* Reviews */}
          <div className="mb-6"><h4 className="font-semibold text-sm mb-3">Past Reviews</h4>
            {loading ? (<div className="text-center py-4">Loading...</div>) : workerReviews.length === 0 ? (<p className="text-sm text-center py-4">No reviews yet</p>) : (
              <div className="space-y-3">{workerReviews.map((review) => (
                <div key={review.id} className="bg-gray-50 p-3 rounded-xl">
                  <div className="flex justify-between items-start mb-1"><span className="font-semibold text-xs">{review.employer_name}</span>
                    <div className="flex gap-0.5">{[...Array(5)].map((_, i) => (<Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? 'text-secondary' : 'text-gray-300'} />))}</div>
                  </div>
                  <p className="text-xs text-on-surface-variant italic">"{review.comment}"</p>
                  <p className="text-[10px] text-on-surface-variant mt-1">{new Date(review.created_at).toLocaleDateString()}</p>
                </div>
              ))}</div>)}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            {!showRejectForm ? (<>
              <button onClick={() => onHire?.(worker)} className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90">Hire Now</button>
              <button onClick={() => setShowRejectForm(true)} className="flex-1 py-3 border border-red-300 text-red-600 rounded-xl font-semibold hover:bg-red-50">Reject</button>
            </>) : (
              <div className="w-full space-y-3">
                <select value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full px-4 py-2 rounded-xl border text-sm">
                  <option value="">Select rejection reason...</option>
                  {REJECTION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {rejectReason === 'Other' && <input type="text" placeholder="Please specify..." value={customReason} onChange={(e) => setCustomReason(e.target.value)} className="w-full px-4 py-2 rounded-xl border text-sm" />}
                <div className="flex gap-2"><button onClick={() => setShowRejectForm(false)} className="flex-1 py-2 border rounded-xl text-sm">Back</button>
                  <button onClick={handleReject} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold">Confirm Rejection</button></div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}