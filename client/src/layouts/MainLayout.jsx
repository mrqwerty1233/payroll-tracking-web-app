import { Outlet } from "react-router-dom";
import { useState } from "react";
import Navbar from "../components/Navbar";

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
          <Outlet />
        </div>
      </main>
    </div>
  );
}