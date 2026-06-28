import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Zap,
  Brain,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Customers', icon: Users, path: '/customers' },
  { label: 'Recommendations', icon: Zap, path: '/recommendations' },
  { label: 'Agent Pipeline', icon: Brain, path: '/pipeline' },
  { label: 'Memory', icon: Database, path: '/memory' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-40 bg-slate-950 text-white transition-all duration-300 flex flex-col ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <Brain className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm tracking-wide truncate">
            Decision Intelligence
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV_ITEMS.map((item) => {
          const active =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-violet-600/20 text-violet-300'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-12 border-t border-slate-800 text-slate-500 hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}