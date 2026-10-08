import { query, getConnection } from '../db/pool.js';

/**
 * Generate next transfer_id (e.g. T2001)
 */
export async function generateNextTransferId(connection = null) {
  const runner = connection || { query };
  const sql = `
    SELECT transfer_id 
    FROM transfer 
    WHERE transfer_id REGEXP '^T[0-9]+$' 
    ORDER BY CAST(SUBSTRING(transfer_id, 2) AS UNSIGNED) DESC 
    LIMIT 1
  `;
  const [rows] = await runner.query(sql);
  if (!rows.length) {
    return 'T1001';
  }
  const lastId = rows[0].transfer_id;
  const num = parseInt(lastId.substring(1), 10);
  return `T${num + 1}`;
}

/**
 * Generate next inventory_id (e.g. I0481)
 */
export async function generateNextInventoryId(connection = null) {
  const runner = connection || { query };
  const sql = `
    SELECT inventory_id 
    FROM inventory 
    WHERE inventory_id REGEXP '^I[0-9]+$' 
    ORDER BY CAST(SUBSTRING(inventory_id, 2) AS UNSIGNED) DESC 
    LIMIT 1
  `;
  const [rows] = await runner.query(sql);
  if (!rows.length) {
    return 'I0001';
  }
  const lastId = rows[0].inventory_id;
  const num = parseInt(lastId.substring(1), 10);
  return `I${String(num + 1).padStart(4, '0')}`;
}

/**
 * List transfers with filtering, search, and pagination
 */
