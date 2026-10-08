import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Building2, Search, ArrowUpDown, Eye, MapPin, Boxes, AlertCircle } from 'lucide-react';
import { warehousesApi } from '../services/api';
import WarehouseDetailsModal from '../components/modals/WarehouseDetailsModal';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Warehouses() {
  const { refreshKey } = useOutletContext();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('warehouse_id');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);

  useEffect(() => {
    async function fetchWarehouses() {
      try {
        setLoading(true);
        setError(null);
        const res = await warehousesApi.getAll();
        setWarehouses(res.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load warehouses.');
      } finally {
        setLoading(false);
      }
    }

    fetchWarehouses();
  }, [refreshKey]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedWarehouses = useMemo(() => {
    let list = [...warehouses];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(w =>
        w.warehouse_id?.toLowerCase().includes(q) ||
        w.name?.toLowerCase().includes(q) ||
        w.location?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'utilization_rate' || sortField === 'total_inventory' || sortField === 'capacity') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [warehouses, searchTerm, sortField, sortOrder]);

  if (loading) return <LoadingSpinner text="Retrieving facility network from MariaDB..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Warehouses & Facilities
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Global storage hubs, capacities, and live capacity utilization
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search warehouse ID, name, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/40 focus:bg-white"
          />
        </div>

        <div className="text-xs font-semibold text-slate-500 self-end sm:self-center">
          Total Facilities: <span className="text-slate-900 font-bold">{filteredAndSortedWarehouses.length}</span>
        </div>
      </div>

      {/* Warehouses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th
                  onClick={() => handleSort('warehouse_id')}
                  className="px-5 py-3.5 cursor-pointer hover:text-slate-800"
                >
                  <div className="flex items-center gap-1.5">
                    Warehouse ID
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="px-5 py-3.5 cursor-pointer hover:text-slate-800"
                >
                  <div className="flex items-center gap-1.5">
                    Facility Name
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('location')}
                  className="px-5 py-3.5 cursor-pointer hover:text-slate-800"
                >
                  <div className="flex items-center gap-1.5">
                    Location
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('capacity')}
                  className="px-5 py-3.5 text-right cursor-pointer hover:text-slate-800"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    Capacity
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('total_inventory')}
                  className="px-5 py-3.5 text-right cursor-pointer hover:text-slate-800"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    Total Inventory
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('utilization_rate')}
                  className="px-5 py-3.5 cursor-pointer hover:text-slate-800"
                >
                  <div className="flex items-center gap-1.5">
                    Utilization
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedWarehouses.map((wh) => (
                <tr key={wh.warehouse_id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4 font-mono font-bold text-sky-700">
                    {wh.warehouse_id}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900 text-sm">{wh.name}</div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {wh.product_count} unique SKU products
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {wh.location}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-medium text-slate-700">
                    {Number(wh.capacity).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-right font-extrabold text-slate-900">
                    {Number(wh.total_inventory).toLocaleString()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="w-36">
                      <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                        <span className={wh.utilization_rate > 100 ? 'text-rose-600' : 'text-slate-700'}>
                          {wh.utilization_rate}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            wh.utilization_rate > 100
                              ? 'bg-rose-500'
                              : wh.utilization_rate > 80
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, wh.utilization_rate)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setSelectedWarehouseId(wh.warehouse_id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-sky-600" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warehouse Details Modal */}
      {selectedWarehouseId && (
        <WarehouseDetailsModal
          warehouseId={selectedWarehouseId}
          isOpen={Boolean(selectedWarehouseId)}
          onClose={() => setSelectedWarehouseId(null)}
        />
      )}
    </div>
  );
}

