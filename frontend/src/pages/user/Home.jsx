import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Leaf, Recycle, Award, Truck, AlertTriangle, ChevronRight, Trophy } from "lucide-react";
import { api, getUser, CAT } from "@/lib/appApi";

export default function Home() {
  const nav = useNavigate();
  const u = getUser();
  const [me, setMe] = useState(u);
  const [scans, setScans] = useState([]);
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    api.get(`/me/${u.id}`).then((r) => setMe(r.data)).catch(() => {});
    api.get(`/scans/${u.id}`).then((r) => setScans(r.data)).catch(() => {});
    api.get(`/leaderboard`).then((r) => setLeaders(r.data)).catch(() => {});
  }, []);

  const stats = [
    { label: "EcoPoints", value: me?.ecopoints ?? 0, icon: Award, color: "text-emerald-600 bg-emerald-100" },
    { label: "Segregated", value: me?.items_segregated ?? 0, icon: Recycle, color: "text-blue-600 bg-blue-100" },
    { label: "Diverted", value: me?.waste_diverted ?? 0, icon: Leaf, color: "text-lime-600 bg-lime-100" },
  ];

  return (
    <div className="px-5 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">Good day 🌱</p>
          <h1 className="font-head text-2xl font-extrabold text-gray-900">Hi, {me?.name}</h1>
        </div>
        <div className="bg-white rounded-2xl px-4 py-2 shadow-sm border border-gray-100 text-center">
          <div className="font-head font-extrabold text-emerald-600 text-lg leading-none">{me?.ecopoints ?? 0}</div>
          <div className="text-[10px] text-gray-400 font-semibold">POINTS</div>
        </div>
      </div>

      <button data-testid="home-scan-btn" onClick={() => nav("/app/scan")}
        className="w-full mt-6 bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-3xl p-6 text-white text-left shadow-lg shadow-emerald-600/25 hover:-translate-y-0.5 transition-transform relative overflow-hidden">
        <div className="relative z-10">
          <Camera className="w-9 h-9 mb-3" />
          <div className="font-head text-xl font-bold">Scan Waste</div>
          <div className="text-emerald-50 text-sm">Identify any item with AI</div>
        </div>
        <Recycle className="absolute -right-4 -bottom-4 w-28 h-28 text-white/10" />
      </button>

      <div className="grid grid-cols-3 gap-3 mt-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color} mb-2`}><s.icon className="w-4 h-4" /></div>
            <div className="font-head font-extrabold text-gray-900 text-lg leading-none">{s.value}</div>
            <div className="text-[11px] text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <button data-testid="home-pickup-btn" onClick={() => nav("/app/pickup")}
          className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3 hover:-translate-y-0.5 transition-transform">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center"><Truck className="w-4.5 h-4.5" /></div>
          <span className="text-sm font-semibold text-gray-700">Request Pickup</span>
        </button>
        <button data-testid="home-report-btn" onClick={() => nav("/app/report")}
          className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3 hover:-translate-y-0.5 transition-transform">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center"><AlertTriangle className="w-4.5 h-4.5" /></div>
          <span className="text-sm font-semibold text-gray-700">Report Issue</span>
        </button>
      </div>

      <div className="mt-7">
        <h2 className="font-head font-bold text-gray-900 mb-3">Recent activity</h2>
        <div className="space-y-2">
          {scans.length === 0 && <p className="text-sm text-gray-400">No scans yet. Try scanning something!</p>}
          {scans.slice(0, 4).map((s) => (
            <div key={s.id} className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${CAT[s.category].dot}`} />
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-800">{s.item}</div>
                <div className="text-xs text-gray-400">{s.category} · +{s.points} pts</div>
              </div>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${CAT[s.category].chip}`}>{s.category}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7">
        <h2 className="font-head font-bold text-gray-900 mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Leaderboard</h2>
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-2">
          {leaders.slice(0, 5).map((l, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-500"}`}>{i + 1}</span>
              <span className="flex-1 text-sm font-medium text-gray-700">{l.name}</span>
              <span className="text-sm font-bold text-emerald-600">{l.ecopoints}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
