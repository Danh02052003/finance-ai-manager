import { Router } from 'express';

import {
  getTransactions,
  postTransaction,
  putTransaction,
  removeTransaction
} from '../controllers/transactionController.js';

const router = Router();

router.get('/', getTransactions);
router.post('/', postTransaction);
router.put('/:id', putTransaction);
router.delete('/:id', removeTransaction);

export default router;
