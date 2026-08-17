import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

// Category visual helpers
export const CAT = {
  Biodegradable: { chip: "bg-violet-100 text-violet-700", dot: "bg-violet-500", bar: "bg-violet-500", label: "🟢 Biodegradable" },
  Recyclable: { chip: "bg-blue-100 text-blue-700", dot: "bg-blue-500", bar: "bg-blue-500", label: "🔵 Recyclable" },
  Hazardous: { chip: "bg-red-100 text-red-700", dot: "bg-red-500", bar: "bg-red-500", label: "🔴 Hazardous" },
};

export const STATUS_COLORS = {
  Submitted: "bg-slate-100 text-slate-600",
  "Under Review": "bg-amber-100 text-amber-700",
  Assigned: "bg-blue-100 text-blue-700",
  "In Progress": "bg-indigo-100 text-indigo-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Resolved: "bg-emerald-100 text-emerald-700",
};

export function getUser() {
  const raw = localStorage.getItem("ecosort_user");
  return raw ? JSON.parse(raw) : null;
}
export function setUser(u) {
  localStorage.setItem("ecosort_user", JSON.stringify(u));
}
export function clearUser() {
  localStorage.removeItem("ecosort_user");
}
