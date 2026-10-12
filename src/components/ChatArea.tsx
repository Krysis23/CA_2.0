import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trash2,
  LogOut,
  User,
  ChevronDown,
  TrendingUp,
  Receipt,
  AlertTriangle,
  Scale,
  Sparkles,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import Logo from './Logo';

const ChatArea = () => {
  const { activeConversation, clearChat, sendMessage, isProcessing } = useChat();
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const suggestions = [
    {
      title: 'Analyze Statement & Cashflow',
      desc: 'Calculate total credits, debits & net cashflow from bank PDF',
      icon: TrendingUp,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      prompt: 'Analyze my bank statement, verify cash flows, and summarize income figures.',
    },
    {
      title: 'Compute Tax & Slabs (FY 25-26)',
      desc: 'Compare tax liability under New Regime u/s 115BAC vs Old Regime',
      icon: Receipt,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      prompt: 'Calculate estimated tax liability for FY 2025-26 comparing both new and old regimes.',
    },
    {
      title: 'Audit Outliers & Anomalies',
      desc: 'Run IsolationForest to flag statistically unusual transactions',
      icon: AlertTriangle,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      prompt: 'Scan extracted transactions for potential audit flags and unusual amounts.',
    },
    {
      title: 'Presumptive Taxation u/s 44AD',
      desc: 'Verify eligibility, turnover thresholds and 8%/6% profit declaration',
      icon: Scale,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      prompt: 'Explain the rules, limits and tax benefits under Section 44AD presumptive scheme.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-screen min-w-0 bg-[#070B13] relative overflow-hidden fin-grid-pattern">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-1/3 w-[600px] h-[350px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-[500px] h-[400px] bg-cyan-500/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="h-16 border-b border-white/[0.08] bg-[#0A0F1D]/80 backdrop-blur-xl flex items-center justify-between px-5 shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          {activeConversation ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <h2 className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md font-sans">
                {activeConversation.title || 'Financial Reasoning Session'}
              </h2>
              <span className="hidden sm:inline-block text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                FY 2025-26
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Logo size="sm" />
            </div>
          )}
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {activeConversation && activeConversation.messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all flex items-center gap-1.5 text-xs"
              title="Clear current audit messages"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Clear Audit</span>
            </button>
          )}

          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
                <User size={13} />
              </div>
              <span className="text-xs font-semibold text-slate-200 hidden sm:block">{user?.name || 'Accountant'}</span>
              <ChevronDown size={13} className="text-slate-400" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute right-0 top-full mt-2 z-50 w-52 glass-card rounded-2xl border border-white/15 shadow-2xl overflow-hidden p-1.5"
                >
                  <div className="px-3 py-2.5 border-b border-white/[0.08]">
                    <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 mt-1 text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-500/15 rounded-xl transition-colors font-medium"
                  >
                    <LogOut size={13} />
                    Sign Out
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 lg:p-6 z-10">
        {!activeConversation || activeConversation.messages.length === 0 ? (
          /* FinPilot Welcome Hero */
          <div className="min-h-full flex items-center justify-center py-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-2xl px-4 space-y-6"
            >
              {/* Emblem / Badge */}
              <div className="relative inline-flex items-center justify-center">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-3xl blur-xl animate-pulse" />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-emerald-500/25 border border-white/20 relative z-10">
                  <Sparkles size={28} className="text-white" />
                </div>
              </div>

              {/* Brand Title & Subline */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-display">
                  FIN<span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">PILOT</span>
                </h1>
                <p className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.22em] text-emerald-400 uppercase">
                  MULTI-DOCUMENT FINANCIAL REASONING AND GUIDED TAX FILING
                </p>
                <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed pt-1">
                  Upload bank statements, P&amp;L reports, or ask complex queries on the Income Tax Act 1961, GST, and audit compliance.
                </p>
              </div>

              {/* Interactive Suggestion Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
                {suggestions.map((item, idx) => (
                  <motion.button
                    key={idx}
                    type="button"
                    disabled={isProcessing}
                    onClick={() => sendMessage(item.prompt)}
                    whileHover={{ scale: 1.015, y: -2 }}
                    whileTap={{ scale: 0.985 }}
                    className="p-4 rounded-2xl border border-white/[0.08] bg-[#0E1524]/80 hover:bg-[#131D31] hover:border-emerald-500/40 text-left transition-all duration-200 group shadow-md disabled:opacity-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl border ${item.color} shrink-0 group-hover:scale-110 transition-transform`}>
                        <item.icon size={17} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Trust & Architecture Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center gap-2 text-[10px] font-mono text-slate-400">
                <span className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-emerald-400" />
                  ICAI Curriculum Grounded
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center gap-1.5">
                  <FileCheck2 size={12} className="text-cyan-400" />
                  Multimodal Gemini 1.5
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center gap-1.5">
                  <Scale size={12} className="text-indigo-400" />
                  IsolationForest Anomaly ML
                </span>
              </div>
            </motion.div>
          </div>
        ) : (
          /* Active Messages Stream */
          <div className="max-w-4xl mx-auto space-y-4">
            {activeConversation.messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Command Bar */}
      <ChatInput />
    </div>
  );
};

export default ChatArea;
