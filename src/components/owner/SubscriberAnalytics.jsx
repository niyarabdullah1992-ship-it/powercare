import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { DollarSign, TrendingUp } from "lucide-react";

const PLAN_COLORS = { Free: "#94A3B8", Starter: "#1E9E63", Professional: "#14284B", Enterprise: "#0F1F3A", Custom: "#5A6B85" };

export default function SubscriberAnalytics({ data, ar }) {
  const summary = data?.summary;
  if (!summary) return null;

  const rows = [...(data.subscriptions || []), ...(data.companiesWithoutSubscription || [])];
  const planCounts = {};
  rows.forEach((r) => { const p = r.plan || "Free"; planCounts[p] = (planCounts[p] || 0) + 1; });
  const planData = Object.entries(planCounts).map(([name, value]) => ({ name, value }));
  const growth = data.growth || [];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* MRR */}
      <div className="bg-white rounded-2xl p-5 shadow-xl flex flex-col justify-center items-center text-center">
        <span className="w-11 h-11 rounded-xl bg-[#F7F8FA] flex items-center justify-center text-[#1E9E63] mb-3">
          <DollarSign className="w-5 h-5" />
        </span>
        <p className="hero-title text-4xl text-[#14284B]">${summary.mrr ?? 0}</p>
        <p className="text-xs font-body text-[#14284B]/50 mt-1">
          {ar ? "الإيراد الشهري المتكرر (MRR)" : "Monthly Recurring Revenue (MRR)"}
        </p>
        <p className="text-[11px] font-body text-[#14284B]/40 mt-2">
          {ar ? `${summary.activeSubscriptions} اشتراك نشط` : `${summary.activeSubscriptions} active subscriptions`}
        </p>
      </div>

      {/* Plan distribution */}
      <div className="bg-white rounded-2xl p-5 shadow-xl">
        <h4 className="font-heading text-sm font-semibold text-[#14284B] mb-2">
          {ar ? "توزيع الباقات" : "Plan Distribution"}
        </h4>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={planData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65} paddingAngle={3}>
                {planData.map((d) => <Cell key={d.name} fill={PLAN_COLORS[d.name] || "#5A6B85"} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center text-[11px] font-body text-[#14284B]/60">
          {planData.map((d) => (
            <span key={d.name} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: PLAN_COLORS[d.name] || "#5A6B85" }} />
              {d.name}: <b>{d.value}</b>
            </span>
          ))}
        </div>
      </div>

      {/* Growth */}
      <div className="bg-white rounded-2xl p-5 shadow-xl">
        <h4 className="font-heading text-sm font-semibold text-[#14284B] mb-2 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-[#1E9E63]" /> {ar ? "نمو الشركات (شهريًا)" : "Company Growth (monthly)"}
        </h4>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growth} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#5A6B85" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#5A6B85" }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#14284B" strokeWidth={2} dot={{ r: 3, fill: "#1E9E63" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}