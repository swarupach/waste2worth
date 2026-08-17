import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Truck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, STATUS_COLORS } from "@/lib/appApi";

const STAGES = ["Submitted", "Assigned", "In Progress", "Completed"];

export default function AdminPickups() {
  const [items, setItems] = useState([]);
  const load = () => api.get("/pickups").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const update = async (p, status) => {
    const { data } = await api.put(`/pickups/${p.id}`, { status, assigned_to: status === "Assigned" ? "Team Alpha" : p.assigned_to });
    setItems((x) => x.map((i) => (i.id === p.id ? data : i)));
    toast.success(`Pickup marked ${status}`);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="font-head text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2"><Truck className="w-6 h-6 text-indigo-600" /> Pickup Requests</h1>
      <p className="text-gray-400 text-sm mb-6">Assign and track waste collection</p>

      <div className="space-y-3">
        {items.length === 0 && <p className="text-gray-400 text-sm">No requests yet.</p>}
        {items.map((p) => (
          <div key={p.id} data-testid={`pickup-row-${p.id}`} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-head font-bold text-gray-900">{p.category}</span>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[p.status]}`}>{p.status}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{p.user_name} · {p.quantity} · {p.preferred_date}</p>
              <p className="text-xs text-gray-400">{p.address}{p.assigned_to ? ` · ${p.assigned_to}` : ""}</p>
            </div>
            <Select value={p.status} onValueChange={(v) => update(p, v)}>
              <SelectTrigger data-testid={`pickup-status-${p.id}`} className="w-44 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}
