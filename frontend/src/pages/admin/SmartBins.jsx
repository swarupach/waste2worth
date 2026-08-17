import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, AlertCircle, Minus, Plus } from "lucide-react";
import { api } from "@/lib/appApi";

export default function SmartBins() {
  const [bins, setBins] = useState([]);
  const load = () => api.get("/smartbins").then((r) => setBins(r.data));
  useEffect(() => { load(); }, []);

  const setLevel = async (bin, level) => {
    const lvl = Math.max(0, Math.min(100, level));
    const { data } = await api.put(`/smartbins/${bin.id}`, { level: lvl });
    setBins((b) => b.map((x) => (x.id === bin.id ? data : x)));
    if (data.status === "Collection Required") toast.warning(`Bin #${data.bin_no} needs collection!`);
  };

  const barColor = (l) => (l >= 90 ? "bg-red-500" : l >= 75 ? "bg-amber-500" : "bg-emerald-500");

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="font-head text-2xl sm:text-3xl font-extrabold text-gray-900">Smart Bin Simulation</h1>
      <div className="inline-flex items-center gap-2 mt-2 mb-6 bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full">
        <AlertCircle className="w-3.5 h-3.5" /> Simulated IoT Data — not real sensor readings
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {bins.map((bin) => (
          <div key={bin.id} data-testid={`bin-card-${bin.bin_no}`} className={`bg-white rounded-2xl p-5 border shadow-sm ${bin.level >= 90 ? "border-red-200" : "border-gray-100"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"><Trash2 className="w-4.5 h-4.5 text-gray-500" /></div>
                <div>
                  <div className="font-head font-bold text-gray-900">Bin #{String(bin.bin_no).padStart(2, "0")}</div>
                  <div className="text-xs text-gray-400">{bin.type} · {bin.location}</div>
                </div>
              </div>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${bin.level >= 90 ? "bg-red-100 text-red-700" : bin.level >= 75 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{bin.status}</span>
            </div>

            <div className="mt-4 flex items-end justify-between mb-1">
              <span className="text-xs text-gray-400">Fill level</span>
              <span className="font-head font-extrabold text-lg text-gray-900">{bin.level}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${barColor(bin.level)}`} style={{ width: `${bin.level}%` }} />
            </div>

            {bin.level >= 90 && (
              <div data-testid={`bin-alert-${bin.bin_no}`} className="mt-3 flex items-center gap-2 bg-red-50 text-red-700 text-xs font-semibold px-3 py-2 rounded-xl">
                <AlertCircle className="w-4 h-4" /> Collection required
              </div>
            )}

            <div className="mt-4 flex items-center gap-2">
              <button data-testid={`bin-decrease-${bin.bin_no}`} onClick={() => setLevel(bin, bin.level - 10)}
                className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"><Minus className="w-4 h-4 text-gray-600" /></button>
              <input type="range" min="0" max="100" value={bin.level} data-testid={`bin-slider-${bin.bin_no}`}
                onChange={(e) => setLevel(bin, parseInt(e.target.value))} className="flex-1 accent-emerald-600" />
              <button data-testid={`bin-increase-${bin.bin_no}`} onClick={() => setLevel(bin, bin.level + 10)}
                className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"><Plus className="w-4 h-4 text-gray-600" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
