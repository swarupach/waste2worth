import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { getUser } from "@/lib/appApi";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import UserLayout from "@/components/UserLayout";
import AdminLayout from "@/components/AdminLayout";

import Home from "@/pages/user/Home";
import Scan from "@/pages/user/Scan";
import Disposal from "@/pages/user/Disposal";
import Impact from "@/pages/user/Impact";
import Profile from "@/pages/user/Profile";
import Pickup from "@/pages/user/Pickup";
import Report from "@/pages/user/Report";

import AdminDashboard from "@/pages/admin/Dashboard";
import Analytics from "@/pages/admin/Analytics";
import SmartBins from "@/pages/admin/SmartBins";
import AdminPickups from "@/pages/admin/Pickups";
import AdminReports from "@/pages/admin/Reports";
import Centers from "@/pages/admin/Centers";
import Users from "@/pages/admin/Users";

function RequireRole({ role, children }) {
  const u = getUser();
  if (!u) return <Navigate to="/login" replace />;
  if (u.role !== role) return <Navigate to={u.role === "admin" ? "/admin" : "/app"} replace />;
  return children;
}

function App() {
  return (
    <div className="App">
      <Toaster position="top-center" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          <Route path="/app" element={<RequireRole role="user"><UserLayout /></RequireRole>}>
            <Route index element={<Home />} />
            <Route path="scan" element={<Scan />} />
            <Route path="disposal" element={<Disposal />} />
            <Route path="impact" element={<Impact />} />
            <Route path="profile" element={<Profile />} />
            <Route path="pickup" element={<Pickup />} />
            <Route path="report" element={<Report />} />
          </Route>

          <Route path="/admin" element={<RequireRole role="admin"><AdminLayout /></RequireRole>}>
            <Route index element={<AdminDashboard />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="smartbins" element={<SmartBins />} />
            <Route path="pickups" element={<AdminPickups />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="centers" element={<Centers />} />
            <Route path="users" element={<Users />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
