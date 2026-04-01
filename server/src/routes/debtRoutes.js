import { Router } from 'express';

import {
  getDebts,
  postDebt,
  putDebt,
  removeDebt
} from '../controllers/debtController.js';

const router = Router();

router.get('/', getDebts);
router.post('/', postDebt);
router.put('/:id', putDebt);
router.delete('/:id', removeDebt);

export default router;
