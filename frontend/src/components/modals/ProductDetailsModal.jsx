import React, { useState, useEffect } from 'react';
import { X, Package, Tag, Boxes, ArrowLeftRight } from 'lucide-react';
import { productsApi } from '../../services/api';
import StatusBadge from '../common/StatusBadge';

export default function ProductDetailsModal({ productId, isOpen, onClose }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !productId) return;

    async function fetchDetails() {
      try {
        setLoading(true);
        setError(null);
        const res = await productsApi.getById(productId);
        setProduct(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load product details.');
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [isOpen, productId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-sky-700 bg-sky-100 px-2.5 py-1 rounded-md border border-sky-200">
              {productId}
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">{product?.product_name || 'Product Details'}</h3>
              <p className="text-xs text-slate-500">{product?.category}</p>
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
          <div className="p-12 text-center text-slate-500 animate-pulse">Loading product stock distribution...</div>
        ) : product ? (
          <div className="p-6 space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Unit Price</div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  ₹{Number(product.price).toLocaleString()}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Global Stock</div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {Number(product.total_stock).toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
                </div>
              </div>
            </div>

            {/* Warehouse Stock Distribution */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5 flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-sky-600" />
                Stock Distribution Across Warehouses
              </h4>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="px-3.5 py-2.5">Warehouse</th>
                      <th className="px-3.5 py-2.5">Location</th>
                      <th className="px-3.5 py-2.5 text-right">Stock Quantity</th>
                      <th className="px-3.5 py-2.5 text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {product.warehouses?.map((w) => {
                      const share = product.total_stock > 0 ? ((w.quantity / product.total_stock) * 100).toFixed(1) : 0;
                      return (
                        <tr key={w.warehouse_id} className="hover:bg-slate-50/50">
                          <td className="px-3.5 py-2.5 font-medium text-slate-900">
                            <div>{w.warehouse_name}</div>
                            <span className="text-[10px] text-slate-400 font-mono">{w.warehouse_id}</span>
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-600">{w.location}</td>
                          <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                            {Number(w.quantity).toLocaleString()}
                          </td>
                          <td className="px-3.5 py-2.5 text-right text-slate-500">
                            {share}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transfer History */}
            {product.transfer_history?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                  <ArrowLeftRight className="w-4 h-4 text-sky-600" />
                  Recent Movement History
                </h4>
                <div className="rounded-xl border border-slate-200 overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="px-3.5 py-2">Transfer</th>
                        <th className="px-3.5 py-2">Route</th>
                        <th className="px-3.5 py-2">Date</th>
                        <th className="px-3.5 py-2 text-right">Qty</th>
                        <th className="px-3.5 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {product.transfer_history.map(t => (
                        <tr key={t.transfer_id} className="hover:bg-slate-50/50">
                          <td className="px-3.5 py-2 font-mono font-semibold text-sky-700">{t.transfer_id}</td>
                          <td className="px-3.5 py-2 text-slate-700">{t.source_warehouse_name} → {t.destination_warehouse_name}</td>
                          <td className="px-3.5 py-2 text-slate-600">{t.transfer_date}</td>
                          <td className="px-3.5 py-2 text-right font-bold text-slate-900">{t.transferred_quantity}</td>
                          <td className="px-3.5 py-2"><StatusBadge status={t.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

