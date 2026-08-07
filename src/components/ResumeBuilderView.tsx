import React, { useState, useEffect, useRef } from 'react';
import { Download, ArrowLeft, Loader2, Save, Mail, MapPin, Phone, GraduationCap, Briefcase, Plus, Trash2, ChevronRight, ChevronLeft, CheckCircle2, Linkedin, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/api';

interface ResumeBuilderProps {
  onBack: () => void;
}

export default function ResumeBuilderView({ onBack }: ResumeBuilderProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const resumeRef = useRef<HTMLDivElement>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  const [formData, setFormData] = useState({
    personal: {
      fullName: '',
      email: '',
      phone: '',
      address: '',
      linkedin: '',
    },
    summary: '',
    experience: [] as any[],
    education: [] as any[],
    skills: [] as string[],
    resumeTitle: 'Professional Resume',
  });

  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (user && profile) {
      const savedData = profile.resume_data || {};
      setFormData({
        personal: {
          fullName: savedData.personal?.fullName || profile.full_name || '',
          email: savedData.personal?.email || user.email || '',
          phone: savedData.personal?.phone || '',
          address: savedData.personal?.address || '',
          linkedin: savedData.personal?.linkedin || '',
        },
        summary: savedData.summary || profile.bio || '',
        experience: savedData.experience || [],
        education: savedData.education || [],
        skills: savedData.skills || (Array.isArray(profile.skills) ? profile.skills : []),
        resumeTitle: savedData.resumeTitle || `${profile.full_name || 'Worker'} Resume`,
      });
      setLoading(false);
    }
  }, [user, profile]);

  const updatePersonal = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, personal: { ...prev.personal, [field]: value } }));
  };

  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, { title: '', company: '', startDate: '', endDate: '', description: '' }]
    }));
  };

  const updateExperience = (index: number, field: string, value: string) => {
    const newExp = [...formData.experience];
    newExp[index][field] = value;
    setFormData(prev => ({ ...prev, experience: newExp }));
  };

  const removeExperience = (index: number) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', institution: '', year: '' }]
    }));
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const newEdu = [...formData.education];
    newEdu[index][field] = value;
    setFormData(prev => ({ ...prev, education: newEdu }));
  };

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skillToRemove) }));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // First, detect which columns actually exist in the profiles table
      const { data: testData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!testData) {
        showToast('❌ Could not load profile data');
        setSaving(false);
        return;
      }

      // Build payload with only columns that exist
      const payload: any = {};
      const fieldsToSave: Record<string, any> = {
        resume_data: formData,
        resume_url: profile?.resume_url || null,
      };

      for (const [key, value] of Object.entries(fieldsToSave)) {
        if (key in testData) {
          payload[key] = value;
        }
      }

      if (Object.keys(payload).length === 0) {
        showToast('❌ Database columns missing. Please run the SQL schema script.');
        setSaving(false);
        return;
      }

      console.log('Resume save payload keys:', Object.keys(payload));

      // Save Data to Supabase
      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile();
      
      showToast('✅ Resume saved successfully!');
    } catch (err) {
      console.error(err);
      showToast('❌ Failed to save resume.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-screen">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  const steps = [
    'Personal', 'Summary', 'Experience', 'Education', 'Skills', 'Preview'
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer">
            <ArrowLeft size={24} className="text-on-surface" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-on-surface">Interactive Resume Builder</h1>
            <p className="text-on-surface-variant font-medium">Create a professional resume in 6 easy steps</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 relative">
        <div className="absolute top-[45px] left-12 right-12 h-1 bg-surface-container-highest z-0">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary-container transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>
        <div className="flex justify-between relative z-10">
          {steps.map((step, index) => (
            <div 
              key={step} 
              className={`flex flex-col items-center gap-2 cursor-pointer ${currentStep === index + 1 ? 'opacity-100' : 'opacity-50'}`}
              onClick={() => setCurrentStep(index + 1)}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-4 
                ${currentStep > index + 1 ? 'bg-primary border-primary text-white' : 
                  currentStep === index + 1 ? 'bg-white border-primary text-primary scale-110' : 
                  'bg-white border-surface-container-highest text-on-surface-variant'}`}
              >
                {currentStep > index + 1 ? <CheckCircle2 size={20} /> : index + 1}
              </div>
              <span className={`text-sm font-bold ${currentStep === index + 1 ? 'text-primary' : 'text-on-surface-variant'}`}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white p-8 rounded-2xl shadow-sm mb-8 min-h-[500px]">
        {currentStep === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-2xl font-bold text-primary mb-6">📋 Personal Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Full Name *</label>
                <input type="text" value={formData.personal.fullName} onChange={e => updatePersonal('fullName', e.target.value)} className="w-full p-4 bg-surface-container-lowest border-2 border-outline-variant rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Email Address *</label>
                  <input type="email" value={formData.personal.email} onChange={e => updatePersonal('email', e.target.value)} className="w-full p-4 bg-surface-container-lowest border-2 border-outline-variant rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Phone Number</label>
                  <input type="tel" value={formData.personal.phone} onChange={e => updatePersonal('phone', e.target.value)} className="w-full p-4 bg-surface-container-lowest border-2 border-outline-variant rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Address / Location</label>
                <input type="text" value={formData.personal.address} onChange={e => updatePersonal('address', e.target.value)} placeholder="City, State" className="w-full p-4 bg-surface-container-lowest border-2 border-outline-variant rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">LinkedIn Profile URL</label>
                <input type="text" value={formData.personal.linkedin} onChange={e => updatePersonal('linkedin', e.target.value)} placeholder="https://linkedin.com/in/..." className="w-full p-4 bg-surface-container-lowest border-2 border-outline-variant rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-2xl font-bold text-primary mb-6">✍️ Professional Summary</h2>
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">Summary</label>
              <textarea 
                rows={6}
                value={formData.summary} 
                onChange={e => setFormData(prev => ({...prev, summary: e.target.value}))} 
                placeholder="Write a brief summary about yourself, your background, and goals..."
                className="w-full p-4 bg-surface-container-lowest border-2 border-outline-variant rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-y" 
              />
              <p className="text-sm text-on-surface-variant mt-2">Describe your professional background and skills in 2-3 sentences.</p>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-2xl font-bold text-primary mb-6">💼 Work Experience</h2>
            <div className="space-y-6">
              {formData.experience.map((exp, index) => (
                <div key={index} className="p-6 border-2 border-outline-variant rounded-2xl bg-surface-container-lowest relative group">
                  <button onClick={() => removeExperience(index)} className="absolute top-4 right-4 p-2 text-error hover:bg-error/10 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={20} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">Job Title</label>
                      <input type="text" value={exp.title} onChange={e => updateExperience(index, 'title', e.target.value)} className="w-full p-3 border-2 border-outline-variant rounded-lg focus:border-primary focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">Company</label>
                      <input type="text" value={exp.company} onChange={e => updateExperience(index, 'company', e.target.value)} className="w-full p-3 border-2 border-outline-variant rounded-lg focus:border-primary focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">Start Date</label>
                      <input type="month" value={exp.startDate} onChange={e => updateExperience(index, 'startDate', e.target.value)} className="w-full p-3 border-2 border-outline-variant rounded-lg focus:border-primary focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">End Date (Leave blank if current)</label>
                      <input type="month" value={exp.endDate} onChange={e => updateExperience(index, 'endDate', e.target.value)} className="w-full p-3 border-2 border-outline-variant rounded-lg focus:border-primary focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Description</label>
                    <textarea rows={3} value={exp.description} onChange={e => updateExperience(index, 'description', e.target.value)} className="w-full p-3 border-2 border-outline-variant rounded-lg focus:border-primary focus:outline-none resize-y" placeholder="Describe your responsibilities and achievements..." />
                  </div>
                </div>
              ))}
              <button onClick={addExperience} className="w-full py-4 border-2 border-dashed border-primary text-primary font-bold rounded-2xl hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
                <Plus size={20} /> Add Experience
              </button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-2xl font-bold text-primary mb-6">🎓 Education</h2>
            <div className="space-y-6">
              {formData.education.map((edu, index) => (
                <div key={index} className="p-6 border-2 border-outline-variant rounded-2xl bg-surface-container-lowest relative group">
                  <button onClick={() => removeEducation(index)} className="absolute top-4 right-4 p-2 text-error hover:bg-error/10 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={20} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">Degree / Certificate</label>
                      <input type="text" value={edu.degree} onChange={e => updateEducation(index, 'degree', e.target.value)} className="w-full p-3 border-2 border-outline-variant rounded-lg focus:border-primary focus:outline-none" placeholder="e.g. B.S. Computer Science" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">Institution</label>
                      <input type="text" value={edu.institution} onChange={e => updateEducation(index, 'institution', e.target.value)} className="w-full p-3 border-2 border-outline-variant rounded-lg focus:border-primary focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">Graduation Year</label>
                      <input type="text" value={edu.year} onChange={e => updateEducation(index, 'year', e.target.value)} className="w-full p-3 border-2 border-outline-variant rounded-lg focus:border-primary focus:outline-none" />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addEducation} className="w-full py-4 border-2 border-dashed border-primary text-primary font-bold rounded-2xl hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
                <Plus size={20} /> Add Education
              </button>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-2xl font-bold text-primary mb-6">🎯 Skills</h2>
            <div className="mb-6">
              <label className="block text-sm font-bold text-on-surface mb-2">Add a Skill</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSkill()}
                  placeholder="e.g. JavaScript, Customer Service" 
                  className="flex-1 p-4 bg-surface-container-lowest border-2 border-outline-variant rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" 
                />
                <button onClick={addSkill} className="px-6 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors">
                  Add
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, index) => (
                <div key={index} className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary font-bold rounded-full border border-primary/20">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="p-1 hover:bg-primary/20 rounded-full transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary">👁️ Preview & Save</h2>
              <div className="flex items-center gap-4">
                <input 
                  type="text" 
                  value={formData.resumeTitle}
                  onChange={e => setFormData(prev => ({...prev, resumeTitle: e.target.value}))}
                  className="p-2 border-2 border-outline-variant rounded-lg focus:border-primary focus:outline-none text-sm font-bold w-64"
                />
                <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-primary text-white font-bold rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  {saving ? 'Saving...' : 'Save & Download PDF'}
                </button>
              </div>
            </div>
            
            {/* CV PREVIEW CONTAINER */}
            <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant overflow-x-auto shadow-sm">
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
                    <h1 className="text-4xl font-black text-primary tracking-tight mb-2 uppercase">{formData.personal.fullName || 'Worker Name'}</h1>
                    <h2 className="text-xl font-bold text-on-surface-variant mb-4">{formData.resumeTitle || 'Professional Resume'}</h2>
                    
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-on-surface">
                      {formData.personal.email && (
                        <div className="flex items-center gap-2"><Mail size={16} className="text-primary"/> {formData.personal.email}</div>
                      )}
                      {formData.personal.phone && (
                        <div className="flex items-center gap-2"><Phone size={16} className="text-primary"/> {formData.personal.phone}</div>
                      )}
                      {formData.personal.address && (
                        <div className="flex items-center gap-2"><MapPin size={16} className="text-primary"/> {formData.personal.address}</div>
                      )}
                      {formData.personal.linkedin && (
                        <div className="flex items-center gap-2"><Linkedin size={16} className="text-primary"/> {formData.personal.linkedin}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-[2fr_1fr] gap-12">
                  <div className="space-y-8">
                    {/* Summary */}
                    {formData.summary && (
                      <section>
                        <h3 className="text-2xl font-black text-on-surface border-b-2 border-outline-variant pb-2 mb-4 uppercase tracking-wider flex items-center gap-2">
                          <FileText size={24} className="text-primary"/> Profile Summary
                        </h3>
                        <p className="text-on-surface-variant leading-relaxed">{formData.summary}</p>
                      </section>
                    )}

                    {/* Experience */}
                    {formData.experience.length > 0 && (
                      <section>
                        <h3 className="text-2xl font-black text-on-surface border-b-2 border-outline-variant pb-2 mb-6 uppercase tracking-wider flex items-center gap-2">
                          <Briefcase size={24} className="text-primary"/> Work Experience
                        </h3>
                        <div className="space-y-6">
                          {formData.experience.map((exp, i) => (
                            <div key={i} className="relative pl-6 border-l-2 border-primary/30 pb-2">
                              <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1.5 ring-4 ring-white" />
                              <h4 className="text-lg font-bold text-on-surface">{exp.title}</h4>
                              <div className="flex items-center justify-between text-primary font-bold mb-2">
                                <span>{exp.company}</span>
                                <span className="text-sm bg-primary/10 px-3 py-1 rounded-full">
                                  {exp.startDate} {exp.endDate ? `- ${exp.endDate}` : '- Present'}
                                </span>
                              </div>
                              <p className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>

                  <div className="space-y-8">
                    {/* Education */}
                    {formData.education.length > 0 && (
                      <section>
                        <h3 className="text-2xl font-black text-on-surface border-b-2 border-outline-variant pb-2 mb-6 uppercase tracking-wider flex items-center gap-2">
                          <GraduationCap size={24} className="text-primary"/> Education
                        </h3>
                        <div className="space-y-6">
                          {formData.education.map((edu, i) => (
                            <div key={i}>
                              <h4 className="text-md font-bold text-on-surface">{edu.degree}</h4>
                              <p className="text-primary font-bold text-sm">{edu.institution}</p>
                              <p className="text-on-surface-variant text-sm font-medium">{edu.year}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Skills */}
                    {formData.skills.length > 0 && (
                      <section>
                        <h3 className="text-2xl font-black text-on-surface border-b-2 border-outline-variant pb-2 mb-6 uppercase tracking-wider">
                          Skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {formData.skills.map((skill, i) => (
                            <span key={i} className="px-3 py-1.5 bg-surface-container-highest text-on-surface font-bold text-xs rounded-lg border border-outline-variant">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
        <button 
          onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
          className="px-6 py-3 font-bold rounded-xl flex items-center gap-2 hover:bg-surface-container transition-colors disabled:opacity-30"
        >
          <ChevronLeft size={20} /> Previous
        </button>
        
        {currentStep < totalSteps ? (
          <button 
            onClick={() => setCurrentStep(prev => Math.min(totalSteps, prev + 1))}
            className="px-8 py-3 bg-primary text-white font-bold rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
          >
            Next Step <ChevronRight size={20} />
          </button>
        ) : (
          <div className="text-sm font-bold text-on-surface-variant">
            You're ready to save!
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-surface-container-highest text-on-surface font-bold rounded-2xl shadow-2xl border border-outline-variant animate-in slide-in-from-bottom-4 duration-300">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
