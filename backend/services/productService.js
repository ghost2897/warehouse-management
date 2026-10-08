import { query } from '../db/pool.js';

export async function getAllProducts({ search, category, sortBy, order, page, limit }) {
  let whereClauses = [];
  let params = [];

  if (search) {
    whereClauses.push('(p.product_id LIKE ? OR p.product_name LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (category && category !== 'ALL') {
    whereClauses.push('p.category = ?');
    params.push(category);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Get total count for pagination
  const countSql = `
    SELECT COUNT(DISTINCT p.product_id) AS total
    FROM product p
    ${whereSql}
  `;
  const [countResult] = await query(countSql, params);
  const total = countResult[0].total;

  // Build sorting
  let orderBySql = 'ORDER BY p.product_id ASC';
  const sortDirection = order && order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  if (sortBy === 'price') {
    orderBySql = `ORDER BY p.price ${sortDirection}`;
  } else if (sortBy === 'total_stock' || sortBy === 'stock') {
    orderBySql = `ORDER BY total_stock ${sortDirection}`;
  } else if (sortBy === 'product_name' || sortBy === 'name') {
    orderBySql = `ORDER BY p.product_name ${sortDirection}`;
  } else if (sortBy === 'category') {
    orderBySql = `ORDER BY p.category ${sortDirection}`;
  }

  let limitSql = '';
  if (limit) {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 20);
    const offset = (pageNum - 1) * limitNum;
    limitSql = `LIMIT ${limitNum} OFFSET ${offset}`;
  }

  const dataSql = `
    SELECT 
      p.product_id,
      p.product_name,
      p.category,
      p.price,
      COALESCE(SUM(i.quantity), 0) AS total_stock,
      COUNT(DISTINCT i.warehouse_id) AS warehouse_count
    FROM product p
    LEFT JOIN inventory i ON p.product_id = i.product_id
    ${whereSql}
    GROUP BY p.product_id, p.product_name, p.category, p.price
    ${orderBySql}
    ${limitSql}
  `;

  const [products] = await query(dataSql, params);

  return {
    products,
    pagination: limit ? {
      total,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      totalPages: Math.ceil(total / (Number(limit) || 20))
    } : { total, count: products.length }
  };
}

export async function getProductById(productId) {
  const productSql = `
    SELECT 
      p.product_id,
      p.product_name,
      p.category,
      p.price,
      COALESCE(SUM(i.quantity), 0) AS total_stock
    FROM product p
    LEFT JOIN inventory i ON p.product_id = i.product_id
    WHERE p.product_id = ?
    GROUP BY p.product_id, p.product_name, p.category, p.price
  `;
  const [rows] = await query(productSql, [productId]);
  if (!rows.length) return null;

  const product = rows[0];

  // Get stock distribution across all warehouses
  const distributionSql = `
    SELECT 
      w.warehouse_id,
      w.name AS warehouse_name,
      w.location,
      COALESCE(i.quantity, 0) AS quantity,
      i.inventory_id
    FROM warehouse w
    LEFT JOIN inventory i ON w.warehouse_id = i.warehouse_id AND i.product_id = ?
    ORDER BY w.warehouse_id ASC
  `;
  const [distribution] = await query(distributionSql, [productId]);
  product.warehouses = distribution;

  // Get transfer history for this product
  const historySql = `
    SELECT 
      t.transfer_id,
      t.transfer_date,
      t.status,
      ti.quantity AS transferred_quantity,
      sw.name AS source_warehouse_name,
      dw.name AS destination_warehouse_name
    FROM transfer_item ti
    JOIN transfer t ON ti.transfer_id = t.transfer_id
    JOIN warehouse sw ON t.source_warehouse_id = sw.warehouse_id
    JOIN warehouse dw ON t.destination_warehouse_id = dw.warehouse_id
    WHERE ti.product_id = ?
    ORDER BY t.transfer_date DESC
    LIMIT 10
  `;
  const [history] = await query(historySql, [productId]);
  product.transfer_history = history;

  return product;
}

export async function getCategories() {
  const sql = `
    SELECT DISTINCT category 
    FROM product 
    WHERE category IS NOT NULL 
    ORDER BY category ASC
  `;
  const [rows] = await query(sql);
  return rows.map(r => r.category);
}

export async function createProduct({ product_id, product_name, category, price }) {
  const sql = `
    INSERT INTO product (product_id, product_name, category, price)
    VALUES (?, ?, ?, ?)
  `;
  await query(sql, [product_id, product_name, category, price]);
  return getProductById(product_id);
}

export async function updateProduct(productId, { product_name, category, price }) {
  const sql = `
    UPDATE product
    SET product_name = COALESCE(?, product_name),
        category = COALESCE(?, category),
        price = COALESCE(?, price)
    WHERE product_id = ?
  `;
  await query(sql, [product_name, category, price, productId]);
  return getProductById(productId);
}

export async function deleteProduct(productId) {
  // Check if active inventory > 0
  const [invCheck] = await query(`SELECT SUM(quantity) AS total FROM inventory WHERE product_id = ?`, [productId]);
  if (invCheck[0].total > 0) {
    const err = new Error(`Cannot delete product ${productId} because stock still exists in warehouses.`);
    err.statusCode = 409;
    throw err;
  }

  // Check transfers
  const [transferCheck] = await query(`SELECT COUNT(*) AS count FROM transfer_item WHERE product_id = ?`, [productId]);
  if (transferCheck[0].count > 0) {
    const err = new Error(`Cannot delete product ${productId} because it is referenced in transfer records.`);
    err.statusCode = 409;
    throw err;
  }

  // Delete zero inventory rows if any, then product
  await query(`DELETE FROM inventory WHERE product_id = ?`, [productId]);
  await query(`DELETE FROM product WHERE product_id = ?`, [productId]);
  return { product_id: productId, deleted: true };
}

