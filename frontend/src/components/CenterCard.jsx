import { Phone, MapPin, Clock, Navigation, Star } from "lucide-react";

export default function CenterCard({ c, isFav, onToggleFav }) {
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.name + " " + c.location)}`;
  return (
    <div data-testid={`center-card-${c.id}`} className={`bg-white rounded-3xl p-5 border shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${isFav ? "border-amber-200" : "border-gray-100"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-head font-bold text-gray-900">{c.name}</h3>
            {isFav && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
          </div>
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5" /> {c.location} · {c.distance}</p>
        </div>
        {onToggleFav && (
          <button data-testid={`center-fav-${c.id}`} onClick={() => onToggleFav(c.id)} aria-label="Toggle favourite"
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-amber-50 transition-colors shrink-0">
            <Star className={`w-5 h-5 transition-colors ${isFav ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
          </button>
        )}
      </div>
      <p className="text-sm text-gray-600 mt-3"><span className="font-semibold text-gray-800">Accepts:</span> {c.accepted_types}</p>
      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1.5"><Clock className="w-3.5 h-3.5" /> {c.hours}</p>
      <div className="flex gap-2 mt-4">
        <a data-testid={`center-call-${c.id}`} href={`tel:${c.phone}`}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 rounded-full transition-colors">
          <Phone className="w-4 h-4" /> Call Center
        </a>
        <a data-testid={`center-directions-${c.id}`} href={mapUrl} target="_blank" rel="noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold py-2.5 rounded-full transition-colors">
          <Navigation className="w-4 h-4" /> Directions
        </a>
      </div>
    </div>
  );
}
