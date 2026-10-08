import { Router } from 'express';
import warehouseRoutes from './warehouseRoutes.js';
import productRoutes from './productRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import transferRoutes from './transferRoutes.js';
import vehicleRoutes from './vehicleRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';

const router = Router();

router.use('/warehouses', warehouseRoutes);
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/transfers', transferRoutes);
router.use('/transport-vehicles', vehicleRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/analytics', analyticsRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Warehouse & Inventory Management API'
  });
});

export default router;

