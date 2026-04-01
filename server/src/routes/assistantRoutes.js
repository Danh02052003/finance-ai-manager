import { Router } from 'express';

import { postAssistantChat } from '../controllers/assistantController.js';

const router = Router();

router.post('/chat', postAssistantChat);

export default router;
