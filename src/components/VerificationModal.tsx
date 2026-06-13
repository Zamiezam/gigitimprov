// components/VerificationModal.tsx
import { useState } from 'react';
import { X, Upload, Shield, Building, Store, FileText } from 'lucide-react';
import { supabase } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'worker' | 'employer';
}

export default function VerificationModal({ isOpen, onClose, userRole }: VerificationModalProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{
    ssm?: File;
    shopeeBio?: File;
    studentCard?: File;
    ic?: File;
  }>({});
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handleFileSelect = (type: string, file: File | null) => {
    if (file) {
      setSelectedFiles(prev => ({ ...prev, [type]: file }));
    }
  };

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('verification_docs')
      .upload(path, file);
    
    if (error) throw error;
    return data.path;
  };

  const handleSubmit = async () => {
    setUploading(true);
    setUploadStatus('Uploading documents...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      
      const uploadedUrls: string[] = [];
      
      if (userRole === 'employer') {
        if (selectedFiles.ssm) {
          const path = `${user.id}/ssm_${Date.now()}`;
          await uploadFile(selectedFiles.ssm, path);
          uploadedUrls.push(`ssm:${path}`);
        }
        if (selectedFiles.shopeeBio) {
          const path = `${user.id}/shopee_bio_${Date.now()}`;
          await uploadFile(selectedFiles.shopeeBio, path);
          uploadedUrls.push(`shopee_bio:${path}`);
        }
      } else {
        if (selectedFiles.studentCard) {
          const path = `${user.id}/student_card_${Date.now()}`;
          await uploadFile(selectedFiles.studentCard, path);
          uploadedUrls.push(`student_card:${path}`);
        }
        if (selectedFiles.ic) {
          const path = `${user.id}/ic_${Date.now()}`;
          await uploadFile(selectedFiles.ic, path);
          uploadedUrls.push(`ic:${path}`);
        }
      }
      
      // Update profile verification status
      await supabase
        .from('profiles')
        .update({ 
          verification_status: 'pending',
          verification_document_url: uploadedUrls.join(',')
        })
        .eq('id', user.id);
      
      setUploadStatus('✅ Documents submitted! Verification in progress.');
      setTimeout(() => {
        onClose();
        setUploadStatus(null);
      }, 2000);
      
    } catch (err) {
      console.error('Upload error:', err);
      setUploadStatus('❌ Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <Shield className="text-primary" size={20} />
            <h3 className="font-bold text-lg text-on-surface">Account Verification</h3>
          </div>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-sm text-on-surface-variant">
            {userRole === 'employer' 
              ? 'Verify your business to post gigs and hire workers.'
              : 'Verify your student status to start applying for gigs.'}
          </p>
          
          {userRole === 'employer' ? (
            <>
              <div className="border border-outline-variant rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Building size={20} className="text-primary" />
                  <label className="font-semibold text-sm">SSM Certificate / Business Registration</label>
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileSelect('ssm', e.target.files?.[0] || null)}
                  className="w-full text-sm"
                />
                <p className="text-xs text-on-surface-variant mt-2">Upload your SSM certificate or business registration document.</p>
              </div>
              
              <div className="border border-outline-variant rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Store size={20} className="text-primary" />
                  <label className="font-semibold text-sm">Shopee / Platform Bio (Optional)</label>
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileSelect('shopeeBio', e.target.files?.[0] || null)}
                  className="w-full text-sm"
                />
                <p className="text-xs text-on-surface-variant mt-2">Upload your Shopee store bio or other platform verification.</p>
              </div>
            </>
          ) : (
            <>
              <div className="border border-outline-variant rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FileText size={20} className="text-primary" />
                  <label className="font-semibold text-sm">Student ID / Matric Card</label>
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileSelect('studentCard', e.target.files?.[0] || null)}
                  className="w-full text-sm"
                />
                <p className="text-xs text-on-surface-variant mt-2">Upload your valid student ID or matriculation card.</p>
              </div>
              
              <div className="border border-outline-variant rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FileText size={20} className="text-primary" />
                  <label className="font-semibold text-sm">IC / Identification Card</label>
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileSelect('ic', e.target.files?.[0] || null)}
                  className="w-full text-sm"
                />
                <p className="text-xs text-on-surface-variant mt-2">Upload your identification card for verification.</p>
              </div>
            </>
          )}
          
          {uploadStatus && (
            <div className={`p-3 rounded-xl text-sm ${uploadStatus.includes('✅') ? 'bg-green-50 text-green-700' : uploadStatus.includes('❌') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
              {uploadStatus}
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 py-3 border border-outline-variant rounded-xl font-medium">Later</button>
            <button 
              onClick={handleSubmit} 
              disabled={uploading || (userRole === 'employer' ? !selectedFiles.ssm : !selectedFiles.studentCard)}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? <span className="animate-spin">⏳</span> : <Upload size={16} />}
              {uploading ? 'Uploading...' : 'Submit Verification'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}