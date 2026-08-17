import { useEffect, useState } from "react";
import { Users2, Scan, Recycle, Leaf, ShieldAlert, TrendingUp, Truck, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { api } from "@/lib/appApi";

const COLORS = { Biodegradable: "#8B5CF6", Recyclable: "#3B82F6", Hazardous: "#EF4444" };

export default function Dashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/admin/dashboard").then((r) => setD(r.data)); }, []);
  if (!d) return <div className="text-gray-400">Loading…</div>;

  const cards = [
    { label: "Total Users", value: d.total_users, icon: Users2, color: "bg-emerald-100 text-emerald-600" },
    { label: "Waste Scanned", value: d.total_scanned, icon: Scan, color: "bg-teal-100 text-teal-600" },
    { label: "Recyclable", value: d.recyclable, icon: Recycle, color: "bg-blue-100 text-blue-600" },
    { label: "Biodegradable", value: d.biodegradable, icon: Leaf, color: "bg-violet-100 text-violet-600" },
    { label: "Hazardous", value: d.hazardous, icon: ShieldAlert, color: "bg-red-100 text-red-600" },
    { label: "Waste Diverted", value: d.waste_diverted, icon: TrendingUp, color: "bg-lime-100 text-lime-600" },
    { label: "Pending Pickups", value: d.pending_pickups, icon: Truck, color: "bg-indigo-100 text-indigo-600" },
    { label: "Open Reports", value: d.open_reports, icon: AlertTriangle, color: "bg-amber-100 text-amber-600" },
  ];
  const pie = [
    { name: "Recyclable", value: d.recyclable },
    { name: "Biodegradable", value: d.biodegradable },
    { name: "Hazardous", value: d.hazardous },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="font-head text-2xl sm:text-3xl font-extrabold text-gray-900">Dashboard</h1>
      <p className="text-gray-400 text-sm mb-6">Overview of your waste management system</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} data-testid={`stat-${c.label.toLowerCase().replace(/ /g,'-')}`} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color} mb-3`}><c.icon className="w-5 h-5" /></div>
            <div className="font-head text-2xl font-extrabold text-gray-900">{c.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm max-w-md">
        <h2 className="font-head font-bold text-gray-900 mb-3">Waste category distribution</h2>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={pie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
              {pie.map((e) => <Cell key={e.name} fill={COLORS[e.name]} />)}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
