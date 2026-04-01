import { Transaction } from '../models/index.js';
import {
  parseOptionalString,
  requireDate,
  requireDemoUser,
  requireMonth,
  requireNumber,
  requireObjectId,
  requireString,
  resolveJarByKey
} from './mvpDataService.js';

const buildTransactionPayload = async (userId, payload) => {
  const jar = payload.jar_key ? await resolveJarByKey(userId, payload.jar_key) : null;

  return {
    user_id: userId,
    jar_id: jar?._id || null,
    jar_key: jar?.jar_key || null,
    month: requireMonth(payload.month),
    transaction_date: requireDate(payload.transaction_date, 'transaction_date'),
    amount: requireNumber(payload.amount, 'amount'),
    currency: payload.currency?.trim() || 'VND',
    direction: requireString(payload.direction, 'direction'),
    description: requireString(payload.description, 'description'),
    source: parseOptionalString(payload.source) || 'manual',
    external_row_ref: parseOptionalString(payload.external_row_ref) || null,
    notes: parseOptionalString(payload.notes) || null
  };
};

export const listTransactions = async () => {
  const user = await requireDemoUser();
  const transactions = await Transaction.find({ user_id: user._id })
    .sort({ transaction_date: -1, created_at: -1 })
    .lean();

  return {
    message: 'Transactions loaded successfully.',
    data: transactions
  };
};

export const createTransaction = async (payload) => {
  const user = await requireDemoUser();
  const transactionPayload = await buildTransactionPayload(user._id, payload);
  const transaction = await Transaction.create(transactionPayload);

  return {
    message: 'Transaction created successfully.',
    data: transaction.toObject()
  };
};

export const updateTransaction = async (transactionId, payload) => {
  const user = await requireDemoUser();
  requireObjectId(transactionId, 'transactionId');

  const existingTransaction = await Transaction.findOne({
    _id: transactionId,
    user_id: user._id
  });

  if (!existingTransaction) {
    throw new Error('Transaction not found.');
  }

  const transactionPayload = await buildTransactionPayload(user._id, payload);

  const transaction = await Transaction.findOneAndUpdate(
    {
      _id: transactionId,
      user_id: user._id
    },
    { $set: transactionPayload },
    {
      new: true,
      runValidators: true
    }
  ).lean();

  return {
    message: 'Transaction updated successfully.',
    data: transaction
  };
};

export const deleteTransaction = async (transactionId) => {
  const user = await requireDemoUser();
  requireObjectId(transactionId, 'transactionId');

  const transaction = await Transaction.findOneAndDelete({
    _id: transactionId,
    user_id: user._id
  }).lean();

  if (!transaction) {
    throw new Error('Transaction not found.');
  }

  return {
    message: 'Transaction deleted successfully.',
    data: {
      _id: transaction._id
    }
  };
};
