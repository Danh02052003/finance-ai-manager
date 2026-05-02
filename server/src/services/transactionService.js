import { Transaction } from '../models/index.js';
import { TRANSACTION_CATEGORIES, TRANSACTION_DIRECTIONS } from '../models/constants.js';
import {
  parseOptionalString,
  requireDate,
  requireMonth,
  requireNumber,
  requireMoneyInput,
  requireObjectId,
  requireString,
  resolveJarByKey
} from './mvpDataService.js';
import { applyTransactionImpactToActualBalance } from './jarActualBalanceService.js';

const getAiServiceBaseUrl = () => process.env.AI_SERVICE_BASE_URL || 'http://localhost:8000';

const normalizeTransactionAmount = (value) => {
  return requireMoneyInput(value, 'amount');
};

const normalizeDirection = (value) => {
  const direction = parseOptionalString(value) || 'expense';

  if (!TRANSACTION_DIRECTIONS.includes(direction)) {
    throw new Error('direction is invalid.');
  }

  return direction;
};

const normalizeCategory = (value) => {
  const category = parseOptionalString(value) || 'uncategorized';

  if (!TRANSACTION_CATEGORIES.includes(category)) {
    throw new Error('category is invalid.');
  }

  return category;
};

const classifyTransactionCategoryWithAi = async (payload) => {
  try {
    const response = await fetch(`${getAiServiceBaseUrl()}/import-ai/classify-transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [
          {
            id: 'manual-transaction',
            description: payload.description,
            jar_key: payload.jar_key,
            amount: payload.amount,
            month: payload.month,
            notes: payload.notes
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`AI service returned ${response.status}.`);
    }

    const result = await response.json();
    const category = result?.items?.[0]?.category;

    return TRANSACTION_CATEGORIES.includes(category) ? category : 'uncategorized';
  } catch {
    return 'uncategorized';
  }
};

const buildTransactionPayload = async (userId, payload) => {
  const jar = await resolveJarByKey(userId, payload.jar_key || 'essentials');
  const description = requireString(payload.description, 'description');
  const notes = parseOptionalString(payload.notes) || null;
  const normalizedCategory = normalizeCategory(payload.category);
  let category = normalizedCategory;
  let isAiClassified = payload.is_ai_classified === true;

  if (normalizedCategory === 'uncategorized') {
    const aiCategory = await classifyTransactionCategoryWithAi({
      description,
      jar_key: jar?.jar_key || null,
      amount: payload.amount,
      month: payload.month,
      notes
    });
    
    if (aiCategory !== 'uncategorized') {
      category = aiCategory;
      isAiClassified = true;
    }
  }

  return {
    user_id: userId,
    jar_id: jar?._id || null,
    jar_key: jar?.jar_key || null,
    month: requireMonth(payload.month),
    transaction_date: requireDate(payload.transaction_date, 'transaction_date'),
    amount: normalizeTransactionAmount(payload.amount),
    currency: payload.currency?.trim() || 'VND',
    direction: normalizeDirection(payload.direction),
    category,
    description,
    source: parseOptionalString(payload.source) || 'manual',
    external_row_ref: parseOptionalString(payload.external_row_ref) || null,
    notes,
    is_ai_classified: isAiClassified
  };
};

export const listTransactions = async (userId) => {
  const transactions = await Transaction.find({ user_id: userId })
    .sort({ transaction_date: -1, created_at: -1 })
    .lean();

  return {
    message: 'Transactions loaded successfully.',
    data: transactions
  };
};

export const createTransaction = async (userId, payload) => {
  const transactionPayload = await buildTransactionPayload(userId, payload);
  const transaction = await Transaction.create(transactionPayload);
  await applyTransactionImpactToActualBalance(userId, transactionPayload, 1);

  return {
    message: 'Transaction created successfully.',
    data: transaction.toObject()
  };
};

export const updateTransaction = async (userId, transactionId, payload) => {
  requireObjectId(transactionId, 'transactionId');

  const existingTransaction = await Transaction.findOne({
    _id: transactionId,
    user_id: userId
  });

  if (!existingTransaction) {
    throw new Error('Transaction not found.');
  }

  const transactionPayload = await buildTransactionPayload(userId, payload);

  const transaction = await Transaction.findOneAndUpdate(
    {
      _id: transactionId,
      user_id: userId
    },
    { $set: transactionPayload },
    {
      new: true,
      runValidators: true
    }
  ).lean();

  await applyTransactionImpactToActualBalance(userId, existingTransaction, -1);
  await applyTransactionImpactToActualBalance(userId, transactionPayload, 1);

  return {
    message: 'Transaction updated successfully.',
    data: transaction
  };
};

export const deleteTransaction = async (userId, transactionId) => {
  requireObjectId(transactionId, 'transactionId');

  const transaction = await Transaction.findOneAndDelete({
    _id: transactionId,
    user_id: userId
  }).lean();

  if (!transaction) {
    throw new Error('Transaction not found.');
  }

  await applyTransactionImpactToActualBalance(userId, transaction, -1);

  return {
    message: 'Transaction deleted successfully.',
    data: {
      _id: transaction._id
    }
  };
};