export async function getAllTransfers({
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
}) {
  let whereClauses = [];
  let params = [];

  if (status && status !== 'ALL') {
    whereClauses.push('UPPER(t.status) = ?');
    params.push(status.toUpperCase());
  }

  if (sourceWarehouseId && sourceWarehouseId !== 'ALL') {
    whereClauses.push('t.source_warehouse_id = ?');
    params.push(sourceWarehouseId);
  }

  if (destinationWarehouseId && destinationWarehouseId !== 'ALL') {
    whereClauses.push('t.destination_warehouse_id = ?');
    params.push(destinationWarehouseId);
  }

  if (startDate) {
    whereClauses.push('t.transfer_date >= ?');
    params.push(startDate);
  }

  if (endDate) {
    whereClauses.push('t.transfer_date <= ?');
    params.push(endDate);
  }

  if (search) {
    whereClauses.push('(t.transfer_id LIKE ? OR sw.name LIKE ? OR dw.name LIKE ? OR tv.vehicle_number_plate LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Total count
  const countSql = `
    SELECT COUNT(DISTINCT t.transfer_id) AS total
    FROM transfer t
    JOIN warehouse sw ON t.source_warehouse_id = sw.warehouse_id
    JOIN warehouse dw ON t.destination_warehouse_id = dw.warehouse_id
    LEFT JOIN transport_vehicle tv ON t.transport_id = tv.transport_id
    ${whereSql}
  `;
  const [countResult] = await query(countSql, params);
  const total = countResult[0].total;

  // Ordering
  let orderBySql = 'ORDER BY t.transfer_date DESC, t.transfer_id DESC';
  const sortDirection = order && order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  if (sortBy === 'transfer_date') {
    orderBySql = `ORDER BY t.transfer_date ${sortDirection}, t.transfer_id ${sortDirection}`;
  } else if (sortBy === 'transfer_id') {
    orderBySql = `ORDER BY CAST(SUBSTRING(t.transfer_id, 2) AS UNSIGNED) ${sortDirection}`;
  } else if (sortBy === 'status') {
    orderBySql = `ORDER BY t.status ${sortDirection}`;
  }

  // Pagination
  let limitSql = '';
  if (limit) {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 20);
    const offset = (pageNum - 1) * limitNum;
    limitSql = `LIMIT ${limitNum} OFFSET ${offset}`;
  }

  const dataSql = `
    SELECT 
      t.transfer_id,
      t.source_warehouse_id,
      sw.name AS source_warehouse_name,
      sw.location AS source_location,
      t.destination_warehouse_id,
      dw.name AS destination_warehouse_name,
      dw.location AS destination_location,
      t.transfer_date,
      t.status,
      t.transport_id,
      tv.name AS transport_vehicle_name,
      tv.vehicle_type,
      tv.vehicle_number_plate,
      COUNT(ti.product_id) AS total_items,
      COALESCE(SUM(ti.quantity), 0) AS total_quantity
    FROM transfer t
    JOIN warehouse sw ON t.source_warehouse_id = sw.warehouse_id
    JOIN warehouse dw ON t.destination_warehouse_id = dw.warehouse_id
    LEFT JOIN transport_vehicle tv ON t.transport_id = tv.transport_id
    LEFT JOIN transfer_item ti ON t.transfer_id = ti.transfer_id
    ${whereSql}
    GROUP BY 
      t.transfer_id, 
      t.source_warehouse_id, 
      sw.name, 
      sw.location,
      t.destination_warehouse_id, 
      dw.name, 
      dw.location,
      t.transfer_date, 
      t.status, 
      t.transport_id, 
      tv.name, 
      tv.vehicle_type, 
      tv.vehicle_number_plate
    ${orderBySql}
    ${limitSql}
  `;

  const [rows] = await query(dataSql, params);

  return {
    transfers: rows,
    pagination: limit ? {
      total,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      totalPages: Math.ceil(total / (Number(limit) || 20))
    } : { total, count: rows.length }
  };
}

/**
 * Get transfer by ID with items and vehicle
 */
export async function getTransferById(transferId) {
  const transferSql = `
    SELECT 
      t.transfer_id,
      t.source_warehouse_id,
      sw.name AS source_warehouse_name,
      sw.location AS source_location,
      t.destination_warehouse_id,
      dw.name AS destination_warehouse_name,
      dw.location AS destination_location,
      t.transfer_date,
      t.status,
      t.transport_id,
      tv.name AS transport_vehicle_name,
      tv.vehicle_type,
      tv.vehicle_number_plate,
      tv.contact_number,
      tv.insurance
    FROM transfer t
    JOIN warehouse sw ON t.source_warehouse_id = sw.warehouse_id
    JOIN warehouse dw ON t.destination_warehouse_id = dw.warehouse_id
    LEFT JOIN transport_vehicle tv ON t.transport_id = tv.transport_id
    WHERE t.transfer_id = ?
  `;
  const [rows] = await query(transferSql, [transferId]);
  if (!rows.length) return null;

  const transfer = rows[0];

  // Get transfer items with product details
  const itemsSql = `
    SELECT 
      ti.product_id,
      p.product_name,
      p.category,
      p.price,
      ti.quantity,
      (p.price * ti.quantity) AS total_value
    FROM transfer_item ti
    JOIN product p ON ti.product_id = p.product_id
    WHERE ti.transfer_id = ?
    ORDER BY ti.product_id ASC
  `;
  const [items] = await query(itemsSql, [transferId]);
  transfer.items = items;
  transfer.total_items = items.length;
  transfer.total_quantity = items.reduce((acc, it) => acc + Number(it.quantity), 0);
  transfer.total_value = items.reduce((acc, it) => acc + (Number(it.total_value) || 0), 0);

  return transfer;
}

/**
 * Create a new transfer (supports multiple products)
 * If status is COMPLETED, deducts inventory atomically
 */
export async function createTransfer({
  source_warehouse_id,
  destination_warehouse_id,
  transfer_date,
  status = 'PENDING',
  transport_id = null,
  items = []
}) {
  // 1. Basic validation
  if (!source_warehouse_id || !destination_warehouse_id) {
    const err = new Error('Source and destination warehouses are required.');
    err.statusCode = 400;
    throw err;
  }

  if (source_warehouse_id === destination_warehouse_id) {
    const err = new Error('Source and destination warehouses cannot be the same.');
    err.statusCode = 400;
    throw err;
  }

  if (!items || !items.length) {
    const err = new Error('At least one product item is required for a transfer.');
    err.statusCode = 400;
    throw err;
  }

  const normalizedStatus = status ? status.toUpperCase() : 'PENDING';
  const validStatuses = ['PENDING', 'IN TRANSIT', 'COMPLETED', 'CANCELLED'];
  if (!validStatuses.includes(normalizedStatus)) {
    const err = new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const date = transfer_date || new Date().toISOString().split('T')[0];

  // Acquire dedicated DB connection for transaction
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    // Verify warehouses exist
    const [sourceWh] = await connection.query('SELECT warehouse_id FROM warehouse WHERE warehouse_id = ?', [source_warehouse_id]);
    const [destWh] = await connection.query('SELECT warehouse_id FROM warehouse WHERE warehouse_id = ?', [destination_warehouse_id]);
    if (!sourceWh.length) {
      const err = new Error(`Source warehouse ${source_warehouse_id} does not exist.`);
      err.statusCode = 400;
      throw err;
    }
    if (!destWh.length) {
      const err = new Error(`Destination warehouse ${destination_warehouse_id} does not exist.`);
      err.statusCode = 400;
      throw err;
    }

    // Verify vehicle if provided
    if (transport_id) {
      const [veh] = await connection.query('SELECT transport_id FROM transport_vehicle WHERE transport_id = ?', [transport_id]);
      if (!veh.length) {
        const err = new Error(`Transport vehicle ${transport_id} does not exist.`);
        err.statusCode = 400;
        throw err;
      }
    }

    // Validate items & stock availability
    const aggregatedItems = {};
    for (const item of items) {
      const { product_id, quantity } = item;
      const q = Number(quantity);
      if (!product_id) {
        const err = new Error('Each item must specify a valid product_id.');
        err.statusCode = 400;
        throw err;
      }
      if (isNaN(q) || q <= 0) {
        const err = new Error(`Item quantity for product ${product_id} must be greater than 0.`);
        err.statusCode = 400;
        throw err;
      }
      aggregatedItems[product_id] = (aggregatedItems[product_id] || 0) + q;
    }

    // Check products exist and lock source inventory rows
    for (const [prodId, reqQty] of Object.entries(aggregatedItems)) {
      const [pRows] = await connection.query('SELECT product_id, product_name FROM product WHERE product_id = ?', [prodId]);
      if (!pRows.length) {
        const err = new Error(`Product ${prodId} does not exist.`);
        err.statusCode = 400;
        throw err;
      }

      // Check stock at source warehouse
      const [invRows] = await connection.query(
        'SELECT quantity FROM inventory WHERE warehouse_id = ? AND product_id = ? FOR UPDATE',
        [source_warehouse_id, prodId]
      );
      const currentStock = invRows.length ? Number(invRows[0].quantity) : 0;
      if (currentStock < reqQty) {
        const err = new Error(`Insufficient stock in source warehouse ${source_warehouse_id} for product ${pRows[0].product_name} (${prodId}). Required: ${reqQty}, Available: ${currentStock}.`);
        err.statusCode = 400;
        throw err;
      }
    }

    // Generate next transfer ID
    const transfer_id = await generateNextTransferId(connection);

    // Insert transfer
    const insertTransferSql = `
      INSERT INTO transfer (transfer_id, source_warehouse_id, destination_warehouse_id, transfer_date, status, transport_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await connection.query(insertTransferSql, [
      transfer_id,
      source_warehouse_id,
      destination_warehouse_id,
      date,
      normalizedStatus,
      transport_id || null
    ]);

    // Insert transfer items
    const insertItemSql = `
      INSERT INTO transfer_item (transfer_id, product_id, quantity)
      VALUES (?, ?, ?)
    `;
    for (const [prodId, qty] of Object.entries(aggregatedItems)) {
      await connection.query(insertItemSql, [transfer_id, prodId, qty]);
    }

    // If status is COMPLETED upon creation, apply inventory deduction/addition
    if (normalizedStatus === 'COMPLETED') {
      await applyInventoryTransfer(connection, source_warehouse_id, destination_warehouse_id, aggregatedItems);
    }

    await connection.commit();

    return getTransferById(transfer_id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Update transfer status
 * If status changes to COMPLETED, inventory is updated inside a transaction
 */
export async function updateTransferStatus(transferId, newStatus) {
  const normalizedStatus = newStatus ? newStatus.toUpperCase() : '';
  const validStatuses = ['PENDING', 'IN TRANSIT', 'COMPLETED', 'CANCELLED'];
  if (!validStatuses.includes(normalizedStatus)) {
    const err = new Error(`Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    // Lock transfer record
    const [transfers] = await connection.query(
      'SELECT * FROM transfer WHERE transfer_id = ? FOR UPDATE',
      [transferId]
    );

    if (!transfers.length) {
      const err = new Error(`Transfer with ID ${transferId} not found.`);
      err.statusCode = 404;
      throw err;
    }

    const currentTransfer = transfers[0];
    const currentStatus = currentTransfer.status ? currentTransfer.status.toUpperCase() : 'PENDING';

    if (currentStatus === normalizedStatus) {
      await connection.commit();
      return getTransferById(transferId);
    }

    if (currentStatus === 'COMPLETED') {
      const err = new Error(`Cannot change status of transfer ${transferId} because it is already COMPLETED and inventory has been transferred.`);
      err.statusCode = 400;
      throw err;
    }

    if (currentStatus === 'CANCELLED' && normalizedStatus === 'COMPLETED') {
      const err = new Error(`Cannot complete a CANCELLED transfer.`);
      err.statusCode = 400;
      throw err;
    }

    // If transitioning to COMPLETED, move inventory
    if (normalizedStatus === 'COMPLETED') {
      // Get all items in this transfer
      const [items] = await connection.query(
        'SELECT product_id, quantity FROM transfer_item WHERE transfer_id = ?',
        [transferId]
      );

      if (!items.length) {
        const err = new Error(`Transfer ${transferId} has no items.`);
        err.statusCode = 400;
        throw err;
      }

      const aggregatedItems = {};
      for (const it of items) {
        aggregatedItems[it.product_id] = (aggregatedItems[it.product_id] || 0) + Number(it.quantity);
      }

      // Check stock and move
      await applyInventoryTransfer(
        connection,
        currentTransfer.source_warehouse_id,
        currentTransfer.destination_warehouse_id,
        aggregatedItems
      );
    }

    // Update status
    await connection.query(
      'UPDATE transfer SET status = ? WHERE transfer_id = ?',
      [normalizedStatus, transferId]
    );

    await connection.commit();

    return getTransferById(transferId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Helper: Deduct stock from source and add stock to destination within an active transaction
 */
async function applyInventoryTransfer(connection, sourceWarehouseId, destWarehouseId, aggregatedItems) {
  for (const [prodId, qty] of Object.entries(aggregatedItems)) {
    // Lock source inventory row
    const [sourceRows] = await connection.query(
      'SELECT quantity FROM inventory WHERE warehouse_id = ? AND product_id = ? FOR UPDATE',
      [sourceWarehouseId, prodId]
    );

    const sourceStock = sourceRows.length ? Number(sourceRows[0].quantity) : 0;
    if (sourceStock < qty) {
      const err = new Error(`Cannot complete transfer: Insufficient inventory in warehouse ${sourceWarehouseId} for product ${prodId}. Required: ${qty}, Available: ${sourceStock}.`);
      err.statusCode = 400;
      throw err;
    }

    // Deduct from source warehouse
    await connection.query(
      'UPDATE inventory SET quantity = quantity - ? WHERE warehouse_id = ? AND product_id = ?',
      [qty, sourceWarehouseId, prodId]
    );

    // Lock destination inventory row
    const [destRows] = await connection.query(
      'SELECT inventory_id, quantity FROM inventory WHERE warehouse_id = ? AND product_id = ? FOR UPDATE',
      [destWarehouseId, prodId]
    );

    if (destRows.length > 0) {
      // Record exists: increment quantity
      await connection.query(
        'UPDATE inventory SET quantity = quantity + ? WHERE warehouse_id = ? AND product_id = ?',
        [qty, destWarehouseId, prodId]
      );
    } else {
      // Record doesn't exist: insert new inventory row
      const nextInvId = await generateNextInventoryId(connection);
      await connection.query(
        'INSERT INTO inventory (inventory_id, product_id, warehouse_id, quantity) VALUES (?, ?, ?, ?)',
        [nextInvId, prodId, destWarehouseId, qty]
      );
    }
  }
}

