import { Router } from 'express';

import {
  getJarActualBalances,
  postJarActualBalance,
  putJarActualBalance,
  removeJarActualBalance
} from '../controllers/jarActualBalanceController.js';

const router = Router();

router.get('/', getJarActualBalances);
router.post('/', postJarActualBalance);
router.put('/:id', putJarActualBalance);
router.delete('/:id', removeJarActualBalance);

export default router;
