import {
  ArrowDownTrayIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
  PlusIcon
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
        setError('Không tải được dashboard. Hãy thử lại sau.');
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
  const totalAdjustments = jarCards.reduce((sum, item) => sum + item.adjustmentAmount, 0);
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
  const allocationCompletion = selectedMonthIncome
    ? Math.round((totalAllocated / selectedMonthIncome) * 100)
    : 0;
  const insightBadges = [
    `${allocationCompletion || 0}% budget đã phân bổ`,
    overspentJarCount > 0 ? `${overspentJarCount} hũ đang vượt mức` : 'Các hũ đang trong ngưỡng',
    openDebtCount > 0 ? `${openDebtCount} khoản nợ cần theo dõi` : 'Không có nợ mở'
  ];

  const handleOpenQuickAdd = () => {
    const params = new URLSearchParams({ quickAdd: '1', month: selectedMonth });
    navigate(`/transactions?${params.toString()}`);
  };

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
    <div className="space-y-5">
      <section
        id="dashboard-home"
        data-assistant-target="dashboard-home"
        className="rounded-2xl border border-white/8 bg-(--surface-strong) p-4 shadow-sm"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Dashboard
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                  className="bg-transparent outline-none"
                />
              </label>
              <Link
                to="/monthly-plan"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              >
                <CalendarDaysIcon className="h-4 w-4" />
                <span>Plan tháng</span>
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleOpenQuickAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Nhập tiêu hôm nay</span>
            </button>
            <Link
              to="/import"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Import</span>
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {error}
          </div>
        ) : null}

        {hasBudgetData ? (
          <>
            <div className="mt-5 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
              <div>
                <p className="text-sm text-slate-400">Tổng dư tháng {selectedMonth}</p>
                <h1 className="mt-2 text-4xl font-bold tracking-tight text-emerald-400 sm:text-5xl">
                  {formatCurrency(totalRemaining)}
                </h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  {insightBadges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <article className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Phân bổ tháng
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(totalAllocated)}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Thu nhập {formatCurrency(selectedMonthIncome)}
                  </p>
                </article>
                <article className="rounded-2xl border border-sky-400/15 bg-sky-400/8 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/70">
                    Dư thực giữ riêng
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {previousReserveMonth ? formatCurrency(reserveTotal) : '--'}
                  </p>
                  <p className="mt-1 text-sm text-sky-100/70">
                    {previousReserveMonth ? `Snapshot ${previousReserveMonth}` : 'Chưa có snapshot tháng trước'}
                  </p>
                </article>
              </div>
            </div>

            <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

            <section className="mt-5 rounded-2xl border border-white/8 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    7 ngày gần đây
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-white">Lịch sử theo ngày</h2>
                </div>
                <Link
                  to={`/transactions?month=${selectedMonth}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                >
                  <ArrowTrendingUpIcon className="h-4 w-4" />
                  <span>Xem tất cả</span>
                </Link>
              </div>

              {recentDayCards.length > 0 ? (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                  {recentDayCards.map((day) => (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => handleOpenDayHistory(day)}
                      className="min-w-[220px] rounded-2xl border border-white/8 bg-(--surface-strong) p-4 text-left shadow-sm transition hover:border-white/14 hover:bg-white/5"
                    >
                      <p className="text-sm font-semibold text-white">{day.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{day.subtitle}</p>
                      <p className="mt-4 text-2xl font-bold text-rose-300">{formatCurrency(day.total)}</p>
                      <p className="mt-2 text-sm text-slate-400">
                        {day.count} giao dịch · top {day.topCategory}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-400">
                  Tháng này chưa có giao dịch nào để hiển thị lịch sử gần đây.
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Empty state
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Nhập thu nhập tháng để bắt đầu</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-slate-400">
              Khi có kế hoạch tháng, dashboard sẽ hiển thị 6 hũ, số dư tháng và lịch sử giao dịch gần đây ngay lập tức.
            </p>
            <Link
              to="/monthly-plan"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
            >
              <CalendarDaysIcon className="h-4 w-4" />
              <span>Tạo kế hoạch tháng</span>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
