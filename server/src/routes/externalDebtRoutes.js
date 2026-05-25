import express from 'express';

import {
  getExternalDebts,
  postExternalDebt,
  putExternalDebt,
  removeExternalDebt
} from '../controllers/externalDebtController.js';

const router = express.Router();

router.get('/', getExternalDebts);
router.post('/', postExternalDebt);
router.put('/:id', putExternalDebt);
router.delete('/:id', removeExternalDebt);

export default router;
