import React, { useState, useEffect, useRef } from 'react';
import { Download, FileText, ArrowLeft, Loader2, Save, Mail, MapPin, Phone, GraduationCap, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ResumeBuilderProps {
  onBack: () => void;
}

export default function ResumeBuilderView({ onBack }: ResumeBuilderProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const resumeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
      const { data: historyData } = await supabase.from('hired_workers').select('*').eq('worker_id', user?.id).order('created_at', { ascending: false });
      
      if (profileData) setProfile(profileData);
      if (historyData) setHistory(historyData.filter(h => h.status === 'completed' || h.status === 'verified'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!resumeRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(resumeRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${profile?.full_name?.replace(/\s+/g, '_') || 'Worker'}_Resume.pdf`);
    } catch (err) {
      console.error('Error generating PDF', err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-screen">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer">
            <ArrowLeft size={24} className="text-on-surface" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-on-surface">Resume Builder</h1>
            <p className="text-sm text-on-surface-variant font-medium">Auto-generated from your GigIT profile</p>
          </div>
        </div>
        <button 
          onClick={generatePDF}
          disabled={generating}
          className="px-6 py-3 bg-primary text-white font-bold rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {generating ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
          {generating ? 'Generating PDF...' : 'Download PDF'}
        </button>
      </div>

      <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant overflow-x-auto shadow-sm">
        {/* A4 Size Container for PDF generation (210mm x 297mm ratio approx) */}
        <div 
          ref={resumeRef}
          className="bg-white mx-auto text-on-surface"
          style={{ width: '210mm', minHeight: '297mm', padding: '40px', boxSizing: 'border-box' }}
        >
          {/* Header */}
          <div className="flex items-center gap-6 border-b-2 border-primary/20 pb-8 mb-8">
            {profile?.avatar_url && (
              <img src={profile.avatar_url} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-surface shadow-md" crossOrigin="anonymous" />
            )}
            <div className="flex-1">
              <h1 className="text-4xl font-black text-primary tracking-tight mb-2 uppercase">{profile?.full_name || 'Worker Name'}</h1>
              <h2 className="text-xl font-bold text-on-surface-variant mb-4">{profile?.university || 'University Student'}</h2>
              
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-on-surface-variant">
                <div className="flex items-center gap-1.5"><Mail size={16} className="text-primary" /> {user?.email}</div>
                {profile?.phone_number && <div className="flex items-center gap-1.5"><Phone size={16} className="text-primary" /> {profile.phone_number}</div>}
                {profile?.location && <div className="flex items-center gap-1.5"><MapPin size={16} className="text-primary" /> {profile.location}</div>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="col-span-1 space-y-8">
              {profile?.bio && (
                <div>
                  <h3 className="text-lg font-black text-primary uppercase tracking-wider mb-3 border-b border-outline-variant pb-1">Profile</h3>
                  <p className="text-sm leading-relaxed text-on-surface font-medium">{profile.bio}</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-black text-primary uppercase tracking-wider mb-3 border-b border-outline-variant pb-1">Education</h3>
                <div className="text-sm font-medium">
                  <p className="font-bold text-on-surface">{profile?.education_level || 'Higher Education'}</p>
                  <p className="text-on-surface-variant">{profile?.university || 'University'}</p>
                </div>
              </div>

              {profile?.skills && profile.skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-black text-primary uppercase tracking-wider mb-3 border-b border-outline-variant pb-1">Skills</h3>
                  <div className="flex flex-col gap-1.5">
                    {profile.skills.map((skill: string, i: number) => (
                      <span key={i} className="text-sm font-bold text-on-surface flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile?.available_days && profile.available_days.length > 0 && (
                <div>
                  <h3 className="text-lg font-black text-primary uppercase tracking-wider mb-3 border-b border-outline-variant pb-1">Availability</h3>
                  <div className="flex flex-wrap gap-1">
                    {profile.available_days.map((day: string, i: number) => (
                      <span key={i} className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded">{day}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="col-span-2 space-y-8">
              <div>
                <h3 className="text-lg font-black text-primary uppercase tracking-wider mb-4 border-b border-outline-variant pb-1 flex items-center gap-2">
                  <Briefcase size={20} /> Verified Experience
                </h3>
                
                {history.length > 0 ? (
                  <div className="space-y-6">
                    {history.map((gig, idx) => (
                      <div key={idx} className="relative pl-4 border-l-2 border-primary/20">
                        <div className="absolute w-3 h-3 bg-white border-2 border-primary rounded-full -left-[7.5px] top-1"></div>
                        <h4 className="font-bold text-base text-on-surface">{gig.gig_title}</h4>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-primary">{gig.employer_name}</span>
                          <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                            {new Date(gig.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        {gig.review && (
                          <p className="text-sm text-on-surface-variant italic leading-relaxed">"{gig.review}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-on-surface-variant font-medium">No verified GigIT experience yet. Complete gigs to build your resume!</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-outline-variant/30 text-center text-xs text-on-surface-variant font-medium opacity-60 flex justify-center items-center gap-1">
            Verified by <span className="font-bold text-primary flex items-center gap-0.5"><div className="w-3 h-3 bg-primary text-white rounded-[3px] text-[8px] flex items-center justify-center font-black">G</div> GigIT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
