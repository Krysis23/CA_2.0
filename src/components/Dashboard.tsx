import { useState, useRef, useEffect } from "react";
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
import { ChevronDown, FileText, TrendingUp, TrendingDown, Banknote, Receipt } from "lucide-react";

const COLORS = ["#10b981", "#f43f5e", "#f59e0b", "#6366f1"];

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

// ── FlatDoc: doc + which chat it came from ───────────────────────────────────
interface FlatDoc extends UploadedDocItem {
  chatTitle: string;
}

// ── Dropdown ─────────────────────────────────────────────────────────────────
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
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted/60 transition-colors text-sm font-medium text-foreground shadow-sm min-w-[220px] max-w-xs"
      >
        <FileText size={14} className="text-primary shrink-0" />
        <span className="truncate flex-1 text-left">{label}</span>
        <ChevronDown
          size={14}
          className={`text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-full min-w-[220px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
          {docs.map((doc, i) => (
            <button
              key={i}
              onClick={() => { onSelect(i); setOpen(false); }}
              className={`w-full flex items-start gap-2 px-3 py-2.5 text-left transition-colors
                ${i === selected
                  ? "bg-primary/10"
                  : "hover:bg-muted/60"}`}
            >
              <FileText size={13} className={`mt-0.5 shrink-0 ${i === selected ? "text-primary" : "text-muted-foreground"}`} />
              <div className="min-w-0">
                <p className={`text-sm truncate ${i === selected ? "text-primary font-semibold" : "text-foreground"}`}>
                  {doc.filename ?? `Statement ${i + 1}`}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{doc.chatTitle}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon: Icon,
  accentBg,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accentBg: string;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accentBg}`}>
        <Icon size={17} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground font-medium truncate">{label}</p>
        <p className="text-sm font-bold text-foreground tabular-nums mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { conversations } = useChat();
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Flatten every uploaded doc across ALL conversations
  const docs: FlatDoc[] = conversations.flatMap((conv) =>
    (conv.uploadedDocs ?? []).map((d) => ({
      ...d,
      chatTitle: conv.title || "Untitled Chat",
    }))
  );

  const safeIdx = Math.min(selectedIdx, Math.max(0, docs.length - 1));

  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <FileText size={22} className="text-primary" />
        </div>
        <p className="text-sm font-medium text-foreground">No statements uploaded yet</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Upload a bank statement in the chat to see its financial visualisation here.
        </p>
      </div>
    );
  }

  const doc = docs[safeIdx];
  const { totalCredits, totalDebits, estimatedTax } = getDocMetrics(doc);
  const netCashFlow = totalCredits - totalDebits;

  const barData = [
    { name: "Credits", value: totalCredits, fill: "#10b981" },
    { name: "Debits",  value: totalDebits,  fill: "#f43f5e" },
    { name: "Est. Tax", value: estimatedTax, fill: "#f59e0b" },
  ];

  const pieData = [
    { name: "Net Income",   value: Math.max(0, netCashFlow) },
    { name: "Total Debits", value: totalDebits },
    ...(estimatedTax > 0 ? [{ name: "Est. Tax", value: estimatedTax }] : []),
  ].filter((d) => d.value > 0);

  return (
    <div className="p-5 space-y-5 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Financial Overview</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {docs.length} statement{docs.length !== 1 ? "s" : ""} — select one to inspect
          </p>
        </div>
        <StatementDropdown docs={docs} selected={safeIdx} onSelect={setSelectedIdx} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Total Credits"     value={fmt(totalCredits)}  icon={TrendingUp}   accentBg="bg-emerald-500" />
        <KpiCard label="Total Debits"      value={fmt(totalDebits)}   icon={TrendingDown} accentBg="bg-rose-500" />
        <KpiCard label="Net Cash Flow"     value={fmt(netCashFlow)}   icon={Banknote}     accentBg={netCashFlow >= 0 ? "bg-primary" : "bg-orange-500"} />
        <KpiCard label="Est. Tax (FY 25-26)" value={fmt(estimatedTax)} icon={Receipt}     accentBg="bg-amber-500" />
      </div>

      {/* Bar chart */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Credits · Debits · Tax
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={64}
              tickFormatter={(v) => "₹" + Number(v).toLocaleString("en-IN")}
            />
            <Tooltip
              contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid var(--border)" }}
              formatter={(v: unknown) => fmt(Number(v))}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {barData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie chart */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Income Distribution
        </p>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) =>
                  percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
                }
                labelLine={false}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid var(--border)" }}
                formatter={(v: unknown) => fmt(Number(v))}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">
            No data to display
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground text-right pr-1">
        Showing: <span className="font-medium text-foreground">{doc.filename}</span>
      </p>
    </div>
  );
}
