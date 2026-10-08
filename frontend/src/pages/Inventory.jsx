import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Boxes, Search, Filter, AlertTriangle, ArrowUpDown, Building2, Package, Check, Edit2, X } from 'lucide-react';
import { inventoryApi, warehousesApi, productsApi } from '../services/api';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Inventory() {
  const { refreshKey } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [inventory, setInventory] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & State
  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(searchParams.get('lowStock') === 'true');
  const [lowStockThreshold, setLowStockThreshold] = useState(200);
  const [sortBy, setSortBy] = useState('quantity');
  const [order, setOrder] = useState('ASC');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Direct stock edit state
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Load warehouse & category filters on mount
  useEffect(() => {
    async function loadFilters() {
      try {
        const [wRes, cRes] = await Promise.all([
          warehousesApi.getAll(),
          productsApi.getCategories()
        ]);
        setWarehouses(wRes.data || []);
        setCategories(cRes.data || []);
      } catch (e) {
        console.error('Failed to load filter options:', e);
      }
    }
    loadFilters();
  }, []);

  // Fetch inventory
  useEffect(() => {
    async function fetchInventory() {
      try {
        setLoading(true);
        setError(null);
        const res = await inventoryApi.getAll({
          warehouseId,
          category,
          search,
          lowStockOnly,
          lowStockThreshold,
          sortBy,
          order,
          page,
          limit
        });
        setInventory(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } catch (err) {
        setError(err.message || 'Failed to load inventory records.');
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchInventory, 150);
    return () => clearTimeout(timer);
  }, [refreshKey, warehouseId, category, search, lowStockOnly, lowStockThreshold, sortBy, order, page, limit]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setOrder(order === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setOrder('ASC');
    }
    setPage(1);
  };

  const handleSaveStock = async (inventoryId) => {
    try {
      setSavingEdit(true);
      await inventoryApi.updateStock(inventoryId, Number(editQty));
      setInventory(prev =>
        prev.map(item =>
          item.inventory_id === inventoryId
            ? { ...item, quantity: Number(editQty), is_low_stock: Number(editQty) <= lowStockThreshold ? 1 : 0 }
            : item
        )
      );
      setEditingId(null);
    } catch (err) {
      alert(err.message || 'Failed to update stock.');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Inventory Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time joined view of all product stocks across all warehouses
          </p>
        </div>

        {/* Low-stock toggle & configurable threshold */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => {
                setLowStockOnly(e.target.checked);
                setPage(1);
              }}
              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
            />
            <AlertTriangle className={`w-4 h-4 ${lowStockOnly ? 'text-rose-600' : 'text-slate-400'}`} />
            <span>Low Stock Only</span>
          </label>

          <div className="flex items-center gap-1 text-xs border-l border-slate-200 pl-3">
            <span className="text-slate-500 font-medium">Threshold: &le;</span>
            <input
              type="number"
              min="1"
              max="2000"
              value={lowStockThreshold}
              onChange={(e) => {
                setLowStockThreshold(Number(e.target.value) || 200);
                setPage(1);
              }}
              className="w-16 px-2 py-1 text-xs font-bold border border-slate-200 rounded-lg text-center bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <span className="text-slate-400">units</span>
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product, warehouse, ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/40 focus:bg-white"
            />
          </div>

          {/* Warehouse Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={warehouseId}
              onChange={(e) => {
                setWarehouseId(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/40 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Warehouses</option>
              {warehouses.map(w => (
                <option key={w.warehouse_id} value={w.warehouse_id}>
                  {w.warehouse_id}: {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/40 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500 self-end md:self-center">
          Matching Inventory: <span className="text-slate-900 font-bold">{pagination.total}</span>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Executing SQL JOIN across inventory, product & warehouse tables..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th
                      onClick={() => handleSort('inventory_id')}
                      className="px-5 py-3.5 cursor-pointer hover:text-slate-800"
                    >
                      <div className="flex items-center gap-1.5">
                        Inventory ID
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('product_name')}
                      className="px-5 py-3.5 cursor-pointer hover:text-slate-800"
                    >
                      <div className="flex items-center gap-1.5">
                        Product
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('warehouse_name')}
                      className="px-5 py-3.5 cursor-pointer hover:text-slate-800"
                    >
                      <div className="flex items-center gap-1.5">
                        Warehouse Facility
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('price')}
                      className="px-5 py-3.5 text-right cursor-pointer hover:text-slate-800"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        Unit Price
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('quantity')}
                      className="px-5 py-3.5 text-right cursor-pointer hover:text-slate-800"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        Stock Quantity
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Adjust Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventory.map((row) => (
                    <tr
                      key={row.inventory_id}
                      className={`hover:bg-slate-50/70 transition ${
                        row.is_low_stock ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="px-5 py-4 font-mono font-bold text-slate-700">
                        {row.inventory_id}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 text-sm">{row.product_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {row.product_id} • {row.category}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">{row.warehouse_name}</div>
                        <div className="text-[11px] text-slate-400">
                          {row.warehouse_id} — {row.warehouse_location}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-slate-600">
                        ₹{Number(row.price).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {editingId === row.inventory_id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <input
                              type="number"
                              min="0"
                              value={editQty}
                              onChange={(e) => setEditQty(e.target.value)}
                              className="w-20 px-2 py-1 text-xs font-bold border border-sky-400 rounded-lg text-center focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveStock(row.inventory_id)}
                              disabled={savingEdit}
                              className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className={`text-sm font-black ${
                            row.is_low_stock ? 'text-rose-600' : 'text-slate-900'
                          }`}>
                            {Number(row.quantity).toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {row.is_low_stock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            LOW STOCK
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            OPTIMAL
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => {
                            setEditingId(row.inventory_id);
                            setEditQty(row.quantity);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                          title="Edit Stock"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
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
    </div>
  );
}

