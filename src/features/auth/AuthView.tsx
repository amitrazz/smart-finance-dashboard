import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Moon,
  RefreshCw,
  Sparkles,
  Sun,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import pkg from '../../../package.json';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { DashboardPreview } from './components/DashboardPreview';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { SecurityTrustBadges } from './components/SecurityTrustBadges';

export const AuthView: React.FC = () => {
  const { login, isLoading } = useAuthStore();
  const { theme, toggleTheme } = useSettingsStore();
  const appVersion = pkg.version || '2.5.0';

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // UX Features State
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);

  // Load remembered email on mount & Auto-focus
  useEffect(() => {
    const savedEmail = localStorage.getItem('pf_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
    }
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);

  // Handle CapsLock Detection
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Remember Email in LocalStorage
    if (rememberMe && email) {
      localStorage.setItem('pf_remembered_email', email);
    } else {
      localStorage.removeItem('pf_remembered_email');
    }

    try {
      await login(email, password);
      setSuccessMsg('Sign-in successful! Loading your financial OS...');
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Authentication failed. Please check credentials.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col lg:flex-row relative overflow-x-hidden selection:bg-emerald-500 selection:text-slate-950">
      {/* Theme Switcher Button - Floating Top Right */}
      <button
        onClick={toggleTheme}
        className="fixed top-5 right-5 z-40 p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl text-slate-400 hover:text-slate-100 hover:border-slate-700 transition-all shadow-lg"
        title="Toggle Light/Dark Theme"
        aria-label="Toggle Light/Dark Theme"
      >
        {theme === 'dark' ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 text-slate-300" />
        )}
      </button>

      {/* LEFT COLUMN: 60% Width - Financial OS Dashboard Hero Preview */}
      <div className="hidden lg:flex w-full lg:w-[58%] xl:w-[62%] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-r border-slate-800/80 relative flex-col justify-center">
        <DashboardPreview />
      </div>

      {/* RIGHT COLUMN: 40% Width - Premium Floating Glass Auth Card */}
      <div className="w-full lg:w-[42%] xl:w-[38%] min-h-screen flex items-center justify-center p-6 lg:p-12 relative z-10 bg-slate-950/90 dark:bg-slate-950/95 backdrop-blur-2xl">
        {/* Glow Effects */}
        <div className="absolute top-1/4 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md space-y-6 relative z-10">
          {/* Mobile/Tablet Header Brand Badge */}
          <div className="lg:hidden text-center space-y-2 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 mx-auto">
              <Sparkles className="w-6 h-6 text-slate-950" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Cashflow</h1>
            <p className="text-xs text-slate-400 font-medium">Personal Finance Operating System</p>
          </div>

          {/* Auth Surface Card */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl shadow-2xl p-6 lg:p-8 space-y-6 backdrop-blur-xl">
            {/* Header Title */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-slate-100">Welcome Back</h2>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v{appVersion} OS
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Sign in to continue managing your financial life.
              </p>
            </div>

            {/* Notification Messages */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium animate-in fade-in">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    ref={emailInputRef}
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    placeholder="user@example.com"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">Password</label>
                  {isCapsLockOn && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      <AlertTriangle className="w-3 h-3" /> Caps Lock ON
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Form Controls: Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500/50 cursor-pointer"
                  />
                  <span>Remember Me</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-emerald-400 hover:underline font-semibold text-xs"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all duration-200 mt-2 disabled:opacity-50 group"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Financial OS</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Security Trust Badges */}
            <SecurityTrustBadges />
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
};
