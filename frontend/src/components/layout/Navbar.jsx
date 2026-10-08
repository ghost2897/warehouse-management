import React from 'react';
import { Menu, Plus, RefreshCw, ArrowLeftRight, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ setMobileOpen, onRefresh, refreshing, onOpenNewTransfer }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-8 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-100">
            CachyOS Linux Production
          </span>
          <span className="hidden md:inline-block px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
            ● Live Sync
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            title="Refresh live data"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-sky-600' : ''}`} />
          </button>
        )}

        <button
          onClick={() => {
            if (onOpenNewTransfer) {
              onOpenNewTransfer();
            } else {
              navigate('/transfers?action=create');
            }
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all hover:shadow-lg active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Transfer</span>
        </button>
      </div>
    </header>
  );
}

