import React, { useState } from 'react';
import { Sparkles, Key, Mail, Lock, Eye, EyeOff, ShieldCheck, Dumbbell, UserCheck, Heart } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User, memberObj: any, trainerObj: any) => void;
  isLightMode: boolean;
}

export default function Login({ onLoginSuccess, isLightMode }: LoginProps) {
  const [role, setRole] = useState<'Member' | 'Trainer' | 'Admin'>('Member');
  const [email, setEmail] = useState('marcus@gym.com');
  const [password, setPassword] = useState('member123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot password flow states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  // When changing tabs, automatically update the helper mock credential input values
  const handleRoleChange = (selectedRole: 'Member' | 'Trainer' | 'Admin') => {
    setRole(selectedRole);
    setError(null);
    if (selectedRole === 'Member') {
      setEmail('marcus@gym.com');
      setPassword('member123');
    } else if (selectedRole === 'Trainer') {
      setEmail('trainer@gym.com');
      setPassword('trainer123');
    } else {
      setEmail('admin@gym.com');
      setPassword('admin123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      // Success! Pass states to App parent
      onLoginSuccess(data.user, data.member, data.trainer);
    } catch (err: any) {
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);
    setForgotLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'The email address is unregistered.');
      }

      setForgotSuccess(data.message || 'Transmission request success.');
    } catch (err: any) {
      setForgotError(err.message || 'Server connection error.');
    } finally {
      setForgotLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 min-h-[calc(100vh-140px)] animate-fadeIn">
        <div className={`w-full max-w-lg rounded-3xl border p-6 md:p-10 shadow-2xl relative overflow-hidden transition-all duration-300 ${
          isLightMode 
            ? 'bg-white border-zinc-200 text-zinc-800 shadow-zinc-200/50' 
            : 'bg-[#0C0C0E] border-white/10 text-white shadow-black/80'
        }`}>
          {/* Glow accent */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#C2F900] via-[#C8FF00] to-[#E5FF7F]"></div>
          
          {/* Decorative ambient elements */}
          {!isLightMode && (
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#C8FF00]/5 rounded-full blur-[100px] pointer-events-none"></div>
          )}

          <div className="text-center mb-8 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-[#C8FF00]/10 border border-[#C8FF00]/25 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#C8FF00]/5">
              <Key className="w-7 h-7 text-[#C8FF00]" />
            </div>
            <span className="text-[10px] tracking-widest text-[#C8FF00] font-black uppercase">Credentials Reset Engine</span>
            <h2 className="text-2xl md:text-3xl font-black mt-1 uppercase tracking-wider font-mono">Recover System Key</h2>
            <p className="text-xs text-zinc-400 mt-2 font-sans">
              Provide your cybernetic profile email to dispatch your password retrieval instructions:
            </p>
          </div>

          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-zinc-400 font-mono">Registered Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4.5 h-4.5 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="enter your registered email"
                  className={`w-full pl-10 pr-4 py-3 text-sm rounded-xl border font-mono transition outline-none ${
                    isLightMode
                      ? 'bg-white border-zinc-200 text-black focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00]'
                      : 'bg-black/40 border-white/10 text-white focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00]'
                  }`}
                />
              </div>
            </div>

            {forgotError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-150 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0"></span>
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 animate-fadeIn ${
                isLightMode ? 'bg-[#C8FF00]/5 border-zinc-200' : 'bg-white/5 border-white/5'
              }`}>
                <div className="flex items-center gap-2 text-[#C8FF00]">
                  <span className="w-1.5 h-1.5 bg-[#C8FF00] rounded-full shrink-0 animate-ping"></span>
                  <strong className="uppercase text-[9px] tracking-wider font-bold">Safe Security Transmit successful</strong>
                </div>
                <p className="text-zinc-300 font-sans">{forgotSuccess}</p>
                <div className="pt-2 border-t border-white/5 text-[10px] text-zinc-500 font-sans space-y-1">
                  <span className="block font-black uppercase text-zinc-400">📝 Standard Accounts Info:</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <strong className="block text-zinc-400">Member</strong>
                      <span className="font-mono">marcus@gym.com</span><br/>
                      <span className="font-mono text-white/50">password: member123</span>
                    </div>
                    <div>
                      <strong className="block text-zinc-400">Trainer</strong>
                      <span className="font-mono">trainer@gym.com</span><br/>
                      <span className="font-mono text-white/50">password: trainer123</span>
                    </div>
                    <div>
                      <strong className="block text-zinc-400">Admin</strong>
                      <span className="font-mono">admin@gym.com</span><br/>
                      <span className="font-mono text-white/50">password: admin123</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotError(null);
                  setForgotSuccess(null);
                }}
                className={`flex-1 py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-widest text-center transition ${
                  isLightMode
                    ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                    : 'bg-white/5 hover:bg-white/10 text-white'
                }`}
              >
                Back to Login
              </button>
              <button
                type="submit"
                disabled={forgotLoading}
                className="flex-[2] py-3.5 rounded-xl bg-[#C8FF00] hover:bg-[#b0df00] disabled:bg-[#C8FF00]/50 text-black font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-lg shadow-[#C8FF00]/10"
              >
                {forgotLoading ? 'Querying system...' : 'Dispatch Instructions'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-8 min-h-[calc(100vh-140px)] animate-fade-in">
      <div className={`w-full max-w-lg rounded-3xl border p-6 md:p-10 shadow-2xl relative overflow-hidden transition-all duration-300 ${
        isLightMode 
          ? 'bg-white border-zinc-200 text-zinc-800 shadow-zinc-200/50' 
          : 'bg-[#0C0C0E] border-white/10 text-white shadow-black/80'
      }`}>
        {/* Glow accent */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#C2F900] via-[#C8FF00] to-[#E5FF7F]"></div>
        
        {/* Decorative ambient elements */}
        {!isLightMode && (
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#C8FF00]/5 rounded-full blur-[100px] pointer-events-none"></div>
        )}

        <div className="text-center mb-8 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-[#C8FF00]/10 border border-[#C8FF00]/25 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#C8FF00]/5">
            <Sparkles className="w-7 h-7 text-[#C8FF00]" />
          </div>
          <span className="text-[10px] tracking-widest text-[#C8FF00] font-black uppercase">Cybernetic Physical Hub</span>
          <h2 className="text-2xl md:text-3xl font-black mt-1 uppercase tracking-wider font-mono">strive.ai portal</h2>
          <p className="text-xs text-zinc-400 mt-2">
            Securely authenticate to launch your dashboard. All database identities remain hidden until authorized.
          </p>
        </div>

        {/* Portal Selectors */}
        <div className={`grid grid-cols-3 gap-2 p-1.5 rounded-2xl mb-6 border ${
          isLightMode ? 'bg-zinc-100 border-zinc-200' : 'bg-white/5 border-white/5'
        }`}>
          {(['Member', 'Trainer', 'Admin'] as const).map((r) => {
            const isActive = role === r;
            let ActiveIcon = Dumbbell;
            if (r === 'Trainer') ActiveIcon = UserCheck;
            if (r === 'Admin') ActiveIcon = ShieldCheck;

            return (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleChange(r)}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold uppercase tracking-wider flex flex-col sm:flex-row items-center justify-center gap-1.5 transition ${
                  isActive 
                    ? 'bg-[#C8FF00] text-black shadow-md font-black' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <ActiveIcon className="w-3.5 h-3.5" />
                <span>{r}</span>
              </button>
            );
          })}
        </div>

        {/* Information Callout */}
        <div className={`p-4 rounded-2xl mb-6 border text-xs font-sans leading-relaxed ${
          isLightMode 
            ? 'bg-zinc-50 border-zinc-200 text-zinc-600' 
            : 'bg-white/5 border-white/5 text-zinc-400'
        }`}>
          {role === 'Member' && (
            <p>
              🔐 <strong className="text-[#C8FF00]">Member Account:</strong> Marcus Vance. Exposes active gym workout planners, macro diet tracking, and the customizable AI assistant coach.
            </p>
          )}
          {role === 'Trainer' && (
            <p>
              🔐 <strong className="text-[#C8FF00]">Trainer Account:</strong> Sarah Miller. Assign diets & workouts to your active athlete, chat with the AI assistant, and oversee biometric charts.
            </p>
          )}
          {role === 'Admin' && (
            <p>
              🔐 <strong className="text-[#C8FF00]">Admin Account:</strong> Alex Jordan. Comprehensive user directory manager, financial ledger charts, facility logs, and master configuration dashboard.
            </p>
          )}
        </div>

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-zinc-400 font-mono">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4.5 h-4.5 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@gym.com"
                className={`w-full pl-10 pr-4 py-3 text-sm rounded-xl border font-mono transition outline-none ${
                  isLightMode
                    ? 'bg-white border-zinc-200 text-black focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00]'
                    : 'bg-black/40 border-white/10 text-white focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00]'
                }`}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 font-mono">Secret Password</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email); // Prepopulate with email entered so far
                  setShowForgotPassword(true);
                }}
                className="text-[10px] uppercase font-bold text-[#C8FF00] hover:underline transition font-mono"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4.5 h-4.5 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className={`w-full pl-10 pr-12 py-3 text-sm rounded-xl border font-mono transition outline-none ${
                  isLightMode
                    ? 'bg-white border-zinc-200 text-black focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00]'
                    : 'bg-black/40 border-white/10 text-white focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-[#C8FF00] transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0"></span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 ${
              loading 
                ? 'bg-[#C8FF00]/50 text-black cursor-not-allowed' 
                : 'bg-[#C8FF00] hover:bg-[#b0df00] text-black shadow-lg shadow-[#C8FF00]/10 hover:translate-y-[-1px]'
            }`}
          >
            {loading ? 'Authenticating System...' : `Access ${role} Portal`}
          </button>
        </form>

        {/* Credentials hints footer */}
        <div className={`mt-8 pt-6 border-t text-center text-[11px] font-sans ${
          isLightMode ? 'border-zinc-100 text-zinc-500' : 'border-white/5 text-zinc-500'
        }`}>
          <p className="font-semibold mb-2">⚡ DEMONSTRATION DISCLOSURES</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-2">
            <div className={`p-2 rounded-lg border ${isLightMode ? 'bg-zinc-50 border-zinc-100' : 'bg-white/5 border-white/5'}`}>
              <div className="font-bold text-zinc-400 uppercase text-[9px]">Member</div>
              <div className="text-zinc-500 font-mono">marcus@gym.com</div>
              <div className="text-zinc-500 font-mono">member123</div>
            </div>
            <div className={`p-2 rounded-lg border ${isLightMode ? 'bg-zinc-50 border-zinc-100' : 'bg-white/5 border-white/5'}`}>
              <div className="font-bold text-zinc-400 uppercase text-[9px]">Trainer</div>
              <div className="text-zinc-500 font-mono">trainer@gym.com</div>
              <div className="text-zinc-500 font-mono">trainer123</div>
            </div>
            <div className={`p-2 rounded-lg border ${isLightMode ? 'bg-zinc-50 border-zinc-100' : 'bg-white/5 border-white/5'}`}>
              <div className="font-bold text-zinc-400 uppercase text-[9px]">Admin</div>
              <div className="text-zinc-500 font-mono">admin@gym.com</div>
              <div className="text-zinc-500 font-mono">admin123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
