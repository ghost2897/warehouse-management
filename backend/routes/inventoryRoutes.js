import { Router } from 'express';
import * as inventoryController from '../controllers/inventoryController.js';

const router = Router();

router.get('/', inventoryController.getInventory);
router.get('/:id', inventoryController.getInventoryItem);
router.put('/:id', inventoryController.updateInventoryStock);

export default router;

