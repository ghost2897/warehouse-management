import { query } from './db/pool.js';
import * as transferService from './services/transferService.js';

async function testTransferTransactions() {
  console.log('--- Testing Transfer Transaction & Inventory Movements ---');

  const sourceWh = 'W01';
  const destWh = 'W02';
  const prodId = 'P01';
  const transferQty = 15;

  // 1. Check initial quantities
  const [initSource] = await query('SELECT quantity FROM inventory WHERE warehouse_id = ? AND product_id = ?', [sourceWh, prodId]);
  const [initDest] = await query('SELECT quantity FROM inventory WHERE warehouse_id = ? AND product_id = ?', [destWh, prodId]);

  const sourceInitialQty = Number(initSource[0].quantity);
  const destInitialQty = Number(initDest[0].quantity);

  console.log(`Initial stock for ${prodId}: Source (${sourceWh}) = ${sourceInitialQty}, Dest (${destWh}) = ${destInitialQty}`);

  // 2. Create transfer in PENDING status
  const createdTransfer = await transferService.createTransfer({
    source_warehouse_id: sourceWh,
    destination_warehouse_id: destWh,
    transfer_date: '2026-09-20',
    status: 'PENDING',
    transport_id: 'TV001',
    items: [{ product_id: prodId, quantity: transferQty }]
  });

  console.log(`Created transfer ${createdTransfer.transfer_id} with status ${createdTransfer.status}`);

  // Verify stock is UNCHANGED while PENDING
  const [pendingSource] = await query('SELECT quantity FROM inventory WHERE warehouse_id = ? AND product_id = ?', [sourceWh, prodId]);
  const [pendingDest] = await query('SELECT quantity FROM inventory WHERE warehouse_id = ? AND product_id = ?', [destWh, prodId]);

  if (Number(pendingSource[0].quantity) !== sourceInitialQty || Number(pendingDest[0].quantity) !== destInitialQty) {
    throw new Error('FAILED: Inventory changed while transfer was still PENDING!');
  }
  console.log('✅ Stock untouched while status is PENDING.');

  // 3. Update status to COMPLETED
  const completedTransfer = await transferService.updateTransferStatus(createdTransfer.transfer_id, 'COMPLETED');
  console.log(`Updated transfer ${completedTransfer.transfer_id} to status ${completedTransfer.status}`);

  // Verify stock is MOVED
  const [afterSource] = await query('SELECT quantity FROM inventory WHERE warehouse_id = ? AND product_id = ?', [sourceWh, prodId]);
  const [afterDest] = await query('SELECT quantity FROM inventory WHERE warehouse_id = ? AND product_id = ?', [destWh, prodId]);

  const expectedSource = sourceInitialQty - transferQty;
  const expectedDest = destInitialQty + transferQty;

  if (Number(afterSource[0].quantity) !== expectedSource || Number(afterDest[0].quantity) !== expectedDest) {
    throw new Error(`FAILED: Inventory movement mismatch! Expected source ${expectedSource}, got ${afterSource[0].quantity}. Expected dest ${expectedDest}, got ${afterDest[0].quantity}.`);
  }
  console.log(`✅ Stock accurately moved: Source: ${afterSource[0].quantity} (-${transferQty}), Dest: ${afterDest[0].quantity} (+${transferQty})`);

  // 4. Test insufficient stock rejection
  try {
    await transferService.createTransfer({
      source_warehouse_id: sourceWh,
      destination_warehouse_id: destWh,
      transfer_date: '2026-09-20',
      status: 'PENDING',
      items: [{ product_id: prodId, quantity: 999999 }] // excessively large
    });
    throw new Error('FAILED: Insufficient inventory was not rejected!');
  } catch (err) {
    console.log(`✅ Insufficient stock properly rejected: ${err.message}`);
  }

  // 5. Restore stock to original state for cleanliness
  await query('UPDATE inventory SET quantity = ? WHERE warehouse_id = ? AND product_id = ?', [sourceInitialQty, sourceWh, prodId]);
  await query('UPDATE inventory SET quantity = ? WHERE warehouse_id = ? AND product_id = ?', [destInitialQty, destWh, prodId]);
  await query('DELETE FROM transfer_item WHERE transfer_id = ?', [createdTransfer.transfer_id]);
  await query('DELETE FROM transfer WHERE transfer_id = ?', [createdTransfer.transfer_id]);
  console.log('✅ Test transfer cleaned up and stock restored to original values.');

  console.log('\n🎉 Transfer transaction tests passed with 100% correctness!');
  process.exit(0);
}

testTransferTransactions().catch(err => {
  console.error('❌ Transaction test failed:', err);
  process.exit(1);
});

