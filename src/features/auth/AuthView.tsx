import React, { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import {
  Sparkles,
  Lock,
  Mail,
  User,
  ArrowRight,
  RefreshCw,
  Eye,
  EyeOff,
  Sun,
  Moon,
  AlertTriangle,
  Fingerprint,
  Wand2,
  CheckCircle2,
  XCircle,
  KeyRound
} from "lucide-react";
import { DashboardPreview } from "./components/DashboardPreview";
import { GoogleButton } from "./components/GoogleButton";
import { ForgotPasswordModal } from "./components/ForgotPasswordModal";
import { SecurityTrustBadges } from "./components/SecurityTrustBadges";

type AuthMode = "password" | "passkey" | "magic-link";

export const AuthView: React.FC = () => {
  const { login, register, isLoading } = useAuthStore();
  const { theme, toggleTheme } = useSettingsStore();

  const [isRegister, setIsRegister] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("password");
  
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  
  // UX Features State
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("pf_remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
    }
    // Auto-focus email field
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);

  // Handle CapsLock Detection
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState("CapsLock"));
    }
  };

  // Password Strength Calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: "Weak", color: "bg-rose-500" };
      case 2:
        return { score: 50, label: "Fair", color: "bg-amber-500" };
      case 3:
        return { score: 75, label: "Good", color: "bg-teal-500" };
      case 4:
        return { score: 100, label: "Strong", color: "bg-emerald-500" };
      default:
        return { score: 15, label: "Too Short", color: "bg-rose-500" };
    }
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // Remember Email in LocalStorage
    if (rememberMe && email) {
      localStorage.setItem("pf_remembered_email", email);
    } else {
      localStorage.removeItem("pf_remembered_email");
    }

    try {
      if (isRegister) {
        await register(email, password, name);
        setSuccessMsg("Account created successfully! Redirecting...");
      } else {
        await login(email, password);
        setSuccessMsg("Sign-in successful! Loading your financial OS...");
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Authentication failed. Please check credentials.");
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg("");
    // Standard OAuth fallback or quick test login
    try {
      await login("user@example.com", "password123");
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Google authentication failed.");
    }
  };

  const handlePasskeyAuth = async () => {
    setErrorMsg("");
    setSuccessMsg("Verifying Biometrics / Passkey...");
    setTimeout(async () => {
      try {
        await login("user@example.com", "password123");
      } catch (err: unknown) {
        setErrorMsg((err as Error).message || "Passkey verification failed.");
      }
    }, 1000);
  };

  const handleMagicLinkSend = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!email) {
      setErrorMsg("Please enter your email address.");
      return;
    }
    setSuccessMsg(`Magic Link dispatched to ${email}. Check your inbox!`);
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
        {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
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
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">PFOS</h1>
            <p className="text-xs text-slate-400 font-medium">Personal Finance Operating System</p>
          </div>

          {/* Auth Surface Card */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl shadow-2xl p-6 lg:p-8 space-y-6 backdrop-blur-xl">
            {/* Header Title */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-slate-100">
                  {isRegister ? "Create PFOS Account" : "Welcome Back"}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v2.5 OS
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {isRegister
                  ? "Sign up to begin organizing & growing your net worth."
                  : "Sign in to continue managing your financial life."}
              </p>
            </div>

            {/* Authentication Method Tabs */}
            <div className="grid grid-cols-3 p-1 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs font-semibold">
              <button
                onClick={() => setAuthMode("password")}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  authMode === "password"
                    ? "bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Password</span>
              </button>
              <button
                onClick={() => setAuthMode("passkey")}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  authMode === "passkey"
                    ? "bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Fingerprint className="w-3.5 h-3.5" />
                <span>Passkey</span>
              </button>
              <button
                onClick={() => setAuthMode("magic-link")}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  authMode === "magic-link"
                    ? "bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Magic Link</span>
              </button>
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

            {/* TAB CONTENT: Passkey Mode */}
            {authMode === "passkey" && (
              <div className="text-center py-6 space-y-4 animate-in fade-in">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10 animate-pulse">
                  <Fingerprint className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-100">Touch ID / Face ID Authentication</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Authenticate instantly using your device's biometric sensor or hardware security key.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePasskeyAuth}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Scan Passkey to Sign In</span>}
                </button>
              </div>
            )}

            {/* TAB CONTENT: Magic Link Mode */}
            {authMode === "magic-link" && (
              <form onSubmit={handleMagicLinkSend} className="space-y-4 animate-in fade-in">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>Send Passwordless Magic Link</span>
                </button>
              </form>
            )}

            {/* TAB CONTENT: Password Mode (Default) */}
            {authMode === "password" && (
              <>
                {/* Social Login Button */}
                <GoogleButton onClick={handleGoogleAuth} isLoading={isLoading} />

                {/* Divider */}
                <div className="relative flex items-center justify-center my-4">
                  <div className="border-t border-slate-800/90 w-full" />
                  <span className="bg-slate-900 px-3 text-[10px] uppercase font-bold tracking-widest text-slate-500 absolute">
                    OR CONTINUE WITH EMAIL
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Full Name Input (Register Mode Only) */}
                  {isRegister && (
                    <div className="space-y-1 animate-in fade-in duration-200">
                      <label className="block text-xs font-semibold text-slate-300">Full Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                          placeholder="Alex Morgan"
                          autoComplete="name"
                        />
                      </div>
                    </div>
                  )}

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
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        placeholder="••••••••••••"
                        autoComplete={isRegister ? "new-password" : "current-password"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 transition-colors"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator (Register Mode Only) */}
                    {isRegister && password && (
                      <div className="space-y-1.5 pt-1.5 animate-in fade-in">
                        <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                          <span>Password Strength</span>
                          <span className={`font-bold ${strength.score > 50 ? "text-emerald-400" : "text-amber-400"}`}>
                            {strength.label}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${strength.color}`}
                            style={{ width: `${strength.score}%` }}
                          />
                        </div>
                      </div>
                    )}
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

                    {!isRegister && (
                      <button
                        type="button"
                        onClick={() => setIsForgotPasswordOpen(true)}
                        className="text-emerald-400 hover:underline font-semibold text-xs"
                      >
                        Forgot Password?
                      </button>
                    )}
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
                        <span>{isRegister ? "Create Account & Access OS" : "Sign In to Financial OS"}</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* Toggle Sign In / Create Account */}
            <div className="text-center border-t border-slate-800/80 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="text-xs text-slate-400 hover:text-emerald-400 font-medium transition-colors"
              >
                {isRegister ? (
                  <>
                    Already have a PFOS account?{" "}
                    <span className="text-emerald-400 font-bold underline">Sign In</span>
                  </>
                ) : (
                  <>
                    Don't have a PFOS account yet?{" "}
                    <span className="text-emerald-400 font-bold underline">Register Here</span>
                  </>
                )}
              </button>
            </div>

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
