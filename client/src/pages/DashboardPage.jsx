import {
  ArrowTrendingUpIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  getDashboard,
  getJarActualBalances,
  getJarAllocations,
  getJars,
  getMonthlyIncomes,
  getTransactions
} from '../api/dashboardApi.js';
import JarCardMini from '../components/JarCardMini.jsx';
import { formatCurrency, formatDate } from '../components/formatters.js';
import {
  getActualBalanceMapByMonth,
  getPreviousActualBalanceMonth,
  sumActualBalanceMonth
} from '../utils/actualBalanceSnapshots.js';

const getCurrentMonthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const formatDayTitle = (dateValue) => {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (dateValue === today) {
    return 'Hôm nay';
  }

  if (dateValue === yesterday) {
    return 'Hôm qua';
  }

  return formatDate(dateValue);
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [jars, setJars] = useState([]);
  const [monthlyIncomes, setMonthlyIncomes] = useState([]);
  const [jarAllocations, setJarAllocations] = useState([]);
  const [actualBalances, setActualBalances] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [
          dashboardResponse,
          jarResponse,
          incomeResponse,
          allocationResponse,
          actualBalanceResponse,
          transactionResponse
        ] = await Promise.all([
          getDashboard(),
          getJars(),
          getMonthlyIncomes(),
          getJarAllocations(),
          getJarActualBalances(),
          getTransactions()
        ]);

        const loadedJars = Array.isArray(jarResponse.data) ? jarResponse.data : [];
        const loadedIncomes = Array.isArray(incomeResponse.data) ? incomeResponse.data : [];
        const loadedAllocations = Array.isArray(allocationResponse.data) ? allocationResponse.data : [];
        const loadedActualBalances = Array.isArray(actualBalanceResponse.data)
          ? actualBalanceResponse.data
          : [];
        const loadedTransactions = Array.isArray(transactionResponse.data) ? transactionResponse.data : [];

        setDashboardData(dashboardResponse.data || null);
        setJars(loadedJars);
        setMonthlyIncomes(loadedIncomes);
        setJarAllocations(loadedAllocations);
        setActualBalances(loadedActualBalances);
        setTransactions(loadedTransactions);

        const availableMonths = Array.from(
          new Set([
            ...loadedIncomes.map((item) => item.month),
            ...loadedAllocations.map((item) => item.month),
            ...loadedTransactions.map((item) => item.month),
            ...loadedActualBalances.map((item) => item.month)
          ].filter(Boolean))
        ).sort().reverse();

        const currentMonth = getCurrentMonthValue();
        setSelectedMonth(
          availableMonths.includes(currentMonth) ? currentMonth : availableMonths[0] || currentMonth
        );
        setError('');
      } catch (requestError) {
        setError('Không tải được dữ liệu. Vui lòng thử lại.');
      }
    };

    loadDashboard();
  }, []);

  const availableMonths = useMemo(
    () =>
      Array.from(
        new Set([
          ...monthlyIncomes.map((item) => item.month),
          ...jarAllocations.map((item) => item.month),
          ...transactions.map((item) => item.month),
          ...actualBalances.map((item) => item.month)
        ].filter(Boolean))
      ).sort().reverse(),
    [actualBalances, jarAllocations, monthlyIncomes, transactions]
  );

  const selectedMonthIncome =
    monthlyIncomes.find((item) => item.month === selectedMonth)?.total_amount || 0;
  const selectedMonthAllocations = jarAllocations.filter((item) => item.month === selectedMonth);
  const selectedMonthTransactions = transactions.filter((item) => item.month === selectedMonth);
  const allocationByJar = new Map(selectedMonthAllocations.map((item) => [item.jar_key, item]));
  const spentByJar = selectedMonthTransactions.reduce((accumulator, item) => {
    if (!item.jar_key || item.direction !== 'expense') {
      return accumulator;
    }

    accumulator[item.jar_key] = (accumulator[item.jar_key] || 0) + (item.amount || 0);
    return accumulator;
  }, {});
  const adjustmentByJar = selectedMonthTransactions.reduce((accumulator, item) => {
    if (!item.jar_key || item.direction !== 'income_adjustment') {
      return accumulator;
    }

    accumulator[item.jar_key] = (accumulator[item.jar_key] || 0) + (item.amount || 0);
    return accumulator;
  }, {});

  const previousReserveMonth = getPreviousActualBalanceMonth(actualBalances, selectedMonth);
  const reserveMap = getActualBalanceMapByMonth(actualBalances, previousReserveMonth);
  const reserveTotal = sumActualBalanceMonth(actualBalances, previousReserveMonth);

  const jarCards = jars.map((jar) => {
    const allocatedAmount = allocationByJar.get(jar.jar_key)?.allocated_amount || 0;
    const spentAmount = spentByJar[jar.jar_key] || 0;
    const adjustmentAmount = adjustmentByJar[jar.jar_key] || 0;
    const remainingAmount = allocatedAmount + adjustmentAmount - spentAmount;
    const reserveAmount = reserveMap.get(jar.jar_key)?.actual_balance_amount || 0;

    return {
      jar,
      allocatedAmount,
      spentAmount,
      adjustmentAmount,
      remainingAmount,
      reserveAmount
    };
  });

  const totalAllocated = jarCards.reduce((sum, item) => sum + item.allocatedAmount, 0);
  const totalSpent = jarCards.reduce((sum, item) => sum + item.spentAmount, 0);
  const totalRemaining = jarCards.reduce((sum, item) => sum + item.remainingAmount, 0);

  const recentDayCards = useMemo(() => {
    const groups = selectedMonthTransactions.reduce((accumulator, item) => {
      if (item.direction !== 'expense') {
        return accumulator;
      }

      const dateKey = item.transaction_date?.slice?.(0, 10);

      if (!dateKey) {
        return accumulator;
      }

      if (!accumulator[dateKey]) {
        accumulator[dateKey] = [];
      }

      accumulator[dateKey].push(item);
      return accumulator;
    }, {});

    return Object.entries(groups)
      .map(([date, items]) => {
        const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);
        const categoryMap = items.reduce((accumulator, item) => {
          const key = item.category || 'uncategorized';
          accumulator[key] = (accumulator[key] || 0) + (item.amount || 0);
          return accumulator;
        }, {});
        const topCategory =
          Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'uncategorized';

        return {
          date,
          title: formatDayTitle(date),
          subtitle: formatDate(date),
          total,
          topCategory,
          count: items.length
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);
  }, [selectedMonthTransactions]);

  const overspentJarCount = jarCards.filter((item) => item.remainingAmount < 0).length;
  const openDebtCount = dashboardData?.stats?.open_debt_count || 0;
  const spentPercentage = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  const handleOpenJarHistory = (jar) => {
    const params = new URLSearchParams({ jar: jar.jar_key, month: selectedMonth });
    navigate(`/transactions?${params.toString()}`);
  };

  const handleOpenDayHistory = (day) => {
    const params = new URLSearchParams({ month: selectedMonth, date: day.date });
    navigate(`/transactions?${params.toString()}`);
  };

  const hasBudgetData = selectedMonthIncome > 0 || totalAllocated > 0 || totalSpent > 0;

  return (
    <div className="space-y-6" id="dashboard-home" data-assistant-target="dashboard-home">
      {error ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {error}
        </div>
      ) : null}

      {hasBudgetData ? (
        <>
          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
            <section className="rounded-2xl border border-white/[0.06] bg-(--surface-strong) p-5 sm:p-6">
              <p className="text-sm text-slate-500">Tổng dư tháng {selectedMonth}</p>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                {formatCurrency(totalRemaining)}
              </h1>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-lg bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-slate-400">
                  Thu nhập {formatCurrency(selectedMonthIncome)}
                </span>
                <span className="rounded-lg bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-slate-400">
                  Đã chi {spentPercentage}% ngân sách
                </span>
                {overspentJarCount > 0 ? (
                  <span className="rounded-lg bg-rose-500/15 px-2.5 py-1 text-xs font-medium text-rose-300">
                    {overspentJarCount} hũ vượt mức
                  </span>
                ) : (
                  <span className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
                    Các hũ trong ngưỡng
                  </span>
                )}
                {openDebtCount > 0 ? (
                  <span className="rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-300">
                    {openDebtCount} nợ đang mở
                  </span>
                ) : null}
              </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <article className="rounded-2xl border border-white/[0.06] bg-(--surface-strong) p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Phân bổ tháng
                </p>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <p className="text-2xl font-bold tabular-nums text-white">{formatCurrency(totalAllocated)}</p>
                  <p className="text-xs whitespace-nowrap text-slate-500">/ {formatCurrency(selectedMonthIncome)}</p>
                </div>
              </article>
              <article className="rounded-2xl border border-sky-500/15 bg-sky-500/[0.06] p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-sky-400/70">
                  Giữ riêng
                </p>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <p className="text-2xl font-bold tabular-nums text-white">
                    {previousReserveMonth ? formatCurrency(reserveTotal) : '--'}
                  </p>
                  <p className="text-xs whitespace-nowrap text-sky-400/70">
                    {previousReserveMonth ? `từ ${previousReserveMonth}` : ''}
                  </p>
                </div>
              </article>
            </div>
          </div>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {jarCards.map((item) => (
              <JarCardMini
                key={item.jar.jar_key}
                jar={item.jar}
                remainingAmount={item.remainingAmount}
                allocatedAmount={item.allocatedAmount}
                spentAmount={item.spentAmount}
                adjustmentAmount={item.adjustmentAmount}
                reserveAmount={item.reserveAmount}
                onClick={handleOpenJarHistory}
              />
            ))}
          </section>

          <section className="rounded-2xl border border-white/[0.06] bg-(--surface-strong) p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-white">Hoạt động gần đây</h2>
              </div>
              <Link
                to={`/transactions?month=${selectedMonth}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/[0.08]"
              >
                <ArrowTrendingUpIcon className="h-3.5 w-3.5" />
                Xem tất cả
              </Link>
            </div>

            {recentDayCards.length > 0 ? (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                {recentDayCards.map((day) => (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => handleOpenDayHistory(day)}
                    className="min-w-[200px] shrink-0 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-left transition hover:border-white/[0.12] hover:bg-white/[0.06]"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">{day.title}</p>
                      <span className="text-[11px] text-slate-500">{day.count} giao dịch</span>
                    </div>
                    <p className="mt-3 text-xl font-bold tabular-nums text-rose-300">{formatCurrency(day.total)}</p>
                    <p className="mt-1 text-xs text-slate-500">{day.topCategory}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-white/[0.08] px-4 py-8 text-center">
                <p className="text-sm text-slate-500">Chưa có giao dịch nào trong tháng này.</p>
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="rounded-2xl border border-dashed border-white/[0.1] bg-(--surface-strong) p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10">
            <CalendarDaysIcon className="h-8 w-8 text-indigo-400" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-white">Bắt đầu với kế hoạch tháng</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Hệ thống sẽ tự động phân bổ 6 hũ dựa trên thu nhập của bạn.
          </p>
          <Link
            to="/monthly-plan"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400"
          >
            <CalendarDaysIcon className="h-4 w-4" />
            Tạo kế hoạch tháng
          </Link>
        </section>
      )}
    </div>
  );
};

export default DashboardPage;
