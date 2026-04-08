import { JarDebt } from '../models/index.js';
import {
  parseOptionalDate,
  parseOptionalString,
  requireDate,
  requireMonth,
  requireNumber,
  requireObjectId,
  requireString,
  resolveJarByKey
} from './mvpDataService.js';

const buildDebtPayload = async (userId, payload) => {
  const fromJar = await resolveJarByKey(userId, payload.from_jar_key, 'from_jar_key');
  const toJar = await resolveJarByKey(userId, payload.to_jar_key, 'to_jar_key');

  if (fromJar.jar_key === toJar.jar_key) {
    throw new Error('from_jar_key and to_jar_key must be different.');
  }

  return {
    user_id: userId,
    from_jar_id: fromJar._id,
    from_jar_key: fromJar.jar_key,
    to_jar_id: toJar._id,
    to_jar_key: toJar.jar_key,
    month: requireMonth(payload.month),
    amount: requireNumber(payload.amount, 'amount'),
    debt_date: requireDate(payload.debt_date, 'debt_date'),
    status: requireString(payload.status, 'status'),
    settled_at: parseOptionalDate(payload.settled_at, 'settled_at') || null,
    reason: parseOptionalString(payload.reason) || null
  };
};

export const listDebts = async (userId) => {
  const debts = await JarDebt.find({ user_id: userId })
    .sort({ debt_date: -1, created_at: -1 })
    .lean();

  return {
    message: 'Debts loaded successfully.',
    data: debts
  };
};

export const createDebt = async (userId, payload) => {
  const debtPayload = await buildDebtPayload(userId, payload);
  const debt = await JarDebt.create(debtPayload);

  return {
    message: 'Debt created successfully.',
    data: debt.toObject()
  };
};

export const updateDebt = async (userId, debtId, payload) => {
  requireObjectId(debtId, 'debtId');

  const existingDebt = await JarDebt.findOne({
    _id: debtId,
    user_id: userId
  });

  if (!existingDebt) {
    throw new Error('Debt not found.');
  }

  const debtPayload = await buildDebtPayload(userId, payload);
  const debt = await JarDebt.findOneAndUpdate(
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
    message: 'Debt updated successfully.',
    data: debt
  };
};

export const deleteDebt = async (userId, debtId) => {
  requireObjectId(debtId, 'debtId');

  const debt = await JarDebt.findOneAndDelete({
    _id: debtId,
    user_id: userId
  }).lean();

  if (!debt) {
    throw new Error('Debt not found.');
  }

  return {
    message: 'Debt deleted successfully.',
    data: {
      _id: debt._id
    }
  };
};
