import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Truck, Upload, CheckCircle2, Plus, X, Home, Star } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { api, getUser } from "@/lib/appApi";

const STAGES = ["Submitted", "Assigned", "In Progress", "Completed"];

export default function Pickup() {
  const nav = useNavigate();
  const u = getUser();
  const [form, setForm] = useState({ category: "Recyclable", quantity: "", address: "", preferred_date: "" });
  const [image, setImage] = useState(null);
  const [done, setDone] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [saveAddr, setSaveAddr] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");
  const [prefilled, setPrefilled] = useState(false);

  const loadAddresses = (prefill = false) =>
    api.get(`/addresses/${u.id}`).then((r) => {
      setAddresses(r.data);
      if (prefill && !prefilled) {
        const def = r.data.find((a) => a.is_default);
        if (def) { setForm((f) => ({ ...f, address: def.address })); setPrefilled(true); }
      }
    }).catch(() => {});
  useEffect(() => { loadAddresses(true); }, []);

  const onFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setImage(r.result);
    r.readAsDataURL(f);
  };

  const deleteAddress = async (id) => { await api.delete(`/addresses/${u.id}/${id}`); loadAddresses(); };

  const makeDefault = async (id) => {
    await api.put(`/addresses/${u.id}/${id}/default`);
    toast.success("Default address updated");
    loadAddresses();
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.quantity || !form.address || !form.preferred_date) return toast.error("Please fill all fields");
    if (saveAddr && saveLabel.trim()) {
      await api.post("/addresses", { user_id: u.id, label: saveLabel.trim(), address: form.address });
      toast.success("Address saved");
    }
    const { data } = await api.post("/pickups", { user_id: u.id, ...form, image_base64: image });
    setDone(data);
    toast.success("Pickup request submitted!");
  };

  return (
    <div className="px-5 pt-8 animate-in fade-in duration-500">
      <button onClick={() => nav(-1)} data-testid="pickup-back-btn" className="inline-flex items-center gap-1 text-gray-500 text-sm mb-3"><ArrowLeft className="w-4 h-4" /> Back</button>
      <h1 className="font-head text-2xl font-extrabold text-gray-900 flex items-center gap-2"><Truck className="w-6 h-6 text-indigo-600" /> Request Pickup</h1>
      <p className="text-gray-400 text-sm mb-5">We'll collect your sorted waste</p>

      {done ? (
        <div data-testid="pickup-success" className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold"><CheckCircle2 className="w-5 h-5" /> Request submitted</div>
          <div className="mt-5 flex items-center justify-between">
            {STAGES.map((s, i) => (
              <div key={s} className="flex-1 flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-400"}`}>{i + 1}</div>
                <span className="text-[10px] text-gray-500 mt-1 text-center">{s}</span>
              </div>
            ))}
          </div>
          <button onClick={() => nav("/app/profile")} data-testid="pickup-view-btn" className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-full transition-colors">View my requests</button>
        </div>
      ) : (
        <form onSubmit={submit} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">Waste category</label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger data-testid="pickup-category-select" className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Recyclable", "Biodegradable", "Hazardous", "Mixed"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Quantity</label>
            <input data-testid="pickup-quantity-input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              placeholder="e.g. 2 bags" className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
          </div>

          {addresses.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Home className="w-3.5 h-3.5" /> Saved addresses</label>
              <p className="text-[11px] text-gray-400 mt-0.5">Tap to use · tap the star to set default</p>
              <div className="flex flex-col gap-2 mt-2" data-testid="saved-addresses">
                {addresses.map((a) => (
                  <div key={a.id} className={`flex items-center gap-2 rounded-2xl px-3 py-2 border ${a.is_default ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-100"}`}>
                    <button type="button" data-testid={`set-default-${a.id}`} onClick={() => makeDefault(a.id)} aria-label="Set default"
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-amber-50 transition-colors shrink-0">
                      <Star className={`w-4 h-4 ${a.is_default ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                    </button>
                    <button type="button" data-testid={`use-address-${a.id}`} onClick={() => setForm({ ...form, address: a.address })}
                      className="flex-1 text-left">
                      <span className="text-xs font-bold text-gray-800">{a.label}{a.is_default && <span className="ml-1.5 text-[10px] font-semibold text-emerald-600">Default</span>}</span>
                      <span className="block text-[11px] text-gray-500 truncate">{a.address}</span>
                    </button>
                    <button type="button" data-testid={`delete-address-${a.id}`} onClick={() => deleteAddress(a.id)}
                      className="w-6 h-6 rounded-full bg-gray-200/60 hover:bg-red-200 flex items-center justify-center shrink-0"><X className="w-3 h-3 text-gray-600" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-gray-700">Address</label>
            <input data-testid="pickup-address-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Pickup address" className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <Checkbox checked={saveAddr} onCheckedChange={setSaveAddr} data-testid="pickup-save-address-checkbox" />
            <Plus className="w-3.5 h-3.5 text-emerald-600" /> Save this address for later
          </label>
          {saveAddr && (
            <input data-testid="pickup-save-label-input" value={saveLabel} onChange={(e) => setSaveLabel(e.target.value)}
              placeholder="Label (e.g. Home, Hostel)" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
          )}

          <div>
            <label className="text-sm font-semibold text-gray-700">Preferred date</label>
            <input data-testid="pickup-date-input" type="date" value={form.preferred_date} onChange={(e) => setForm({ ...form, preferred_date: e.target.value })}
              className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm text-emerald-700 font-medium cursor-pointer">
            <Upload className="w-4 h-4" /> {image ? "Image attached" : "Attach photo (optional)"}
            <input type="file" accept="image/*" hidden onChange={onFile} data-testid="pickup-image-input" />
          </label>
          <button type="submit" data-testid="pickup-submit-btn" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-full transition-colors">Submit Request</button>
        </form>
      )}
    </div>
  );
}
