import { createAssistantReply } from '../services/assistantAiService.js';

export const postAssistantChat = async (req, res, next) => {
  try {
    const result = await createAssistantReply({
      ...req.body,
      user: req.user
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
