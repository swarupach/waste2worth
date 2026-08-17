import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, BarChart3, Trash2, Truck, AlertTriangle, MapPin, Users2, Recycle, LogOut, Menu, X } from "lucide-react";
import { clearUser } from "@/lib/appApi";

const items = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true, testid: "admin-nav-dashboard" },
  { to: "/admin/analytics", icon: BarChart3, label: "Analytics", testid: "admin-nav-analytics" },
  { to: "/admin/smartbins", icon: Trash2, label: "Smart Bins", testid: "admin-nav-smartbins" },
  { to: "/admin/pickups", icon: Truck, label: "Pickup Requests", testid: "admin-nav-pickups" },
  { to: "/admin/reports", icon: AlertTriangle, label: "Reports", testid: "admin-nav-reports" },
  { to: "/admin/centers", icon: MapPin, label: "Recycling Centers", testid: "admin-nav-centers" },
  { to: "/admin/users", icon: Users2, label: "Users", testid: "admin-nav-users" },
];

export default function AdminLayout() {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const logout = () => { clearUser(); nav("/login"); };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center"><Recycle className="w-5 h-5" /></div>
        <div>
          <div className="font-head font-bold text-gray-900 leading-tight">Waste2Worth</div>
          <div className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Admin</div>
        </div>
      </div>
      <div className="flex-1 px-3 space-y-1">
        {items.map((it) => (
          <NavLink key={it.to} to={it.to} end={it.end} data-testid={it.testid} onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? "bg-emerald-50 text-emerald-700" : "text-gray-500 hover:bg-gray-50"}`}>
            <it.icon className="w-4.5 h-4.5" /> {it.label}
          </NavLink>
        ))}
      </div>
      <button data-testid="admin-logout-btn" onClick={logout}
        className="m-3 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
        <LogOut className="w-4.5 h-4.5" /> Log out
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4FBF6] flex">
      <aside className="hidden lg:block w-64 bg-white border-r border-gray-100 fixed h-screen">
        <Sidebar />
      </aside>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-white h-full shadow-xl"><Sidebar /></div>
          <div className="flex-1 bg-black/30" onClick={() => setOpen(false)} />
        </div>
      )}
      <div className="flex-1 lg:ml-64">
        <header className="lg:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-4 py-3">
          <button data-testid="admin-menu-btn" onClick={() => setOpen(true)}><Menu className="w-6 h-6 text-gray-700" /></button>
          <span className="font-head font-bold text-gray-900">Waste2Worth Admin</span>
          <span className="w-6" />
        </header>
        <main className="p-5 sm:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
