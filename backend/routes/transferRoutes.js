import { Router } from 'express';
import * as transferController from '../controllers/transferController.js';

const router = Router();

router.get('/', transferController.getTransfers);
router.get('/:id', transferController.getTransfer);
router.post('/', transferController.createTransfer);
router.put('/:id/status', transferController.updateTransferStatus);

export default router;

