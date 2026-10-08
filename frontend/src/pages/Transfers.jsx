import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftRight,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Eye,
  Calendar,
  Truck,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { transfersApi, warehousesApi } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import Pagination from '../components/common/Pagination';
import TransferDetailsModal from '../components/modals/TransferDetailsModal';
import CreateTransferModal from '../components/modals/CreateTransferModal';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Transfers() {
  const { refreshKey, triggerRefresh } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [sourceWarehouseId, setSourceWarehouseId] = useState('ALL');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('transfer_date');
  const [order, setOrder] = useState('DESC');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Modals
  const [selectedTransferId, setSelectedTransferId] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(searchParams.get('action') === 'create');

  // Load warehouses for filter
  useEffect(() => {
    async function loadWhs() {
      try {
        const res = await warehousesApi.getAll();
        setWarehouses(res.data || []);
      } catch (e) {
        console.error('Failed to load warehouses:', e);
      }
    }
    loadWhs();
  }, []);

  // Fetch transfers
  useEffect(() => {
    async function fetchTransfers() {
      try {
        setLoading(true);
        setError(null);
        const res = await transfersApi.getAll({
          search,
          status,
          sourceWarehouseId,
          destinationWarehouseId,
          startDate,
          endDate,
          sortBy,
          order,
          page,
          limit
        });
        setTransfers(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } catch (err) {
        setError(err.message || 'Failed to load transfers.');
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchTransfers, 150);
    return () => clearTimeout(timer);
  }, [
    refreshKey,
    search,
    status,
    sourceWarehouseId,
    destinationWarehouseId,
    startDate,
    endDate,
    sortBy,
    order,
    page,
    limit
  ]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setOrder(order === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setOrder('DESC');
    }
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Stock Transfers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Dispatch logistics, multi-item manifests, and transaction-safe stock synchronization
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Transfer
        </button>
      </div>

      {/* Control Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID, vehicle plate, route..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/40 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/40 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="IN TRANSIT">IN TRANSIT</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>

            {/* Source Wh */}
            <select
              value={sourceWarehouseId}
              onChange={(e) => {
                setSourceWarehouseId(e.target.value);
                setPage(1);
              }}
              className="text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/40 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Sources</option>
              {warehouses.map(w => (
                <option key={w.warehouse_id} value={w.warehouse_id}>
                  Src: {w.warehouse_id}
                </option>
              ))}
            </select>

            {/* Destination Wh */}
            <select
              value={destinationWarehouseId}
              onChange={(e) => {
                setDestinationWarehouseId(e.target.value);
                setPage(1);
              }}
              className="text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/40 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Destinations</option>
              {warehouses.map(w => (
                <option key={w.warehouse_id} value={w.warehouse_id}>
                  Dest: {w.warehouse_id}
                </option>
              ))}
            </select>

            {/* Date range */}
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="text-xs font-semibold border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50/40 focus:outline-none focus:ring-2 focus:ring-sky-500"
              title="From Date"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="text-xs font-semibold border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50/40 focus:outline-none focus:ring-2 focus:ring-sky-500"
              title="To Date"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Found {pagination.total} transfers matching filter criteria</span>
          {(status !== 'ALL' || sourceWarehouseId !== 'ALL' || destinationWarehouseId !== 'ALL' || startDate || endDate || search) && (
            <button
              onClick={() => {
                setStatus('ALL');
                setSourceWarehouseId('ALL');
                setDestinationWarehouseId('ALL');
                setStartDate('');
                setEndDate('');
                setSearch('');
                setPage(1);
              }}
              className="text-xs font-bold text-sky-600 hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Retrieving transfer records from MariaDB..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th
                      onClick={() => handleSort('transfer_id')}
                      className="px-5 py-3.5 cursor-pointer hover:text-slate-800"
                    >
                      <div className="flex items-center gap-1.5">
                        Transfer ID
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="px-5 py-3.5">Source Warehouse</th>
                    <th className="px-5 py-3.5">Destination Warehouse</th>
                    <th
                      onClick={() => handleSort('transfer_date')}
                      className="px-5 py-3.5 cursor-pointer hover:text-slate-800"
                    >
                      <div className="flex items-center gap-1.5">
                        Date
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="px-5 py-3.5">Transport Vehicle</th>
                    <th className="px-5 py-3.5 text-right">Volume</th>
                    <th
                      onClick={() => handleSort('status')}
                      className="px-5 py-3.5 cursor-pointer hover:text-slate-800"
                    >
                      <div className="flex items-center gap-1.5">
                        Status
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transfers.map((t) => (
                    <tr key={t.transfer_id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4 font-mono font-bold text-sky-700">
                        {t.transfer_id}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{t.source_warehouse_name}</div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {t.source_warehouse_id} ({t.source_location})
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{t.destination_warehouse_name}</div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {t.destination_warehouse_id} ({t.destination_location})
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-medium">
                        {t.transfer_date}
                      </td>
                      <td className="px-5 py-4">
                        {t.transport_id ? (
                          <div>
                            <div className="font-semibold text-slate-800">{t.vehicle_number_plate}</div>
                            <span className="text-[10px] text-slate-400 uppercase">{t.vehicle_type}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="font-extrabold text-slate-900">
                          {Number(t.total_quantity).toLocaleString()} units
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {t.total_items} SKU product{t.total_items > 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedTransferId(t.transfer_id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition"
                        >
                          <Eye className="w-3.5 h-3.5 text-sky-600" />
                          Manifest
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(lim) => {
                setLimit(lim);
                setPage(1);
              }}
            />
          </>
        )}
      </div>

      {/* Modals */}
      {selectedTransferId && (
        <TransferDetailsModal
          transferId={selectedTransferId}
          isOpen={Boolean(selectedTransferId)}
          onClose={() => setSelectedTransferId(null)}
          onStatusUpdated={() => {
            triggerRefresh();
          }}
        />
      )}

      {createModalOpen && (
        <CreateTransferModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            triggerRefresh();
          }}
        />
      )}
    </div>
  );
}

