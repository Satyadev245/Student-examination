import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, User, AlertCircle, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import campusImage from '../assets/images/datapro_institute_campus_1791190503710.jpg';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please provide your username/email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(identifier.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Left Column: Institute Branding & Presentation */}
      <div className="lg:w-1/2 relative bg-slate-900 text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between overflow-hidden">
        {/* Background photo with clean contrast scrim */}
        <div className="absolute inset-0 z-0">
          <img
            src={campusImage}
            alt="DataPro Institute Gajuwaka"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-40 scale-105"
            onError={(e) => {
              // Fallback to rich dark gradient if image fails
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-900/70" />
        </div>

        {/* Top Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md">
              DP
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight block">DATAPRO INSTITUTE</span>
              <span className="text-xs text-blue-300 font-medium tracking-wide">GAJUWAKA CENTRE FOR SOFTWARE EXCELLENCE</span>
            </div>
          </div>
        </div>

        {/* Central Educational Narrative */}
        <div className="relative z-10 my-12 max-w-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 block mb-2">
            Academic Assessment Infrastructure
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Student Examination & Certification Management System
          </h1>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            Centralized portal for syllabus-aligned examination paper submissions, batch scheduling, secure invigilation records, and administrative governance for DataPro Institute, Gajuwaka.
          </p>

          <div className="mt-8 space-y-2.5 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Role-governed trainer uploads with course-batch verification</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Encrypted paper repository & tamper-evident audit logging</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instant administrative notifications upon trainer submission</span>
            </div>
          </div>
        </div>

        {/* Footer address */}
        <div className="relative z-10 text-xs text-slate-400 border-t border-slate-800/80 pt-4">
          <p>DataPro Institute, Opposite Police Station, Main Road, Gajuwaka, Visakhapatnam - 530026</p>
        </div>
      </div>

      {/* Right Column: Login Form & Quick Role Selectors */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to your account</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Enter your DataPro credentials to access the examination portal.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Username or Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. rajkumar or admin@datapro.in"
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span>Remember me on this workstation</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Secure Institutional Portal Notice */}
          <div className="pt-5 border-t border-slate-200">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 text-center">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Secure Internal Faculty & Examination Portal · 256-bit Encrypted Session</span>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-left border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Password Recovery</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              For security compliance at DataPro Institute, credential resets are managed by the System Super Administrator or Center Academic Admin.
            </p>
            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-700 space-y-1 border border-slate-200">
              <p><strong>Admin Desk:</strong> +91 98480 12345</p>
              <p><strong>Support Email:</strong> admin@datapro.in</p>
              <p><strong>Center:</strong> DataPro Gajuwaka Centre</p>
            </div>
            <div className="mt-5 text-right">
              <button
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
