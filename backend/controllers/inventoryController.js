import * as inventoryService from '../services/inventoryService.js';

export async function getInventory(req, res, next) {
  try {
    const {
      warehouseId,
      productId,
      category,
      search,
      lowStockOnly,
      lowStockThreshold,
      sortBy,
      order,
      page,
      limit
    } = req.query;

    const result = await inventoryService.getAllInventory({
      warehouseId,
      productId,
      category,
      search,
      lowStockOnly,
      lowStockThreshold,
      sortBy,
      order,
      page,
      limit
    });

    res.json({
      success: true,
      data: result.inventory,
      threshold: result.threshold,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

export async function getInventoryItem(req, res, next) {
  try {
    const { id } = req.params;
    const item = await inventoryService.getInventoryById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: `Inventory record with ID ${id} not found.`
      });
    }
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
}

export async function updateInventoryStock(req, res, next) {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    if (quantity == null) {
      return res.status(400).json({
        success: false,
        message: 'quantity is required.'
      });
    }
    const updated = await inventoryService.updateInventoryStock(id, quantity);
    res.json({
      success: true,
      message: 'Inventory stock updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

