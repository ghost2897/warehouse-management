import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Calendar, Truck, Box, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { transfersApi } from '../../services/api';
import StatusBadge from '../common/StatusBadge';

export default function TransferDetailsModal({ transferId, isOpen, onClose, onStatusUpdated }) {
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (!isOpen || !transferId) return;

    async function fetchTransfer() {
      try {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        const res = await transfersApi.getById(transferId);
        setTransfer(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load transfer details.');
      } finally {
        setLoading(false);
      }
    }

    fetchTransfer();
  }, [isOpen, transferId]);

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      setError(null);
      setSuccessMessage(null);
      const res = await transfersApi.updateStatus(transferId, newStatus);
      setTransfer(res.data);
      setSuccessMessage(`Transfer successfully updated to ${newStatus}!`);
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      setError(err.message || 'Failed to update transfer status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
              {transferId}
            </span>
            <h3 className="text-base font-bold text-slate-900">Transfer Manifest</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 animate-pulse">Loading manifest...</div>
        ) : transfer ? (
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Route & Status Banner */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase">From</div>
                  <div className="text-sm font-bold text-slate-900">{transfer.source_warehouse_name}</div>
                  <div className="text-xs text-slate-500">{transfer.source_location} ({transfer.source_warehouse_id})</div>
                </div>
                <div className="p-2 rounded-full bg-white border border-slate-200 shadow-sm text-slate-400">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase">To</div>
                  <div className="text-sm font-bold text-slate-900">{transfer.destination_warehouse_name}</div>
                  <div className="text-xs text-slate-500">{transfer.destination_location} ({transfer.destination_warehouse_id})</div>
                </div>
              </div>

              <div className="sm:text-right">
                <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">Status</div>
                <StatusBadge status={transfer.status} />
              </div>
            </div>

            {/* Logistics Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-xs">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Transfer Date</span>
                </div>
                <span className="font-semibold text-slate-800">{transfer.transfer_date}</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-xs">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Assigned Vehicle</span>
                </div>
                <span className="font-semibold text-slate-800">
                  {transfer.vehicle_number_plate ? `${transfer.vehicle_number_plate} (${transfer.vehicle_type})` : 'Unassigned'}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-xs col-span-2 sm:col-span-1">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Box className="w-3.5 h-3.5" />
                  <span>Total Volume</span>
                </div>
                <span className="font-semibold text-slate-800">
                  {transfer.total_quantity?.toLocaleString()} units ({transfer.total_items} items)
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Manifest Products
              </h4>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="px-3.5 py-2.5">Product</th>
                      <th className="px-3.5 py-2.5">Category</th>
                      <th className="px-3.5 py-2.5 text-right">Quantity</th>
                      <th className="px-3.5 py-2.5 text-right">Unit Price</th>
                      <th className="px-3.5 py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transfer.items?.map((it) => (
                      <tr key={it.product_id} className="hover:bg-slate-50/50">
                        <td className="px-3.5 py-2.5 font-medium text-slate-900">
                          <div>{it.product_name}</div>
                          <span className="text-[10px] text-slate-400 font-mono">{it.product_id}</span>
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-600">{it.category}</td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                          {Number(it.quantity).toLocaleString()}
                        </td>
                        <td className="px-3.5 py-2.5 text-right text-slate-600">
                          ₹{Number(it.price).toLocaleString()}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-semibold text-slate-900">
                          ₹{Number(it.total_value).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Status Transition Actions */}
            {transfer.status !== 'COMPLETED' && transfer.status !== 'CANCELLED' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-700 mb-2">Manage Status Workflow</div>
                <div className="flex flex-wrap gap-2">
                  {transfer.status === 'PENDING' && (
                    <button
                      onClick={() => handleStatusChange('IN TRANSIT')}
                      disabled={updatingStatus}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition disabled:opacity-50"
                    >
                      Mark as In Transit
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusChange('COMPLETED')}
                    disabled={updatingStatus}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition disabled:opacity-50"
                  >
                    Mark as Completed (Execute Stock Move)
                  </button>
                  <button
                    onClick={() => handleStatusChange('CANCELLED')}
                    disabled={updatingStatus}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition disabled:opacity-50"
                  >
                    Cancel Transfer
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">Transfer not found.</div>
        )}
      </div>
    </div>
  );
}

