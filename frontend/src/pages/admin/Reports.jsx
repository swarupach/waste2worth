import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Image as ImageIcon, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, STATUS_COLORS } from "@/lib/appApi";

const STAGES = ["Submitted", "Under Review", "Resolved"];

export default function AdminReports() {
  const [items, setItems] = useState([]);
  const load = () => api.get("/reports").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const update = async (r, status) => {
    const { data } = await api.put(`/reports/${r.id}`, { status });
    setItems((x) => x.map((i) => (i.id === r.id ? data : i)));
    toast.success(`Report marked ${status}`);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="font-head text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-amber-600" /> Community Reports</h1>
      <p className="text-gray-400 text-sm mb-6">Review and resolve reported issues</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {items.length === 0 && <p className="text-gray-400 text-sm">No reports yet.</p>}
        {items.map((r) => (
          <div key={r.id} data-testid={`report-row-${r.id}`} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-head font-bold text-gray-900">{r.issue_type}</span>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[r.status]}`}>{r.status}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">{r.description}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {r.location}</span>
              {r.has_image && <span className="flex items-center gap-1 text-emerald-600"><ImageIcon className="w-3.5 h-3.5" /> Photo attached</span>}
            </div>
            <p className="text-xs text-gray-400 mt-1">By {r.user_name}</p>
            <div className="mt-3">
              <Select value={r.status} onValueChange={(v) => update(r, v)}>
                <SelectTrigger data-testid={`report-status-${r.id}`} className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
