import { JarAllocation, MonthlyIncome } from '../models/index.js';
import {
  parseOptionalString,
  requireDate,
  requireMonth,
  requireMoneyInput,
  requireObjectId
} from './mvpDataService.js';

const buildMonthlyIncomePayload = (userId, payload) => ({
  user_id: userId,
  month: requireMonth(payload.month),
  total_amount: requireMoneyInput(payload.total_amount, 'total_amount'),
  currency: payload.currency?.trim() || 'VND',
  income_date: payload.income_date
    ? requireDate(payload.income_date, 'income_date')
    : null,
  source_note: parseOptionalString(payload.source_note) || null
});

export const listMonthlyIncomes = async (userId) => {
  const monthlyIncomes = await MonthlyIncome.find({ user_id: userId })
    .sort({ month: -1, created_at: -1 })
    .lean();

  return {
    message: 'Monthly incomes loaded successfully.',
    data: monthlyIncomes
  };
};

export const createMonthlyIncome = async (userId, payload) => {
  const monthlyIncomePayload = buildMonthlyIncomePayload(userId, payload);

  const existingMonthlyIncome = await MonthlyIncome.findOne({
    user_id: userId,
    month: monthlyIncomePayload.month
  });

  if (existingMonthlyIncome) {
    throw new Error('A monthly income already exists for this month.');
  }

  const monthlyIncome = await MonthlyIncome.create(monthlyIncomePayload);

  return {
    message: 'Monthly income created successfully.',
    data: monthlyIncome.toObject()
  };
};

export const updateMonthlyIncome = async (userId, monthlyIncomeId, payload) => {
  requireObjectId(monthlyIncomeId, 'monthlyIncomeId');

  const existingMonthlyIncome = await MonthlyIncome.findOne({
    _id: monthlyIncomeId,
    user_id: userId
  });

  if (!existingMonthlyIncome) {
    throw new Error('Monthly income not found.');
  }

  const monthlyIncomePayload = buildMonthlyIncomePayload(userId, payload);
  const conflictingMonthlyIncome = await MonthlyIncome.findOne({
    _id: { $ne: monthlyIncomeId },
    user_id: userId,
    month: monthlyIncomePayload.month
  });

  if (conflictingMonthlyIncome) {
    throw new Error('A monthly income already exists for this month.');
  }

  const monthlyIncome = await MonthlyIncome.findOneAndUpdate(
    {
      _id: monthlyIncomeId,
      user_id: userId
    },
    { $set: monthlyIncomePayload },
    {
      new: true,
      runValidators: true
    }
  ).lean();

  return {
    message: 'Monthly income updated successfully.',
    data: monthlyIncome
  };
};

export const deleteMonthlyIncome = async (userId, monthlyIncomeId) => {
  requireObjectId(monthlyIncomeId, 'monthlyIncomeId');

  const monthlyIncome = await MonthlyIncome.findOneAndDelete({
    _id: monthlyIncomeId,
    user_id: userId
  }).lean();

  if (!monthlyIncome) {
    throw new Error('Monthly income not found.');
  }

  await JarAllocation.deleteMany({
    user_id: userId,
    monthly_income_id: monthlyIncome._id
  });

  return {
    message: 'Monthly income deleted successfully.',
    data: {
      _id: monthlyIncome._id
    }
  };
};
