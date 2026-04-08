import { Router } from 'express';

import { getMe, postLogin, postLogout, postRegister } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', postRegister);
router.post('/login', postLogin);
router.post('/logout', postLogout);
router.get('/me', requireAuth, getMe);

export default router;
