import { query } from '../db/pool.js';

export async function getAllInventory({
  warehouseId,
  productId,
  category,
  search,
  lowStockOnly,
  lowStockThreshold = 200,
  sortBy,
  order,
  page,
  limit
}) {
  let whereClauses = [];
  let params = [];

  if (warehouseId && warehouseId !== 'ALL') {
    whereClauses.push('i.warehouse_id = ?');
    params.push(warehouseId);
  }

  if (productId && productId !== 'ALL') {
    whereClauses.push('i.product_id = ?');
    params.push(productId);
  }

  if (category && category !== 'ALL') {
    whereClauses.push('p.category = ?');
    params.push(category);
  }

  if (search) {
    whereClauses.push('(i.inventory_id LIKE ? OR p.product_name LIKE ? OR p.product_id LIKE ? OR w.name LIKE ? OR w.location LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  const threshold = Number(lowStockThreshold) || 200;
  if (lowStockOnly === true || lowStockOnly === 'true') {
    whereClauses.push('i.quantity <= ?');
    params.push(threshold);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Total count
  const countSql = `
    SELECT COUNT(*) AS total
    FROM inventory i
    JOIN product p ON i.product_id = p.product_id
    JOIN warehouse w ON i.warehouse_id = w.warehouse_id
    ${whereSql}
  `;
  const [countResult] = await query(countSql, params);
  const total = countResult[0].total;

  // Ordering
  let orderBySql = 'ORDER BY i.quantity ASC, p.product_name ASC';
  const sortDirection = order && order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  if (sortBy === 'quantity') {
    orderBySql = `ORDER BY i.quantity ${sortDirection}`;
  } else if (sortBy === 'product_name') {
    orderBySql = `ORDER BY p.product_name ${sortDirection}`;
  } else if (sortBy === 'warehouse_name') {
    orderBySql = `ORDER BY w.name ${sortDirection}`;
  } else if (sortBy === 'price') {
    orderBySql = `ORDER BY p.price ${sortDirection}`;
  } else if (sortBy === 'inventory_id') {
    orderBySql = `ORDER BY i.inventory_id ${sortDirection}`;
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
      i.inventory_id,
      i.product_id,
      p.product_name,
      p.category,
      p.price,
      i.warehouse_id,
      w.name AS warehouse_name,
      w.location AS warehouse_location,
      i.quantity,
      CASE WHEN i.quantity <= ? THEN 1 ELSE 0 END AS is_low_stock
    FROM inventory i
    JOIN product p ON i.product_id = p.product_id
    JOIN warehouse w ON i.warehouse_id = w.warehouse_id
    ${whereSql}
    ${orderBySql}
    ${limitSql}
  `;

  const [rows] = await query(dataSql, [threshold, ...params]);

  return {
    inventory: rows,
    threshold,
    pagination: limit ? {
      total,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      totalPages: Math.ceil(total / (Number(limit) || 20))
    } : { total, count: rows.length }
  };
}

export async function getInventoryById(inventoryId) {
  const sql = `
    SELECT 
      i.inventory_id,
      i.product_id,
      p.product_name,
      p.category,
      p.price,
      i.warehouse_id,
      w.name AS warehouse_name,
      w.location AS warehouse_location,
      i.quantity
    FROM inventory i
    JOIN product p ON i.product_id = p.product_id
    JOIN warehouse w ON i.warehouse_id = w.warehouse_id
    WHERE i.inventory_id = ?
  `;
  const [rows] = await query(sql, [inventoryId]);
  return rows.length ? rows[0] : null;
}

export async function updateInventoryStock(inventoryId, quantity) {
  const num = Number(quantity);
  if (isNaN(num) || num < 0) {
    const err = new Error('Quantity must be a non-negative number.');
    err.statusCode = 400;
    throw err;
  }

  const sql = `UPDATE inventory SET quantity = ? WHERE inventory_id = ?`;
  await query(sql, [num, inventoryId]);
  return getInventoryById(inventoryId);
}

