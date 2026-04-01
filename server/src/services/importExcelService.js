import fs from 'fs/promises';

import {
  AIAdviceLog,
  Jar,
  JarActualBalance,
  JarAllocation,
  JarDebt,
  MonthlyIncome,
  Transaction
} from '../models/index.js';
import { ensureDemoData } from './demoSeedService.js';
import { parseWorkbookForImport } from '../utils/excel/importWorkbook.js';

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

const buildImportSummary = (fileName, normalizedData) => ({
  success: true,
  fileName,
  detectedSheets: normalizedData.detectedSheets,
  inserted: {
    monthly_incomes: 0,
    jar_allocations: 0,
    transactions: 0,
    jar_debts: 0
  },
  skipped: normalizedData.skipped,
  warnings: [...normalizedData.warnings],
  errors: [...normalizedData.errors]
});

export const resetImportedData = async () => {
  const user = await ensureDemoData();

  const [monthlyIncomes, jarAllocations, jarActualBalances, transactions, jarDebts, aiAdviceLogs] =
    await Promise.all([
      MonthlyIncome.deleteMany({ user_id: user._id }),
      JarAllocation.deleteMany({ user_id: user._id }),
      JarActualBalance.deleteMany({ user_id: user._id }),
      Transaction.deleteMany({ user_id: user._id }),
      JarDebt.deleteMany({ user_id: user._id }),
      AIAdviceLog.deleteMany({ user_id: user._id })
    ]);

  return {
    success: true,
    message: 'Existing finance data was cleared successfully.',
    deleted: {
      monthly_incomes: monthlyIncomes.deletedCount,
      jar_allocations: jarAllocations.deletedCount,
      jar_actual_balances: jarActualBalances.deletedCount,
      transactions: transactions.deletedCount,
      jar_debts: jarDebts.deletedCount,
      ai_advice_logs: aiAdviceLogs.deletedCount
    },
    preserved: ['users', 'jars']
  };
};

