import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ChartPieIcon, SparklesIcon } from '@heroicons/react/24/outline';

import {
  getDashboard,
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
  {
    jar_key: 'essentials',
    display_name_vi: 'Hũ chi tiêu cần thiết',
    display_order: 1,
    target_percentage: null,
    is_active: true
  },
  {
    jar_key: 'long_term_saving',
    display_name_vi: 'Tiết kiệm dài hạn',
    display_order: 2,
    target_percentage: null,
    is_active: true
  },
  {
    jar_key: 'education',
    display_name_vi: 'Quỹ Giáo Dục',
    display_order: 3,
    target_percentage: null,
    is_active: true
  },
  {
    jar_key: 'enjoyment',
    display_name_vi: 'Hưởng thụ',
    display_order: 4,
    target_percentage: null,
    is_active: true
  },
  {
    jar_key: 'financial_freedom',
    display_name_vi: 'Quỹ tự do tài chính',
    display_order: 5,
    target_percentage: null,
    is_active: true
  },
  {
    jar_key: 'charity',
    display_name_vi: 'Quỹ từ thiện',
    display_order: 6,
    target_percentage: null,
    is_active: true
  }
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
    return {
      daysInMonth,
      daysElapsed: daysInMonth,
      daysRemaining: 0
    };
  }

  return {
    daysInMonth,
    daysElapsed: 0,
    daysRemaining: daysInMonth
  };
};

