import { JarAllocation } from '../models/index.js';
import {
  parseOptionalString,
  requireDemoUser,
  requireNumber,
  requireObjectId,
  resolveJarByKey,
  resolveMonthlyIncome
} from './mvpDataService.js';

const buildJarAllocationPayload = async (userId, payload) => {
  const monthlyIncome = await resolveMonthlyIncome(userId, payload.monthly_income_id);
  const jar = await resolveJarByKey(userId, payload.jar_key);

  return {
    user_id: userId,
    monthly_income_id: monthlyIncome._id,
    jar_id: jar._id,
    jar_key: jar.jar_key,
    month: monthlyIncome.month,
    allocated_amount: requireNumber(payload.allocated_amount, 'allocated_amount'),
    allocation_percentage:
      payload.allocation_percentage === '' || payload.allocation_percentage == null
        ? null
        : requireNumber(payload.allocation_percentage, 'allocation_percentage'),
    note: parseOptionalString(payload.note) || null
  };
};

export const listJarAllocations = async () => {
  const user = await requireDemoUser();
  const jarAllocations = await JarAllocation.find({ user_id: user._id })
    .sort({ month: -1, jar_key: 1, created_at: -1 })
    .lean();

  return {
    message: 'Jar allocations loaded successfully.',
    data: jarAllocations
  };
};

export const createJarAllocation = async (payload) => {
  const user = await requireDemoUser();
  const jarAllocationPayload = await buildJarAllocationPayload(user._id, payload);

  const existingJarAllocation = await JarAllocation.findOne({
    user_id: user._id,
    monthly_income_id: jarAllocationPayload.monthly_income_id,
    jar_id: jarAllocationPayload.jar_id
  });

  if (existingJarAllocation) {
    throw new Error('A jar allocation already exists for this jar in the selected month.');
  }

  const jarAllocation = await JarAllocation.create(jarAllocationPayload);

  return {
    message: 'Jar allocation created successfully.',
    data: jarAllocation.toObject()
  };
};

export const updateJarAllocation = async (jarAllocationId, payload) => {
  const user = await requireDemoUser();
  requireObjectId(jarAllocationId, 'jarAllocationId');

  const existingJarAllocation = await JarAllocation.findOne({
    _id: jarAllocationId,
    user_id: user._id
  });

  if (!existingJarAllocation) {
    throw new Error('Jar allocation not found.');
  }

  const jarAllocationPayload = await buildJarAllocationPayload(user._id, payload);
  const conflictingJarAllocation = await JarAllocation.findOne({
    _id: { $ne: jarAllocationId },
    user_id: user._id,
    monthly_income_id: jarAllocationPayload.monthly_income_id,
    jar_id: jarAllocationPayload.jar_id
  });

  if (conflictingJarAllocation) {
    throw new Error('A jar allocation already exists for this jar in the selected month.');
  }

  const jarAllocation = await JarAllocation.findOneAndUpdate(
    {
      _id: jarAllocationId,
      user_id: user._id
    },
    { $set: jarAllocationPayload },
    {
      new: true,
      runValidators: true
    }
  ).lean();

  return {
    message: 'Jar allocation updated successfully.',
    data: jarAllocation
  };
};

export const deleteJarAllocation = async (jarAllocationId) => {
  const user = await requireDemoUser();
  requireObjectId(jarAllocationId, 'jarAllocationId');

  const jarAllocation = await JarAllocation.findOneAndDelete({
    _id: jarAllocationId,
    user_id: user._id
  }).lean();

  if (!jarAllocation) {
    throw new Error('Jar allocation not found.');
  }

  return {
    message: 'Jar allocation deleted successfully.',
    data: {
      _id: jarAllocation._id
    }
  };
};
