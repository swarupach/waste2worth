import { Link } from "react-router-dom";
import { Camera, Recycle, Sprout, ShieldCheck, ArrowRight, Search, MapPin } from "lucide-react";

const HERO = "https://images.unsplash.com/photo-1507041957456-9c397ce39c97?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwxfHxiZWF1dGlmdWwlMjBsdXNoJTIwZm9yZXN0JTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3ODY1OTY5NTl8MA&ixlib=rb-4.1.0&q=85";

const steps = [
  { icon: Camera, title: "Scan", text: "Snap or upload a photo of any waste item." },
  { icon: Search, title: "Identify", text: "AI recognises the item and its material." },
  { icon: Recycle, title: "Segregate", text: "Get the right bin and disposal advice." },
  { icon: MapPin, title: "Recycle", text: "Find nearby centers that accept it." },
];

const stats = [
  { value: "12,400+", label: "Items segregated" },
  { value: "8.6 T", label: "Waste diverted" },
  { value: "3,200", label: "Active eco-users" },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-center">
        <img src={HERO} alt="Lush green forest" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/60 to-transparent" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-20">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-full text-emerald-700 text-sm font-semibold shadow-sm mb-6">
            <Recycle className="w-4 h-4" /> Waste2Worth
          </div>
          <h1 className="font-head text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter text-gray-900 leading-[0.95]">
            Waste smarter.<br />Live greener.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-700 max-w-xl leading-relaxed">
            AI-powered waste identification and responsible disposal made simple.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link to="/login" data-testid="hero-scan-btn"
              className="group inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-7 py-4 rounded-full shadow-lg shadow-emerald-600/25 transition-all hover:-translate-y-0.5">
              <Camera className="w-5 h-5" /> Scan Waste
              <ArrowRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </Link>
            <Link to="/login" data-testid="hero-login-btn"
              className="inline-flex items-center gap-2 bg-white/90 backdrop-blur text-emerald-800 font-semibold px-7 py-4 rounded-full shadow-md hover:-translate-y-0.5 transition-all">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Flow */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 mb-3">How it works</p>
        <h2 className="font-head text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-10">
          Scan → Identify → Segregate → Recycle
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <div key={s.title} className="bg-white rounded-3xl p-7 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <s.icon className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-emerald-500 mb-1">STEP {i + 1}</div>
              <h3 className="font-head text-xl font-bold text-gray-900">{s.title}</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Impact */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-[2rem] p-10 sm:p-14 text-white grid grid-cols-1 sm:grid-cols-3 gap-8">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-head text-4xl sm:text-5xl font-extrabold">{s.value}</div>
              <div className="text-emerald-50 mt-2">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-gray-500 text-sm">
          <span className="inline-flex items-center gap-2"><Sprout className="w-4 h-4 text-emerald-500" /> Earn EcoPoints</span>
          <span className="inline-flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Safe hazardous disposal</span>
          <span className="inline-flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-500" /> Nearby recycling centers</span>
        </div>
      </section>
    </div>
  );
}
