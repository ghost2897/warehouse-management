import { query } from '../db/pool.js';

/**
 * Get dashboard overview metrics
 */
export async function getDashboardData(lowStockThreshold = 200) {
  const threshold = Number(lowStockThreshold) || 200;

  // 1. Summary Counts
  const [warehouseCountRows] = await query('SELECT COUNT(*) AS total FROM warehouse');
  const [productCountRows] = await query('SELECT COUNT(*) AS total FROM product');
  const [inventorySumRows] = await query('SELECT COALESCE(SUM(quantity), 0) AS total_inventory, COUNT(*) AS total_records FROM inventory');
  const [transferCountRows] = await query('SELECT COUNT(*) AS total FROM transfer');
  const [vehicleCountRows] = await query('SELECT COUNT(*) AS total FROM transport_vehicle');

  // 2. Low-stock products alert list
  const lowStockSql = `
    SELECT 
      i.inventory_id,
      i.product_id,
      p.product_name,
      p.category,
      p.price,
      i.warehouse_id,
      w.name AS warehouse_name,
      i.quantity
    FROM inventory i
    JOIN product p ON i.product_id = p.product_id
    JOIN warehouse w ON i.warehouse_id = w.warehouse_id
    WHERE i.quantity <= ?
    ORDER BY i.quantity ASC
    LIMIT 10
  `;
  const [lowStockItems] = await query(lowStockSql, [threshold]);

  // Total count of low stock items across all warehouses
  const [lowStockCountRows] = await query(
    'SELECT COUNT(*) AS total_low_stock FROM inventory WHERE quantity <= ?',
    [threshold]
  );

  // 3. Recent transfers
  const recentTransfersSql = `
    SELECT 
      t.transfer_id,
      t.source_warehouse_id,
      sw.name AS source_warehouse_name,
      t.destination_warehouse_id,
      dw.name AS destination_warehouse_name,
      t.transfer_date,
      t.status,
      tv.name AS transport_vehicle_name,
      tv.vehicle_number_plate,
      COUNT(ti.product_id) AS total_items,
      COALESCE(SUM(ti.quantity), 0) AS total_quantity
    FROM transfer t
    JOIN warehouse sw ON t.source_warehouse_id = sw.warehouse_id
    JOIN warehouse dw ON t.destination_warehouse_id = dw.warehouse_id
    LEFT JOIN transport_vehicle tv ON t.transport_id = tv.transport_id
    LEFT JOIN transfer_item ti ON t.transfer_id = ti.transfer_id
    GROUP BY t.transfer_id, t.source_warehouse_id, sw.name, t.destination_warehouse_id, dw.name, t.transfer_date, t.status, tv.name, tv.vehicle_number_plate
    ORDER BY t.transfer_date DESC, t.transfer_id DESC
    LIMIT 6
  `;
  const [recentTransfers] = await query(recentTransfersSql);

  // 4. Inventory by warehouse
  const warehouseStockSql = `
    SELECT 
      w.warehouse_id,
      w.name,
      w.location,
      w.capacity,
      COALESCE(SUM(i.quantity), 0) AS total_inventory,
      ROUND(COALESCE((SUM(i.quantity) / NULLIF(w.capacity, 0)) * 100, 0), 1) AS utilization_rate
    FROM warehouse w
    LEFT JOIN inventory i ON w.warehouse_id = i.warehouse_id
    GROUP BY w.warehouse_id, w.name, w.location, w.capacity
    ORDER BY w.warehouse_id ASC
  `;
  const [warehouseStock] = await query(warehouseStockSql);

  // 5. Product distribution by category
  const categoryDistSql = `
    SELECT 
      COALESCE(p.category, 'Uncategorized') AS category,
      COUNT(DISTINCT p.product_id) AS product_count,
      COALESCE(SUM(i.quantity), 0) AS total_stock,
      COALESCE(SUM(i.quantity * p.price), 0) AS total_value
    FROM product p
    LEFT JOIN inventory i ON p.product_id = i.product_id
    GROUP BY p.category
    ORDER BY total_stock DESC
  `;
  const [categoryDistribution] = await query(categoryDistSql);

  // 6. Transfer status summary
  const transferStatusSql = `
    SELECT 
      COALESCE(status, 'UNKNOWN') AS status,
      COUNT(*) AS count
    FROM transfer
    GROUP BY status
  `;
  const [transferStatus] = await query(transferStatusSql);

  return {
    summary: {
      total_warehouses: Number(warehouseCountRows[0].total),
      total_products: Number(productCountRows[0].total),
      total_inventory: Number(inventorySumRows[0].total_inventory),
      total_transfers: Number(transferCountRows[0].total),
      total_vehicles: Number(vehicleCountRows[0].total),
      low_stock_count: Number(lowStockCountRows[0].total_low_stock),
      low_stock_threshold: threshold
    },
    warehouse_stock: warehouseStock,
    category_distribution: categoryDistribution,
    transfer_status: transferStatus,
    recent_transfers: recentTransfers,
    low_stock_items: lowStockItems
  };
}

/**
 * Detailed analytics aggregations
 */
