import React, { useState, useEffect } from 'react';
import { X, Truck, Phone, Shield, ArrowLeftRight } from 'lucide-react';
import { vehiclesApi } from '../../services/api';
import StatusBadge from '../common/StatusBadge';

export default function VehicleHistoryModal({ vehicleId, isOpen, onClose }) {
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !vehicleId) return;

    async function fetchVehicle() {
      try {
        setLoading(true);
        setError(null);
        const res = await vehiclesApi.getById(vehicleId);
        setVehicle(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load vehicle history.');
      } finally {
        setLoading(false);
      }
    }

    fetchVehicle();
  }, [isOpen, vehicleId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-sky-700 bg-sky-100 px-2.5 py-1 rounded-md border border-sky-200">
              {vehicleId}
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">{vehicle?.name || 'Vehicle History'}</h3>
              <p className="text-xs text-slate-500 font-mono">{vehicle?.vehicle_number_plate} • {vehicle?.vehicle_type}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 animate-pulse">Loading vehicle trip records...</div>
        ) : vehicle ? (
          <div className="p-6 space-y-6">
            {/* Metadata banner */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block mb-1">Contact</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-sky-600" />
                  {vehicle.contact_number || 'N/A'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block mb-1">Insurance Policy</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  {vehicle.insurance || 'N/A'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-slate-400 block mb-1">Total Trips Executed</span>
                <span className="text-base font-bold text-slate-900">
                  {vehicle.total_transfers_count}
                </span>
              </div>
            </div>

            {/* Trips list */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
                Associated Transfer Trips
              </h4>
              <div className="rounded-xl border border-slate-200 overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold sticky top-0">
                    <tr>
                      <th className="px-3.5 py-2.5">Transfer</th>
                      <th className="px-3.5 py-2.5">Route</th>
                      <th className="px-3.5 py-2.5">Date</th>
                      <th className="px-3.5 py-2.5 text-right">Units</th>
                      <th className="px-3.5 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vehicle.transfers?.length ? (
                      vehicle.transfers.map((t) => (
                        <tr key={t.transfer_id} className="hover:bg-slate-50/50">
                          <td className="px-3.5 py-2 font-mono font-semibold text-sky-700">{t.transfer_id}</td>
                          <td className="px-3.5 py-2 text-slate-700">
                            {t.source_warehouse_name} → {t.destination_warehouse_name}
                          </td>
                          <td className="px-3.5 py-2 text-slate-600">{t.transfer_date}</td>
                          <td className="px-3.5 py-2 text-right font-bold text-slate-900">{Number(t.total_quantity).toLocaleString()}</td>
                          <td className="px-3.5 py-2">
                            <StatusBadge status={t.status} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-6 text-center text-slate-500">
                          No transfer trips recorded for this vehicle.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

