import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import CreateTransferModal from '../modals/CreateTransferModal';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Navbar
          setMobileOpen={setMobileOpen}
          onRefresh={handleRefresh}
          onOpenNewTransfer={() => setTransferModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ refreshKey, triggerRefresh: handleRefresh, openTransferModal: () => setTransferModalOpen(true) }} />
        </main>
      </div>

      {/* Global Create Transfer Modal */}
      {transferModalOpen && (
        <CreateTransferModal
          isOpen={transferModalOpen}
          onClose={() => setTransferModalOpen(false)}
          onSuccess={() => {
            setTransferModalOpen(false);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}

