import { query } from '../db/pool.js';

export async function getAllWarehouses() {
  const sql = `
    SELECT 
      w.warehouse_id,
      w.name,
      w.location,
      w.capacity,
      COALESCE(SUM(i.quantity), 0) AS total_inventory,
      COUNT(i.product_id) AS product_count,
      ROUND(COALESCE((SUM(i.quantity) / NULLIF(w.capacity, 0)) * 100, 0), 2) AS utilization_rate
    FROM warehouse w
    LEFT JOIN inventory i ON w.warehouse_id = i.warehouse_id
    GROUP BY w.warehouse_id, w.name, w.location, w.capacity
    ORDER BY w.warehouse_id ASC
  `;
  const [rows] = await query(sql);
  return rows;
}

export async function getWarehouseById(warehouseId) {
  const warehouseSql = `
    SELECT 
      w.warehouse_id,
      w.name,
      w.location,
      w.capacity,
      COALESCE(SUM(i.quantity), 0) AS total_inventory,
      ROUND(COALESCE((SUM(i.quantity) / NULLIF(w.capacity, 0)) * 100, 0), 2) AS utilization_rate,
      COUNT(i.product_id) AS product_count
    FROM warehouse w
    LEFT JOIN inventory i ON w.warehouse_id = i.warehouse_id
    WHERE w.warehouse_id = ?
    GROUP BY w.warehouse_id, w.name, w.location, w.capacity
  `;
  const [warehouseRows] = await query(warehouseSql, [warehouseId]);
  if (!warehouseRows.length) return null;

  const warehouse = warehouseRows[0];

  // Get products stored in this warehouse
  const productsSql = `
    SELECT 
      i.inventory_id,
      p.product_id,
      p.product_name,
      p.category,
      p.price,
      i.quantity
    FROM inventory i
    JOIN product p ON i.product_id = p.product_id
    WHERE i.warehouse_id = ?
    ORDER BY i.quantity DESC, p.product_name ASC
  `;
  const [products] = await query(productsSql, [warehouseId]);
  warehouse.products = products;

  // Get recent transfers for this warehouse (source or destination)
  const transfersSql = `
    SELECT 
      t.transfer_id,
      t.source_warehouse_id,
      sw.name AS source_warehouse_name,
      t.destination_warehouse_id,
      dw.name AS destination_warehouse_name,
      t.transfer_date,
      t.status,
      t.transport_id,
      tv.name AS transport_vehicle_name,
      tv.vehicle_number_plate,
      COUNT(ti.product_id) AS total_items,
      COALESCE(SUM(ti.quantity), 0) AS total_quantity
    FROM transfer t
    JOIN warehouse sw ON t.source_warehouse_id = sw.warehouse_id
    JOIN warehouse dw ON t.destination_warehouse_id = dw.warehouse_id
    LEFT JOIN transport_vehicle tv ON t.transport_id = tv.transport_id
    LEFT JOIN transfer_item ti ON t.transfer_id = ti.transfer_id
    WHERE t.source_warehouse_id = ? OR t.destination_warehouse_id = ?
    GROUP BY t.transfer_id, t.source_warehouse_id, sw.name, t.destination_warehouse_id, dw.name, t.transfer_date, t.status, t.transport_id, tv.name, tv.vehicle_number_plate
    ORDER BY t.transfer_date DESC
    LIMIT 10
  `;
  const [recentTransfers] = await query(transfersSql, [warehouseId, warehouseId]);
  warehouse.recent_transfers = recentTransfers;

  return warehouse;
}

export async function createWarehouse({ warehouse_id, name, location, capacity }) {
  const sql = `
    INSERT INTO warehouse (warehouse_id, name, location, capacity)
    VALUES (?, ?, ?, ?)
  `;
  await query(sql, [warehouse_id, name, location, capacity]);
  return getWarehouseById(warehouse_id);
}

export async function updateWarehouse(warehouseId, { name, location, capacity }) {
  const sql = `
    UPDATE warehouse
    SET name = COALESCE(?, name),
        location = COALESCE(?, location),
        capacity = COALESCE(?, capacity)
    WHERE warehouse_id = ?
  `;
  await query(sql, [name, location, capacity, warehouseId]);
  return getWarehouseById(warehouseId);
}

export async function deleteWarehouse(warehouseId) {
  // Check if warehouse has inventory or transfers
  const [invCheck] = await query(`SELECT COUNT(*) AS count FROM inventory WHERE warehouse_id = ? AND quantity > 0`, [warehouseId]);
  if (invCheck[0].count > 0) {
    const err = new Error(`Cannot delete warehouse ${warehouseId} because it contains active inventory.`);
    err.statusCode = 409;
    throw err;
  }

  const [transferCheck] = await query(`SELECT COUNT(*) AS count FROM transfer WHERE source_warehouse_id = ? OR destination_warehouse_id = ?`, [warehouseId, warehouseId]);
  if (transferCheck[0].count > 0) {
    const err = new Error(`Cannot delete warehouse ${warehouseId} because it is referenced in transfer records.`);
    err.statusCode = 409;
    throw err;
  }

  await query(`DELETE FROM warehouse WHERE warehouse_id = ?`, [warehouseId]);
  return { warehouse_id: warehouseId, deleted: true };
}

