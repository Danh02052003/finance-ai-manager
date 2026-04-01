import { JarActualBalance } from '../models/index.js';
import {
  parseOptionalString,
  requireDemoUser,
  requireMoneyInput,
  requireMonth,
  requireObjectId,
  resolveJarByKey
} from './mvpDataService.js';

const buildJarActualBalancePayload = async (userId, payload) => {
  const month = requireMonth(payload.month);
  const jar = await resolveJarByKey(userId, payload.jar_key);

  return {
    user_id: userId,
    jar_id: jar._id,
    jar_key: jar.jar_key,
    month,
    actual_balance_amount: requireMoneyInput(payload.actual_balance_amount, 'actual_balance_amount'),
    note: parseOptionalString(payload.note) || null
  };
};

export const listJarActualBalances = async () => {
  const user = await requireDemoUser();
  const jarActualBalances = await JarActualBalance.find({ user_id: user._id })
    .sort({ month: -1, jar_key: 1, updated_at: -1 })
    .lean();

  return {
    message: 'Jar actual balances loaded successfully.',
    data: jarActualBalances
  };
};

export const createJarActualBalance = async (payload) => {
  const user = await requireDemoUser();
  const jarActualBalancePayload = await buildJarActualBalancePayload(user._id, payload);

  const existingJarActualBalance = await JarActualBalance.findOne({
    user_id: user._id,
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

export const updateJarActualBalance = async (jarActualBalanceId, payload) => {
  const user = await requireDemoUser();
  requireObjectId(jarActualBalanceId, 'jarActualBalanceId');

  const existingJarActualBalance = await JarActualBalance.findOne({
    _id: jarActualBalanceId,
    user_id: user._id
  });

  if (!existingJarActualBalance) {
    throw new Error('Jar actual balance not found.');
  }

  const jarActualBalancePayload = await buildJarActualBalancePayload(user._id, payload);
  const conflictingJarActualBalance = await JarActualBalance.findOne({
    _id: { $ne: jarActualBalanceId },
    user_id: user._id,
    month: jarActualBalancePayload.month,
    jar_id: jarActualBalancePayload.jar_id
  });

  if (conflictingJarActualBalance) {
    throw new Error('An actual balance already exists for this jar in the selected month.');
  }

  const jarActualBalance = await JarActualBalance.findOneAndUpdate(
    {
      _id: jarActualBalanceId,
      user_id: user._id
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

export const deleteJarActualBalance = async (jarActualBalanceId) => {
  const user = await requireDemoUser();
  requireObjectId(jarActualBalanceId, 'jarActualBalanceId');

  const jarActualBalance = await JarActualBalance.findOneAndDelete({
    _id: jarActualBalanceId,
    user_id: user._id
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
