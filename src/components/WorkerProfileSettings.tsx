import React, { useState, useEffect } from 'react';
import { supabase, verifyStudentIdWithAI, api } from '../services/api';
import JSSBadge from './JSSBadge';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Mail, Phone, MapPin, Save, Camera, Shield, 
  Bell, Upload, FileText, CheckCircle, XCircle, 
  Clock, Award, Car, Plus, X, Sparkles, BookOpen
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/men/67.jpg',
  'https://randomuser.me/api/portraits/women/68.jpg',
  'https://randomuser.me/api/portraits/men/91.jpg',
  'https://randomuser.me/api/portraits/women/33.jpg',
  'https://randomuser.me/api/portraits/men/82.jpg',
  'https://randomuser.me/api/portraits/women/9.jpg'
];

const DEFAULT_SKILLS = ['Barista', 'Event Crew', 'Packing', 'Cashier', 'Tutoring', 'Cleaning', 'Customer Service', 'Data Entry'];

export default function WorkerProfileSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifyingCard, setVerifyingCard] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Profile data
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [university, setUniversity] = useState('');
  const [matricId, setMatricId] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [transport, setTransport] = useState('Public Transport');
  const [skills, setSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  
  // New Upwork-style worker fields
  const [educationLevel, setEducationLevel] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [expectedHourlyRate, setExpectedHourlyRate] = useState<number | ''>('');
  const [commitmentsDescription, setCommitmentsDescription] = useState('');
  const [googleCalendarId, setGoogleCalendarId] = useState('');
  const [emergencyReady, setEmergencyReady] = useState(false);
  const [emergencyRadiusKm, setEmergencyRadiusKm] = useState<number | ''>(5);
  const [householdIncome, setHouseholdIncome] = useState<number | ''>('');
  const [incomeClassification, setIncomeClassification] = useState('');

  // Schedule state
  interface ScheduleRow {
    id?: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
  }
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);

  // Local helper states
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [aiVerificationResult, setAiVerificationResult] = useState<any>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(() => localStorage.getItem('gigit_available') === 'true');
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (!error && data) {
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
        setUniversity(data.university || '');
        setMatricId(data.matric_id || '');
        setAvatarUrl(data.avatar_url || PRESET_AVATARS[0]);
        setIsVerified(data.is_verified || false);
        
        // Parse metadata-like fields from DB or try structured bio fallback
        let transportVal = 'Public Transport';
        let skillsVal: string[] = [];
        let expVal = '';
        let bioText = data.bio || '';

        // Safely check if custom columns exist, otherwise fallback to bio parsing
        if ('transport' in data) {
          transportVal = data.transport || 'Public Transport';
        }
        if ('skills' in data && Array.isArray(data.skills)) {
          skillsVal = data.skills;
        }
        if ('experience' in data) {
          expVal = data.experience || '';
        }

        // Self-healing fallback: check if bio contains a JSON payload
        if (bioText.trim().startsWith('{') && bioText.trim().endsWith('}')) {
          try {
            const parsed = JSON.parse(bioText);
            bioText = parsed.bio || '';
            if (!data.transport) transportVal = parsed.transport || transportVal;
            if (!data.skills) skillsVal = parsed.skills || skillsVal;
            if (!data.experience) expVal = parsed.experience || expVal;
          } catch (e) {
            console.log('Failed to parse bio as JSON, keeping raw text');
          }
        }

        setBio(bioText);
        setTransport(transportVal);
        setSkills(skillsVal);
        setExperience(expVal);

        // Map new fields
        setEducationLevel(data.education_level || '');
        setLanguages(data.languages || []);
        setPreferredCategories(data.preferred_categories || []);
        setBankName(data.bank_name || '');
        setBankAccountNumber(data.bank_account_number || '');
        setExpectedHourlyRate(data.expected_hourly_rate || '');
        setCommitmentsDescription(data.commitments_description || '');
        setGoogleCalendarId(data.google_calendar_id || '');
        setEmergencyReady(data.emergency_ready || false);
        setEmergencyRadiusKm(data.emergency_radius_km || 5);
        setHouseholdIncome(data.household_income || '');
        setIncomeClassification(data.income_classification || '');
      }
      
      // Fetch schedules
      const { data: scheduleData } = await supabase
        .from('worker_schedules')
        .select('*')
        .eq('worker_id', user?.id);
      if (scheduleData) {
        setSchedules(scheduleData);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build update payload
      const payload: any = {
        full_name: fullName,
        phone: phone,
        avatar_url: avatarUrl,
        university: university,
        matric_id: matricId,
        is_verified: isVerified,
        education_level: educationLevel,
        languages: languages,
        preferred_categories: preferredCategories,
        bank_name: bankName,
        bank_account_number: bankAccountNumber,
        expected_hourly_rate: expectedHourlyRate === '' ? null : expectedHourlyRate,
        commitments_description: commitmentsDescription,
        google_calendar_id: googleCalendarId,
        emergency_ready: emergencyReady,
        emergency_radius_km: emergencyRadiusKm === '' ? null : emergencyRadiusKm,
        household_income: householdIncome === '' ? null : householdIncome,
        income_classification: householdIncome === '' ? null : (Number(householdIncome) <= 4850 ? 'B40' : Number(householdIncome) <= 10970 ? 'M40' : 'T20'),
        updated_at: new Date().toISOString()
      };

      // Check if custom columns exist or default to JSON-in-bio fallback
      const { data: testData } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
        .single();

      const hasCustomColumns = testData && ('transport' in testData) && ('skills' in testData) && ('experience' in testData);

      if (hasCustomColumns) {
        payload.transport = transport;
        payload.skills = skills;
        payload.experience = experience;
        payload.bio = bio;
      } else {
        // Fallback: Serialize custom fields inside the bio column
        payload.bio = JSON.stringify({
          bio: bio,
          transport: transport,
          skills: skills,
          experience: experience
        });
      }

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user?.id);
      
      if (error) throw error;
      
      // Save schedules
      if (schedules.length >= 0) {
        await supabase.from('worker_schedules').delete().eq('worker_id', user?.id);
        if (schedules.length > 0) {
          const schedPayload = schedules.map(s => ({
            worker_id: user?.id,
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time
          }));
          await supabase.from('worker_schedules').insert(schedPayload);
        }
      }
      
      showToast('✅ Profile & Schedule updated successfully!');
    } catch (err) {
      console.error('Error saving profile:', err);
      showToast('❌ Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddSkill = (skill: string) => {
    const clean = skill.trim();
    if (clean && !skills.includes(clean)) {
      setSkills(prev => [...prev, clean]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(prev => prev.filter(s => s !== skillToRemove));
  };

  // Convert uploaded card image to base64 and verify with Gemini AI
  const handleStudentCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVerifyingCard(true);
    setAiVerificationResult(null);
    showToast('🤖 AI scanning student matriculation card...');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const result = await verifyStudentIdWithAI(base64String);
          setAiVerificationResult(result);
          if (result.isValid) {
            setIsVerified(true);
            setUniversity(result.university || university);
            setMatricId(result.matricId || matricId);
            setFullName(result.name || fullName);
            showToast('🎉 Student ID card verified by Gemini AI!');
          } else {
            showToast(`⚠️ AI Verification Rejected: ${result.reason || 'Invalid Student ID'}`);
          }
        } catch (apiErr) {
          console.error('AI verify API error:', apiErr);
          showToast('❌ AI verification failed. Please try again or contact support.');
          setAiVerificationResult({
            isValid: false,
            reason: 'Verification service unavailable or failed.'
          });
        } finally {
          setVerifyingCard(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File read error:', err);
      setVerifyingCard(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploadingAvatar(true);
    showToast('Uploading avatar...');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      if (data.publicUrl) {
        setAvatarUrl(data.publicUrl);
        setCustomAvatarUrl(data.publicUrl);
        showToast('Avatar uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      showToast('❌ Error uploading avatar. Make sure the avatars bucket exists and is public.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-on-surface-variant font-medium">Loading profile details...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-outline-variant pb-4">
            <div>
              <h1 className="font-display font-bold text-xl md:text-2xl text-primary flex items-center gap-2">Verified Skills Passport™️</h1>
              <p className="text-xs text-on-surface-variant mt-0.5">Your living portfolio of verified skills, attendance, and SWEAT™️ Trust Score.</p>
            </div>
            {isVerified ? (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs font-bold shadow-xs">
                <CheckCircle size={14} /> Verified Student
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs font-bold shadow-xs">
                <Clock size={14} /> Unverified Account
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Avatar & Verification */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Photo selector */}
              <div className="bg-white rounded-2xl border border-outline-variant p-5 text-center shadow-xs">
                <h3 className="font-semibold text-sm mb-4 text-on-surface text-left">Profile Picture</h3>
                <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-primary shadow-xs">
                  <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                </div>
                
                <p className="text-xs font-bold text-on-surface-variant mb-2">Choose preset avatar:</p>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {PRESET_AVATARS.map((preset, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setAvatarUrl(preset)}
                      className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all hover:scale-105 ${avatarUrl === preset ? 'border-primary scale-110 shadow-xs' : 'border-transparent'}`}
                    >
                      <img src={preset} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-outline-variant/60 space-y-3">
                  <div>
                    <label className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-wider text-left mb-1">Upload Your Own Image (Max 2MB):</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 bg-surface-container-lowest border border-outline-variant rounded-lg p-1"
                    />
                    {uploadingAvatar && <p className="text-[10px] text-primary mt-1 animate-pulse">Uploading...</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-wider text-left mb-1">Or paste custom image URL:</label>
                    <input 
                      type="text" 
                      value={customAvatarUrl} 
                      onChange={e => {
                        setCustomAvatarUrl(e.target.value);
                        if (e.target.value.trim().startsWith('http')) setAvatarUrl(e.target.value.trim());
                      }}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full px-3 py-1.5 rounded-lg border border-outline-variant text-xs focus:outline-primary bg-surface-container-lowest"
                    />
                  </div>
                </div>

                {/* Section 4: Recurring Weekly Schedule */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 text-on-surface pb-1 border-b border-outline-variant/40 flex items-center gap-1.5"><Clock size={16} className="text-primary" /> Availability & Schedule</h3>
                  <p className="text-[10px] text-on-surface-variant mb-4 leading-relaxed">Add your recurring free time so employers know when you are available to work. This makes you more likely to get direct job offers.</p>
                  
                  <div className="space-y-3 mb-3">
                    {schedules.map((sched, index) => (
                      <div key={index} className="flex flex-wrap items-center gap-2 bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/50">
                        <select 
                          value={sched.day_of_week}
                          onChange={(e) => {
                            const newScheds = [...schedules];
                            newScheds[index].day_of_week = e.target.value;
                            setSchedules(newScheds);
                          }}
                          className="px-2 py-1.5 rounded-lg border border-outline-variant text-xs focus:outline-primary bg-white flex-1 min-w-[100px]"
                        >
                          <option value="Monday">Monday</option>
                          <option value="Tuesday">Tuesday</option>
                          <option value="Wednesday">Wednesday</option>
                          <option value="Thursday">Thursday</option>
                          <option value="Friday">Friday</option>
                          <option value="Saturday">Saturday</option>
                          <option value="Sunday">Sunday</option>
                        </select>
                        <input 
                          type="time" 
                          value={sched.start_time}
                          onChange={(e) => {
                            const newScheds = [...schedules];
                            newScheds[index].start_time = e.target.value;
                            setSchedules(newScheds);
                          }}
                          className="px-2 py-1.5 rounded-lg border border-outline-variant text-xs focus:outline-primary bg-white"
                        />
                        <span className="text-xs font-bold text-on-surface-variant">to</span>
                        <input 
                          type="time" 
                          value={sched.end_time}
                          onChange={(e) => {
                            const newScheds = [...schedules];
                            newScheds[index].end_time = e.target.value;
                            setSchedules(newScheds);
                          }}
                          className="px-2 py-1.5 rounded-lg border border-outline-variant text-xs focus:outline-primary bg-white"
                        />
                        <button 
                          onClick={() => {
                            const newScheds = [...schedules];
                            newScheds.splice(index, 1);
                            setSchedules(newScheds);
                          }}
                          className="p-1.5 text-error hover:bg-error/10 rounded-full transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {schedules.length === 0 && (
                      <p className="text-xs text-on-surface-variant italic">No schedule blocks added yet.</p>
                    )}
                  </div>
                  <button 
                    onClick={() => setSchedules([...schedules, { day_of_week: 'Monday', start_time: '08:00', end_time: '17:00' }])}
                    className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-3 py-1.5 rounded-full font-bold hover:bg-primary/20 transition-colors"
                  >
                    <Plus size={12} /> Add Time Block
                  </button>
                </div>
              </div>

              {/* Student verification via Gemini AI */}
              <div className="bg-white rounded-2xl border border-outline-variant p-5 shadow-xs">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5 text-primary"><Shield size={16} /> Instant Student Audit</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                  Upload your UMS/UiTM student ID card copy. Our smart Gemini AI assistant checks and validates credentials instantly.
                </p>

                {isVerified ? (
                  <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl space-y-2">
                    <p className="text-xs font-bold flex items-center gap-1"><CheckCircle size={14} /> Verification Clear</p>
                    <div className="text-[10px] space-y-0.5 leading-normal opacity-90">
                      <p>Institution: <strong>{university}</strong></p>
                      <p>Student ID: <strong>{matricId}</strong></p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-outline-variant hover:border-primary transition-colors rounded-xl p-5 text-center relative bg-surface-container-lowest/50">
                      <input 
                        type="file" 
                        id="matric-upload" 
                        accept="image/*" 
                        disabled={verifyingCard}
                        onChange={handleStudentCardUpload}
                        className="hidden"
                      />
                      <label htmlFor="matric-upload" className="cursor-pointer block">
                        <Upload size={24} className="mx-auto text-on-surface-variant mb-1.5" />
                        <p className="text-xs font-bold text-on-surface">Upload Student ID Card</p>
                        <p className="text-[9px] text-on-surface-variant mt-0.5">JPEG or PNG (Max 4MB)</p>
                      </label>
                    </div>

                    {verifyingCard && (
                      <div className="bg-primary/5 border border-primary/20 p-3.5 rounded-xl flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                        <span className="text-[10px] text-primary font-bold animate-pulse">Gemini analyzing ID card...</span>
                      </div>
                    )}
                  </div>
                )}

                {aiVerificationResult && (
                  <div className="mt-3 p-3 bg-purple-50 border border-purple-100 rounded-xl space-y-1">
                    <p className="text-[10px] font-bold text-purple-800 flex items-center gap-1"><Sparkles size={12} /> Gemini Audit Response:</p>
                    <p className="text-[10px] text-purple-700 font-medium leading-relaxed">
                      {aiVerificationResult.isValid 
                        ? `Validated! Student Name: ${aiVerificationResult.name}, Matric ID: ${aiVerificationResult.matricId} at ${aiVerificationResult.university}.`
                        : `Rejection reason: ${aiVerificationResult.reason}`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Details form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-outline-variant p-6 space-y-5 shadow-xs">
                
                {/* Section 1: Basic info */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 text-on-surface pb-1 border-b border-outline-variant/40 flex items-center gap-1.5"><User size={16} className="text-primary" /> Personal Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-outline-variant text-xs focus:outline-primary bg-surface-container-lowest"
                        placeholder="e.g. Student Name"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Phone Number</label>
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-outline-variant text-xs focus:outline-primary bg-surface-container-lowest"
                        placeholder="e.g. +6012-3456789"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Academic Institution</label>
                      <input 
                        type="text" 
                        value={university}
                        onChange={e => setUniversity(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-outline-variant text-xs focus:outline-primary bg-surface-container-lowest"
                        placeholder="e.g. Local University"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Matric ID / Student ID</label>
                      <input 
                        type="text" 
                        value={matricId}
                        onChange={e => setMatricId(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-outline-variant text-xs focus:outline-primary bg-surface-container-lowest"
                        placeholder="e.g. BI22110294"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Short Bio</label>
                    <textarea 
                      rows={3}
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant text-xs focus:outline-primary bg-surface-container-lowest"
                      placeholder="Write a brief overview of yourself. For example: UMS student looking for barista work on weekends..."
                    />
                  </div>
                </div>

                {/* Section 2: Logistics & Transportation */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 text-on-surface pb-1 border-b border-outline-variant/40 flex items-center gap-1.5"><Car size={16} className="text-primary" /> Logistics & Transport</h3>
                  <div>
                    <label className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Transportation Access</label>
                    <select 
                      value={transport}
                      onChange={e => setTransport(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-outline-variant text-xs focus:outline-primary bg-surface-container-lowest"
                    >
                      <option value="Own Car">Own Car (Willing to travel &lt;15km)</option>
                      <option value="Own Motorcycle">Own Motorcycle (Willing to travel &lt;10km)</option>
                      <option value="Public Transport">Public Transport (Bus / Grab / Transit)</option>
                      <option value="Walk">Walking Only (UMS Campus vicinity)</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                </div>

                {/* Section 2b: Financial & Classification */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 text-on-surface pb-1 border-b border-outline-variant/40 flex items-center gap-1.5"><Shield size={16} className="text-primary" /> Financial & Classification</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Household Income (RM/month)</label>
                      <input 
                        type="number" 
                        value={householdIncome}
                        onChange={e => setHouseholdIncome(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3.5 py-2 rounded-xl border border-outline-variant text-xs focus:outline-primary bg-surface-container-lowest"
                        placeholder="e.g. 3000"
                      />
                      {householdIncome !== '' && (
                        <p className="text-[10px] text-primary mt-1">Classification: {Number(householdIncome) <= 4850 ? 'B40' : Number(householdIncome) <= 10970 ? 'M40' : 'T20'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Expected Hourly Rate (RM)</label>
                      <input 
                        type="number" 
                        value={expectedHourlyRate}
                        onChange={e => setExpectedHourlyRate(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3.5 py-2 rounded-xl border border-outline-variant text-xs focus:outline-primary bg-surface-container-lowest"
                        placeholder="e.g. 15"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Bank Name</label>
                      <input 
                        type="text" 
                        value={bankName}
                        onChange={e => setBankName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-outline-variant text-xs focus:outline-primary bg-surface-container-lowest"
                        placeholder="e.g. Maybank"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Bank Account Number</label>
                      <input 
                        type="text" 
                        value={bankAccountNumber}
                        onChange={e => setBankAccountNumber(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-outline-variant text-xs focus:outline-primary bg-surface-container-lowest"
                        placeholder="e.g. 160123456789"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2c: Emergency SOS */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 text-on-surface pb-1 border-b border-outline-variant/40 flex items-center gap-1.5"><Bell size={16} className="text-primary" /> Emergency SOS Settings</h3>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-2 cursor-pointer bg-surface-container-lowest p-3 rounded-xl border border-outline-variant">
                      <input 
                        type="checkbox" 
                        checked={emergencyReady}
                        onChange={e => setEmergencyReady(e.target.checked)}
                        className="rounded text-primary focus:ring-primary w-4 h-4"
                      />
                      <span className="text-xs font-medium">I am willing to accept Emergency SOS gigs (Immediate Start)</span>
                    </label>
                    {emergencyReady && (
                      <div>
                        <label className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Max Travel Radius for SOS Gigs (km)</label>
                        <input 
                          type="number" 
                          value={emergencyRadiusKm}
                          onChange={e => setEmergencyRadiusKm(e.target.value ? Number(e.target.value) : '')}
                          className="w-full px-3.5 py-2 rounded-xl border border-outline-variant text-xs focus:outline-primary bg-surface-container-lowest"
                          placeholder="e.g. 5"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3: Skills & Work Experience */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 text-on-surface pb-1 border-b border-outline-variant/40 flex items-center gap-1.5"><BookOpen size={16} className="text-primary" /> Skills & Work Experience</h3>
                  
                  {/* Skills tags */}
                  <div className="space-y-2">
                    <label className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">My Skills ({skills.length})</label>
                    
                    <div className="flex flex-wrap gap-1.5 p-3.5 bg-surface-container-low rounded-xl min-h-[50px] border border-outline-variant/50">
                      {skills.length === 0 ? (
                        <span className="text-[10px] text-on-surface-variant italic font-medium">No skills listed yet. Choose some recommendations below or type custom ones.</span>
                      ) : (
                        skills.map(skill => (
                          <span key={skill} className="bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                            {skill}
                            <button type="button" onClick={() => handleRemoveSkill(skill)} className="hover:scale-110 active:scale-95 transition-transform"><X size={10} /></button>
                          </span>
                        ))
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newSkill}
                        onChange={e => setNewSkill(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(newSkill); } }}
                        placeholder="e.g. Latte Art, SQL, Inventory Packing..."
                        className="flex-1 px-3.5 py-2 rounded-xl border border-outline-variant text-xs focus:outline-primary bg-surface-container-lowest"
                      />
                      <button 
                        type="button" 
                        onClick={() => handleAddSkill(newSkill)}
                        className="bg-primary text-white px-4 rounded-xl text-xs font-bold active:scale-95 transition-transform cursor-pointer"
                      >
                        Add Skill
                      </button>
                    </div>

                    {/* Skill recommendations */}
                    <div className="space-y-1 pt-1">
                      <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">Recommendations:</p>
                      <div className="flex flex-wrap gap-1">
                        {DEFAULT_SKILLS.filter(s => !skills.includes(s)).map(s => (
                          <button 
                            key={s} 
                            type="button"
                            onClick={() => handleAddSkill(s)}
                            className="bg-white border hover:bg-primary/5 text-on-surface hover:text-primary text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                          >
                            + {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Work Experience */}
                  <div className="mt-4">
                    <label className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Previous Work History</label>
                    <textarea 
                      rows={3}
                      value={experience}
                      onChange={e => setExperience(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant text-xs focus:outline-primary bg-surface-container-lowest"
                      placeholder="e.g. Worked as cashier at Daily Brew for 3 months, helper at Sabah IT Expo 2025, delivery rider for GrabFood."
                    />
                  </div>
                </div>

                  {/* Availability Toggle */}
                  <div className="mt-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-on-surface flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-green-500 animate-pulse' : 'bg-outline-variant'}`} />
                          {isAvailable ? '🟢 Available for Work' : '🔴 Offline / Unavailable'}
                        </p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5 font-medium">
                          {isAvailable ? 'Employers can see you are ready for new gigs.' : 'Toggle ON to let employers know you are available now.'}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          setTogglingAvailability(true);
                          const next = !isAvailable;
                          setIsAvailable(next);
                          localStorage.setItem('gigit_available', String(next));
                          if (user) await api.setAvailability(user.id, next);
                          showToast(next ? '🟢 You are now marked as Available!' : '🔴 Availability set to Offline.');
                          setTogglingAvailability(false);
                        }}
                        disabled={togglingAvailability}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${isAvailable ? 'bg-green-500' : 'bg-outline-variant/40'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${isAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <div className="mt-3 pt-3 border-t border-outline-variant/40">
                      <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider mb-2">Your SWEAT™️ Score</p>
                      <JSSBadge score={Math.round(parseFloat('4.8') * 20)} size="sm" showLabel={true} />
                    </div>
                  </div>

                  {/* Save changes button */}
                <div className="pt-4 border-t border-outline-variant/60 flex justify-end">
                  <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="bg-primary hover:bg-primary/95 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md hover:scale-102 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        <span>Save Profile Details</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Toast feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-4 z-50 bg-slate-900 border border-slate-800 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
