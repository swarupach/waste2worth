import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Search, AlertCircle, CheckCircle2, ShieldCheck, Recycle, MapPin, Navigation, Loader2, Star } from "lucide-react";
import { api, getUser, CAT } from "@/lib/appApi";
import CenterCard from "@/components/CenterCard";

const CATS = ["All", "Biodegradable", "Recyclable", "Hazardous"];

function haversineKm(u, c) {
  const R = 6371;
  const dLat = ((c.lat - u.lat) * Math.PI) / 180;
  const dLng = ((c.lng - u.lng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((u.lat * Math.PI) / 180) * Math.cos((c.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function Disposal() {
  const [params] = useSearchParams();
  const u = getUser();
  const [q, setQ] = useState("");
  const [info, setInfo] = useState(null);
  const [filter, setFilter] = useState(params.get("category") || "All");
  const [centers, setCenters] = useState([]);
  const [favs, setFavs] = useState([]);
  const [userLoc, setUserLoc] = useState(null);
  const [locStatus, setLocStatus] = useState("idle");
  const [sortMode, setSortMode] = useState("nearest");
  const [favOnly, setFavOnly] = useState(false);

  const loadCenters = (cat) => api.get(`/centers`, { params: { category: cat } }).then((r) => setCenters(r.data));

  const requestLocation = () => {
    if (!("geolocation" in navigator)) { setLocStatus("unsupported"); return; }
    setLocStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocStatus("granted"); },
      () => setLocStatus("denied"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => { loadCenters(filter); }, [filter]);
  useEffect(() => {
    if (params.get("category")) setFilter(params.get("category"));
    requestLocation();
    api.get(`/favourites/${u.id}`).then((r) => setFavs(r.data)).catch(() => {});
  }, []);

  const toggleFav = async (centerId) => {
    const { data } = await api.post("/favourites", { user_id: u.id, center_id: centerId });
    setFavs(data);
    toast.success(data.includes(centerId) ? "Added to favourites" : "Removed from favourites");
  };

  const search = async () => {
    if (!q.trim()) return;
    const { data } = await api.get(`/disposal/search`, { params: { q } });
    setInfo(data);
    setFilter(data.category);
  };

  // favourites float to the top; within groups, sort by nearest when enabled
  const displayed = useMemo(() => {
    let list = centers.map((c) => {
      const dist = userLoc && c.lat != null && c.lng != null ? haversineKm(userLoc, c) : null;
      return { ...c, distance: dist != null ? `${dist.toFixed(1)} km` : c.distance, _d: dist ?? Infinity, _fav: favs.includes(c.id) };
    });
    if (favOnly) list = list.filter((c) => c._fav);
    if (sortMode === "nearest" && userLoc) list = [...list].sort((a, b) => a._d - b._d);
    list = [...list].sort((a, b) => (b._fav ? 1 : 0) - (a._fav ? 1 : 0));
    return list;
  }, [centers, userLoc, sortMode, favs, favOnly]);

  return (
    <div className="px-5 pt-8 animate-in fade-in duration-500">
      <h1 className="font-head text-2xl font-extrabold text-gray-900">Disposal Assistant</h1>
      <p className="text-gray-400 text-sm mb-4">Search any waste item for guidance</p>

      <div className="flex gap-2">
        <input data-testid="disposal-search-input" value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="e.g. Old mobile phone"
          className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
        <button data-testid="disposal-search-btn" onClick={search}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 rounded-full transition-colors"><Search className="w-4 h-4" /></button>
      </div>

      {info && (
        <div data-testid="disposal-result" className="mt-5 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-head text-xl font-extrabold text-gray-900">{info.item}</h2>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${CAT[info.category].chip}`}>{CAT[info.category].label}</span>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="bg-emerald-50 rounded-2xl p-4">
              <p className="font-semibold text-emerald-800 flex items-center gap-2 mb-1"><CheckCircle2 className="w-4 h-4" /> Correct method</p>
              <p className="text-gray-600">{info.instructions}</p>
              <p className="text-gray-600 mt-1"><span className="font-semibold">Bin:</span> {info.bin}</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-4">
              <p className="font-semibold text-red-700 flex items-center gap-2 mb-1"><AlertCircle className="w-4 h-4" /> What NOT to do</p>
              <p className="text-gray-600">{info.do_not}</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-4">
              <p className="font-semibold text-blue-700 flex items-center gap-2 mb-1"><ShieldCheck className="w-4 h-4" /> Safety & recycling</p>
              <p className="text-gray-600">{info.safety}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-7 flex items-center justify-between">
        <h2 className="font-head font-bold text-gray-900 flex items-center gap-2"><Recycle className="w-4 h-4 text-emerald-600" /> Recycling Centers</h2>
        <div className="inline-flex items-center bg-gray-100 rounded-full p-0.5" data-testid="sort-toggle">
          <button data-testid="sort-nearest-btn" onClick={() => setSortMode("nearest")}
            className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-colors ${sortMode === "nearest" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500"}`}>Nearest first</button>
          <button data-testid="sort-any-btn" onClick={() => setSortMode("any")}
            className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-colors ${sortMode === "any" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500"}`}>Any</button>
        </div>
      </div>

      <div data-testid="location-banner" className="mt-3">
        {locStatus === "requesting" && (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-100 rounded-full px-3 py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Requesting your location…
          </div>
        )}
        {locStatus === "granted" && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full px-3 py-2">
            <MapPin className="w-3.5 h-3.5" /> Showing centers nearest to your location
          </div>
        )}
        {(locStatus === "denied" || locStatus === "unsupported") && (
          <div className="flex items-center justify-between gap-2 text-xs text-gray-500 bg-amber-50 rounded-full px-3 py-2">
            <span className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Showing default centers</span>
            {locStatus === "denied" && (
              <button data-testid="enable-location-btn" onClick={requestLocation} className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <Navigation className="w-3.5 h-3.5" /> Use my location
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-3 overflow-x-auto hide-scrollbar pb-1">
        <button data-testid="fav-only-toggle" onClick={() => setFavOnly((v) => !v)}
          className={`whitespace-nowrap inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${favOnly ? "bg-amber-400 text-white" : "bg-white text-gray-500 border border-gray-200"}`}>
          <Star className={`w-3.5 h-3.5 ${favOnly ? "fill-white" : ""}`} /> Favourites{favs.length ? ` (${favs.length})` : ""}
        </button>
        {CATS.map((c) => (
          <button key={c} data-testid={`filter-${c}`} onClick={() => setFilter(c)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${filter === c ? "bg-emerald-600 text-white" : "bg-white text-gray-500 border border-gray-200"}`}>{c}</button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {displayed.length === 0 && <p className="text-sm text-gray-400" data-testid="no-centers-msg">{favOnly ? "No favourite centers yet. Tap the star on a center to add one." : "No centers for this category."}</p>}
        {displayed.map((c) => <CenterCard key={c.id} c={c} isFav={c._fav} onToggleFav={toggleFav} />)}
      </div>
    </div>
  );
}