const JarsPage = () => {
  const navigate = useNavigate();
  const [jars, setJars] = useState(defaultJars);
  const [dashboardData, setDashboardData] = useState(null);
  const [monthlyIncomes, setMonthlyIncomes] = useState([]);
  const [jarAllocations, setJarAllocations] = useState([]);
  const [actualBalances, setActualBalances] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadJars = async () => {
      try {
        const [
          jarResponse,
          dashboardResponse,
          incomeResponse,
          allocationResponse,
          actualBalanceResponse,
          transactionResponse
        ] =
          await Promise.all([
            getJars(),
            getDashboard(),
            getMonthlyIncomes(),
            getJarAllocations(),
            getJarActualBalances(),
            getTransactions()
          ]);

        if (Array.isArray(jarResponse.data) && jarResponse.data.length > 0) {
          setJars(jarResponse.data);
        }
        setDashboardData(dashboardResponse.data || null);
        const loadedIncomes = Array.isArray(incomeResponse.data) ? incomeResponse.data : [];
        const loadedAllocations = Array.isArray(allocationResponse.data) ? allocationResponse.data : [];
        const loadedActualBalances = Array.isArray(actualBalanceResponse.data)
          ? actualBalanceResponse.data
          : [];
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
        setError('Đang hiển thị cấu hình 6 hũ mặc định từ tài liệu domain.');
      }
    };

    loadJars();
  }, []);

  const allocationMap = new Map(
    (dashboardData?.latest_jar_allocations || []).map((item) => [item.jar_key, item])
  );
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
    if (!item.jar_key || item.direction !== 'expense') {
      return accumulator;
    }

    accumulator[item.jar_key] = (accumulator[item.jar_key] || 0) + (item.amount || 0);
    return accumulator;
  }, {});
  const totalAllocation = (dashboardData?.latest_jar_allocations || []).reduce(
    (sum, item) => sum + (item.allocated_amount || 0),
    0
  );
  const selectedMonthAllocationTotal = selectedMonthAllocations.reduce(
    (sum, item) => sum + (item.allocated_amount || 0),
    0
  );
  const selectedMonthSpentTotal = selectedMonthTransactions.reduce(
    (sum, item) => sum + (item.direction === 'expense' ? item.amount || 0 : 0),
    0
  );
  const activeCount = jars.filter((jar) => jar.is_active).length;
  const selectedMonthIncome =
    monthlyIncomes.find((item) => item.month === selectedMonth)?.total_amount || 0;
  const selectedMonthLabel = selectedMonth || 'Chưa chọn tháng';
  const monthMetrics = getMonthMetrics(selectedMonth);
  const previousSnapshotMonth = getPreviousActualBalanceMonth(actualBalances, selectedMonth);
  const previousActualBalanceMap = getActualBalanceMapByMonth(actualBalances, previousSnapshotMonth);
  const previousActualBalanceTotal = sumActualBalanceMonth(actualBalances, previousSnapshotMonth);

  const handleSpendFromJar = (jar) => {
    const params = new URLSearchParams({
      quickAdd: '1',
      jar: jar.jar_key
    });

    if (selectedMonth) {
      params.set('month', selectedMonth);
    }

    navigate(`/transactions?${params.toString()}`);
  };

  const handleViewJarHistory = (jar) => {
    const params = new URLSearchParams({
      jar: jar.jar_key
    });

    if (selectedMonth) {
      params.set('month', selectedMonth);
    }

    navigate(`/transactions?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(102,126,234,0.24)_0%,rgba(118,75,162,0.22)_45%,rgba(15,15,35,0.96)_100%)] p-6 shadow-2xl shadow-slate-950/20">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-100/80">
            Visual jars
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Mỗi hũ là một bucket có vai trò riêng trong kế hoạch tài chính của bạn.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Màn này tập trung vào nhận diện từng hũ, mức phân bổ gần nhất và cảm giác tiến độ thay
            vì chỉ hiển thị dạng danh sách thông thường.
          </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Tổng hũ</p>
              <p className="mt-2 text-3xl font-bold text-white">{jars.length}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Đang hoạt động</p>
              <p className="mt-2 text-3xl font-bold text-white">{activeCount}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Phân bổ gần nhất</p>
              <p className="mt-2 text-3xl font-bold text-white">{formatCurrency(totalAllocation)}</p>
            </div>
              <label className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Tháng đang xem</p>
                <select
                  aria-label="Chọn tháng xem dashboard hũ"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                  className="mt-3 w-full bg-transparent text-base font-semibold text-white outline-none"
                >
                  {availableMonths.length > 0 ? (
                    availableMonths.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))
                  ) : (
                    <option value="">Chưa có tháng</option>
                  )}
                </select>
              </label>
          </div>
        </article>

        <article className="rounded-[32px] border border-white/10 bg-(--surface-strong) p-6 shadow-xl shadow-slate-950/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Allocation mix
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Tóm tắt hiện tại</h2>
            </div>
            <span className="rounded-2xl bg-white/5 p-3 text-slate-300">
              <ChartPieIcon className="h-5 w-5" />
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {jars.map((jar) => {
              const allocation = allocationMap.get(jar.jar_key);
              const percentage =
                allocationByJar.get(jar.jar_key)?.allocation_percentage ??
                allocation?.allocation_percentage ??
                jar.target_percentage ??
                0;

              return (
                <div key={jar.jar_key}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-300">{jar.display_name_vi}</span>
                    <span className="text-slate-500">
                      {typeof percentage === 'number' ? `${percentage}%` : 'Chưa đặt'}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5">
                    <div
                      className="h-2 rounded-full bg-(--hero-gradient)"
                      style={{ width: `${Math.min(100, Math.max(8, percentage || 8))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-5 w-5" />
              <span className="font-semibold">Gợi ý visual</span>
            </div>
            <p className="mt-2 leading-6">
              Dashboard theo tháng đang xem: {selectedMonthLabel}. Bạn có thể bấm vào từng hũ để chi
              trực tiếp hoặc mở lịch sử của đúng hũ đó.
            </p>
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-[28px] border border-white/10 bg-(--surface-strong) p-5 shadow-lg shadow-slate-950/20">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Thu nhập tháng
          </p>
          <p className="mt-2 text-3xl font-bold text-white">{formatCurrency(selectedMonthIncome)}</p>
          <p className="mt-2 text-sm text-slate-400">{selectedMonthLabel}</p>
        </article>
        <article className="rounded-[28px] border border-white/10 bg-(--surface-strong) p-5 shadow-lg shadow-slate-950/20">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Đã phân bổ theo hũ
          </p>
          <p className="mt-2 text-3xl font-bold text-white">
            {formatCurrency(selectedMonthAllocationTotal)}
          </p>
          <p className="mt-2 text-sm text-slate-400">Tổng phân bổ của tháng đang xem</p>
        </article>
        <article className="rounded-[28px] border border-white/10 bg-(--surface-strong) p-5 shadow-lg shadow-slate-950/20">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Đã chi theo hũ
          </p>
          <p className="mt-2 text-3xl font-bold text-white">{formatCurrency(selectedMonthSpentTotal)}</p>
          <p className="mt-2 text-sm text-slate-400">Tổng chi phát sinh trong tháng đang xem</p>
        </article>
        <article className="rounded-[28px] border border-sky-400/20 bg-sky-400/10 p-5 shadow-lg shadow-slate-950/20">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">
            Giữ riêng từ tháng trước
          </p>
          <p className="mt-2 text-3xl font-bold text-white">
            {previousSnapshotMonth ? formatCurrency(previousActualBalanceTotal) : '--'}
          </p>
          <p className="mt-2 text-sm text-sky-100/80">
            {previousSnapshotMonth
              ? `Snapshot ${previousSnapshotMonth}, không cộng vào ngân sách ${selectedMonthLabel}.`
              : 'Chưa có snapshot số dư thực từ tháng trước.'}
          </p>
        </article>
      </section>

      {error ? (
        <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      <section className="rounded-[28px] border border-sky-400/20 bg-sky-400/10 p-5 text-sm text-sky-100 shadow-lg shadow-slate-950/20">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">
          Tách riêng để tránh ảo giác còn nhiều tiền
        </p>
        <p className="mt-3 leading-7">
          Tháng {selectedMonthLabel} chỉ dùng thu nhập, phân bổ và giao dịch của chính tháng này để
          tính mức còn lại. Số dư thực từ {previousSnapshotMonth || 'tháng trước'} chỉ được hiển thị ở
          khu riêng và không được cộng vào daily budget.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {jars.map((jar) => {
          const allocation = allocationMap.get(jar.jar_key);
          const monthlyAllocation = allocationByJar.get(jar.jar_key)?.allocated_amount || 0;
          const spentAmount = spentByJar[jar.jar_key] || 0;
          const remainingAmount = monthlyAllocation - spentAmount;
          const suggestedDailyBudget =
            monthMetrics && monthMetrics.daysRemaining > 0
              ? Math.max(0, Math.floor(remainingAmount / monthMetrics.daysRemaining))
              : 0;
          const expectedSpendToDate =
            monthMetrics && monthMetrics.daysInMonth > 0
              ? Math.round((monthlyAllocation * monthMetrics.daysElapsed) / monthMetrics.daysInMonth)
              : 0;
          const overspendAmount = Math.max(0, spentAmount - expectedSpendToDate);
          const baseDailyRate =
            monthMetrics && monthMetrics.daysInMonth > 0
              ? Math.max(1, Math.floor(monthlyAllocation / monthMetrics.daysInMonth))
              : 0;
          const overspendDays =
            overspendAmount > 0 && baseDailyRate > 0
              ? Math.ceil(overspendAmount / baseDailyRate)
              : 0;
          const previousActualBalance = previousActualBalanceMap.get(jar.jar_key)?.actual_balance_amount;

          return (
            <JarCard
              key={jar.jar_key}
              jar={jar}
              amount={monthlyAllocation}
              spentAmount={spentAmount}
              remainingAmount={remainingAmount}
              reserveAmount={typeof previousActualBalance === 'number' ? previousActualBalance : null}
              reserveLabel={previousSnapshotMonth ? `Giữ riêng ${previousSnapshotMonth}` : ''}
              monthLabel={selectedMonthLabel}
              dailyBudgetLabel={
                monthMetrics
                  ? monthMetrics.daysRemaining > 0
                    ? `Nên dùng khoảng ${formatCurrency(
                        suggestedDailyBudget
                      )}/ngày trong ${monthMetrics.daysRemaining} ngày còn lại để cân bằng hũ.`
                    : `Tháng này đã khép lại. Tổng chi của hũ là ${formatCurrency(spentAmount)}.`
                  : ''
              }
              warningLabel={
                overspendAmount > 0
                  ? `Bạn đang vượt nhịp chi an toàn ${formatCurrency(
                      overspendAmount
                    )}, tương đương khoảng ${overspendDays} ngày đã dùng quá tay.`
                  : ''
              }
              percentage={
                allocationByJar.get(jar.jar_key)?.allocation_percentage ??
                allocation?.allocation_percentage ??
                jar.target_percentage
              }
              deltaLabel={
                allocationByJar.get(jar.jar_key)
                  ? `Phân bổ tháng ${selectedMonthLabel}`
                  : 'Chưa có phân bổ cho tháng này'
              }
              onSecondaryAction={handleSpendFromJar}
              onPrimaryAction={handleViewJarHistory}
            />
          );
        })}
      </section>
    </div>
  );
};

export default JarsPage;
