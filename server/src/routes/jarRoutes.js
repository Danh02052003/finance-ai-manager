import { Router } from 'express';

import { getJars } from '../controllers/jarController.js';

const router = Router();

router.get('/', getJars);

export default router;
