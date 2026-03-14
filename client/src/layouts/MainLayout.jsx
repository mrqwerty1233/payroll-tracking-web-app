import { Outlet } from "react-router-dom";
import { useState } from "react";
import Navbar from "../components/Navbar";

const DEMO_MODE =
  String(import.meta.env.VITE_DEMO_MODE || "").toLowerCase() === "true";

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Navbar collapsed={collapsed} setCollapsed={setCollapsed} />

      <main
        className={`min-h-screen px-4 py-4 transition-all duration-300 lg:px-8 lg:py-8 ${
          collapsed ? "lg:ml-24" : "lg:ml-80"
        }`}
      >
        <div className="w-full max-w-none">
          {DEMO_MODE && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
              <span className="font-semibold">Demo Mode Active:</span> this public
              deployment is using sample data for portfolio viewing. Changes are not
              saved.
            </div>
          )}

          <Outlet />
        </div>
      </main>
    </div>
  );
}