export async function getAnalyticsData() {
  // 1. Warehouse Utilization (capacity vs current inventory)
  const warehouseUtilizationSql = `
    SELECT 
      w.warehouse_id,
      w.name,
      w.location,
      w.capacity,
      COALESCE(SUM(i.quantity), 0) AS current_inventory,
      (w.capacity - COALESCE(SUM(i.quantity), 0)) AS remaining_capacity,
      ROUND(COALESCE((SUM(i.quantity) / NULLIF(w.capacity, 0)) * 100, 0), 2) AS utilization_rate
    FROM warehouse w
    LEFT JOIN inventory i ON w.warehouse_id = i.warehouse_id
    GROUP BY w.warehouse_id, w.name, w.location, w.capacity
    ORDER BY utilization_rate DESC
  `;
  const [warehouseUtilization] = await query(warehouseUtilizationSql);

  // 2. Inventory by product (Top 10 highest total stock)
  const topProductsSql = `
    SELECT 
      p.product_id,
      p.product_name,
      p.category,
      p.price,
      COALESCE(SUM(i.quantity), 0) AS total_stock,
      COALESCE(SUM(i.quantity * p.price), 0) AS total_valuation
    FROM product p
    JOIN inventory i ON p.product_id = i.product_id
    GROUP BY p.product_id, p.product_name, p.category, p.price
    ORDER BY total_stock DESC
    LIMIT 10
  `;
  const [topProducts] = await query(topProductsSql);

  // 3. Inventory distribution by category
  const categorySql = `
    SELECT 
      COALESCE(p.category, 'Uncategorized') AS category,
      COUNT(DISTINCT p.product_id) AS product_count,
      COALESCE(SUM(i.quantity), 0) AS total_quantity,
      COALESCE(SUM(i.quantity * p.price), 0) AS total_valuation
    FROM product p
    JOIN inventory i ON p.product_id = i.product_id
    GROUP BY p.category
    ORDER BY total_quantity DESC
  `;
  const [categoryDistribution] = await query(categorySql);

  // 4. Transfer frequency by warehouse pairs (top routes)
  const routeFrequencySql = `
    SELECT 
      CONCAT(t.source_warehouse_id, ' → ', t.destination_warehouse_id) AS route,
      sw.name AS source_warehouse_name,
      dw.name AS destination_warehouse_name,
      COUNT(*) AS transfer_count,
      COALESCE(SUM(ti.quantity), 0) AS total_units_transferred
    FROM transfer t
    JOIN warehouse sw ON t.source_warehouse_id = sw.warehouse_id
    JOIN warehouse dw ON t.destination_warehouse_id = dw.warehouse_id
    LEFT JOIN transfer_item ti ON t.transfer_id = ti.transfer_id
    GROUP BY t.source_warehouse_id, t.destination_warehouse_id, sw.name, dw.name
    ORDER BY transfer_count DESC
    LIMIT 10
  `;
  const [routeFrequency] = await query(routeFrequencySql);

  // 5. Most transferred products (highest quantities & frequency)
  const mostTransferredSql = `
    SELECT 
      p.product_id,
      p.product_name,
      p.category,
      p.price,
      COUNT(ti.transfer_id) AS transfer_frequency,
      COALESCE(SUM(ti.quantity), 0) AS total_transferred_quantity
    FROM transfer_item ti
    JOIN product p ON ti.product_id = p.product_id
    GROUP BY p.product_id, p.product_name, p.category, p.price
    ORDER BY total_transferred_quantity DESC
    LIMIT 10
  `;
  const [mostTransferredProducts] = await query(mostTransferredSql);

  // 6. Transfer status breakdown
  const statusSql = `
    SELECT 
      COALESCE(status, 'UNKNOWN') AS status,
      COUNT(*) AS count,
      ROUND((COUNT(*) * 100.0) / (SELECT COUNT(*) FROM transfer), 1) AS percentage
    FROM transfer
    GROUP BY status
    ORDER BY count DESC
  `;
  const [transferStatus] = await query(statusSql);

  // 7. Monthly transfer volume activity
  const monthlyActivitySql = `
    SELECT 
      DATE_FORMAT(transfer_date, '%Y-%m') AS month_year,
      COUNT(*) AS transfer_count,
      COALESCE(SUM(ti.quantity), 0) AS units_transferred
    FROM transfer t
    LEFT JOIN transfer_item ti ON t.transfer_id = ti.transfer_id
    WHERE transfer_date IS NOT NULL
    GROUP BY DATE_FORMAT(transfer_date, '%Y-%m')
    ORDER BY month_year ASC
    LIMIT 24
  `;
  const [monthlyActivity] = await query(monthlyActivitySql);

  // 8. Transport vehicle utilization
  const vehicleUtilizationSql = `
    SELECT 
      tv.transport_id,
      tv.name,
      tv.vehicle_type,
      tv.vehicle_number_plate,
      COUNT(t.transfer_id) AS trips_count
    FROM transport_vehicle tv
    LEFT JOIN transfer t ON tv.transport_id = t.transport_id
    GROUP BY tv.transport_id, tv.name, tv.vehicle_type, tv.vehicle_number_plate
    ORDER BY trips_count DESC
    LIMIT 10
  `;
  const [vehicleUtilization] = await query(vehicleUtilizationSql);

  return {
    warehouse_utilization: warehouseUtilization,
    top_products: topProducts,
    category_distribution: categoryDistribution,
    route_frequency: routeFrequency,
    most_transferred_products: mostTransferredProducts,
    transfer_status: transferStatus,
    monthly_activity: monthlyActivity,
    vehicle_utilization: vehicleUtilization
  };
}

