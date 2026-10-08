import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Building2,
  Package,
  Boxes,
  ArrowLeftRight,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Truck
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { dashboardApi } from '../services/api';
import MetricCard from '../components/common/MetricCard';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';

const COLORS = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e'];

export default function Dashboard() {
  const { refreshKey, openTransferModal } = useOutletContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);
        const res = await dashboardApi.getData(200);
        setData(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [refreshKey]);

  if (loading) {
    return <LoadingSpinner text="Aggregating live warehouse metrics from MariaDB..." />;
  }

  if (error) {
    return (
      <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800">
        <h3 className="font-bold text-base mb-1">Database Connection Alert</h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const { summary, warehouse_stock, category_distribution, recent_transfers, low_stock_items } = data;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time telemetry and inventory distribution across active facilities
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/inventory?lowStock=true"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Low Stock Alerts ({summary.low_stock_count})</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Warehouses"
          value={summary.total_warehouses}
          subtitle="Active distribution hubs"
          icon={Building2}
          color="blue"
        />
        <MetricCard
          title="Total Products"
          value={summary.total_products}
          subtitle="Catalog SKU items"
          icon={Package}
          color="indigo"
        />
        <MetricCard
          title="Total Inventory"
          value={summary.total_inventory}
          subtitle="Stored units globally"
          icon={Boxes}
          color="emerald"
        />
        <MetricCard
          title="Total Transfers"
          value={summary.total_transfers}
          subtitle="Recorded transfer dispatches"
          icon={ArrowLeftRight}
          color="amber"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory by Warehouse Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Warehouse Inventory & Capacity</h3>
              <p className="text-xs text-slate-500">Total units stored versus rated capacity</p>
            </div>
            <Link to="/warehouses" className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={warehouse_stock} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="warehouse_id"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val, name) => [Number(val).toLocaleString() + ' units', name === 'total_inventory' ? 'Current Units' : 'Capacity']}
                  labelFormatter={(id) => {
                    const found = warehouse_stock.find(w => w.warehouse_id === id);
                    return `${id}: ${found ? found.name : ''}`;
                  }}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="total_inventory" name="Current Units" fill="#0284c7" radius={[6, 6, 0, 0]} />
                <Bar dataKey="capacity" name="Capacity" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Category Distribution Donut */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Stock by Category</h3>
              <p className="text-xs text-slate-500">Unit volume per product category</p>
            </div>
            <Link to="/products" className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1">
              Products <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={category_distribution}
                  dataKey="total_stock"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {category_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `${Number(value).toLocaleString()} units`}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(val) => <span className="text-[11px] text-slate-700 font-medium">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transfers List */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Transfers</h3>
              <p className="text-xs text-slate-500">Latest logistical dispatches</p>
            </div>
            <Link to="/transfers" className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1">
              View All Transfers <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-2.5">ID</th>
                  <th className="px-3.5 py-2.5">Route</th>
                  <th className="px-3.5 py-2.5">Date</th>
                  <th className="px-3.5 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent_transfers?.map((t) => (
                  <tr key={t.transfer_id} className="hover:bg-slate-50/50">
                    <td className="px-3.5 py-2.5 font-mono font-bold text-sky-700">
                      {t.transfer_id}
                    </td>
                    <td className="px-3.5 py-2.5 font-medium text-slate-900">
                      {t.source_warehouse_id} → {t.destination_warehouse_id}
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-500">{t.transfer_date}</td>
                    <td className="px-3.5 py-2.5">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Critical Stock Items</h3>
                <p className="text-xs text-slate-500">Threshold: &le; 200 units</p>
              </div>
            </div>
            <Link to="/inventory?lowStock=true" className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1">
              Manage Inventory <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-2.5">Product</th>
                  <th className="px-3.5 py-2.5">Warehouse</th>
                  <th className="px-3.5 py-2.5 text-right">Available Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {low_stock_items?.map((item) => (
                  <tr key={item.inventory_id} className="hover:bg-slate-50/50">
                    <td className="px-3.5 py-2.5">
                      <div className="font-semibold text-slate-900 truncate max-w-[180px]">{item.product_name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{item.product_id} • {item.category}</span>
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-600">
                      <div>{item.warehouse_name}</div>
                      <span className="text-[10px] font-mono text-slate-400">{item.warehouse_id}</span>
                    </td>
                    <td className="px-3.5 py-2.5 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                        {item.quantity} units
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

