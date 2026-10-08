import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Package,
  Boxes,
  ArrowLeftRight,
  Truck,
  BarChart3,
  Database,
  X
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Warehouses', href: '/warehouses', icon: Building2 },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Inventory', href: '/inventory', icon: Boxes },
  { name: 'Transfers', href: '/transfers', icon: ArrowLeftRight },
  { name: 'Transport Vehicles', href: '/transport-vehicles', icon: Truck },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-md shadow-sky-500/20">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white leading-none">
                NexStore
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-400">
                Enterprise WMS
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <div className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Operations
          </div>
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>

        {/* Bottom system status card */}
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700/60">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 -ml-3"></div>
              <span className="text-xs font-semibold text-slate-200">MariaDB 13.0.2</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span className="truncate">Database: warehouse</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

