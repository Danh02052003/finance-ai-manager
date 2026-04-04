import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const positiveAdjustmentsByJar = selectedMonthTransactions.reduce((accumulator, item) => {
    if (!item.jar_key || item.direction !== 'income_adjustment') {
      return accumulator;
    }

    accumulator[item.jar_key] = (accumulator[item.jar_key] || 0) + (item.amount || 0);
    return accumulator;
  }, {});
  const selectedMonthAllocationTotal = selectedMonthAllocations.reduce(
    (sum, item) => sum + (item.allocated_amount || 0),
    0
  );
  const selectedMonthSpentTotal = selectedMonthTransactions.reduce(
    (sum, item) => sum + (item.direction === 'expense' ? item.amount || 0 : 0),
    0
  );
  const selectedMonthNetYieldTotal = selectedMonthTransactions.reduce(
    (sum, item) =>
      sum + (item.direction === 'income_adjustment' && item.source === 'momo_yield' ? item.amount || 0 : 0),
    0
  );
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
      <section
        id="jars-overview"
        data-assistant-target="jars-overview"
        className="rounded-[28px] border border-white/10 bg-(--surface-strong) p-5 shadow-lg shadow-slate-950/20"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">6 hũ</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Quản lý 6 hũ theo tháng đang xem</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Trang này chỉ giữ lại phần số liệu thật sự cần để xem hũ nào còn bao nhiêu, chi nhanh và
              mở lịch sử đúng hũ đó.
            </p>
          </div>

          <label className="rounded-3xl border border-white/10 bg-white/5 p-4 lg:min-w-[220px]">
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
      </section>

      <section
        id="jars-summary"
        data-assistant-target="jars-summary"
        className="grid gap-4 md:grid-cols-5"
      >
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
        <article className="rounded-[28px] border border-emerald-400/20 bg-emerald-400/10 p-5 shadow-lg shadow-slate-950/20">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/80">
            Lãi ròng tháng này
          </p>
          <p className="mt-2 text-3xl font-bold text-white">{formatCurrency(selectedMonthNetYieldTotal)}</p>
          <p className="mt-2 text-sm text-emerald-100/80">
            Tổng các giao dịch lợi nhuận MoMo của tháng đang xem.
          </p>
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

      <section
        id="jars-separation-note"
        data-assistant-target="jars-separation-note"
        className="rounded-[28px] border border-sky-400/20 bg-sky-400/10 p-5 text-sm text-sky-100 shadow-lg shadow-slate-950/20"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">
          Tách riêng để tránh ảo giác còn nhiều tiền
        </p>
        <p className="mt-3 leading-7">
          Tháng {selectedMonthLabel} chỉ dùng thu nhập, phân bổ và giao dịch của chính tháng này để
          tính mức còn lại. Số dư thực từ {previousSnapshotMonth || 'tháng trước'} chỉ được hiển thị ở
          khu riêng và không được cộng vào daily budget.
        </p>
      </section>

      <section
        id="jars-cards"
        data-assistant-target="jars-cards"
        className="grid gap-4 xl:grid-cols-2"
      >
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
          const overspendDays =
            overspendAmount > 0 && baseDailyRate > 0
              ? Math.ceil(overspendAmount / baseDailyRate)
              : 0;
          const previousActualBalance = previousActualBalanceMap.get(jar.jar_key)?.actual_balance_amount;
          const currentMonthPercentage =
            allocationByJar.get(jar.jar_key)?.allocation_percentage ?? jar.target_percentage;

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
                currentMonthPercentage
              }
              deltaLabel={
                allocationByJar.get(jar.jar_key)
                  ? positiveAdjustments > 0
                    ? `Phân bổ ${formatCurrency(monthlyAllocation)} + điều chỉnh ${formatCurrency(
                        positiveAdjustments
                      )}`
                    : `Phân bổ tháng ${selectedMonthLabel}`
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
