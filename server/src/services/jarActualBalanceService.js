import { JarActualBalance } from '../models/index.js';
import {
  parseOptionalString,
  parseOptionalDate,
  requireMoneyInput,
  requireMonth,
  requireNumber,
  requireObjectId,
  resolveJarByKey
} from './mvpDataService.js';
import { createYieldDates, DEFAULT_MOMO_YIELD_RATE, runDailyYield } from './yieldService.js';

const buildJarActualBalancePayload = async (userId, payload, existingRecord = null) => {
  const month = requireMonth(payload.month);
  const jar = await resolveJarByKey(userId, payload.jar_key);
  const activationDate =
    parseOptionalDate(payload.yield_activation_date, 'yield_activation_date') ||
    existingRecord?.yield_activation_date ||
    null;
  const yieldDates = createYieldDates(activationDate);

  return {
    user_id: userId,
    jar_id: jar._id,
    jar_key: jar.jar_key,
    month,
    actual_balance_amount: requireMoneyInput(
      payload.actual_balance_amount ?? existingRecord?.actual_balance_amount ?? 0,
      'actual_balance_amount'
    ),
    yield_enabled:
      payload.yield_enabled == null ? existingRecord?.yield_enabled ?? true : Boolean(payload.yield_enabled),
    yield_activation_date: yieldDates.yield_activation_date,
    yield_start_date: yieldDates.yield_start_date,
    yield_rate_annual:
      payload.yield_rate_annual == null
        ? Number(existingRecord?.yield_rate_annual ?? DEFAULT_MOMO_YIELD_RATE)
        : requireNumber(payload.yield_rate_annual, 'yield_rate_annual'),
    last_yield_processed_at: existingRecord?.last_yield_processed_at || null,
    gross_yield_amount: Number(existingRecord?.gross_yield_amount || 0),
    withholding_tax_amount: Number(existingRecord?.withholding_tax_amount || 0),
    net_yield_amount: Number(existingRecord?.net_yield_amount || 0),
    note: parseOptionalString(payload.note) || existingRecord?.note || null
  };
};

export const listJarActualBalances = async (userId) => {
  const jarActualBalances = await JarActualBalance.find({ user_id: userId })
    .sort({ month: -1, jar_key: 1, updated_at: -1 })
    .lean();

  return {
    message: 'Jar actual balances loaded successfully.',
    data: jarActualBalances
  };
};

export const createJarActualBalance = async (userId, payload) => {
  const jarActualBalancePayload = await buildJarActualBalancePayload(userId, payload, null);

  const existingJarActualBalance = await JarActualBalance.findOne({
    user_id: userId,
    month: jarActualBalancePayload.month,
    jar_id: jarActualBalancePayload.jar_id
  });

  if (existingJarActualBalance) {
    throw new Error('An actual balance already exists for this jar in the selected month.');
  }

  const jarActualBalance = await JarActualBalance.create(jarActualBalancePayload);

  return {
    message: 'Jar actual balance created successfully.',
    data: jarActualBalance.toObject()
  };
};

export const updateJarActualBalance = async (userId, jarActualBalanceId, payload) => {
  requireObjectId(jarActualBalanceId, 'jarActualBalanceId');

  const existingJarActualBalance = await JarActualBalance.findOne({
    _id: jarActualBalanceId,
    user_id: userId
  });

  if (!existingJarActualBalance) {
    throw new Error('Jar actual balance not found.');
  }

  const jarActualBalancePayload = await buildJarActualBalancePayload(
    userId,
    payload,
    existingJarActualBalance
  );
  const conflictingJarActualBalance = await JarActualBalance.findOne({
    _id: { $ne: jarActualBalanceId },
    user_id: userId,
    month: jarActualBalancePayload.month,
    jar_id: jarActualBalancePayload.jar_id
  });

  if (conflictingJarActualBalance) {
    throw new Error('An actual balance already exists for this jar in the selected month.');
  }

  const jarActualBalance = await JarActualBalance.findOneAndUpdate(
    {
      _id: jarActualBalanceId,
      user_id: userId
    },
    { $set: jarActualBalancePayload },
    {
      new: true,
      runValidators: true
    }
  ).lean();

  return {
    message: 'Jar actual balance updated successfully.',
    data: jarActualBalance
  };
};

export const deleteJarActualBalance = async (userId, jarActualBalanceId) => {
  requireObjectId(jarActualBalanceId, 'jarActualBalanceId');

  const jarActualBalance = await JarActualBalance.findOneAndDelete({
    _id: jarActualBalanceId,
    user_id: userId
  }).lean();

  if (!jarActualBalance) {
    throw new Error('Jar actual balance not found.');
  }

  return {
    message: 'Jar actual balance deleted successfully.',
    data: {
      _id: jarActualBalance._id
    }
  };
};

export const triggerDailyYield = async (userId, payload) => runDailyYield({ userId, ...(payload || {}) });
