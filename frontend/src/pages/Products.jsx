import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Package, Search, Filter, ArrowUpDown, Eye, Tag } from 'lucide-react';
import { productsApi } from '../services/api';
import ProductDetailsModal from '../components/modals/ProductDetailsModal';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Products() {
  const { refreshKey } = useOutletContext();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('product_id');
  const [order, setOrder] = useState('ASC');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Modal
  const [selectedProductId, setSelectedProductId] = useState(null);

  // Load categories once
  useEffect(() => {
    async function loadCats() {
      try {
        const res = await productsApi.getCategories();
        setCategories(res.data || []);
      } catch (e) {
        console.error('Failed to load categories:', e);
      }
    }
    loadCats();
  }, []);

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);
        const res = await productsApi.getAll({
          search,
          category: selectedCategory,
          sortBy,
          order,
          page,
          limit
        });
        setProducts(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } catch (err) {
        setError(err.message || 'Failed to load products.');
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchProducts, 150);
    return () => clearTimeout(timer);
  }, [refreshKey, search, selectedCategory, sortBy, order, page, limit]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setOrder(order === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setOrder('ASC');
    }
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Product Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse stock inventories, pricing, and cross-warehouse availability
          </p>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product name or SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/40 focus:bg-white"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
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

        {/* Total stats */}
        <div className="text-xs font-semibold text-slate-500 self-end md:self-center">
          Total Products: <span className="text-slate-900 font-bold">{pagination.total}</span>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Retrieving products from MariaDB..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th
                      onClick={() => handleSort('product_id')}
                      className="px-5 py-3.5 cursor-pointer hover:text-slate-800"
                    >
                      <div className="flex items-center gap-1.5">
                        Product ID
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('product_name')}
                      className="px-5 py-3.5 cursor-pointer hover:text-slate-800"
                    >
                      <div className="flex items-center gap-1.5">
                        Product Name
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('category')}
                      className="px-5 py-3.5 cursor-pointer hover:text-slate-800"
                    >
                      <div className="flex items-center gap-1.5">
                        Category
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
                      onClick={() => handleSort('total_stock')}
                      className="px-5 py-3.5 text-right cursor-pointer hover:text-slate-800"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        Total Stock
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="px-5 py-3.5 text-right">Warehouse Spread</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.product_id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4 font-mono font-bold text-sky-700">
                        {p.product_id}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900 text-sm">
                        {p.product_name}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-slate-700">
                        ₹{Number(p.price).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black ${
                          Number(p.total_stock) <= 500
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {Number(p.total_stock).toLocaleString()} units
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-slate-500 font-medium">
                        {p.warehouse_count} warehouses
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedProductId(p.product_id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition"
                        >
                          <Eye className="w-3.5 h-3.5 text-sky-600" />
                          Stock Breakdown
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

      {/* Product Details Modal */}
      {selectedProductId && (
        <ProductDetailsModal
          productId={selectedProductId}
          isOpen={Boolean(selectedProductId)}
          onClose={() => setSelectedProductId(null)}
        />
      )}
    </div>
  );
}

