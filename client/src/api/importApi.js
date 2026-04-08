import { apiRequest } from './http.js';

export const uploadExcelWorkbook = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest('/import/excel', {
    method: 'POST',
    body: formData
  });
};

export const clearImportedWorkbookData = () =>
  apiRequest('/import/excel', {
    method: 'DELETE'
  });

export const reclassifyTransactionsByAi = () =>
  apiRequest('/import/reclassify-transactions', {
    method: 'POST'
  });
