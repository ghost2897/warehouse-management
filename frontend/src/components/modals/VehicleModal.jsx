import React, { useState, useEffect } from 'react';
import { X, Truck, AlertCircle } from 'lucide-react';
import { vehiclesApi } from '../../services/api';

export default function VehicleModal({ isOpen, onClose, vehicle = null, onSuccess }) {
  const isEditing = Boolean(vehicle);
  const [formData, setFormData] = useState({
    transport_id: '',
    name: '',
    vehicle_type: 'TRUCK',
    vehicle_number_plate: '',
    contact_number: '',
    insurance: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        transport_id: vehicle.transport_id || '',
        name: vehicle.name || '',
        vehicle_type: vehicle.vehicle_type || 'TRUCK',
        vehicle_number_plate: vehicle.vehicle_number_plate || '',
        contact_number: vehicle.contact_number || '',
        insurance: vehicle.insurance || ''
      });
    } else {
      setFormData({
        transport_id: '',
        name: '',
        vehicle_type: 'TRUCK',
        vehicle_number_plate: '',
        contact_number: '',
        insurance: ''
      });
    }
    setError(null);
  }, [vehicle, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.vehicle_type || !formData.vehicle_number_plate) {
      setError('Partner Name, Vehicle Type, and Number Plate are required.');
      return;
    }

    try {
      setSubmitting(true);
      if (isEditing) {
        await vehiclesApi.update(vehicle.transport_id, formData);
      } else {
        await vehiclesApi.create(formData);
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-200">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? `Edit Vehicle (${vehicle.transport_id})` : 'Add New Transport Vehicle'}
              </h3>
              <p className="text-xs text-slate-500">Fleet management registry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Transport Partner / Driver Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Transport Partner 26"
              className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2 bg-slate-50/40 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Vehicle Type *
              </label>
              <select
                value={formData.vehicle_type}
                onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2 bg-slate-50/40 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
              >
                <option value="TRUCK">TRUCK</option>
                <option value="VAN">VAN</option>
                <option value="MINI TRUCK">MINI TRUCK</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Number Plate *
              </label>
              <input
                type="text"
                value={formData.vehicle_number_plate}
                onChange={(e) => setFormData({ ...formData, vehicle_number_plate: e.target.value })}
                placeholder="e.g. TN26AB0026"
                className="w-full text-sm font-mono uppercase border border-slate-200 rounded-xl px-3.5 py-2 bg-slate-50/40 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Contact Number
              </label>
              <input
                type="text"
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                placeholder="e.g. 9876543210"
                className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2 bg-slate-50/40 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Insurance ID / Policy
              </label>
              <input
                type="text"
                value={formData.insurance}
                onChange={(e) => setFormData({ ...formData, insurance: e.target.value })}
                placeholder="e.g. INS100026"
                className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2 bg-slate-50/40 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
              />
            </div>
          </div>

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
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-500/20 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Register Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

