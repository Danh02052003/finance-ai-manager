import { JarDebt } from '../models/index.js';
import {
  parseOptionalDate,
  parseOptionalString,
  requireDate,
  requireMonth,
  requireNumber,
  requireMoneyInput,
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
    amount: requireMoneyInput(payload.amount, 'amount'),
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

  if (debtPayload.status === 'open') {
    const { createTransaction } = await import('./transactionService.js');
    const today = new Date().toISOString().slice(0, 10);
    const reasonText = debtPayload.reason ? ` (${debtPayload.reason})` : '';

    await createTransaction(userId, {
      jar_key: debtPayload.from_jar_key,
      month: debtPayload.month,
      transaction_date: debtPayload.debt_date ? new Date(debtPayload.debt_date).toISOString().slice(0, 10) : today,
      amount: debtPayload.amount,
      direction: 'expense',
      category: 'uncategorized',
      description: debtPayload.reason || 'Ghi nợ nội bộ',
      source: 'auto_debt_creation'
    });
  }

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

  if (existingDebt.status === 'open' && debtPayload.status === 'settled') {
    const { createTransaction } = await import('./transactionService.js');
    const today = new Date().toISOString().slice(0, 10);
    const reasonText = debtPayload.reason ? ` (${debtPayload.reason})` : '';

    // Transaction 1: Reduce from the jar that owed the money (to_jar_key)
    await createTransaction(userId, {
      jar_key: debtPayload.to_jar_key,
      month: debtPayload.month,
      transaction_date: debtPayload.settled_at ? new Date(debtPayload.settled_at).toISOString().slice(0, 10) : today,
      amount: debtPayload.amount,
      direction: 'expense',
      category: 'uncategorized',
      description: `Tự động tất toán nợ${reasonText}`,
      source: 'auto_debt_settlement'
    });

    // Transaction 2: Increase back to the jar that lent the money (from_jar_key)
    await createTransaction(userId, {
      jar_key: debtPayload.from_jar_key,
      month: debtPayload.month,
      transaction_date: debtPayload.settled_at ? new Date(debtPayload.settled_at).toISOString().slice(0, 10) : today,
      amount: debtPayload.amount,
      direction: 'income_adjustment',
      category: 'uncategorized',
      description: `Tự động tất toán nợ${reasonText}`,
      source: 'auto_debt_settlement'
    });
  }

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
