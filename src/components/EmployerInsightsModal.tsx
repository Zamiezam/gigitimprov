import { useState, useEffect } from 'react';
import { X, Star, Shield, CreditCard, User, Building } from 'lucide-react';
import { api } from '../services/api';
import { EmployerReview } from '../types';

interface EmployerInsightsModalProps {
  employerName: string;
  onClose: () => void;
}

export default function EmployerInsightsModal({ employerName, onClose }: EmployerInsightsModalProps) {
  const [reviews, setReviews] = useState<EmployerReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      const data = await api.getEmployerReviews(employerName);
      setReviews(data);
      setLoading(false);
    }
    fetchReviews();
  }, [employerName]);

  const avgRating = reviews.length ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : 'N/A';
  const avgPayment = reviews.length ? (reviews.reduce((acc, r) => acc + r.payment_promptness, 0) / reviews.length).toFixed(1) : 'N/A';
  const avgSafety = reviews.length ? (reviews.reduce((acc, r) => acc + r.safety_rating, 0) / reviews.length).toFixed(1) : 'N/A';

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-outline-variant flex justify-between items-start bg-surface-container-lowest">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
              <Building size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-display font-bold text-on-surface">{employerName}</h2>
                <span className="bg-primary-container text-on-primary-container text-[10px] px-2 py-0.5 rounded-full font-bold">Verified</span>
              </div>
              <p className="text-xs font-medium text-on-surface-variant mt-1">Employer Transparency Report</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors">
            <X size={20} className="text-on-surface-variant" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-surface-container-lowest">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Scorecard */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="bg-surface border border-outline-variant rounded-2xl p-4 text-center shadow-sm">
                  <Star size={20} fill="#f59e0b" className="text-amber-500 mx-auto mb-2" />
                  <p className="text-xs text-on-surface-variant font-medium">Overall</p>
                  <p className="text-xl font-bold font-display text-on-surface mt-1">{avgRating}</p>
                </div>
                <div className="bg-surface border border-outline-variant rounded-2xl p-4 text-center shadow-sm">
                  <CreditCard size={20} className="text-teal-600 mx-auto mb-2" />
                  <p className="text-xs text-on-surface-variant font-medium">Payment</p>
                  <p className="text-xl font-bold font-display text-on-surface mt-1">{avgPayment}</p>
                </div>
                <div className="bg-surface border border-outline-variant rounded-2xl p-4 text-center shadow-sm">
                  <Shield size={20} className="text-indigo-600 mx-auto mb-2" />
                  <p className="text-xs text-on-surface-variant font-medium">Safety</p>
                  <p className="text-xl font-bold font-display text-on-surface mt-1">{avgSafety}</p>
                </div>
              </div>

              {/* Reviews List */}
              <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
                Worker Reviews <span className="bg-surface-container-high text-on-surface px-2 py-0.5 rounded-full text-xs">{reviews.length}</span>
              </h3>
              
              {reviews.length === 0 ? (
                <div className="text-center py-8 bg-surface-container-low rounded-2xl border border-outline-variant border-dashed">
                  <p className="text-sm font-medium text-on-surface-variant">No reviews yet for this employer.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review, idx) => (
                    <div key={idx} className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center">
                            <User size={14} className="text-on-surface-variant" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-on-surface">
                              {review.is_anonymous ? 'Anonymous Student' : 'Verified Worker'}
                            </p>
                            {review.created_at && (
                              <p className="text-[10px] text-on-surface-variant">
                                {new Date(review.created_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-xs font-bold">
                          <Star size={12} fill="currentColor" /> {review.rating}
                        </div>
                      </div>
                      
                      {review.comment && (
                        <p className="text-sm text-on-surface-variant font-medium leading-relaxed italic border-l-2 border-outline-variant pl-3 mt-3">
                          "{review.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
