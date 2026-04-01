import { API_BASE_URL } from './http.js';

export const uploadExcelWorkbook = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/import/excel`, {
    method: 'POST',
    body: formData
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.errors?.[0] || payload.message || 'Import failed.');
  }

  return payload;
};

export const clearImportedWorkbookData = async () => {
  const response = await fetch(`${API_BASE_URL}/import/excel`, {
    method: 'DELETE'
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.errors?.[0] || payload.message || 'Reset failed.');
  }

  return payload;
};

export const reclassifyTransactionsByAi = async () => {
  const response = await fetch(`${API_BASE_URL}/import/reclassify-transactions`, {
    method: 'POST'
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.errors?.[0] || payload.message || payload.detail || 'AI reclassification failed.');
  }

  return payload;
};
