import { Transaction } from '../models/index.js';

const getAiServiceBaseUrl = () => process.env.AI_SERVICE_BASE_URL || 'http://localhost:8000';

const classifyImportedTransactions = async (transactions) => {
  if (!transactions.length) {
    return {
      provider: '',
      transactions,
      warnings: []
    };
  }

  const aiItems = transactions.map((transaction, index) => ({
    id: `t${index + 1}`,
    description: transaction.description,
    jar_key: transaction.jar_key,
    amount: transaction.amount,
    month: transaction.month,
    notes: transaction.notes
  }));

  try {
    const response = await fetch(`${getAiServiceBaseUrl()}/import-ai/classify-transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: aiItems
      })
    });

    if (!response.ok) {
      let errorMessage = `AI service returned ${response.status}.`;

      try {
        const errorPayload = await response.json();
        errorMessage = errorPayload.detail || errorPayload.message || errorMessage;
      } catch {
        // Keep fallback message when response body is not JSON.
      }

      throw new Error(errorMessage);
    }

    const payload = await response.json();
    const categoryMap = new Map((payload.items || []).map((item) => [item.id, item.category || 'uncategorized']));

    return {
      provider: payload.provider || '',
      transactions: transactions.map((transaction, index) => ({
        ...transaction,
        category: categoryMap.get(`t${index + 1}`) || 'uncategorized'
      })),
      warnings: []
    };
  } catch (error) {
    throw new Error(error.message || 'OpenAI classification failed during import.');
  }
};

export const reclassifyImportedTransactions = async (userId) => {
  const transactions = await Transaction.find({
    user_id: userId,
    direction: 'expense',
    category: { $in: ['uncategorized', '', null] }
  })
    .sort({ transaction_date: -1, created_at: -1 })
    .lean();

  if (!transactions.length) {
    return {
      success: true,
      message: 'No transactions found for AI reclassification.',
      provider: null,
      updated: 0
    };
  }

  const preparedTransactions = transactions.map((transaction) => ({
    ...transaction,
    external_row_ref: transaction.external_row_ref || String(transaction._id)
  }));
  const classificationResult = await classifyImportedTransactions(preparedTransactions);

  await Promise.all(
    classificationResult.transactions.map((transaction) =>
      Transaction.updateOne(
        { _id: transaction._id, user_id: userId },
        {
          $set: {
            category: transaction.category || 'uncategorized',
            is_ai_classified: transaction.category && transaction.category !== 'uncategorized'
          }
        }
      )
    )
  );

  return {
    success: true,
    message: 'Transactions were reclassified by AI successfully.',
    provider: classificationResult.provider || null,
    updated: classificationResult.transactions.length
  };
};
