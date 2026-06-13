// components/LoginPage.tsx - Modal version (no routing needed)
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, X, Briefcase, Users } from 'lucide-react';
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
        await signUpWithEmail(email, password, fullName, selectedRole);
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
        className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-outline-variant"
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

            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2">
                  I want to...
                </label>
                <div className="grid grid-cols-2 gap-3">
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
                    <span className="text-sm font-semibold">Find Gigs</span>
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
                    <span className="text-sm font-semibold">Hire Staff</span>
                  </button>
                </div>
              </div>
            )}

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