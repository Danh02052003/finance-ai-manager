import { createAssistantReply, extractStoryFromAi } from '../services/assistantAiService.js';

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
export const postExtractStory = async (req, res, next) => {
  try {
    const { story, context_date } = req.body;
    if (!story) {
      return res.status(400).json({ error: 'Story text is required.' });
    }
    const result = await extractStoryFromAi({ story, context_date });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
