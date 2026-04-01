import { Router } from 'express';

import {
  getMonthlyIncomes,
  postMonthlyIncome,
  putMonthlyIncome,
  removeMonthlyIncome
} from '../controllers/monthlyIncomeController.js';

const router = Router();

router.get('/', getMonthlyIncomes);
router.post('/', postMonthlyIncome);
router.put('/:id', putMonthlyIncome);
router.delete('/:id', removeMonthlyIncome);

export default router;
