import { Router } from 'express';

import {
  getJarAllocations,
  postJarAllocation,
  putJarAllocation,
  removeJarAllocation
} from '../controllers/jarAllocationController.js';

const router = Router();

router.get('/', getJarAllocations);
router.post('/', postJarAllocation);
router.put('/:id', putJarAllocation);
router.delete('/:id', removeJarAllocation);

export default router;
