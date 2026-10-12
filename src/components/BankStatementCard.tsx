import { motion } from 'framer-motion';
import { Building2, Calendar, TrendingUp, TrendingDown, Wallet, ArrowUpDown, Receipt, IndianRupee, ShieldCheck } from 'lucide-react';

export interface BankSummaryData {
  personEntity: string;
  period: string;
  openingBalance: string;
  totalCredits: string;
  totalDebits: string;
  closingBalance: string;
  estimatedAnnualIncome: string;
  estimatedTax: string;
}

interface BankStatementCardProps {
  data: BankSummaryData;
  filename?: string;
}

const StatRow = ({
  icon: Icon,
  label,
  value,
  colorClass,
  bgClass,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  colorClass: string;
  bgClass: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3, delay }}
    className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 ${bgClass} border border-white/5`}
  >
    <div className="flex items-center gap-2.5">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colorClass} bg-current/10 shrink-0`}>
        <Icon size={14} className="text-current opacity-90" style={{ color: 'inherit' }} />
      </div>
      <span className="text-xs text-slate-300 font-medium">{label}</span>
    </div>
    <span className={`text-xs font-bold font-mono-num ${colorClass}`}>{value}</span>
  </motion.div>
);

const BankStatementCard = ({ data, filename }: BankStatementCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mt-3 rounded-2xl border border-white/10 bg-[#0E1524] overflow-hidden shadow-2xl relative"
    >
      {/* Top accent light */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

      {/* Card Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border-b border-white/[0.08] flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 text-white">
            <Building2 size={17} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                AUDITED BANK STATEMENT
              </span>
              <ShieldCheck size={11} className="text-emerald-400" />
            </div>
            <p className="text-sm font-bold text-white leading-tight mt-0.5">
              {data.personEntity !== 'N/A' ? data.personEntity : filename ?? 'Taxpayer Statement'}
            </p>
          </div>
        </div>

        {data.period !== 'N/A' && (
          <div className="flex items-center gap-1.5 bg-[#070B13] border border-white/10 rounded-lg px-2.5 py-1 shrink-0">
            <Calendar size={11} className="text-slate-400" />
            <span className="text-[10px] font-mono text-slate-300 font-medium">{data.period}</span>
          </div>
        )}
      </div>

      {/* 4 Financial Metrics Grid */}
      <div className="p-4 space-y-2">
        <StatRow
          icon={Wallet}
          label="Opening Balance"
          value={data.openingBalance}
          colorClass="text-slate-200"
          bgClass="bg-[#070B13]/70"
          delay={0.05}
        />
        <StatRow
          icon={TrendingUp}
          label="Total Inflow (Credits)"
          value={data.totalCredits}
          colorClass="text-emerald-400"
          bgClass="bg-emerald-500/10 border-emerald-500/20"
          delay={0.1}
        />
        <StatRow
          icon={TrendingDown}
          label="Total Outflow (Debits)"
          value={data.totalDebits}
          colorClass="text-rose-400"
          bgClass="bg-rose-500/10 border-rose-500/20"
          delay={0.15}
        />

        <div className="border-t border-white/[0.08] my-1" />

        <StatRow
          icon={ArrowUpDown}
          label="Closing Balance"
          value={data.closingBalance}
          colorClass="text-cyan-400"
          bgClass="bg-cyan-500/10 border-cyan-500/20"
          delay={0.2}
        />
      </div>

      {/* Tax Estimate Section */}
      {(data.estimatedAnnualIncome !== 'N/A' || data.estimatedTax !== 'N/A') &&
        (data.estimatedAnnualIncome !== '₹0' || data.estimatedTax !== '₹0') && (
          <div className="border-t border-white/[0.08] bg-[#070B13]/60">
            <div className="px-4 py-2 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-400">
                PROVISIONAL TAX LIABILITY · NEW REGIME FY 2025-26
              </span>
              <span className="text-[9px] font-mono text-slate-500">u/s 115BAC</span>
            </div>
            <div className="px-4 pb-4 pt-2 space-y-2">
              <StatRow
                icon={IndianRupee}
                label="Estimated Annual Gross Income"
                value={data.estimatedAnnualIncome}
                colorClass="text-amber-300"
                bgClass="bg-amber-500/10 border-amber-500/20"
                delay={0.25}
              />
              <StatRow
                icon={Receipt}
                label="Estimated Income Tax (incl. 4% Cess)"
                value={data.estimatedTax}
                colorClass="text-amber-400"
                bgClass="bg-amber-500/15 border-amber-500/30 font-bold"
                delay={0.3}
              />
            </div>
          </div>
        )}
    </motion.div>
  );
};

export default BankStatementCard;
