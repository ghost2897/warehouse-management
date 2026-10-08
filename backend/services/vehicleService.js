import { query } from '../db/pool.js';

export async function generateNextTransportId() {
  const sql = `
    SELECT transport_id 
    FROM transport_vehicle 
    WHERE transport_id REGEXP '^TV[0-9]+$' 
    ORDER BY CAST(SUBSTRING(transport_id, 3) AS UNSIGNED) DESC 
    LIMIT 1
  `;
  const [rows] = await query(sql);
  if (!rows.length) return 'TV001';
  const lastId = rows[0].transport_id;
  const num = parseInt(lastId.substring(2), 10);
  return `TV${String(num + 1).padStart(3, '0')}`;
}

export async function getAllVehicles({ search, vehicleType }) {
  let whereClauses = [];
  let params = [];

  if (search) {
    whereClauses.push('(tv.transport_id LIKE ? OR tv.name LIKE ? OR tv.vehicle_number_plate LIKE ? OR tv.contact_number LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (vehicleType && vehicleType !== 'ALL') {
    whereClauses.push('tv.vehicle_type = ?');
    params.push(vehicleType);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const sql = `
    SELECT 
      tv.transport_id,
      tv.name,
      tv.vehicle_type,
      tv.vehicle_number_plate,
      tv.contact_number,
      tv.insurance,
      COUNT(t.transfer_id) AS total_transfers_count,
      SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_transfers_count,
      SUM(CASE WHEN t.status = 'IN TRANSIT' THEN 1 ELSE 0 END) AS active_transfers_count
    FROM transport_vehicle tv
    LEFT JOIN transfer t ON tv.transport_id = t.transport_id
    ${whereSql}
    GROUP BY 
      tv.transport_id,
      tv.name,
      tv.vehicle_type,
      tv.vehicle_number_plate,
      tv.contact_number,
      tv.insurance
    ORDER BY tv.transport_id ASC
  `;

  const [rows] = await query(sql, params);
  return rows;
}

export async function getVehicleById(transportId) {
  const vehicleSql = `
    SELECT 
      tv.transport_id,
      tv.name,
      tv.vehicle_type,
      tv.vehicle_number_plate,
      tv.contact_number,
      tv.insurance,
      COUNT(t.transfer_id) AS total_transfers_count
    FROM transport_vehicle tv
    LEFT JOIN transfer t ON tv.transport_id = t.transport_id
    WHERE tv.transport_id = ?
    GROUP BY 
      tv.transport_id,
      tv.name,
      tv.vehicle_type,
      tv.vehicle_number_plate,
      tv.contact_number,
      tv.insurance
  `;
  const [rows] = await query(vehicleSql, [transportId]);
  if (!rows.length) return null;

  const vehicle = rows[0];

  // Associated transfer history
  const historySql = `
    SELECT 
      t.transfer_id,
      t.transfer_date,
      t.status,
      sw.name AS source_warehouse_name,
      dw.name AS destination_warehouse_name,
      COUNT(ti.product_id) AS item_count,
      COALESCE(SUM(ti.quantity), 0) AS total_quantity
    FROM transfer t
    JOIN warehouse sw ON t.source_warehouse_id = sw.warehouse_id
    JOIN warehouse dw ON t.destination_warehouse_id = dw.warehouse_id
    LEFT JOIN transfer_item ti ON t.transfer_id = ti.transfer_id
    WHERE t.transport_id = ?
    GROUP BY t.transfer_id, t.transfer_date, t.status, sw.name, dw.name
    ORDER BY t.transfer_date DESC
    LIMIT 20
  `;
  const [transfers] = await query(historySql, [transportId]);
  vehicle.transfers = transfers;

  return vehicle;
}

export async function createVehicle({ transport_id, name, vehicle_type, vehicle_number_plate, contact_number, insurance }) {
  const id = transport_id || (await generateNextTransportId());
  const sql = `
    INSERT INTO transport_vehicle (transport_id, name, vehicle_type, vehicle_number_plate, contact_number, insurance)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  await query(sql, [id, name, vehicle_type, vehicle_number_plate, contact_number, insurance]);
  return getVehicleById(id);
}

export async function updateVehicle(transportId, { name, vehicle_type, vehicle_number_plate, contact_number, insurance }) {
  const sql = `
    UPDATE transport_vehicle
    SET name = COALESCE(?, name),
        vehicle_type = COALESCE(?, vehicle_type),
        vehicle_number_plate = COALESCE(?, vehicle_number_plate),
        contact_number = COALESCE(?, contact_number),
        insurance = COALESCE(?, insurance)
    WHERE transport_id = ?
  `;
  await query(sql, [name, vehicle_type, vehicle_number_plate, contact_number, insurance, transportId]);
  return getVehicleById(transportId);
}

export async function deleteVehicle(transportId) {
  // Check if vehicle has any transfers
  const [transferCheck] = await query(
    'SELECT COUNT(*) AS count FROM transfer WHERE transport_id = ?',
    [transportId]
  );
  if (transferCheck[0].count > 0) {
    const err = new Error(`Cannot delete vehicle ${transportId} because it is referenced by ${transferCheck[0].count} transfer records.`);
    err.statusCode = 409;
    throw err;
  }

  await query('DELETE FROM transport_vehicle WHERE transport_id = ?', [transportId]);
  return { transport_id: transportId, deleted: true };
}

