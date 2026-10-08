import * as transferService from '../services/transferService.js';

export async function getTransfers(req, res, next) {
  try {
    const {
      status,
      sourceWarehouseId,
      destinationWarehouseId,
      search,
      startDate,
      endDate,
      sortBy,
      order,
      page,
      limit
    } = req.query;

    const result = await transferService.getAllTransfers({
      status,
      sourceWarehouseId,
      destinationWarehouseId,
      search,
      startDate,
      endDate,
      sortBy,
      order,
      page,
      limit
    });

    res.json({
      success: true,
      data: result.transfers,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

export async function getTransfer(req, res, next) {
  try {
    const { id } = req.params;
    const transfer = await transferService.getTransferById(id);
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: `Transfer with ID ${id} not found.`
      });
    }
    res.json({
      success: true,
      data: transfer
    });
  } catch (error) {
    next(error);
  }
}

export async function createTransfer(req, res, next) {
  try {
    const {
      source_warehouse_id,
      destination_warehouse_id,
      transfer_date,
      status,
      transport_id,
      items
    } = req.body;

    const transfer = await transferService.createTransfer({
      source_warehouse_id,
      destination_warehouse_id,
      transfer_date,
      status,
      transport_id,
      items
    });

    res.status(201).json({
      success: true,
      message: 'Transfer created successfully.',
      data: transfer
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTransferStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'status field is required.'
      });
    }

    const updated = await transferService.updateTransferStatus(id, status);
    res.json({
      success: true,
      message: `Transfer ${id} status updated to ${status}.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

