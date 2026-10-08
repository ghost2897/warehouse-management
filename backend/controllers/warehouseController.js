import * as warehouseService from '../services/warehouseService.js';

export async function getWarehouses(req, res, next) {
  try {
    const warehouses = await warehouseService.getAllWarehouses();
    res.json({
      success: true,
      data: warehouses
    });
  } catch (error) {
    next(error);
  }
}

export async function getWarehouse(req, res, next) {
  try {
    const { id } = req.params;
    const warehouse = await warehouseService.getWarehouseById(id);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: `Warehouse with ID ${id} not found.`
      });
    }
    res.json({
      success: true,
      data: warehouse
    });
  } catch (error) {
    next(error);
  }
}

export async function createWarehouse(req, res, next) {
  try {
    const { warehouse_id, name, location, capacity } = req.body;
    if (!warehouse_id || !name || !location || capacity == null) {
      return res.status(400).json({
        success: false,
        message: 'warehouse_id, name, location, and capacity are required.'
      });
    }
    const newWarehouse = await warehouseService.createWarehouse({ warehouse_id, name, location, capacity: Number(capacity) });
    res.status(201).json({
      success: true,
      message: 'Warehouse created successfully.',
      data: newWarehouse
    });
  } catch (error) {
    next(error);
  }
}

export async function updateWarehouse(req, res, next) {
  try {
    const { id } = req.params;
    const { name, location, capacity } = req.body;
    const updated = await warehouseService.updateWarehouse(id, {
      name,
      location,
      capacity: capacity != null ? Number(capacity) : undefined
    });
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Warehouse with ID ${id} not found.`
      });
    }
    res.json({
      success: true,
      message: 'Warehouse updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteWarehouse(req, res, next) {
  try {
    const { id } = req.params;
    const result = await warehouseService.deleteWarehouse(id);
    res.json({
      success: true,
      message: `Warehouse ${id} deleted successfully.`,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

