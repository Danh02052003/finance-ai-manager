import { apiRequest } from './http.js';

export const chatWithAssistant = (payload) =>
  apiRequest('/assistant/chat', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const extractStory = (payload) =>
  apiRequest('/assistant/extract-story', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
