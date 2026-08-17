import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Truck, AlertTriangle, Award, ChevronRight } from "lucide-react";
import { api, getUser, clearUser, STATUS_COLORS } from "@/lib/appApi";

export default function Profile() {
  const nav = useNavigate();
  const u = getUser();
  const [me, setMe] = useState(u);
  const [pickups, setPickups] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    api.get(`/me/${u.id}`).then((r) => setMe(r.data));
    api.get(`/pickups`, { params: { user_id: u.id } }).then((r) => setPickups(r.data));
    api.get(`/reports`, { params: { user_id: u.id } }).then((r) => setReports(r.data));
  }, []);

  const logout = () => { clearUser(); nav("/login"); };

  return (
    <div className="px-5 pt-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center"><User className="w-8 h-8" /></div>
        <div className="flex-1">
          <h1 className="font-head text-xl font-extrabold text-gray-900">{me?.name}</h1>
          <p className="text-sm text-gray-400">{me?.email}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">{me?.community}</p>
        </div>
        <div className="text-center">
          <div className="font-head font-extrabold text-emerald-600 text-lg flex items-center gap-1"><Award className="w-4 h-4" />{me?.ecopoints}</div>
          <div className="text-[10px] text-gray-400">POINTS</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <button data-testid="profile-pickup-btn" onClick={() => nav("/app/pickup")}
          className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3 hover:-translate-y-0.5 transition-transform">
          <Truck className="w-5 h-5 text-indigo-600" /><span className="text-sm font-semibold text-gray-700">Request Pickup</span>
        </button>
        <button data-testid="profile-report-btn" onClick={() => nav("/app/report")}
          className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3 hover:-translate-y-0.5 transition-transform">
          <AlertTriangle className="w-5 h-5 text-amber-600" /><span className="text-sm font-semibold text-gray-700">Report Issue</span>
        </button>
      </div>

      <h2 className="font-head font-bold text-gray-900 mt-7 mb-3">My pickup requests</h2>
      <div className="space-y-2">
        {pickups.length === 0 && <p className="text-sm text-gray-400">No pickup requests yet.</p>}
        {pickups.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">{p.category} · {p.quantity}</span>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[p.status]}`}>{p.status}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{p.address} · {p.preferred_date}</p>
          </div>
        ))}
      </div>

      <h2 className="font-head font-bold text-gray-900 mt-7 mb-3">My reports</h2>
      <div className="space-y-2">
        {reports.length === 0 && <p className="text-sm text-gray-400">No reports yet.</p>}
        {reports.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">{r.issue_type}</span>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[r.status]}`}>{r.status}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{r.location}</p>
          </div>
        ))}
      </div>

      <button data-testid="profile-logout-btn" onClick={logout}
        className="w-full mt-7 inline-flex items-center justify-center gap-2 bg-white text-red-600 font-semibold py-3 rounded-full border border-red-100 hover:bg-red-50 transition-colors">
        <LogOut className="w-4 h-4" /> Log out
      </button>
    </div>
  );
}
