import { JarActualBalance } from '../models/index.js';
import {
  parseOptionalString,
  requireMoneyInput,
  requireMonth,
  requireObjectId,
  resolveJarByKey
} from './mvpDataService.js';

const buildJarActualBalancePayload = async (userId, payload, existingRecord = null) => {
  const month = requireMonth(payload.month);
  const jar = await resolveJarByKey(userId, payload.jar_key);

  return {
    user_id: userId,
    jar_id: jar._id,
    jar_key: jar.jar_key,
    month,
    actual_balance_amount: requireMoneyInput(
      payload.actual_balance_amount ?? existingRecord?.actual_balance_amount ?? 0,
      'actual_balance_amount'
    ),
    note: parseOptionalString(payload.note) || existingRecord?.note || null
  };
};

export const ensureJarActualBalanceRecord = async (
  userId,
  { jar_key, month, initialAmount = 0 }
) => {
  const jar = await resolveJarByKey(userId, jar_key);

  if (!jar) {
    throw new Error('jar_key does not match an existing jar.');
  }

  const existingRecord = await JarActualBalance.findOne({
    user_id: userId,
    jar_id: jar._id,
    month
  });

  if (existingRecord) {
    return existingRecord;
  }

  return JarActualBalance.create({
    user_id: userId,
    jar_id: jar._id,
    jar_key: jar.jar_key,
    month,
    actual_balance_amount: initialAmount,
    note: null
  });
};

export const applyTransactionImpactToActualBalance = async (
  userId,
  transactionPayload,
  factor = 1
) => {
  if (!transactionPayload?.jar_key || !transactionPayload?.month) {
    return null;
  }

  let deltaAmount = 0;

  if (transactionPayload.direction === 'expense') {
    deltaAmount = -Number(transactionPayload.amount || 0) * factor;
  } else if (transactionPayload.direction === 'income_adjustment') {
    deltaAmount = Number(transactionPayload.amount || 0) * factor;
  }

  if (!deltaAmount) {
    return ensureJarActualBalanceRecord(userId, {
      jar_key: transactionPayload.jar_key,
      month: transactionPayload.month
    });
  }

  const actualBalance = await ensureJarActualBalanceRecord(userId, {
    jar_key: transactionPayload.jar_key,
    month: transactionPayload.month
  });

  actualBalance.actual_balance_amount += deltaAmount;
  await actualBalance.save();

  return actualBalance;
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
