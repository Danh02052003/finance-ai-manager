import { apiRequest, clearApiCache } from './http.js';

export const getCurrentUser = () => apiRequest('/auth/me', { skipCache: true });

export const loginUser = async (payload) => {
  const result = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  clearApiCache();
  return result;
};

export const registerUser = async (payload) => {
  const result = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  clearApiCache();
  return result;
};

export const logoutUser = async () => {
  const result = await apiRequest('/auth/logout', {
    method: 'POST'
  });
  clearApiCache();
  return result;
};
