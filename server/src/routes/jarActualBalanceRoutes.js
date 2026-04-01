import { Router } from 'express';

import {
  getJarActualBalances,
  postDailyYieldRun,
  postJarActualBalance,
  putJarActualBalance,
  removeJarActualBalance
} from '../controllers/jarActualBalanceController.js';

const router = Router();

router.get('/', getJarActualBalances);
router.post('/run-daily-yield', postDailyYieldRun);
router.post('/', postJarActualBalance);
router.put('/:id', putJarActualBalance);
router.delete('/:id', removeJarActualBalance);

export default router;