export const reclassifyImportedTransactions = async () => {
  const user = await ensureDemoData();
  const transactions = await Transaction.find({
    user_id: user._id,
    direction: 'expense'
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
        { _id: transaction._id, user_id: user._id },
        {
          $set: {
            category: transaction.category || 'uncategorized'
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

export const importExcelWorkbook = async (file) => {
  if (!file) {
    throw new Error('Excel file is required.');
  }

  const normalizedData = parseWorkbookForImport(file.path);
  const importSummary = buildImportSummary(file.originalname, normalizedData);
  const classificationResult = await classifyImportedTransactions(normalizedData.transactions);
  normalizedData.transactions = classificationResult.transactions;
  importSummary.warnings.push(...classificationResult.warnings);
  const user = await ensureDemoData();
  const jars = await Jar.find({ user_id: user._id }).lean();
  const jarMap = new Map(jars.map((jar) => [jar.jar_key, jar]));
  const monthlyIncomeMap = new Map();

  try {
    for (const monthlyIncomeItem of normalizedData.monthlyIncomes) {
      if (monthlyIncomeMap.has(monthlyIncomeItem.month)) {
        importSummary.skipped += 1;
        importSummary.warnings.push(
          `Skipped duplicate monthly income for ${monthlyIncomeItem.month} inside the workbook.`
        );
        continue;
      }

      const existingMonthlyIncome = await MonthlyIncome.findOne({
        user_id: user._id,
        month: monthlyIncomeItem.month
      });

      if (existingMonthlyIncome) {
        monthlyIncomeMap.set(monthlyIncomeItem.month, existingMonthlyIncome);
        importSummary.skipped += 1;
        importSummary.warnings.push(
          `Monthly income for ${monthlyIncomeItem.month} already existed and was reused.`
        );
        continue;
      }

      const createdMonthlyIncome = await MonthlyIncome.create({
        user_id: user._id,
        month: monthlyIncomeItem.month,
        total_amount: monthlyIncomeItem.total_amount,
        currency: 'VND',
        income_date: monthlyIncomeItem.income_date,
        source_note: monthlyIncomeItem.source_note
      });

      monthlyIncomeMap.set(monthlyIncomeItem.month, createdMonthlyIncome);
      importSummary.inserted.monthly_incomes += 1;
    }

    for (const jarAllocationItem of normalizedData.jarAllocations) {
      const monthlyIncome = monthlyIncomeMap.get(jarAllocationItem.month);
      const jar = jarMap.get(jarAllocationItem.jar_key);

      if (!monthlyIncome || !jar) {
        importSummary.skipped += 1;
        importSummary.warnings.push(
          `Skipped jar allocation for ${jarAllocationItem.jar_key} in ${jarAllocationItem.month}.`
        );
        continue;
      }

      const existingJarAllocation = await JarAllocation.findOne({
        user_id: user._id,
        monthly_income_id: monthlyIncome._id,
        jar_id: jar._id
      });

      if (existingJarAllocation) {
        importSummary.skipped += 1;
        continue;
      }

      await JarAllocation.create({
        user_id: user._id,
        monthly_income_id: monthlyIncome._id,
        jar_id: jar._id,
        jar_key: jar.jar_key,
        month: monthlyIncome.month,
        allocated_amount: jarAllocationItem.allocated_amount,
        allocation_percentage: jarAllocationItem.allocation_percentage,
        note: jarAllocationItem.note
      });

      importSummary.inserted.jar_allocations += 1;
    }

    for (const transactionItem of normalizedData.transactions) {
      const jar = transactionItem.jar_key ? jarMap.get(transactionItem.jar_key) : null;
      const existingTransaction = await Transaction.findOne({
        user_id: user._id,
        source: 'excel_import',
        external_row_ref: transactionItem.external_row_ref
      });

      if (existingTransaction) {
        importSummary.skipped += 1;
        continue;
      }

      await Transaction.create({
        user_id: user._id,
        jar_id: jar?._id || null,
        jar_key: jar?.jar_key || null,
        month: transactionItem.month,
        transaction_date: transactionItem.transaction_date,
        amount: transactionItem.amount,
        currency: 'VND',
        direction: transactionItem.direction || 'expense',
        category: transactionItem.category || 'uncategorized',
        description: transactionItem.description,
        source: 'excel_import',
        external_row_ref: transactionItem.external_row_ref,
        notes: transactionItem.notes
      });

      importSummary.inserted.transactions += 1;
    }

    for (const jarDebtItem of normalizedData.jarDebts) {
      const fromJar = jarMap.get(jarDebtItem.from_jar_key);
      const toJar = jarMap.get(jarDebtItem.to_jar_key);

      if (!fromJar || !toJar) {
        importSummary.skipped += 1;
        importSummary.warnings.push(
          `Skipped debt row because jar mapping failed for ${jarDebtItem.from_jar_key} -> ${jarDebtItem.to_jar_key}.`
        );
        continue;
      }

      const existingJarDebt = await JarDebt.findOne({
        user_id: user._id,
        from_jar_key: jarDebtItem.from_jar_key,
        to_jar_key: jarDebtItem.to_jar_key,
        month: jarDebtItem.month,
        amount: jarDebtItem.amount,
        debt_date: jarDebtItem.debt_date
      });

      if (existingJarDebt) {
        importSummary.skipped += 1;
        continue;
      }

      await JarDebt.create({
        user_id: user._id,
        from_jar_id: fromJar._id,
        from_jar_key: fromJar.jar_key,
        to_jar_id: toJar._id,
        to_jar_key: toJar.jar_key,
        month: jarDebtItem.month,
        amount: jarDebtItem.amount,
        debt_date: jarDebtItem.debt_date,
        status: jarDebtItem.status === 'settled' ? 'settled' : 'open',
        settled_at: jarDebtItem.status === 'settled' ? jarDebtItem.debt_date : null,
        reason: jarDebtItem.reason
      });

      importSummary.inserted.jar_debts += 1;
    }

    return importSummary;
  } catch (error) {
    importSummary.success = false;
    importSummary.errors.push(error.message || 'Unexpected import error.');
    return importSummary;
  } finally {
    await fs.unlink(file.path).catch(() => undefined);
  }
};
