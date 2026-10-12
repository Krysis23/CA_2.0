import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useChat, type UploadedDocItem } from "../contexts/ChatContext";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  ChevronDown,
  FileText,
  TrendingUp,
  TrendingDown,
  Banknote,
  Receipt,
  ArrowLeft,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import Logo from "./Logo";

const COLORS = ["#10B981", "#F43F5E", "#F59E0B", "#06B6D4", "#6366F1"];

function getDocMetrics(doc: UploadedDocItem) {
  if (doc.totalCredits != null || doc.totalDebits != null || doc.estimatedTax != null) {
    return {
      totalCredits: doc.totalCredits ?? 0,
      totalDebits: doc.totalDebits ?? 0,
      estimatedTax: doc.estimatedTax ?? 0,
    };
  }
  const structured = doc.doc_data as Record<string, unknown> | undefined;
  const bank = structured?.bank as Record<string, unknown> | undefined;
  return {
    totalCredits: Number(bank?.total_credits ?? structured?.total_credits ?? 0) || 0,
    totalDebits: Number(bank?.total_debits ?? structured?.total_debits ?? 0) || 0,
    estimatedTax: Number(structured?.estimated_tax_new_regime_fy_2025_26 ?? 0) || 0,
  };
}

function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

interface FlatDoc extends UploadedDocItem {
  chatTitle: string;
}

