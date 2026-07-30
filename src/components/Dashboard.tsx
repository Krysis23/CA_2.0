import { useChat, type UploadedDocItem } from "../contexts/ChatContext";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#0F6E56", "#534AB7", "#993C1D", "#854F0B"];

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

export default function Dashboard() {
  const { activeConversation } = useChat();

  const docs = activeConversation?.uploadedDocs ?? [];

  if (docs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Upload bank statements to see your financial dashboard.
      </div>
    );
  }

  const barData = docs.map((doc) => {
    const metrics = getDocMetrics(doc);
    return {
      name: doc.filename ?? "Unknown",
      Credits: metrics.totalCredits,
      Debits: metrics.totalDebits,
      TDS: metrics.estimatedTax,
    };
  });

  const totalCredits = barData.reduce((sum, d) => sum + d.Credits, 0);
  const totalDebits = barData.reduce((sum, d) => sum + d.Debits, 0);

  const pieData = [
    {
      name: "Net Income",
      value: Math.max(0, totalCredits - totalDebits),
    },
    {
      name: "Total Debits",
      value: totalDebits,
    },
  ];

  return (
    <div className="p-6 space-y-8 overflow-y-auto h-full">
      <h2 className="text-xl font-semibold text-gray-800">
        Financial Overview — {docs[0].filename || "Uploaded Statement"}
      </h2>

      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Total Credits",
            value: `Rs. ${totalCredits.toLocaleString("en-IN")}`,
          },
          {
            label: "Total Debits",
            value: `Rs. ${totalDebits.toLocaleString("en-IN")}`,
          },
          {
            label: "Net Cash Flow",
            value: `Rs. ${(totalCredits - totalDebits).toLocaleString("en-IN")}`,
          },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Monthly Credits vs Debits</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={barData}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `Rs. ${Number(v).toLocaleString("en-IN")}`} />
            <Legend />
            <Bar dataKey="Credits" fill="#0F6E56" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Debits" fill="#993C1D" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Income Distribution</p>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => `Rs. ${Number(v).toLocaleString("en-IN")}`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
