import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, UserPlus, Lock, Mail, User, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import { toast } from 'sonner';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { signup, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/chat', { replace: true });
    }
  }, [user, navigate]);

  const getPasswordStrength = () => {
    if (!password) return { level: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const levels = [
      { level: 1, label: 'Weak', color: 'bg-rose-500 text-rose-400' },
      { level: 2, label: 'Fair', color: 'bg-amber-500 text-amber-400' },
      { level: 3, label: 'Good', color: 'bg-teal-500 text-teal-400' },
      { level: 4, label: 'Strong', color: 'bg-emerald-500 text-emerald-400' },
    ];
    return levels[score - 1] || { level: 0, label: '', color: '' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await signup(name, email, password);
      toast.success('Account created successfully! Welcome to FINPILOT.');
      navigate('/chat');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    }
  };

  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#070B13] p-4 lg:p-8 overflow-hidden fin-grid-pattern">
      {/* Ambient Glow Orbs */}
      <div className="absolute top-1/4 -right-20 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="w-full max-w-5xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side Hero */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-6 space-y-6 text-left hidden lg:block"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold tracking-wider uppercase font-mono">
            <ShieldCheck size={14} className="text-cyan-400" />
            Secure Tax Practice Engine
          </div>

          <div className="space-y-2">
            <Logo size="lg" />
            <p className="text-xs font-mono font-bold tracking-[0.2em] text-emerald-400/90 uppercase">
              MULTI-DOCUMENT FINANCIAL REASONING AND GUIDED TAX FILING
            </p>
          </div>

          <p className="text-sm text-slate-400 leading-relaxed max-w-lg">
            Empower your practice with autonomous bank statement cross-analysis, IsolationForest transaction flagging, and verified statutory citations under the Income Tax Act 1961.
          </p>

          <div className="space-y-3 pt-2 text-sm text-slate-300">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 size={13} className="text-emerald-400" />
              </div>
              <span className="text-xs text-slate-300">End-to-End rolling memory summarization (Gemini Flash)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 size={13} className="text-cyan-400" />
              </div>
              <span className="text-xs text-slate-300">FastAPI RAG pipeline with dense & rerank retrieval</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 size={13} className="text-indigo-400" />
              </div>
              <span className="text-xs text-slate-300">Guided ITR-1 to 4 form classification & checklist export</span>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Register Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-6 w-full max-w-md mx-auto"
        >
          <div className="text-center mb-6 lg:hidden">
            <div className="flex justify-center mb-3">
              <Logo size="md" />
            </div>
            <p className="text-[10px] font-mono tracking-wider text-emerald-400 uppercase font-semibold">
              MULTI-DOCUMENT FINANCIAL REASONING AND GUIDED TAX FILING
            </p>
          </div>

          <div className="glass-card rounded-2xl p-7 lg:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-500" />

            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-white font-display">Create Account</h2>
              <p className="text-xs text-slate-400 mt-1">Get started with institutional financial reasoning</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl p-3 text-xs flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 tracking-wide uppercase font-mono">
                  Full Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Parth Borkute, CA"
                    className="w-full bg-[#0A0F1D]/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 tracking-wide uppercase font-mono">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="parth@firm.com"
                    className="w-full bg-[#0A0F1D]/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 tracking-wide uppercase font-mono">
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full bg-[#0A0F1D]/80 border border-white/10 rounded-xl pl-10 pr-10 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {password && (
                  <div className="mt-1.5 flex items-center justify-between text-[11px]">
                    <div className="flex gap-1 items-center flex-1 mr-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${
                            i <= strength.level ? strength.color.split(' ')[0] : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`font-mono text-[10px] ${strength.color.split(' ')[1]}`}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 tracking-wide uppercase font-mono">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full bg-[#0A0F1D]/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 relative group overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-typing" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-typing" style={{ animationDelay: '0.2s' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-typing" style={{ animationDelay: '0.4s' }} />
                    <span className="text-xs font-mono ml-1">CREATING ACCOUNT...</span>
                  </div>
                ) : (
                  <>
                    <UserPlus size={16} className="transition-transform group-hover:translate-x-0.5" />
                    Complete Registration
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-white/[0.08] text-center">
              <p className="text-xs text-slate-400">
                Already registered?{' '}
                <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
