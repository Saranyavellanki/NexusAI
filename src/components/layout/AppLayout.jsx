import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 z-50 flex items-center px-4">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
          <Menu className="w-5 h-5 text-slate-600" />
        </button>
        <span className="ml-3 text-sm font-semibold text-slate-800">Decision Intelligence</span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`hidden lg:block`}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>
      <div className={`lg:hidden fixed top-0 left-0 z-50 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
      </div>

      <main
        className={`transition-all duration-300 min-h-screen pt-14 lg:pt-0 ${
          collapsed ? 'lg:ml-16' : 'lg:ml-60'
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}