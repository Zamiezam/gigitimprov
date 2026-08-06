// components/LoginPage.tsx - Modal version (no routing needed)
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, X, Briefcase, Users, Building2, FileText, MapPin, Phone, Grid, Hash, Globe, AlignLeft, Map, GraduationCap, Link, Wrench, Landmark, CreditCard, CircleDollarSign, CalendarClock, Siren, Navigation } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginPageProps {
  onClose: () => void;
  defaultRole?: 'worker' | 'employer';
  onLoginSuccess?: () => void;
}

export default function LoginPage({ onClose, defaultRole = 'worker', onLoginSuccess }: LoginPageProps) {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'worker' | 'employer'>(defaultRole);
  const [companyName, setCompanyName] = useState('');
  const [ssmNumber, setSsmNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  
  // Worker-specific state
  const [bio, setBio] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [skills, setSkills] = useState(''); // Comma separated for now
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [expectedRate, setExpectedRate] = useState('');
  const [commitments, setCommitments] = useState('');
  const [emergencyReady, setEmergencyReady] = useState(false);
  const [emergencyRadius, setEmergencyRadius] = useState('5');
  const [householdIncome, setHouseholdIncome] = useState('');
  
  // B40/M40/T20 auto-classification based on DOSM thresholds
  const getIncomeClassification = (income: string): { label: string; color: string; bg: string } | null => {
    if (!income) return null;
    const val = parseInt(income);
    if (val <= 4850) return { label: 'B40', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300' };
    if (val <= 10970) return { label: 'M40', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300' };
    return { label: 'T20', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300' };
  };
  const incomeClass = getIncomeClassification(householdIncome);
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmail(email, password);
        onLoginSuccess?.();
        onClose();
      } else {
        const extraData = selectedRole === 'employer' ? {
          company_name: companyName,
          ssm_number: ssmNumber,
          phone_number: phoneNumber,
          industry: industry,
          company_size: companySize,
          company_description: companyDescription,
          website: website,
          company_address: companyAddress,
          city: city,
          state: state,
          postal_code: postalCode
        } : {
          phone_number: phoneNumber,
          city: city,
          state: state,
          postal_code: postalCode,
          bio: bio,
          education_level: educationLevel,
          resume_url: resumeUrl,
          skills: skills ? skills.split(',').map(s => s.trim()) : [],
          bank_name: bankName,
          bank_account_number: bankAccountNumber,
          expected_hourly_rate: expectedRate ? parseFloat(expectedRate) : null,
          household_income: householdIncome ? parseInt(householdIncome) : null,
          income_classification: incomeClass?.label || null,
          commitments_description: commitments,
          emergency_ready: emergencyReady,
          emergency_radius_km: emergencyRadius ? parseInt(emergencyRadius) : null
        };
        
        await signUpWithEmail(email, password, fullName, selectedRole, extraData);
        setIsLogin(true);
        setError('✅ Registration successful! Please log in.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-outline-variant"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant bg-surface flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">G</div>
            <span className="font-bold text-primary">GigIT</span>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <h2 className="text-xl font-bold text-on-surface mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-sm text-on-surface-variant mb-6">
            {isLogin ? 'Log in to access your dashboard' : 'Join GigIT as a worker or employer'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                {/* Role Selection is moved to the top for better UX flow */}
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-2">
                    I want to...
                  </label>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('worker')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        selectedRole === 'worker'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-outline-variant text-on-surface-variant'
                      }`}
                    >
                      <Users size={18} />
                      <span className="text-sm font-semibold">Find Opportunities</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('employer')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        selectedRole === 'employer'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-outline-variant text-on-surface-variant'
                      }`}
                    >
                      <Briefcase size={18} />
                      <span className="text-sm font-semibold">Hire Trusted Talent</span>
                    </button>
                  </div>
                </div>

                {selectedRole === 'worker' && (
                  <div className="space-y-6">
                    {/* Professional Background Group */}
                    <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant space-y-4">
                      <h3 className="text-sm font-bold text-on-surface">1. Professional Background</h3>
                      
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Professional Summary / Bio</label>
                        <div className="relative">
                          <AlignLeft size={18} className="absolute left-3 top-3 text-on-surface-variant" />
                          <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm min-h-[80px]" placeholder="Briefly describe yourself and your experience..." />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">Education Level</label>
                          <div className="relative">
                            <GraduationCap size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                            <select required value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm bg-white">
                              <option value="">Select Level</option>
                              <option value="High School">High School</option>
                              <option value="Diploma">Diploma</option>
                              <option value="Bachelor's Degree">Bachelor's Degree</option>
                              <option value="Master's Degree">Master's Degree</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">Resume Link (Optional)</label>
                          <div className="relative">
                            <Link size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                            <input type="url" value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm" placeholder="GDrive, LinkedIn..." />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Key Skills (comma separated)</label>
                        <div className="relative">
                          <Wrench size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                          <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm" placeholder="e.g. Barista, Event Crew, Data Entry" />
                        </div>
                      </div>
                    </div>

                    {/* Financial Info Group */}
                    <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant space-y-4">
                      <h3 className="text-sm font-bold text-on-surface">2. Financial Information</h3>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">Bank Name</label>
                          <div className="relative">
                            <Landmark size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                            <select required value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm bg-white">
                              <option value="">Select Bank</option>
                              <option value="Maybank">Maybank</option>
                              <option value="CIMB">CIMB Bank</option>
                              <option value="Public Bank">Public Bank</option>
                              <option value="RHB">RHB Bank</option>
                              <option value="Bank Islam">Bank Islam</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">Account Number</label>
                          <div className="relative">
                            <CreditCard size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                            <input type="text" required value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm" placeholder="e.g. 1234567890" />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Expected Hourly Rate (RM/hr)</label>
                        <div className="relative">
                          <CircleDollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                          <input type="number" min="0" step="0.5" required value={expectedRate} onChange={(e) => setExpectedRate(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm" placeholder="e.g. 15.00" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Monthly Household Income (RM)</label>
                        <div className="relative">
                          <CircleDollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                          <select required value={householdIncome} onChange={(e) => setHouseholdIncome(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm bg-white">
                            <option value="">Select income range</option>
                            <option value="1500">Below RM 2,000</option>
                            <option value="2500">RM 2,000 – RM 3,000</option>
                            <option value="3500">RM 3,000 – RM 4,000</option>
                            <option value="4500">RM 4,000 – RM 4,850</option>
                            <option value="6000">RM 4,850 – RM 7,000</option>
                            <option value="9000">RM 7,000 – RM 10,970</option>
                            <option value="12000">RM 10,970 – RM 15,000</option>
                            <option value="20000">Above RM 15,000</option>
                          </select>
                        </div>
                      </div>

                      {incomeClass && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${incomeClass.bg}`}>
                          <span className={`text-xs font-bold ${incomeClass.color}`}>Auto-classified:</span>
                          <span className={`text-sm font-extrabold ${incomeClass.color}`}>{incomeClass.label}</span>
                          <span className={`text-xs ${incomeClass.color} opacity-70`}>
                            {incomeClass.label === 'B40' && '(Bottom 40% — eligible for subsidies & priority hiring)'}
                            {incomeClass.label === 'M40' && '(Middle 40%)'}
                            {incomeClass.label === 'T20' && '(Top 20%)'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Scheduling & Emergency Group */}
                    <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant space-y-4">
                      <h3 className="text-sm font-bold text-on-surface">3. Scheduling & Commitments</h3>
                      
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Standard Commitments</label>
                        <div className="relative">
                          <CalendarClock size={18} className="absolute left-3 top-3 text-on-surface-variant" />
                          <textarea value={commitments} onChange={(e) => setCommitments(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm min-h-[60px]" placeholder="e.g. I have classes Monday-Wednesday mornings..." />
                        </div>
                      </div>

                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <Siren className="text-amber-600 shrink-0 mt-0.5" size={20} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-bold text-amber-900">Emergency Responder Opt-in</h4>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={emergencyReady} onChange={(e) => setEmergencyReady(e.target.checked)} />
                                <div className="w-9 h-5 bg-amber-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                              </label>
                            </div>
                            <p className="text-xs text-amber-800 mb-3">Turn this on if you are willing to receive high-priority, last-minute SOS gigs from employers.</p>
                            
                            {emergencyReady && (
                              <div>
                                <label className="block text-xs font-bold text-amber-900 mb-1">Emergency Travel Radius (km)</label>
                                <div className="relative">
                                  <Navigation size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-700" />
                                  <input type="number" min="1" max="50" value={emergencyRadius} onChange={(e) => setEmergencyRadius(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-amber-300 focus:outline-amber-600 text-sm bg-white" placeholder="e.g. 5" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Location Group (Reused) */}
                    <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant space-y-4">
                      <h3 className="text-sm font-bold text-on-surface">4. Location Details</h3>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">City</label>
                          <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm" placeholder="e.g. Kota Kinabalu" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">State</label>
                          <div className="relative">
                            <Map size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                            <select required value={state} onChange={(e) => setStateName(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm bg-white">
                              <option value="">Select State</option>
                              <option value="Sabah">Sabah</option>
                              <option value="Sarawak">Sarawak</option>
                              <option value="Kuala Lumpur">Kuala Lumpur</option>
                              <option value="Selangor">Selangor</option>
                              <option value="Johor">Johor</option>
                              <option value="Penang">Penang</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Postal Code</label>
                        <input type="text" required value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm" placeholder="e.g. 88400" />
                      </div>
                    </div>
                  </div>
                )}

                {selectedRole === 'employer' && (
                  <div className="space-y-6">
                    {/* Business Info Group */}
                    <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant space-y-4">
                      <h3 className="text-sm font-bold text-on-surface">1. Business Information</h3>
                      
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Company / Business Name</label>
                        <div className="relative">
                          <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                          <input type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm" placeholder="e.g. GigIT Tech Sdn Bhd" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">SSM Number</label>
                          <div className="relative">
                            <FileText size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                            <input type="text" required value={ssmNumber} onChange={(e) => setSsmNumber(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm" placeholder="202301123456" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">Industry</label>
                          <div className="relative">
                            <Grid size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                            <input type="text" required value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm" placeholder="e.g. F&B, Tech" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">Company Size</label>
                          <div className="relative">
                            <Hash size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                            <select value={companySize} onChange={(e) => setCompanySize(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm bg-white">
                              <option value="">Select size</option>
                              <option value="1-10">1-10 employees</option>
                              <option value="11-50">11-50 employees</option>
                              <option value="51-200">51-200 employees</option>
                              <option value="200+">200+ employees</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">Website (Optional)</label>
                          <div className="relative">
                            <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                            <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm" placeholder="https://" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Company Description</label>
                        <div className="relative">
                          <AlignLeft size={18} className="absolute left-3 top-3 text-on-surface-variant" />
                          <textarea value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm min-h-[80px]" placeholder="Briefly describe what your company does..." />
                        </div>
                      </div>
                    </div>

                    {/* Location Group */}
                    <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant space-y-4">
                      <h3 className="text-sm font-bold text-on-surface">2. Location Details</h3>
                      
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Street Address</label>
                        <div className="relative">
                          <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                          <input type="text" required value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm" placeholder="Suite, Building, Street" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">City</label>
                          <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm" placeholder="e.g. Kota Kinabalu" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">State</label>
                          <div className="relative">
                            <Map size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                            <select required value={state} onChange={(e) => setStateName(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm bg-white">
                              <option value="">Select State</option>
                              <option value="Sabah">Sabah</option>
                              <option value="Sarawak">Sarawak</option>
                              <option value="Kuala Lumpur">Kuala Lumpur</option>
                              <option value="Selangor">Selangor</option>
                              <option value="Johor">Johor</option>
                              <option value="Penang">Penang</option>
                              {/* Add others as needed */}
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Postal Code</label>
                        <input type="text" required value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm" placeholder="e.g. 88400" />
                      </div>
                    </div>
                  </div>
                )}
                  
                <div className="pt-2">
                  <h3 className="text-sm font-bold text-on-surface mb-4">
                    {selectedRole === 'worker' ? '5. Account Login Details' : '3. Account Login Details'}
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm"
                    placeholder="Ahmad Rosli"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm"
                      placeholder="e.g. 0123456789"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Moved role selection up */}

            {error && (
              <div className={`p-3 rounded-xl text-xs font-medium ${
                error.includes('✅') 
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isLogin ? 'Logging in...' : 'Creating account...'}
                </span>
              ) : (
                isLogin ? 'Log In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}