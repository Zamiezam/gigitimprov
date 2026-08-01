import { useState } from 'react';
import { X, Star, Shield, CreditCard } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface EmployerRatingModalProps {
  employerName: string;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export default function EmployerRatingModal({ employerName, onClose, onSubmitSuccess }: EmployerRatingModalProps) {
  const { user } = useAuth();
  
  const [rating, setRating] = useState(0);
  const [paymentPromptness, setPaymentPromptness] = useState(0);
  const [safetyRating, setSafetyRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating || !paymentPromptness || !safetyRating) return;
    
    setSubmitting(true);
    await api.submitEmployerReview({
      employer_name: employerName,
      worker_id: isAnonymous ? undefined : user?.id,
      is_anonymous: isAnonymous,
      rating,
      payment_promptness: paymentPromptness,
      safety_rating: safetyRating,
      comment: comment.trim() || undefined
    });
    setSubmitting(false);
    onSubmitSuccess();
  };

  const renderStars = (value: number, setter: (val: number) => void) => (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => setter(star)}
          className={`cursor-pointer transition-transform hover:scale-110 p-1 ${star <= value ? 'text-amber-500' : 'text-outline-variant'}`}
        >
          <Star size={24} fill={star <= value ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        <div className="p-6 border-b border-outline-variant flex justify-between items-start bg-surface-container-lowest">
          <div>
            <h2 className="text-xl font-display font-bold text-on-surface">Rate Employer</h2>
            <p className="text-xs font-medium text-on-surface-variant mt-1">Review {employerName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer">
            <X size={20} className="text-on-surface-variant" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface">Overall Rating</label>
            {renderStars(rating, setRating)}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface flex items-center gap-2">
              <CreditCard size={16} className="text-teal-600" />
              Payment Promptness
            </label>
            <p className="text-xs text-on-surface-variant">Did they pay on time and accurately?</p>
            {renderStars(paymentPromptness, setPaymentPromptness)}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface flex items-center gap-2">
              <Shield size={16} className="text-indigo-600" />
              Workplace Safety
            </label>
            <p className="text-xs text-on-surface-variant">Was the work environment safe and respectful?</p>
            {renderStars(safetyRating, setSafetyRating)}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface">Written Feedback (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Help other students by sharing your experience..."
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 text-sm text-on-surface focus:outline-none focus:border-primary resize-none"
              rows={3}
            />
          </div>
          
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-10 h-6 bg-outline-variant/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">Submit Anonymously</p>
              <p className="text-[10px] text-on-surface-variant font-medium">The employer will not see your name.</p>
            </div>
          </label>
        </div>
        
        <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 border border-outline-variant rounded-xl font-bold text-sm text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!rating || !paymentPromptness || !safetyRating || submitting}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>

      </div>
    </div>
  );
}
