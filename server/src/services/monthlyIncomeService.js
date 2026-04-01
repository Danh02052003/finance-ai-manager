import { JarAllocation, MonthlyIncome } from '../models/index.js';
import {
  parseOptionalString,
  requireDate,
  requireDemoUser,
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

export const listMonthlyIncomes = async () => {
  const user = await requireDemoUser();
  const monthlyIncomes = await MonthlyIncome.find({ user_id: user._id })
    .sort({ month: -1, created_at: -1 })
    .lean();

  return {
    message: 'Monthly incomes loaded successfully.',
    data: monthlyIncomes
  };
};

export const createMonthlyIncome = async (payload) => {
  const user = await requireDemoUser();
  const monthlyIncomePayload = buildMonthlyIncomePayload(user._id, payload);

  const existingMonthlyIncome = await MonthlyIncome.findOne({
    user_id: user._id,
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

export const updateMonthlyIncome = async (monthlyIncomeId, payload) => {
  const user = await requireDemoUser();
  requireObjectId(monthlyIncomeId, 'monthlyIncomeId');

  const existingMonthlyIncome = await MonthlyIncome.findOne({
    _id: monthlyIncomeId,
    user_id: user._id
  });

  if (!existingMonthlyIncome) {
    throw new Error('Monthly income not found.');
  }

  const monthlyIncomePayload = buildMonthlyIncomePayload(user._id, payload);
  const conflictingMonthlyIncome = await MonthlyIncome.findOne({
    _id: { $ne: monthlyIncomeId },
    user_id: user._id,
    month: monthlyIncomePayload.month
  });

  if (conflictingMonthlyIncome) {
    throw new Error('A monthly income already exists for this month.');
  }

  const monthlyIncome = await MonthlyIncome.findOneAndUpdate(
    {
      _id: monthlyIncomeId,
      user_id: user._id
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

export const deleteMonthlyIncome = async (monthlyIncomeId) => {
  const user = await requireDemoUser();
  requireObjectId(monthlyIncomeId, 'monthlyIncomeId');

  const monthlyIncome = await MonthlyIncome.findOneAndDelete({
    _id: monthlyIncomeId,
    user_id: user._id
  }).lean();

  if (!monthlyIncome) {
    throw new Error('Monthly income not found.');
  }

  await JarAllocation.deleteMany({
    user_id: user._id,
    monthly_income_id: monthlyIncome._id
  });

  return {
    message: 'Monthly income deleted successfully.',
    data: {
      _id: monthlyIncome._id
    }
  };
};
