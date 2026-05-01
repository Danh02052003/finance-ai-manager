import { Router } from 'express';

import { postAssistantChat, postExtractStory } from '../controllers/assistantController.js';

const router = Router();

router.post('/chat', postAssistantChat);
router.post('/extract-story', postExtractStory);

export default router;
