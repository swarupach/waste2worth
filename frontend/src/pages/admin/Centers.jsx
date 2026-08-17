import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPin, Plus, Pencil, Trash2, Phone, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/appApi";

const CATS = ["Recyclable", "Biodegradable", "Hazardous"];
const EMPTY = { name: "", location: "", distance: "", accepted_categories: [], accepted_types: "", hours: "", phone: "" };

export default function Centers() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);

  const load = () => api.get("/centers").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditId(null); setOpen(true); };
  const openEdit = (c) => { setForm({ ...c }); setEditId(c.id); setOpen(true); };

  const toggleCat = (c) => setForm((f) => ({ ...f, accepted_categories: f.accepted_categories.includes(c) ? f.accepted_categories.filter((x) => x !== c) : [...f.accepted_categories, c] }));

  const save = async () => {
    if (!form.name || !form.location || form.accepted_categories.length === 0) return toast.error("Name, location and at least one category required");
    const payload = { name: form.name, location: form.location, distance: form.distance || "—", accepted_categories: form.accepted_categories, accepted_types: form.accepted_types, hours: form.hours, phone: form.phone };
    if (editId) await api.put(`/centers/${editId}`, payload); else await api.post("/centers", payload);
    toast.success(editId ? "Center updated" : "Center added");
    setOpen(false); load();
  };

  const del = async (id) => { await api.delete(`/centers/${id}`); toast.success("Center deleted"); load(); };

  const field = (label, key, ph) => (
    <div>
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={ph} data-testid={`center-input-${key}`}
        className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-head text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2"><MapPin className="w-6 h-6 text-emerald-600" /> Recycling Centers</h1>
          <p className="text-gray-400 text-sm">These appear to users by waste type</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button data-testid="center-add-btn" onClick={openNew} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"><Plus className="w-4 h-4" /> Add Center</button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Recycling Center</DialogTitle></DialogHeader>
            <div className="space-y-3">
              {field("Name", "name", "GreenCycle Hub")}
              {field("Location", "location", "MG Road, Sector 12")}
              {field("Distance", "distance", "1.2 km")}
              {field("Accepted types", "accepted_types", "Plastic, Paper, Metal")}
              {field("Opening hours", "hours", "Mon-Sat 9AM - 7PM")}
              {field("Phone", "phone", "+911140011223")}
              <div>
                <label className="text-sm font-semibold text-gray-700">Accepted categories</label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {CATS.map((c) => (
                    <label key={c} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <Checkbox checked={form.accepted_categories.includes(c)} onCheckedChange={() => toggleCat(c)} data-testid={`center-cat-${c}`} /> {c}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <button onClick={save} data-testid="center-save-btn" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-colors">{editId ? "Save changes" : "Add center"}</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((c) => (
          <div key={c.id} data-testid={`admin-center-${c.id}`} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between">
              <h3 className="font-head font-bold text-gray-900">{c.name}</h3>
              <div className="flex gap-1">
                <button data-testid={`center-edit-${c.id}`} onClick={() => openEdit(c)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Pencil className="w-3.5 h-3.5 text-gray-600" /></button>
                <button data-testid={`center-delete-${c.id}`} onClick={() => del(c.id)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5 text-red-600" /></button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">{c.location} · {c.distance}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {c.accepted_categories.map((cat) => <span key={cat} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{cat}</span>)}
            </div>
            <p className="text-xs text-gray-500 mt-2">{c.accepted_types}</p>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {c.hours}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
