import { testConnection, query } from './db/pool.js';
import * as warehouseService from './services/warehouseService.js';
import * as productService from './services/productService.js';
import * as inventoryService from './services/inventoryService.js';
import * as transferService from './services/transferService.js';
import * as vehicleService from './services/vehicleService.js';
import * as analyticsService from './services/analyticsService.js';

async function runTests() {
  console.log('--- Testing MariaDB Connection ---');
  await testConnection();

  console.log('\n--- Testing Warehouses ---');
  const warehouses = await warehouseService.getAllWarehouses();
  console.log(`Retrieved ${warehouses.length} warehouses.`);
  console.log('Sample warehouse:', warehouses[0]);

  console.log('\n--- Testing Products ---');
  const productsResult = await productService.getAllProducts({ limit: 5 });
  console.log(`Total products: ${productsResult.pagination.total}, Retrieved: ${productsResult.products.length}`);
  console.log('Sample product:', productsResult.products[0]);

  console.log('\n--- Testing Inventory ---');
  const inventoryResult = await inventoryService.getAllInventory({ limit: 5, lowStockThreshold: 200 });
  console.log(`Total inventory records: ${inventoryResult.pagination.total}`);
  console.log('Sample inventory record:', inventoryResult.inventory[0]);

  console.log('\n--- Testing Transfers ---');
  const transfersResult = await transferService.getAllTransfers({ limit: 5 });
  console.log(`Total transfers: ${transfersResult.pagination.total}`);
  console.log('Sample transfer:', transfersResult.transfers[0]);

  console.log('\n--- Testing Transport Vehicles ---');
  const vehicles = await vehicleService.getAllVehicles({});
  console.log(`Retrieved ${vehicles.length} vehicles.`);
  console.log('Sample vehicle:', vehicles[0]);

  console.log('\n--- Testing Dashboard & Analytics Data ---');
  const dashboardData = await analyticsService.getDashboardData();
  console.log('Dashboard summary:', dashboardData.summary);

  const analyticsData = await analyticsService.getAnalyticsData();
  console.log('Analytics routes count:', analyticsData.route_frequency.length);
  console.log('Analytics top products count:', analyticsData.top_products.length);

  console.log('\n✅ All backend service tests passed successfully!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

