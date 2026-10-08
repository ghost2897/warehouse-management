import * as vehicleService from '../services/vehicleService.js';

export async function getVehicles(req, res, next) {
  try {
    const { search, vehicleType } = req.query;
    const vehicles = await vehicleService.getAllVehicles({ search, vehicleType });
    res.json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    next(error);
  }
}

export async function getVehicle(req, res, next) {
  try {
    const { id } = req.params;
    const vehicle = await vehicleService.getVehicleById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: `Transport vehicle with ID ${id} not found.`
      });
    }
    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    next(error);
  }
}

export async function createVehicle(req, res, next) {
  try {
    const { transport_id, name, vehicle_type, vehicle_number_plate, contact_number, insurance } = req.body;
    if (!name || !vehicle_type || !vehicle_number_plate) {
      return res.status(400).json({
        success: false,
        message: 'name, vehicle_type, and vehicle_number_plate are required.'
      });
    }
    const created = await vehicleService.createVehicle({
      transport_id,
      name,
      vehicle_type,
      vehicle_number_plate,
      contact_number,
      insurance
    });
    res.status(201).json({
      success: true,
      message: 'Transport vehicle registered successfully.',
      data: created
    });
  } catch (error) {
    next(error);
  }
}

export async function updateVehicle(req, res, next) {
  try {
    const { id } = req.params;
    const { name, vehicle_type, vehicle_number_plate, contact_number, insurance } = req.body;
    const updated = await vehicleService.updateVehicle(id, {
      name,
      vehicle_type,
      vehicle_number_plate,
      contact_number,
      insurance
    });
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Transport vehicle with ID ${id} not found.`
      });
    }
    res.json({
      success: true,
      message: 'Transport vehicle updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteVehicle(req, res, next) {
  try {
    const { id } = req.params;
    const result = await vehicleService.deleteVehicle(id);
    res.json({
      success: true,
      message: `Transport vehicle ${id} deleted successfully.`,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

