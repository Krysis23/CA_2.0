import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Trash2, ArrowLeft, FileSpreadsheet, Zap, FileText, CheckCircle2, ShieldCheck, Sparkles, FolderLock } from "lucide-react";
import Logo from "@/components/Logo";

interface RecentSession {
  id: string;
  date: string;
  itrForm: string | null;
  fields: number;
  stage: string;
}

const SESSIONS_KEY = "ca_agent_itr_sessions";

function loadSessions(): RecentSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

interface EntryCardProps {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: "emerald" | "indigo" | "amber";
  cta: string;
  ctaGradient: string;
}

function EntryCard({
  to,
  icon,
  title,
  description,
  badge,
  badgeColor = "emerald",
  cta,
  ctaGradient,
}: EntryCardProps) {
  const badgeStyles = {
    emerald: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
    indigo: "bg-indigo-500/15 border-indigo-500/30 text-indigo-300",
    amber: "bg-amber-500/15 border-amber-500/30 text-amber-300",
  };

  return (
    <Link
      to={to}
      className="glass-card rounded-2xl p-6 flex flex-col justify-between border border-white/[0.08] hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 group relative overflow-hidden"
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-[#0E1524] border border-white/10 flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-md">
            {icon}
          </div>
          {badge && (
            <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${badgeStyles[badgeColor]}`}>
              {badge}
            </span>
          )}
        </div>

        <div>
          <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors font-display">
            {title}
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="pt-6">
        <div
          className={`w-full py-2.5 px-4 rounded-xl text-center text-xs font-bold text-white shadow-lg ${ctaGradient} transition-all duration-300 group-hover:shadow-emerald-500/25 flex items-center justify-center gap-2`}
        >
          {cta}
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </div>
      </div>
    </Link>
  );
}

export default function ITRHubPage() {
  const [sessions, setSessions] = useState<RecentSession[]>([]);
  const currentYear = new Date().getFullYear();
  const assessmentYear = `AY ${currentYear}-${String(currentYear + 1).slice(2)}`;

  useEffect(() => {
    setSessions(loadSessions().slice(0, 3));
  }, []);

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    try {
      const raw = localStorage.getItem(SESSIONS_KEY);
      if (raw) {
        let allSessions = JSON.parse(raw);
        allSessions = allSessions.filter((s: any) => s.id !== id);
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(allSessions));
        setSessions(allSessions.slice(0, 3));
      }
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#070B13] text-white p-5 lg:p-8 overflow-y-auto scrollbar-thin fin-grid-pattern">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col gap-3 pb-4 border-b border-white/[0.08]">
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors w-fit p-1.5 rounded-lg hover:bg-white/5"
          >
            <ArrowLeft size={15} /> Back to Audit Workspace
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Logo size="sm" />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold">
                  ITR FILING PORTAL
                </span>
              </div>
              <h1 className="text-2xl font-black text-white font-display">
                Guided Tax Return Filing Hub
              </h1>
              <p className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">
                MULTI-DOCUMENT FINANCIAL REASONING AND GUIDED TAX FILING · {assessmentYear}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-slate-300 font-mono">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Assessment Year: {assessmentYear}</span>
            </div>
          </div>
        </div>

        {/* 2 Entry Points */}
        <div className="space-y-3">
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Select Filing Mode
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <EntryCard
              to="/itr-chat"
              badge="Recommended · Guided"
              badgeColor="indigo"
              cta="Start Guided Assistant"
              ctaGradient="bg-gradient-to-r from-indigo-600 via-indigo-500 to-teal-500 hover:from-indigo-500 hover:to-teal-400"
              icon={<FileSpreadsheet size={22} className="text-indigo-400" />}
              title="Interactive ITR Copilot"
              description="Guided multi-step questionnaire that inspects your salary, rental, business, and capital gains. Automatically classifies ITR-1 through ITR-4 and exports your pre-fill checklist."
            />

            <EntryCard
              to="/itr"
              badge="Instant · 30 Seconds"
              badgeColor="emerald"
              cta="Quick Statement Analyse"
              ctaGradient="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400"
              icon={<Zap size={22} className="text-emerald-400" />}
              title="Quick ITR Statement Drop"
              description="Upload your bank statement PDF directly. FinPilot extracts income metrics, computes deductions, and immediately renders your required filing disclosures."
            />
          </div>
        </div>

        {/* What to Keep Ready Checklist */}
        <div className="glass-card rounded-2xl p-6 border border-white/[0.08] shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <FolderLock size={16} className="text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Statutory Documentation Readiness
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              { title: "Form 16 / 16A", desc: "TDS certificates from employer or deductors" },
              { title: "Bank Statements", desc: "Annual statement covering 1st April to 31st March" },
              { title: "Annual Information Statement (AIS)", desc: "Download from Income Tax e-filing portal" },
              { title: "Investment & Exemption Proofs", desc: "PPF, ELSS, Insurance receipts u/s 80C, 80D" },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-xl bg-[#0E1524] border border-white/[0.06] flex items-start gap-2.5">
                <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-white">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sessions */}
        {sessions.length > 0 && (
          <div className="glass-card rounded-2xl p-6 border border-white/[0.08] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                Recent Filing Sessions
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Stored Locally</span>
            </div>

            <div className="space-y-2">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#0E1524] border border-white/[0.06] hover:border-white/15 transition-all text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={15} className="text-indigo-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">
                        {sess.itrForm ? `Filing for ${sess.itrForm}` : "In-Progress Return Session"}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                        {new Date(sess.date).toLocaleDateString()} · {sess.fields} fields collected · Stage: {sess.stage}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/itr-chat?sessionId=${sess.id}`}
                      className="px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition-colors border border-emerald-500/25"
                    >
                      Resume
                    </Link>
                    <button
                      onClick={(e) => deleteSession(e, sess.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete session"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
