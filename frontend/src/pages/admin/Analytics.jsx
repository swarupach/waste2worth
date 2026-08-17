import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { Users2, Truck, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/appApi";

export default function Analytics() {
  const [a, setA] = useState(null);
  useEffect(() => { api.get("/admin/analytics").then((r) => setA(r.data)); }, []);
  if (!a) return <div className="text-gray-400">Loading…</div>;

  const kpis = [
    { label: "Active Users", value: a.active_users, icon: Users2, color: "text-emerald-600" },
    { label: "Completed Pickups", value: a.completed_pickups, icon: Truck, color: "text-indigo-600" },
    { label: "Reports Resolved", value: a.reports_resolved, icon: CheckCircle2, color: "text-lime-600" },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="font-head text-2xl sm:text-3xl font-extrabold text-gray-900">Analytics</h1>
      <p className="text-gray-400 text-sm mb-6">Waste and recycling trends</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <k.icon className={`w-5 h-5 ${k.color} mb-2`} />
            <div className="font-head text-2xl font-extrabold text-gray-900">{k.value}</div>
            <div className="text-xs text-gray-400">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-head font-bold text-gray-900 mb-4">Daily waste scans</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={a.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip /><Line type="monotone" dataKey="scans" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-head font-bold text-gray-900 mb-4">Most common waste items</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={a.top_items} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
              <Tooltip /><Bar dataKey="value" fill="#84CC16" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm lg:col-span-2">
          <h2 className="font-head font-bold text-gray-900 mb-4">Category distribution</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={a.category_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip /><Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
