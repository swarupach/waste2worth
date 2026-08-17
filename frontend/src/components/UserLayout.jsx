import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Home, Camera, Recycle, Sprout, User } from "lucide-react";

const items = [
  { to: "/app", icon: Home, label: "Home", end: true, testid: "nav-home" },
  { to: "/app/scan", icon: Camera, label: "Scan", testid: "nav-scan" },
  { to: "/app/disposal", icon: Recycle, label: "Disposal", testid: "nav-disposal" },
  { to: "/app/impact", icon: Sprout, label: "Impact", testid: "nav-impact" },
  { to: "/app/profile", icon: User, label: "Profile", testid: "nav-profile" },
];

export default function UserLayout() {
  return (
    <div className="min-h-screen bg-[#F4FBF6]">
      <div className="max-w-md mx-auto min-h-screen bg-[#F4FBF6] shadow-sm relative pb-24">
        <Outlet />
      </div>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50">
        <div className="grid grid-cols-5 px-2 py-2">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end} data-testid={it.testid}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1.5 rounded-xl transition-colors ${isActive ? "text-emerald-600" : "text-gray-400"}`}>
              {({ isActive }) => (
                <>
                  <it.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-semibold">{it.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
