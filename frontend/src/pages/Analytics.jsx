import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Boxes,
  ArrowLeftRight,
  Truck,
  Building2,
  Layers
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
  Legend,
  LineChart,
  Line
} from 'recharts';
import { analyticsApi } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';

const PALETTE = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e', '#3b82f6', '#10b981'];

export default function Analytics() {
  const { refreshKey } = useOutletContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError(null);
        const res = await analyticsApi.getData();
        setData(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [refreshKey]);

  if (loading) return <LoadingSpinner text="Running SQL aggregation pipelines across MariaDB tables..." />;

  if (error) {
    return (
      <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800">
        <h3 className="font-bold text-base mb-1">Analytics Error</h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const {
    warehouse_utilization,
    top_products,
    category_distribution,
    route_frequency,
    most_transferred_products,
    transfer_status,
    monthly_activity,
    vehicle_utilization
  } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Analytics & Intelligence
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Deep SQL aggregations covering stock density, transfer routes, product velocity, and fleet metrics
        </p>
      </div>

      {/* Row 1: Warehouse Utilization & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Warehouse Utilization Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Warehouse Capacity vs Current Stock</h3>
              <p className="text-xs text-slate-500">Comparing stored inventory volume with facility capacity</p>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 text-xs font-bold border border-sky-100">
              8 Warehouses
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={warehouse_utilization} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(n) => n.split(' ')[0]} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val) => Number(val).toLocaleString() + ' units'}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 10 }} />
                <Bar dataKey="current_inventory" name="Stored Stock" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="capacity" name="Rated Capacity" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Donut */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col">
          <div className="mb-2">
            <h3 className="text-base font-bold text-slate-900">Inventory by Category</h3>
            <p className="text-xs text-slate-500">Distribution of stock across categories</p>
          </div>

          <div className="h-64 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={category_distribution}
                  dataKey="total_quantity"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={78}
                  paddingAngle={3}
                >
                  {category_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => `${Number(val).toLocaleString()} units`}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Top Stocked Products & Transfer Routes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Stocked Products */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Top 10 Products by Stock</h3>
              <p className="text-xs text-slate-500">Products with highest total stock volume</p>
            </div>
            <Boxes className="w-5 h-5 text-sky-600" />
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topProductsFormatted(top_products)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="shortName" type="category" tick={{ fontSize: 10, fill: '#475569' }} width={90} />
                <Tooltip
                  formatter={(val) => `${Number(val).toLocaleString()} units`}
                  labelFormatter={(name, payload) => payload?.[0]?.payload?.product_name || name}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="total_stock" name="Total Units" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transfer Frequency by Route */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Most Active Transfer Corridors</h3>
              <p className="text-xs text-slate-500">Warehouse pairs with highest transfer frequencies</p>
            </div>
            <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {route_frequency.map((rf, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="font-mono text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">{rf.route}</span>
                    <span>{rf.source_warehouse_name.split(' ')[0]} &rarr; {rf.destination_warehouse_name.split(' ')[0]}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {Number(rf.total_units_transferred).toLocaleString()} total units transferred
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 text-xs">
                    {rf.transfer_count} trips
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Most Transferred Products & Transfer Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Transferred Products */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Most Transferred Products</h3>
              <p className="text-xs text-slate-500">Products moved with highest cumulative volumes from transfer_item</p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Transfer Frequency</th>
                  <th className="px-4 py-3 text-right">Total Transferred Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {most_transferred_products.map((p) => (
                  <tr key={p.product_id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div>{p.product_name}</div>
                      <span className="text-[10px] font-mono text-slate-400">{p.product_id}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.category}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      {p.transfer_frequency} transfers
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-emerald-700">
                      {Number(p.total_transferred_quantity).toLocaleString()} units
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transfer Status Pie Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col">
          <div className="mb-2">
            <h3 className="text-base font-bold text-slate-900">Transfer Status Ratio</h3>
            <p className="text-xs text-slate-500">Distribution across 1,000 transfer logs</p>
          </div>

          <div className="h-64 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={transfer_status}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {transfer_status.map((entry, index) => (
                    <Cell
                      key={`status-cell-${index}`}
                      fill={
                        entry.status === 'COMPLETED'
                          ? '#10b981'
                          : entry.status === 'IN TRANSIT'
                          ? '#f59e0b'
                          : entry.status === 'PENDING'
                          ? '#0ea5e9'
                          : '#f43f5e'
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => `${Number(val).toLocaleString()} transfers`}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper for horizontal bar truncation
function topProductsFormatted(list) {
  if (!list) return [];
  return list.map(item => ({
    ...item,
    shortName: item.product_name.length > 15 ? item.product_name.slice(0, 14) + '…' : item.product_name
  }));
}

