import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, AlertTriangle, Upload, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, getUser } from "@/lib/appApi";

const STAGES = ["Submitted", "Under Review", "Resolved"];
const TYPES = ["Overflowing bin", "Garbage pile", "Illegal dumping", "Improper segregation", "Other"];

export default function Report() {
  const nav = useNavigate();
  const u = getUser();
  const [form, setForm] = useState({ issue_type: "Overflowing bin", location: "", description: "" });
  const [image, setImage] = useState(null);
  const [done, setDone] = useState(false);

  const onFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setImage(r.result);
    r.readAsDataURL(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.location || !form.description) return toast.error("Please fill all fields");
    await api.post("/reports", { user_id: u.id, ...form, image_base64: image });
    setDone(true);
    toast.success("Report submitted · +5 EcoPoints");
  };

  return (
    <div className="px-5 pt-8 animate-in fade-in duration-500">
      <button onClick={() => nav(-1)} data-testid="report-back-btn" className="inline-flex items-center gap-1 text-gray-500 text-sm mb-3"><ArrowLeft className="w-4 h-4" /> Back</button>
      <h1 className="font-head text-2xl font-extrabold text-gray-900 flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-amber-600" /> Report a Problem</h1>
      <p className="text-gray-400 text-sm mb-5">Help keep your community clean</p>

      {done ? (
        <div data-testid="report-success" className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold"><CheckCircle2 className="w-5 h-5" /> Report submitted</div>
          <div className="mt-5 flex items-center justify-between">
            {STAGES.map((s, i) => (
              <div key={s} className="flex-1 flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-400"}`}>{i + 1}</div>
                <span className="text-[10px] text-gray-500 mt-1 text-center">{s}</span>
              </div>
            ))}
          </div>
          <button onClick={() => nav("/app/profile")} data-testid="report-view-btn" className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-full transition-colors">View my reports</button>
        </div>
      ) : (
        <form onSubmit={submit} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">Issue type</label>
            <Select value={form.issue_type} onValueChange={(v) => setForm({ ...form, issue_type: v })}>
              <SelectTrigger data-testid="report-type-select" className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Location</label>
            <input data-testid="report-location-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Where is it?" className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Description</label>
            <textarea data-testid="report-description-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the problem" rows={3} className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm text-emerald-700 font-medium cursor-pointer">
            <Upload className="w-4 h-4" /> {image ? "Photo attached" : "Attach photo (optional)"}
            <input type="file" accept="image/*" hidden onChange={onFile} data-testid="report-image-input" />
          </label>
          <button type="submit" data-testid="report-submit-btn" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-full transition-colors">Submit Report</button>
        </form>
      )}
    </div>
  );
}
