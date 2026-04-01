import { apiRequest } from './http.js';

export const getHealth = () => apiRequest('/health');

export const getDashboard = () => apiRequest('/dashboard');

export const getJars = () => apiRequest('/jars');

export const getJarActualBalances = () => apiRequest('/jar-actual-balances');

export const getTransactions = () => apiRequest('/transactions');

export const getDebts = () => apiRequest('/debts');

export const createTransaction = (payload) =>
  apiRequest('/transactions', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const updateTransaction = (transactionId, payload) =>
  apiRequest(`/transactions/${transactionId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

export const deleteTransaction = (transactionId) =>
  apiRequest(`/transactions/${transactionId}`, {
    method: 'DELETE'
  });

export const createDebt = (payload) =>
  apiRequest('/debts', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const updateDebt = (debtId, payload) =>
  apiRequest(`/debts/${debtId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

export const deleteDebt = (debtId) =>
  apiRequest(`/debts/${debtId}`, {
    method: 'DELETE'
  });

export const getMonthlyIncomes = () => apiRequest('/monthly-incomes');

export const createMonthlyIncome = (payload) =>
  apiRequest('/monthly-incomes', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const updateMonthlyIncome = (monthlyIncomeId, payload) =>
  apiRequest(`/monthly-incomes/${monthlyIncomeId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

export const deleteMonthlyIncome = (monthlyIncomeId) =>
  apiRequest(`/monthly-incomes/${monthlyIncomeId}`, {
    method: 'DELETE'
  });

export const getJarAllocations = () => apiRequest('/jar-allocations');

export const createJarActualBalance = (payload) =>
  apiRequest('/jar-actual-balances', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const updateJarActualBalance = (jarActualBalanceId, payload) =>
  apiRequest(`/jar-actual-balances/${jarActualBalanceId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

export const deleteJarActualBalance = (jarActualBalanceId) =>
  apiRequest(`/jar-actual-balances/${jarActualBalanceId}`, {
    method: 'DELETE'
  });

export const createJarAllocation = (payload) =>
  apiRequest('/jar-allocations', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const updateJarAllocation = (jarAllocationId, payload) =>
  apiRequest(`/jar-allocations/${jarAllocationId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

export const deleteJarAllocation = (jarAllocationId) =>
  apiRequest(`/jar-allocations/${jarAllocationId}`, {
    method: 'DELETE'
  });
