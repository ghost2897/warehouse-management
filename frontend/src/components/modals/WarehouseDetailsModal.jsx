import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Boxes, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { warehousesApi } from '../../services/api';
import StatusBadge from '../common/StatusBadge';

export default function WarehouseDetailsModal({ warehouseId, isOpen, onClose }) {
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'transfers'

  useEffect(() => {
    if (!isOpen || !warehouseId) return;

    async function fetchDetails() {
      try {
        setLoading(true);
        setError(null);
        const res = await warehousesApi.getById(warehouseId);
        setWarehouse(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load warehouse details.');
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [isOpen, warehouseId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-sky-700 bg-sky-100 px-2.5 py-1 rounded-md border border-sky-200">
              {warehouseId}
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">{warehouse?.name || 'Warehouse Details'}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {warehouse?.location}
              </p>
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
          <div className="p-12 text-center text-slate-500 animate-pulse">Loading warehouse details...</div>
        ) : warehouse ? (
          <div className="p-6 space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Capacity</div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {warehouse.capacity?.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Inventory</div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {warehouse.total_inventory?.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Utilization Rate</div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {warehouse.utilization_rate}%
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      warehouse.utilization_rate > 100
                        ? 'bg-rose-500'
                        : warehouse.utilization_rate > 75
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, warehouse.utilization_rate)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 flex gap-4">
              <button
                onClick={() => setActiveTab('inventory')}
                className={`pb-2.5 text-xs font-bold transition border-b-2 ${
                  activeTab === 'inventory'
                    ? 'border-sky-600 text-sky-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Products Stored ({warehouse.products?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('transfers')}
                className={`pb-2.5 text-xs font-bold transition border-b-2 ${
                  activeTab === 'transfers'
                    ? 'border-sky-600 text-sky-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Recent Transfers ({warehouse.recent_transfers?.length || 0})
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'inventory' && (
              <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold sticky top-0">
                    <tr>
                      <th className="px-3.5 py-2.5">Product ID</th>
                      <th className="px-3.5 py-2.5">Product Name</th>
                      <th className="px-3.5 py-2.5">Category</th>
                      <th className="px-3.5 py-2.5 text-right">Price</th>
                      <th className="px-3.5 py-2.5 text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {warehouse.products?.map((p) => (
                      <tr key={p.product_id} className="hover:bg-slate-50/50">
                        <td className="px-3.5 py-2 font-mono font-semibold text-slate-700">{p.product_id}</td>
                        <td className="px-3.5 py-2 font-medium text-slate-900">{p.product_name}</td>
                        <td className="px-3.5 py-2 text-slate-600">{p.category}</td>
                        <td className="px-3.5 py-2 text-right text-slate-600">₹{Number(p.price).toLocaleString()}</td>
                        <td className="px-3.5 py-2 text-right font-bold text-slate-900">
                          {Number(p.quantity).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'transfers' && (
              <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold sticky top-0">
                    <tr>
                      <th className="px-3.5 py-2.5">ID</th>
                      <th className="px-3.5 py-2.5">Route</th>
                      <th className="px-3.5 py-2.5">Date</th>
                      <th className="px-3.5 py-2.5">Vehicle</th>
                      <th className="px-3.5 py-2.5 text-right">Units</th>
                      <th className="px-3.5 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {warehouse.recent_transfers?.map((t) => (
                      <tr key={t.transfer_id} className="hover:bg-slate-50/50">
                        <td className="px-3.5 py-2 font-mono font-semibold text-sky-700">{t.transfer_id}</td>
                        <td className="px-3.5 py-2 text-slate-700">
                          {t.source_warehouse_id} → {t.destination_warehouse_id}
                        </td>
                        <td className="px-3.5 py-2 text-slate-600">{t.transfer_date}</td>
                        <td className="px-3.5 py-2 text-slate-600">{t.vehicle_number_plate || '—'}</td>
                        <td className="px-3.5 py-2 text-right font-bold text-slate-900">{t.total_quantity}</td>
                        <td className="px-3.5 py-2">
                          <StatusBadge status={t.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

