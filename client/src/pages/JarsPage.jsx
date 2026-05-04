import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  getJarActualBalances,
  getJarAllocations,
  getJars,
  getMonthlyIncomes,
  getTransactions
} from '../api/dashboardApi.js';
import JarCard from '../components/JarCard.jsx';
import { formatCurrency } from '../components/formatters.js';
import {
  getActualBalanceMapByMonth,
  getPreviousActualBalanceMonth,
  sumActualBalanceMonth
} from '../utils/actualBalanceSnapshots.js';

const defaultJars = [
  { jar_key: 'essentials', display_name_vi: 'Hũ chi tiêu cần thiết', display_order: 1, target_percentage: null, is_active: true },
  { jar_key: 'long_term_saving', display_name_vi: 'Tiết kiệm dài hạn', display_order: 2, target_percentage: null, is_active: true },
  { jar_key: 'education', display_name_vi: 'Quỹ Giáo Dục', display_order: 3, target_percentage: null, is_active: true },
  { jar_key: 'enjoyment', display_name_vi: 'Hưởng thụ', display_order: 4, target_percentage: null, is_active: true },
  { jar_key: 'financial_freedom', display_name_vi: 'Quỹ tự do tài chính', display_order: 5, target_percentage: null, is_active: true },
  { jar_key: 'charity', display_name_vi: 'Quỹ từ thiện', display_order: 6, target_percentage: null, is_active: true }
];

const getMonthMetrics = (selectedMonth) => {
  if (!selectedMonth) {
    return null;
  }

  const [yearValue, monthValue] = selectedMonth.split('-').map(Number);

  if (!yearValue || !monthValue) {
    return null;
  }

  const now = new Date();
  const todayMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const daysInMonth = new Date(yearValue, monthValue, 0).getDate();

  if (selectedMonth === todayMonth) {
    return {
      daysInMonth,
      daysElapsed: now.getDate(),
      daysRemaining: Math.max(1, daysInMonth - now.getDate() + 1)
    };
  }

  if (selectedMonth < todayMonth) {
    return { daysInMonth, daysElapsed: daysInMonth, daysRemaining: 0 };
  }

  return { daysInMonth, daysElapsed: 0, daysRemaining: daysInMonth };
};

const JarsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [jars, setJars] = useState(defaultJars);
  const [monthlyIncomes, setMonthlyIncomes] = useState([]);
  const [jarAllocations, setJarAllocations] = useState([]);
  const [actualBalances, setActualBalances] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadJars = async () => {
      try {
        const [jarResponse, incomeResponse, allocationResponse, actualBalanceResponse, transactionResponse] =
          await Promise.all([
            getJars(),
            getMonthlyIncomes(),
            getJarAllocations(),
            getJarActualBalances(),
            getTransactions()
          ]);

        if (Array.isArray(jarResponse.data) && jarResponse.data.length > 0) {
          setJars(jarResponse.data);
        }
        const loadedIncomes = Array.isArray(incomeResponse.data) ? incomeResponse.data : [];
        const loadedAllocations = Array.isArray(allocationResponse.data) ? allocationResponse.data : [];
        const loadedActualBalances = Array.isArray(actualBalanceResponse.data) ? actualBalanceResponse.data : [];
        const loadedTransactions = Array.isArray(transactionResponse.data) ? transactionResponse.data : [];
        setMonthlyIncomes(loadedIncomes);
        setJarAllocations(loadedAllocations);
        setActualBalances(loadedActualBalances);
        setTransactions(loadedTransactions);
        setSelectedMonth(
          (currentMonth) =>
            currentMonth ||
            loadedIncomes[0]?.month ||
            loadedAllocations[0]?.month ||
            loadedActualBalances[0]?.month ||
            loadedTransactions[0]?.month ||
            ''
        );
        setError('');
      } catch (requestError) {
        setError(t('jars.defaultConfigWarning', 'Đang hiển thị cấu hình 6 hũ mặc định.'));
      }
    };

    loadJars();
  }, []);

  const availableMonths = useMemo(
    () =>
      Array.from(
        new Set([
          ...monthlyIncomes.map((item) => item.month),
          ...jarAllocations.map((item) => item.month),
          ...actualBalances.map((item) => item.month),
          ...transactions.map((item) => item.month)
        ].filter(Boolean))
      ).sort().reverse(),
    [actualBalances, jarAllocations, monthlyIncomes, transactions]
  );

  const selectedMonthAllocations = jarAllocations.filter((item) => item.month === selectedMonth);
  const selectedMonthTransactions = transactions.filter((item) => item.month === selectedMonth);
  const allocationByJar = new Map(selectedMonthAllocations.map((item) => [item.jar_key, item]));
  const spentByJar = selectedMonthTransactions.reduce((accumulator, item) => {
    if (!item.jar_key || item.direction !== 'expense') return accumulator;
    accumulator[item.jar_key] = (accumulator[item.jar_key] || 0) + (item.amount || 0);
    return accumulator;
  }, {});
  const positiveAdjustmentsByJar = selectedMonthTransactions.reduce((accumulator, item) => {
    if (!item.jar_key || item.direction !== 'income_adjustment') return accumulator;
    accumulator[item.jar_key] = (accumulator[item.jar_key] || 0) + (item.amount || 0);
    return accumulator;
  }, {});
  const selectedMonthAllocationTotal = selectedMonthAllocations.reduce((sum, item) => sum + (item.allocated_amount || 0), 0);
  const selectedMonthSpentTotal = selectedMonthTransactions.reduce((sum, item) => sum + (item.direction === 'expense' ? item.amount || 0 : 0), 0);

  const selectedMonthIncome = monthlyIncomes.find((item) => item.month === selectedMonth)?.total_amount || 0;
  const selectedMonthLabel = selectedMonth || t('jars.unselected', 'Chưa chọn');
  const monthMetrics = getMonthMetrics(selectedMonth);
  const previousSnapshotMonth = getPreviousActualBalanceMonth(actualBalances, selectedMonth);
  const previousActualBalanceMap = getActualBalanceMapByMonth(actualBalances, previousSnapshotMonth);
  const previousActualBalanceTotal = sumActualBalanceMonth(actualBalances, previousSnapshotMonth);

  const handleViewJarHistory = (jar) => {
    const params = new URLSearchParams({ jar: jar.jar_key });
    if (selectedMonth) params.set('month', selectedMonth);
    navigate(`/transactions?${params.toString()}`);
  };

  return (
    <div className="space-y-5" id="jars-overview" data-assistant-target="jars-overview">


      <section id="jars-summary" data-assistant-target="jars-summary" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <label className="rounded-2xl border border-indigo-500/15 bg-indigo-500/[0.06] p-4 cursor-pointer hover:bg-indigo-500/[0.1] transition-colors relative">
          <p className="text-[11px] font-medium uppercase tracking-wider text-indigo-400/70">{t('jars.monthPeriod', 'Kỳ tháng')}</p>
          <select
            aria-label={t('jars.selectMonth', 'Chọn tháng')}
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="mt-2 w-full bg-transparent text-2xl font-bold tabular-nums text-white outline-none cursor-pointer appearance-none"
          >
            {availableMonths.length > 0 ? (
              availableMonths.map((month) => <option key={month} value={month} className="text-slate-900 text-base">{month}</option>)
            ) : (
              <option value="" className="text-slate-900 text-base">{t('jars.empty', 'Trống')}</option>
            )}
          </select>
          <div className="pointer-events-none absolute right-4 bottom-5 text-indigo-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </label>
        <article className="rounded-2xl border border-white/[0.06] bg-(--surface-strong) p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{t('jars.income', 'Thu nhập')}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-white">{formatCurrency(selectedMonthIncome)}</p>
        </article>
        <article className="rounded-2xl border border-white/[0.06] bg-(--surface-strong) p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{t('jars.allocation', 'Phân bổ')}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-white">{formatCurrency(selectedMonthAllocationTotal)}</p>
        </article>
        <article className="rounded-2xl border border-white/[0.06] bg-(--surface-strong) p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{t('jars.spent', 'Đã chi')}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-white">{formatCurrency(selectedMonthSpentTotal)}</p>
        </article>

        <article className="rounded-2xl border border-sky-500/15 bg-sky-500/[0.06] p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-sky-400/70">{t('jars.reserved', 'Giữ riêng')}</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="text-2xl font-bold tabular-nums text-white">{previousSnapshotMonth ? formatCurrency(previousActualBalanceTotal) : '--'}</p>
            <p className="text-[11px] whitespace-nowrap text-sky-400/50">{previousSnapshotMonth ? `${t('jars.from', 'Từ')} ${previousSnapshotMonth}` : ''}</p>
          </div>
        </article>
      </section>

      {error ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{error}</div>
      ) : null}



      <section id="jars-cards" data-assistant-target="jars-cards" className="grid gap-4 xl:grid-cols-2">
        {jars.map((jar) => {
          const monthlyAllocation = allocationByJar.get(jar.jar_key)?.allocated_amount || 0;
          const spentAmount = spentByJar[jar.jar_key] || 0;
          const positiveAdjustments = positiveAdjustmentsByJar[jar.jar_key] || 0;
          const effectiveAvailableAmount = monthlyAllocation + positiveAdjustments;
          const remainingAmount = effectiveAvailableAmount - spentAmount;
          const suggestedDailyBudget =
            monthMetrics && monthMetrics.daysRemaining > 0
              ? Math.max(0, Math.floor(remainingAmount / monthMetrics.daysRemaining))
              : 0;
          const expectedSpendToDate =
            monthMetrics && monthMetrics.daysInMonth > 0
              ? Math.round((effectiveAvailableAmount * monthMetrics.daysElapsed) / monthMetrics.daysInMonth)
              : 0;
          const overspendAmount = Math.max(0, spentAmount - expectedSpendToDate);
          const baseDailyRate =
            monthMetrics && monthMetrics.daysInMonth > 0
              ? Math.max(1, Math.floor(Math.max(effectiveAvailableAmount, 0) / monthMetrics.daysInMonth))
              : 0;
          const overspendDays = overspendAmount > 0 && baseDailyRate > 0 ? Math.ceil(overspendAmount / baseDailyRate) : 0;
          const previousActualBalance = previousActualBalanceMap.get(jar.jar_key)?.actual_balance_amount;
          const currentMonthPercentage = allocationByJar.get(jar.jar_key)?.allocation_percentage ?? jar.target_percentage;

          return (
            <JarCard
              key={jar.jar_key}
              jar={jar}
              amount={monthlyAllocation}
              spentAmount={spentAmount}
              remainingAmount={remainingAmount}
              reserveAmount={typeof previousActualBalance === 'number' ? previousActualBalance : null}
              reserveLabel={previousSnapshotMonth ? `${t('jars.reserved', 'Giữ riêng')} ${previousSnapshotMonth}` : ''}
              monthLabel={selectedMonthLabel}
              dailyBudgetLabel={
                monthMetrics
                  ? monthMetrics.daysRemaining > 0
                    ? t('jars.suggestedDaily', { budget: formatCurrency(suggestedDailyBudget), days: monthMetrics.daysRemaining })
                    : t('jars.monthEnded', { spent: formatCurrency(spentAmount) })
                  : ''
              }
              warningLabel={
                overspendAmount > 0
                  ? t('jars.overspendWarning', { amount: formatCurrency(overspendAmount), days: overspendDays })
                  : ''
              }
              percentage={currentMonthPercentage}
              deltaLabel={
                allocationByJar.get(jar.jar_key)
                  ? positiveAdjustments > 0
                    ? t('jars.deltaAdjusted', { allocated: formatCurrency(monthlyAllocation), adjusted: formatCurrency(positiveAdjustments) })
                    : t('jars.deltaMonth', { month: selectedMonthLabel })
                  : t('jars.deltaNone', 'Chưa có phân bổ tháng này')
              }
              onPrimaryAction={handleViewJarHistory}
              i18n={i18n}
            />
          );
        })}
      </section>
    </div>
  );
};

export default JarsPage;