function StatementDropdown({
  docs,
  selected,
  onSelect,
}: {
  docs: FlatDoc[];
  selected: number;
  onSelect: (i: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected_doc = docs[selected];
  const label = selected_doc?.filename ?? `Statement ${selected + 1}`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-white/10 bg-[#0E1524] hover:bg-[#131D31] transition-all text-xs font-semibold text-white shadow-lg min-w-[220px] max-w-xs"
      >
        <FileText size={15} className="text-emerald-400 shrink-0" />
        <span className="truncate flex-1 text-left">{label}</span>
        <ChevronDown
          size={14}
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-full min-w-[240px] bg-[#0E1524] border border-white/15 rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto scrollbar-thin p-1">
          {docs.map((doc, i) => (
            <button
              key={i}
              onClick={() => {
                onSelect(i);
                setOpen(false);
              }}
              className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
                i === selected
                  ? "bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/20"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <FileText size={14} className={`mt-0.5 shrink-0 ${i === selected ? "text-emerald-400" : "text-slate-400"}`} />
              <div className="min-w-0">
                <p className="text-xs truncate">{doc.filename ?? `Statement ${i + 1}`}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{doc.chatTitle}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  accentColor,
  bgAccent,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accentColor: string;
  bgAccent: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-4 border border-white/[0.08] relative overflow-hidden group hover:border-white/20 transition-all">
      <div className={`w-8 h-8 rounded-xl ${bgAccent} flex items-center justify-center ${accentColor} mb-3 shadow-md`}>
        <Icon size={16} />
      </div>
      <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={`text-lg sm:text-xl font-bold font-mono-num mt-1 ${accentColor}`}>{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { conversations } = useChat();
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Flatten every uploaded doc across ALL conversations
  const docs: FlatDoc[] = conversations.flatMap((conv) =>
    (conv.uploadedDocs ?? []).map((d) => ({
      ...d,
      chatTitle: conv.title || "Untitled Audit",
    }))
  );

  const safeIdx = Math.min(selectedIdx, Math.max(0, docs.length - 1));

  if (docs.length === 0) {
    return (
      <div className="min-h-screen bg-[#070B13] p-6 flex flex-col fin-grid-pattern">
        <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-xl shadow-emerald-500/15">
            <BarChart3 size={32} />
          </div>
          <h2 className="text-xl font-bold text-white font-display">No Statements Uploaded Yet</h2>
          <p className="text-xs text-slate-400 max-w-md mt-1 mb-6 leading-relaxed">
            Upload bank statements or financial PDFs in the FinPilot workspace to unlock real-time multi-document analytics, income distribution, and tax visualisations.
          </p>
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
          >
            <ArrowLeft size={14} />
            Go to Audit Workspace
          </Link>
        </div>
      </div>
    );
  }

  const doc = docs[safeIdx];
  const { totalCredits, totalDebits, estimatedTax } = getDocMetrics(doc);
  const netCashFlow = totalCredits - totalDebits;

  const barData = [
    { name: "Total Credits", value: totalCredits, fill: "#10B981" },
    { name: "Total Debits",  value: totalDebits,  fill: "#F43F5E" },
    { name: "Est. Tax",      value: estimatedTax, fill: "#F59E0B" },
  ];

  const pieData = [
    { name: "Net Income",   value: Math.max(0, netCashFlow) },
    { name: "Total Debits", value: totalDebits },
    ...(estimatedTax > 0 ? [{ name: "Est. Tax", value: estimatedTax }] : []),
  ].filter((d) => d.value > 0);

  return (
    <div className="min-h-screen bg-[#070B13] text-white p-5 lg:p-8 space-y-6 overflow-y-auto scrollbar-thin fin-grid-pattern">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <Link
              to="/chat"
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white transition-colors"
              title="Return to Chat"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Logo size="sm" />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                  ANALYTICS ENGINE
                </span>
              </div>
              <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase mt-0.5">
                MULTI-DOCUMENT FINANCIAL REASONING AND GUIDED TAX FILING
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatementDropdown docs={docs} selected={safeIdx} onSelect={setSelectedIdx} />
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <KpiCard
            label="Total Inflow (Credits)"
            value={fmt(totalCredits)}
            icon={TrendingUp}
            accentColor="text-emerald-400"
            bgAccent="bg-emerald-500/15"
          />
          <KpiCard
            label="Total Outflow (Debits)"
            value={fmt(totalDebits)}
            icon={TrendingDown}
            accentColor="text-rose-400"
            bgAccent="bg-rose-500/15"
          />
          <KpiCard
            label="Net Operating Cash Flow"
            value={fmt(netCashFlow)}
            icon={Banknote}
            accentColor={netCashFlow >= 0 ? "text-cyan-400" : "text-amber-400"}
            bgAccent={netCashFlow >= 0 ? "bg-cyan-500/15" : "bg-amber-500/15"}
          />
          <KpiCard
            label="Est. Tax Liability (FY 25-26)"
            value={fmt(estimatedTax)}
            icon={Receipt}
            accentColor="text-amber-400"
            bgAccent="bg-amber-500/15"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Bar Chart: Credits vs Debits vs Tax */}
          <div className="lg:col-span-7 glass-card rounded-2xl p-5 border border-white/[0.08] shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Cashflow Flow Breakdown
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Statement: {doc.filename}</span>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
                    contentStyle={{
                      backgroundColor: "#0E1524",
                      borderRadius: 12,
                      fontSize: 12,
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#FFFFFF",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                    }}
                    formatter={(v: unknown) => [fmt(Number(v)), "Amount"]}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={60}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart: Income Distribution */}
          <div className="lg:col-span-5 glass-card rounded-2xl p-5 border border-white/[0.08] shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PieIcon size={16} className="text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Fund Distribution Ratio
                </h3>
              </div>
            </div>

            <div className="h-64 flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ percent }) => (percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : "")}
                      labelLine={false}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0E1524",
                        borderRadius: 12,
                        fontSize: 12,
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        color: "#FFFFFF",
                      }}
                      formatter={(v: unknown) => [fmt(Number(v)), "Value"]}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#94A3B8" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-xs text-slate-500 font-mono">No positive distribution data</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Document Details */}
        <div className="p-3.5 rounded-xl border border-white/[0.08] bg-[#0E1524]/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Extracted with Multimodal Gemini 1.5 Vision &amp; IsolationForest Verified</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            Audit Source: <span className="text-slate-300 font-semibold">{doc.filename}</span>
          </span>
        </div>

      </div>
    </div>
  );
}
