import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, Recycle, Leaf, Sprout, Trophy, Lock, History, Trash2, CheckCircle2, XCircle, ShieldCheck, ChevronRight, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, getUser, CAT } from "@/lib/appApi";

const ICONS = { sprout: Sprout, leaf: Leaf, recycle: Recycle, award: Award };
const FILTERS = ["All", "Recyclable", "Biodegradable", "Hazardous"];

export default function Impact() {
  const nav = useNavigate();
  const u = getUser();
  const [data, setData] = useState(null);
  const [leaders, setLeaders] = useState([]);
  const [scans, setScans] = useState([]);
  const [scanFilter, setScanFilter] = useState("All");
  const [selectedScan, setSelectedScan] = useState(null);

  useEffect(() => {
    api.get(`/impact/${u.id}`).then((r) => setData(r.data));
    api.get(`/leaderboard`).then((r) => setLeaders(r.data));
    api.get(`/scans/${u.id}`).then((r) => setScans(r.data)).catch(() => {});
  }, []);

  const filteredScans = useMemo(
    () => (scanFilter === "All" ? scans : scans.filter((s) => s.category === scanFilter)),
    [scans, scanFilter]
  );

  if (!data) return <div className="p-8 text-gray-400">Loading…</div>;
  const total = Object.values(data.breakdown).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="px-5 pt-8 animate-in fade-in duration-500">
      <h1 className="font-head text-2xl font-extrabold text-gray-900">Your Impact</h1>
      <p className="text-gray-400 text-sm mb-5">Every action counts 🌍</p>

      <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-3xl p-6 text-white shadow-lg shadow-emerald-600/25">
        <div className="flex items-center gap-2 text-emerald-50 text-sm"><Trophy className="w-4 h-4" /> Eco Champion</div>
        <div className="font-head text-5xl font-extrabold mt-1">{data.ecopoints}</div>
        <div className="text-emerald-50">EcoPoints</div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <Recycle className="w-5 h-5 text-blue-500 mb-2" />
          <div className="font-head font-extrabold text-xl text-gray-900">{data.items_segregated}</div>
          <div className="text-xs text-gray-400">Items segregated</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <Leaf className="w-5 h-5 text-lime-500 mb-2" />
          <div className="font-head font-extrabold text-xl text-gray-900">{data.waste_diverted}</div>
          <div className="text-xs text-gray-400">Waste diverted</div>
        </div>
      </div>

      <h2 className="font-head font-bold text-gray-900 mt-7 mb-3">Category breakdown</h2>
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
        {Object.entries(data.breakdown).map(([k, v]) => (
          <div key={k}>
            <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">{k}</span><span className="font-semibold text-gray-800">{v}</span></div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${CAT[k].bar}`} style={{ width: `${(v / total) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Scan history with category filter */}
      <h2 className="font-head font-bold text-gray-900 mt-7 mb-3 flex items-center gap-2"><History className="w-4 h-4 text-emerald-600" /> Scan history</h2>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1" data-testid="scan-filter">
        {FILTERS.map((f) => (
          <button key={f} data-testid={`scan-filter-${f}`} onClick={() => setScanFilter(f)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${scanFilter === f ? "bg-emerald-600 text-white" : "bg-white text-gray-500 border border-gray-200"}`}>{f}</button>
        ))}
      </div>
      <div className="mt-3 space-y-2" data-testid="scan-history-list">
        {filteredScans.length === 0 && <p className="text-sm text-gray-400">No scans in this category yet.</p>}
        {filteredScans.map((s) => (
          <button key={s.id} data-testid={`scan-item-${s.id}`} onClick={() => setSelectedScan(s)}
            className="w-full text-left bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm flex items-center gap-3 hover:-translate-y-0.5 hover:border-emerald-200 transition-all">
            <div className={`w-2.5 h-2.5 rounded-full ${CAT[s.category].dot}`} />
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-800">{s.item}</div>
              <div className="text-xs text-gray-400">{s.confidence}% · +{s.points} pts</div>
            </div>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${CAT[s.category].chip}`}>{s.category}</span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        ))}
      </div>

      <Dialog open={!!selectedScan} onOpenChange={(o) => !o && setSelectedScan(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl" data-testid="scan-detail-dialog">
          {selectedScan && (
            <>
              <DialogHeader>
                <DialogTitle className="font-head text-xl font-extrabold text-gray-900 flex items-center justify-between gap-2 pr-6">
                  {selectedScan.item}
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${CAT[selectedScan.category].chip}`}>{CAT[selectedScan.category].label}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selectedScan.confidence}%` }} />
                </div>
                <span className="text-sm font-semibold text-emerald-600">{selectedScan.confidence}%</span>
              </div>
              <div className="space-y-3 text-sm mt-2">
                <div className="flex items-start gap-2"><Trash2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <p><span className="font-semibold text-gray-800">Recommended bin:</span> {selectedScan.bin}</p></div>
                <div className="bg-emerald-50 rounded-2xl p-4">
                  <p className="font-semibold text-emerald-800 flex items-center gap-2 mb-1"><CheckCircle2 className="w-4 h-4" /> Correct disposal</p>
                  <p className="text-gray-600">{selectedScan.instructions}</p>
                </div>
                {selectedScan.do_not && (
                  <div className="bg-red-50 rounded-2xl p-4">
                    <p className="font-semibold text-red-700 flex items-center gap-2 mb-1"><XCircle className="w-4 h-4" /> What NOT to do</p>
                    <p className="text-gray-600">{selectedScan.do_not}</p>
                  </div>
                )}
                {selectedScan.safety && (
                  <div className="bg-blue-50 rounded-2xl p-4">
                    <p className="font-semibold text-blue-700 flex items-center gap-2 mb-1"><ShieldCheck className="w-4 h-4" /> Safety & recycling</p>
                    <p className="text-gray-600">{selectedScan.safety}</p>
                  </div>
                )}
                <div className="flex items-center justify-between bg-lime-50 rounded-2xl px-4 py-3">
                  <span className="text-sm font-semibold text-lime-700">🌱 +{selectedScan.points} EcoPoints earned</span>
                </div>
                <button data-testid="scan-detail-find-centers-btn"
                  onClick={() => nav(`/app/disposal?category=${selectedScan.category}`)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-full transition-colors">
                  <MapPin className="w-4 h-4" /> Find centers for {selectedScan.category}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <h2 className="font-head font-bold text-gray-900 mt-7 mb-3">Achievements</h2>
      <div className="grid grid-cols-2 gap-3">
        {data.achievements.map((a) => {
          const Icon = ICONS[a.icon] || Award;
          return (
            <div key={a.name} className={`rounded-2xl p-4 border shadow-sm flex items-center gap-3 ${a.unlocked ? "bg-white border-emerald-100" : "bg-gray-50 border-gray-100 opacity-70"}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.unlocked ? "bg-emerald-100 text-emerald-600" : "bg-gray-200 text-gray-400"}`}>
                {a.unlocked ? <Icon className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
              </div>
              <span className="text-sm font-semibold text-gray-700">{a.name}</span>
            </div>
          );
        })}
      </div>

      <h2 className="font-head font-bold text-gray-900 mt-7 mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Community leaderboard</h2>
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-2">
        {leaders.map((l, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-500"}`}>{i + 1}</span>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-700">{l.name}</div>
              <div className="text-[11px] text-gray-400">{l.community}</div>
            </div>
            <span className="text-sm font-bold text-emerald-600">{l.ecopoints}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
