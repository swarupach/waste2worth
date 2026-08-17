import { useEffect, useState } from "react";
import { Users2, Award } from "lucide-react";
import { api } from "@/lib/appApi";

export default function Users() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/admin/users").then((r) => setItems(r.data)); }, []);

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="font-head text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2"><Users2 className="w-6 h-6 text-emerald-600" /> Users</h1>
      <p className="text-gray-400 text-sm mb-6">Registered eco-users and their activity</p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3 hidden sm:table-cell">Community</th>
              <th className="px-5 py-3 text-center">Segregated</th>
              <th className="px-5 py-3 text-right">EcoPoints</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id} data-testid={`user-row-${u.id}`} className="border-t border-gray-50">
                <td className="px-5 py-3">
                  <div className="font-semibold text-gray-800 text-sm">{u.name}</div>
                  <div className="text-xs text-gray-400">{u.email}</div>
                </td>
                <td className="px-5 py-3 hidden sm:table-cell text-sm text-gray-500">{u.community}</td>
                <td className="px-5 py-3 text-center text-sm text-gray-600">{u.items_segregated}</td>
                <td className="px-5 py-3 text-right">
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600"><Award className="w-4 h-4" /> {u.ecopoints}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
