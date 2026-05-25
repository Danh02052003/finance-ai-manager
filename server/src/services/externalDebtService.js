import { ExternalDebt } from '../models/index.js';
import {
  parseOptionalDate,
  parseOptionalString,
  requireDate,
  requireMonth,
  requireMoneyInput,
  requireObjectId,
  requireString
} from './mvpDataService.js';

const buildExternalDebtPayload = (userId, payload) => {
  return {
    user_id: userId,
    creditor_name: requireString(payload.creditor_name, 'creditor_name').trim(),
    debt_type: payload.debt_type === 'lent' ? 'lent' : 'borrowed', // Default to borrowed
    month: requireMonth(payload.month),
    amount: requireMoneyInput(payload.amount, 'amount'),
    debt_date: requireDate(payload.debt_date, 'debt_date'),
    status: requireString(payload.status, 'status'),
    settled_at: parseOptionalDate(payload.settled_at, 'settled_at') || null,
    reason: parseOptionalString(payload.reason) || null
  };
};

export const listExternalDebts = async (userId) => {
  const debts = await ExternalDebt.find({ user_id: userId })
    .sort({ debt_date: -1, created_at: -1 })
    .lean();

  return {
    message: 'External debts loaded successfully.',
    data: debts
  };
};

export const createExternalDebt = async (userId, payload) => {
  const debtPayload = buildExternalDebtPayload(userId, payload);
  const debt = await ExternalDebt.create(debtPayload);

  return {
    message: 'External debt created successfully.',
    data: debt.toObject()
  };
};

export const updateExternalDebt = async (userId, debtId, payload) => {
  requireObjectId(debtId, 'debtId');

  const existingDebt = await ExternalDebt.findOne({
    _id: debtId,
    user_id: userId
  });

  if (!existingDebt) {
    throw new Error('External debt not found.');
  }

  const debtPayload = buildExternalDebtPayload(userId, payload);
  
  // Update payload with new data
  const debt = await ExternalDebt.findOneAndUpdate(
    {
      _id: debtId,
      user_id: userId
    },
    { $set: debtPayload },
    {
      new: true,
      runValidators: true
    }
  ).lean();

  return {
    message: 'External debt updated successfully.',
    data: debt
  };
};

export const deleteExternalDebt = async (userId, debtId) => {
  requireObjectId(debtId, 'debtId');

  const debt = await ExternalDebt.findOneAndDelete({
    _id: debtId,
    user_id: userId
  }).lean();

  if (!debt) {
    throw new Error('External debt not found.');
  }

  return {
    message: 'External debt deleted successfully.',
    data: {
      _id: debt._id
    }
  };
};
