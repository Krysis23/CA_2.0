import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, Lock, Mail, ShieldCheck, FileSpreadsheet, Network, Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/chat', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    try {
      await login(email, password);
      toast.success('Welcome back to FINPILOT!');
      navigate('/chat');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#070B13] p-4 lg:p-8 overflow-hidden fin-grid-pattern">
      {/* Dynamic Ambient Glow Backdrops */}
      <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-600/5 rounded-full blur-[180px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-5xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Financial Capabilities & Brand Hero */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-6 space-y-6 text-left hidden lg:block"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wider uppercase font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Institutional Financial Copilot v2.0
          </div>

          <div className="space-y-2">
            <Logo size="lg" />
            <p className="text-xs font-mono font-bold tracking-[0.2em] text-emerald-400/90 uppercase">
              MULTI-DOCUMENT FINANCIAL REASONING AND GUIDED TAX FILING
            </p>
          </div>

          <p className="text-sm text-slate-400 leading-relaxed max-w-lg">
            High-precision statutory analysis engine for Indian Income Tax & GST. Ingest bank statements, detect audit anomalies, and execute guided return filings with verified legal citations.
          </p>

          {/* Capabilities Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              {
                icon: FileSpreadsheet,
                title: 'Multi-Doc Ingestion',
                desc: 'Consolidated statement cashflows',
                color: 'text-emerald-400',
                border: 'border-emerald-500/20 bg-emerald-500/5',
              },
              {
                icon: TrendingUp,
                title: 'IsolationForest ML',
                desc: 'Unsupervised outlier audit checks',
                color: 'text-cyan-400',
                border: 'border-cyan-500/20 bg-cyan-500/5',
              },
              {
                icon: Network,
                title: 'GraphRAG Legal Tree',
                desc: 'Section cross-reference traversal',
                color: 'text-indigo-400',
                border: 'border-indigo-500/20 bg-indigo-500/5',
              },
              {
                icon: ShieldCheck,
                title: 'Guided ITR Agent',
                desc: 'Automated ITR-1 to 4 classification',
                color: 'text-teal-400',
                border: 'border-teal-500/20 bg-teal-500/5',
              },
            ].map((feat, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-xl border ${feat.border} backdrop-blur-sm transition-all hover:border-white/20`}
              >
                <feat.icon size={18} className={`${feat.color} mb-2`} />
                <h4 className="text-xs font-bold text-white">{feat.title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{feat.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 pt-2 text-xs text-slate-500 font-mono">
            <span>• ICAI Curriculum Aligned</span>
            <span>• Section 44AD / 115BAC Verified</span>
          </div>
        </motion.div>

        {/* Right Side: Authentication Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-6 w-full max-w-md mx-auto"
        >
          {/* Mobile Header */}
          <div className="text-center mb-6 lg:hidden">
            <div className="flex justify-center mb-3">
              <Logo size="md" />
            </div>
            <p className="text-[10px] font-mono tracking-wider text-emerald-400 uppercase font-semibold">
              MULTI-DOCUMENT FINANCIAL REASONING AND GUIDED TAX FILING
            </p>
          </div>

          <div className="glass-card rounded-2xl p-7 lg:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-500" />

            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-white font-display">Sign In</h2>
              <p className="text-xs text-slate-400 mt-1">Access your audit workspace and tax filing sessions</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 tracking-wide uppercase font-mono">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="accountant@firm.com"
                    className="w-full bg-[#0A0F1D]/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all font-sans"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase font-mono">
                    Password
                  </label>
                  <button type="button" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#0A0F1D]/80 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-[#0A0F1D] accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-400">Remember credentials</span>
                </label>
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
                    <span className="text-xs font-mono ml-1">AUTHENTICATING...</span>
                  </div>
                ) : (
                  <>
                    <LogIn size={16} className="transition-transform group-hover:translate-x-0.5" />
                    Launch Workspace
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-white/[0.08] text-center">
              <p className="text-xs text-slate-400">
                New to FINPILOT?{' '}
                <Link to="/signup" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                  Create Audit Account
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
