import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Truck, Search, Plus, Edit2, Trash2, History, Phone, Shield, AlertCircle } from 'lucide-react';
import { vehiclesApi } from '../services/api';
import VehicleModal from '../components/modals/VehicleModal';
import VehicleHistoryModal from '../components/modals/VehicleHistoryModal';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Vehicles() {
  const { refreshKey, triggerRefresh } = useOutletContext();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [vehicleType, setVehicleType] = useState('ALL');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [historyVehicleId, setHistoryVehicleId] = useState(null);

  useEffect(() => {
    async function fetchVehicles() {
      try {
        setLoading(true);
        setError(null);
        const res = await vehiclesApi.getAll({ search, vehicleType });
        setVehicles(res.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load vehicles.');
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchVehicles, 150);
    return () => clearTimeout(timer);
  }, [refreshKey, search, vehicleType]);

  const handleDelete = async (transportId) => {
    if (!window.confirm(`Are you sure you want to delete vehicle ${transportId}? Safe deletion will verify if any transfers exist.`)) {
      return;
    }

    try {
      await vehiclesApi.delete(transportId);
      triggerRefresh();
    } catch (err) {
      alert(`Deletion blocked: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Transport Fleet
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Registered transport vehicles, haulage partners, and dispatch history
          </p>
        </div>

        <button
          onClick={() => {
            setEditingVehicle(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add New Vehicle
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search plate, name, partner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/40 focus:bg-white"
            />
          </div>

          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/40 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">All Vehicle Types</option>
            <option value="TRUCK">TRUCK</option>
            <option value="VAN">VAN</option>
            <option value="MINI TRUCK">MINI TRUCK</option>
          </select>
        </div>

        <div className="text-xs font-semibold text-slate-500 self-end sm:self-center">
          Active Fleet: <span className="text-slate-900 font-bold">{vehicles.length}</span>
        </div>
      </div>

      {/* Vehicle Grid / Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Retrieving vehicle fleet registry from MariaDB..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Transport ID</th>
                  <th className="px-5 py-3.5">Partner Name</th>
                  <th className="px-5 py-3.5">Vehicle Type</th>
                  <th className="px-5 py-3.5">Number Plate</th>
                  <th className="px-5 py-3.5">Contact</th>
                  <th className="px-5 py-3.5">Insurance</th>
                  <th className="px-5 py-3.5 text-right">Trips Logged</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicles.map((v) => (
                  <tr key={v.transport_id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4 font-mono font-bold text-sky-700">
                      {v.transport_id}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {v.name}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                        <Truck className="w-3 h-3 text-slate-500" />
                        {v.vehicle_type}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-slate-800">
                      {v.vehicle_number_plate}
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {v.contact_number || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3 h-3 text-emerald-500" />
                        {v.insurance || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-1 rounded-md">
                        {v.total_transfers_count || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setHistoryVehicleId(v.transport_id)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                          title="Trip History"
                        >
                          <History className="w-4 h-4 text-sky-600" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingVehicle(v);
                            setModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-slate-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(v.transport_id)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600"
                          title="Delete Vehicle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <VehicleModal
          isOpen={modalOpen}
          vehicle={editingVehicle}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            triggerRefresh();
          }}
        />
      )}

      {/* Trip History Modal */}
      {historyVehicleId && (
        <VehicleHistoryModal
          vehicleId={historyVehicleId}
          isOpen={Boolean(historyVehicleId)}
          onClose={() => setHistoryVehicleId(null)}
        />
      )}
    </div>
  );
}

