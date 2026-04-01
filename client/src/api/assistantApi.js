import { apiRequest } from './http.js';

export const chatWithAssistant = (payload) =>
  apiRequest('/assistant/chat', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
