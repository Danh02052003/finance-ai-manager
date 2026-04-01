import { Jar, JarAllocation, JarDebt, MonthlyIncome, Transaction } from '../models/index.js';
import { getDemoUser } from './demoSeedService.js';

export const getDashboardSummary = async () => {
  const user = await getDemoUser();

  if (!user) {
    return {
      message: 'Demo user not found.',
      data: {
        user: null,
        latest_monthly_income: null,
        latest_jar_allocations: [],
        recent_transactions: [],
        open_debts: [],
        stats: {
          total_jars: 0,
          active_jars: 0,
          latest_income_total: 0,
          latest_allocation_total: 0,
          recent_transaction_total: 0,
          open_debt_total: 0,
          recent_transaction_count: 0,
          open_debt_count: 0
        }
      }
    };
  }

  const [totalJars, activeJars, latestMonthlyIncome, recentTransactions, openDebts] =
    await Promise.all([
      Jar.countDocuments({ user_id: user._id }),
      Jar.countDocuments({ user_id: user._id, is_active: true }),
      MonthlyIncome.findOne({ user_id: user._id }).sort({ month: -1 }).lean(),
      Transaction.find({ user_id: user._id })
        .sort({ transaction_date: -1, created_at: -1 })
        .limit(5)
        .lean(),
      JarDebt.find({ user_id: user._id, status: 'open' })
        .sort({ debt_date: -1, created_at: -1 })
        .limit(5)
        .lean()
    ]);

  const latestJarAllocations = latestMonthlyIncome
    ? await JarAllocation.find({
        user_id: user._id,
        month: latestMonthlyIncome.month
      })
        .sort({ jar_key: 1 })
        .lean()
    : [];

  const latestAllocationTotal = latestJarAllocations.reduce(
    (total, item) => total + (item.allocated_amount || 0),
    0
  );
  const recentTransactionTotal = recentTransactions.reduce(
    (total, item) => total + (item.amount || 0),
    0
  );
  const openDebtTotal = openDebts.reduce(
    (total, item) => total + (item.amount || 0),
    0
  );

  return {
    message: 'Dashboard data loaded successfully.',
    data: {
      user: {
        _id: user._id,
        display_name: user.display_name,
        email: user.email,
        base_currency: user.base_currency
      },
      latest_monthly_income: latestMonthlyIncome,
      latest_jar_allocations: latestJarAllocations,
      recent_transactions: recentTransactions,
      open_debts: openDebts,
      stats: {
        total_jars: totalJars,
        active_jars: activeJars,
        latest_income_total: latestMonthlyIncome?.total_amount || 0,
        latest_allocation_total: latestAllocationTotal,
        recent_transaction_total: recentTransactionTotal,
        open_debt_total: openDebtTotal,
        recent_transaction_count: recentTransactions.length,
        open_debt_count: openDebts.length
      }
    }
  };
};
