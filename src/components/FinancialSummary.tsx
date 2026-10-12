import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Receipt } from 'lucide-react';
import { FinancialData } from '@/contexts/ChatContext';

interface FinancialSummaryProps {
  data: FinancialData;
  isLoading?: boolean;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const FinancialSummary = ({ data, isLoading }: FinancialSummaryProps) => {
  if (isLoading) {
    return (
      <div className="my-3 p-4 bg-[#0E1524] border border-white/10 rounded-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 p-3 bg-white/[0.02] rounded-xl">
              <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
              <div className="h-6 w-28 bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const items = [
    {
      label: 'Total Inflow (Credits)',
      value: data.totalCredit,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/25',
    },
    {
      label: 'Total Outflow (Debits)',
      value: data.totalDebit,
      icon: TrendingDown,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/25',
    },
    {
      label: 'Estimated Tax Liability',
      value: data.estimatedTax,
      icon: Receipt,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/25',
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="my-3">
      <p className="text-[10px] font-mono font-bold text-slate-400 mb-2 uppercase tracking-wider">
        Financial Document Metrics
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map(({ label, value, icon: Icon, color, bgColor, borderColor }) => (
          <div key={label} className={`${bgColor} border ${borderColor} rounded-2xl p-4 shadow-lg backdrop-blur-sm`}>
            <div className="flex items-center gap-2 mb-1.5">
              <Icon size={15} className={color} />
              <span className="text-xs text-slate-300 font-medium">{label}</span>
            </div>
            <p className={`text-base sm:text-lg font-bold font-mono-num ${color}`}>{formatCurrency(value)}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default FinancialSummary;
