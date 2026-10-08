import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { warehousesApi, productsApi, vehiclesApi, transfersApi } from '../../services/api';

export default function CreateTransferModal({ isOpen, onClose, onSuccess }) {
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [sourceWarehouse, setSourceWarehouse] = useState('');
  const [destWarehouse, setDestWarehouse] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [transportId, setTransportId] = useState('');
  const [status, setStatus] = useState('PENDING');

  // Items: array of { product_id, quantity, availableStock }
  const [items, setItems] = useState([
    { product_id: '', quantity: 1, availableStock: null }
  ]);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load warehouses, products, vehicles on open
  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      try {
        setLoadingInitial(true);
        setError(null);
        const [wRes, pRes, vRes] = await Promise.all([
          warehousesApi.getAll(),
          productsApi.getAll({ limit: 100 }),
          vehiclesApi.getAll({})
        ]);

        const whs = wRes.data || [];
        setWarehouses(whs);
        setProducts(pRes.data || []);
        setVehicles(vRes.data || []);

        if (whs.length >= 2) {
          setSourceWarehouse(whs[0].warehouse_id);
          setDestWarehouse(whs[1].warehouse_id);
        }
      } catch (err) {
        setError(err.message || 'Failed to load options.');
      } finally {
        setLoadingInitial(false);
      }
    }

    loadData();
  }, [isOpen]);

  // When source warehouse changes, refresh available stock for selected products
  useEffect(() => {
    if (!sourceWarehouse) return;

    async function refreshStock() {
      try {
        const wDetail = await warehousesApi.getById(sourceWarehouse);
        const stockMap = {};
        if (wDetail.data?.products) {
          wDetail.data.products.forEach(p => {
            stockMap[p.product_id] = p.quantity;
          });
        }

        setItems(prevItems =>
          prevItems.map(item => ({
            ...item,
            availableStock: item.product_id ? (stockMap[item.product_id] ?? 0) : null
          }))
        );
      } catch (e) {
        console.error('Failed to update stock map:', e);
      }
    }

    refreshStock();
  }, [sourceWarehouse]);

  const handleProductChange = async (index, productId) => {
    let avail = null;
    if (sourceWarehouse && productId) {
      try {
        const wDetail = await warehousesApi.getById(sourceWarehouse);
        const found = wDetail.data?.products?.find(p => p.product_id === productId);
        avail = found ? found.quantity : 0;
      } catch (e) {
        avail = 0;
      }
    }

    setItems(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        product_id: productId,
        availableStock: avail
      };
      return next;
    });
  };

  const handleQuantityChange = (index, qty) => {
    const val = parseInt(qty, 10);
    setItems(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        quantity: isNaN(val) ? '' : Math.max(1, val)
      };
      return next;
    });
  };

  const addItemRow = () => {
    setItems(prev => [...prev, { product_id: '', quantity: 1, availableStock: null }]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!sourceWarehouse || !destWarehouse) {
      setError('Please select both source and destination warehouses.');
      return;
    }

    if (sourceWarehouse === destWarehouse) {
      setError('Source and destination warehouses cannot be the same.');
      return;
    }

    const cleanItems = items.filter(it => it.product_id && Number(it.quantity) > 0);
    if (!cleanItems.length) {
      setError('Please add at least one product with a quantity greater than 0.');
      return;
    }

    // Check for stock shortages
    for (const it of cleanItems) {
      if (it.availableStock !== null && Number(it.quantity) > it.availableStock) {
        const prod = products.find(p => p.product_id === it.product_id);
        setError(`Insufficient stock for ${prod?.product_name || it.product_id}. Available: ${it.availableStock}, Requested: ${it.quantity}.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      await transfersApi.create({
        source_warehouse_id: sourceWarehouse,
        destination_warehouse_id: destWarehouse,
        transfer_date: transferDate,
        status,
        transport_id: transportId || null,
        items: cleanItems.map(it => ({
          product_id: it.product_id,
          quantity: Number(it.quantity)
        }))
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to create transfer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Create New Stock Transfer</h3>
            <p className="text-xs text-slate-500">Initiate inventory movement between warehouses</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Validation Notice</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Route Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Source Warehouse *
              </label>
              <select
                value={sourceWarehouse}
                onChange={(e) => setSourceWarehouse(e.target.value)}
                className="w-full text-sm font-medium border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/40 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                required
              >
                {warehouses.map(w => (
                  <option key={w.warehouse_id} value={w.warehouse_id}>
                    {w.warehouse_id} — {w.name} ({w.location})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Destination Warehouse *
              </label>
              <select
                value={destWarehouse}
                onChange={(e) => setDestWarehouse(e.target.value)}
                className="w-full text-sm font-medium border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/40 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                required
              >
                {warehouses.map(w => (
                  <option key={w.warehouse_id} value={w.warehouse_id} disabled={w.warehouse_id === sourceWarehouse}>
                    {w.warehouse_id} — {w.name} ({w.location}) {w.warehouse_id === sourceWarehouse ? '(Source)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Transfer Date *
              </label>
              <input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="w-full text-sm font-medium border border-slate-200 rounded-xl px-3.5 py-2 bg-slate-50/40 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Transport Vehicle
              </label>
              <select
                value={transportId}
                onChange={(e) => setTransportId(e.target.value)}
                className="w-full text-sm font-medium border border-slate-200 rounded-xl px-3.5 py-2 bg-slate-50/40 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
              >
                <option value="">-- No vehicle assigned --</option>
                {vehicles.map(v => (
                  <option key={v.transport_id} value={v.transport_id}>
                    {v.transport_id}: {v.vehicle_number_plate} ({v.vehicle_type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-sm font-medium border border-slate-200 rounded-xl px-3.5 py-2 bg-slate-50/40 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
              >
                <option value="PENDING">PENDING</option>
                <option value="IN TRANSIT">IN TRANSIT</option>
                <option value="COMPLETED">COMPLETED (Apply Stock Move)</option>
              </select>
            </div>
          </div>

          {/* Products Multi-Line Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Products to Transfer *
              </label>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/30">
                  <div className="flex-1">
                    <select
                      value={item.product_id}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    >
                      <option value="">-- Select Product --</option>
                      {products.map(p => (
                        <option key={p.product_id} value={p.product_id}>
                          {p.product_id} — {p.product_name} ({p.category})
                        </option>
                      ))}
                    </select>
                    {item.availableStock !== null && (
                      <span className={`text-[11px] font-semibold mt-1 inline-block ${item.availableStock > 0 ? 'text-slate-500' : 'text-rose-600'}`}>
                        In Source Wh: {item.availableStock} units available
                      </span>
                    )}
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      min="1"
                      max={item.availableStock !== null ? item.availableStock : undefined}
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(idx, e.target.value)}
                      placeholder="Qty"
                      className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-center focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    disabled={items.length <= 1}
                    className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-500/20 disabled:opacity-50"
            >
              {submitting ? 'Submitting Transfer...' : 'Confirm & Create Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

