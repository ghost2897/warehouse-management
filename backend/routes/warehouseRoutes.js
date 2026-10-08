import { Router } from 'express';
import * as warehouseController from '../controllers/warehouseController.js';

const router = Router();

router.get('/', warehouseController.getWarehouses);
router.get('/:id', warehouseController.getWarehouse);
router.post('/', warehouseController.createWarehouse);
router.put('/:id', warehouseController.updateWarehouse);
router.delete('/:id', warehouseController.deleteWarehouse);

export default router;

