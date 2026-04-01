import { motion } from 'framer-motion';
import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BoltIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  getDashboard,
  getJarActualBalances,
  getJars,
  getTransactions
} from '../api/dashboardApi.js';
import JarCard from '../components/JarCard.jsx';
import { formatCurrency, formatDate } from '../components/formatters.js';
import {
  getActualBalanceMapByMonth,
  getPreviousActualBalanceMonth,
  sumActualBalanceMonth
} from '../utils/actualBalanceSnapshots.js';

const fallbackStats = {
  total_jars: 0,
  active_jars: 0,
  latest_income_total: 0,
  latest_allocation_total: 0,
  recent_transaction_total: 0,
  open_debt_total: 0,
  recent_transaction_count: 0,
  open_debt_count: 0
};

const statCards = [
  {
    key: 'latest_income_total',
    label: 'Thu nhập tháng',
    icon: BanknotesIcon
  },
  {
    key: 'latest_allocation_total',
    label: 'Đã phân bổ',
    icon: SparklesIcon
  },
  {
    key: 'recent_transaction_total',
    label: 'Chi gần đây',
    icon: ArrowTrendingUpIcon
  },
  {
    key: 'open_debt_total',
    label: 'Nợ đang mở',
    icon: BoltIcon
  }
];

const DashboardPage = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [jars, setJars] = useState([]);
  const [actualBalances, setActualBalances] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [dashboardResponse, jarResponse, actualBalanceResponse, transactionResponse] = await Promise.all([
          getDashboard(),
          getJars(),
          getJarActualBalances(),
          getTransactions()
        ]);

        setDashboardData(dashboardResponse.data || null);
        setJars(Array.isArray(jarResponse.data) ? jarResponse.data : []);
        setActualBalances(Array.isArray(actualBalanceResponse.data) ? actualBalanceResponse.data : []);
        setTransactions(Array.isArray(transactionResponse.data) ? transactionResponse.data : []);
        setError('');
      } catch (requestError) {
        setError('Không tải được dashboard. Hãy thử tải lại sau.');
      }
    };

    loadDashboard();
  }, []);

  const stats = dashboardData?.stats || fallbackStats;
  const allocationMap = useMemo(
    () =>
      new Map(
        (dashboardData?.latest_jar_allocations || []).map((item) => [item.jar_key, item])
      ),
    [dashboardData?.latest_jar_allocations]
  );
  const latestIncome = dashboardData?.latest_monthly_income?.total_amount || 0;
  const focusMonth =
    dashboardData?.latest_monthly_income?.month ||
    dashboardData?.latest_jar_allocations?.[0]?.month ||
    '';
  const allocationProgress = latestIncome
    ? Math.min(100, Math.round((stats.latest_allocation_total / latestIncome) * 100))
    : 0;
  const spentByJar = useMemo(
    () =>
      transactions.reduce((accumulator, item) => {
        if (!focusMonth || item.month !== focusMonth || item.direction !== 'expense' || !item.jar_key) {
          return accumulator;
        }

        accumulator[item.jar_key] = (accumulator[item.jar_key] || 0) + (item.amount || 0);
        return accumulator;
      }, {}),
    [focusMonth, transactions]
  );
  const positiveAdjustmentsByJar = useMemo(
    () =>
      transactions.reduce((accumulator, item) => {
        if (!focusMonth || item.month !== focusMonth || item.direction !== 'income_adjustment' || !item.jar_key) {
          return accumulator;
        }

        accumulator[item.jar_key] = (accumulator[item.jar_key] || 0) + (item.amount || 0);
        return accumulator;
      }, {}),
    [focusMonth, transactions]
  );
  const previousSnapshotMonth = useMemo(() => {
    if (focusMonth) {
      return getPreviousActualBalanceMonth(actualBalances, focusMonth);
    }

    return (
      Array.from(new Set(actualBalances.map((item) => item.month).filter(Boolean))).sort().reverse()[0] ||
      ''
    );
  }, [actualBalances, focusMonth]);
  const previousActualBalanceMap = useMemo(
    () => getActualBalanceMapByMonth(actualBalances, previousSnapshotMonth),
    [actualBalances, previousSnapshotMonth]
  );
  const previousActualBalanceTotal = useMemo(
    () => sumActualBalanceMonth(actualBalances, previousSnapshotMonth),
    [actualBalances, previousSnapshotMonth]
  );
  const focusMonthNetYieldTotal = useMemo(
    () =>
      transactions.reduce(
        (sum, item) =>
          sum +
          (item.month === focusMonth && item.direction === 'income_adjustment' && item.source === 'momo_yield'
            ? item.amount || 0
            : 0),
        0
      ),
    [focusMonth, transactions]
  );
  const netAmount = stats.latest_income_total - stats.recent_transaction_total;
  const insightItems = [
    allocationProgress >= 80
      ? { label: 'Tiết kiệm tốt', tone: 'emerald' }
      : { label: 'Cần chốt kế hoạch tháng', tone: 'amber' },
    stats.recent_transaction_total > stats.latest_income_total * 0.2 && latestIncome
      ? { label: 'Ăn uống hoặc chi tiêu đang tăng', tone: 'amber' }
      : { label: 'Chi tiêu đang trong tầm kiểm soát', tone: 'sky' },
    stats.open_debt_count > 0
      ? { label: 'Có khoản nợ cần theo dõi', tone: 'rose' }
      : { label: 'Chưa có nợ mở', tone: 'emerald' }
  ];
  const hasAnyData =
    stats.latest_income_total > 0 ||
    stats.recent_transaction_count > 0 ||
    stats.open_debt_count > 0 ||
    jars.length > 0;

  const handleSpendFromJar = (jar) => {
    const params = new URLSearchParams({
      quickAdd: '1',
      jar: jar.jar_key
    });

    if (focusMonth) {
      params.set('month', focusMonth);
    }

    navigate(`/transactions?${params.toString()}`);
  };

  const handleViewJarHistory = (jar) => {
    const params = new URLSearchParams({
      jar: jar.jar_key
    });

    if (focusMonth) {
      params.set('month', focusMonth);
    }

    navigate(`/transactions?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <motion.section
        id="dashboard-overview"
        data-assistant-target="dashboard-overview"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(102,126,234,0.25)_0%,rgba(118,75,162,0.25)_45%,rgba(15,15,35,0.95)_100%)] p-6 shadow-2xl shadow-indigo-950/25"
      >
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-100/80">
              Snapshot hôm nay
            </div>
            <h1 className="mt-5 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Nhìn nhanh sức khỏe tài chính để biết hôm nay nên hành động gì trước.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Bạn đang theo dõi {stats.active_jars}/{stats.total_jars} hũ hoạt động. Mọi số liệu ở đây
              tập trung vào phần thật sự hữu ích cho quyết định chi tiêu trong ngày.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Thu nhập gần nhất</p>
                <p className="mt-2 text-3xl font-bold text-white">{formatCurrency(stats.latest_income_total)}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Chi gần đây</p>
                <p className="mt-2 text-3xl font-bold text-white">{formatCurrency(stats.recent_transaction_total)}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Chênh lệch</p>
                <p className="mt-2 text-3xl font-bold text-white">{formatCurrency(netAmount)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tiến độ kế hoạch</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Mức hoàn thiện tháng này</h2>
              </div>
              <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-300">
                {allocationProgress}%
              </div>
            </div>

            <div className="mt-6 flex items-center gap-5">
              <div
                className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(#10b981 ${allocationProgress}%, rgba(255,255,255,0.08) 0)`
                }}
              >
                <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-[#111428]">
                  <span className="text-2xl font-bold text-white">{allocationProgress}%</span>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                    goal
                  </span>
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-4">
                <div>
                  <p className="text-sm text-slate-400">Đã phân bổ</p>
                  <p className="text-lg font-semibold text-white">{formatCurrency(stats.latest_allocation_total)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Thu nhập tháng hiện tại</p>
                  <p className="text-lg font-semibold text-white">{formatCurrency(latestIncome)}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {insightItems.map((item) => (
                <span
                  key={item.label}
                  className={[
                    'rounded-full px-3 py-1.5 text-sm font-medium',
                    item.tone === 'emerald' && 'bg-emerald-400/15 text-emerald-200',
                    item.tone === 'amber' && 'bg-amber-400/15 text-amber-200',
                    item.tone === 'rose' && 'bg-rose-400/15 text-rose-200',
                    item.tone === 'sky' && 'bg-sky-400/15 text-sky-200'
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {error ? (
        <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      {!hasAnyData ? (
        <section className="rounded-[28px] border border-dashed border-white/10 bg-white/5 p-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Empty state</p>
          <h2 className="mt-4 text-2xl font-semibold text-white">
            Chào mừng! Nhập giao dịch đầu tiên để xem tổng quan.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-400">
            Khi có dữ liệu, dashboard sẽ hiển thị mức thu, chi, trạng thái 6 hũ và các tín hiệu
            cần chú ý trong ngày.
          </p>
        </section>
      ) : null}

      <section
        id="dashboard-stats"
        data-assistant-target="dashboard-stats"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        {statCards.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.key}
              className="rounded-[28px] border border-white/10 bg-(--surface-strong) p-5 shadow-lg shadow-slate-950/20"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{item.label}</p>
                <span className="rounded-2xl bg-white/5 p-2 text-slate-300">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-5 text-3xl font-bold tracking-tight text-white">
                {formatCurrency(stats[item.key])}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[28px] border border-emerald-400/20 bg-emerald-400/10 p-5 shadow-lg shadow-slate-950/20">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/80">
            Lãi ròng tháng hiện tại
          </p>
          <p className="mt-2 text-3xl font-bold text-white">{formatCurrency(focusMonthNetYieldTotal)}</p>
          <p className="mt-2 text-sm text-emerald-100/80">
            Tổng lợi nhuận MoMo đã ghi vào tháng {focusMonth || 'hiện tại'}.
          </p>
        </article>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">6 Jars</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Snapshot từng hũ</h2>
          </div>
        </div>

        <div
          id="dashboard-actual-reserve"
          data-assistant-target="dashboard-actual-reserve"
          className="rounded-[28px] border border-sky-400/20 bg-sky-400/10 p-5 text-sm text-sky-100 shadow-lg shadow-slate-950/20"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">
            Số dư thực giữ riêng
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-3xl font-bold text-white">
                {previousSnapshotMonth ? formatCurrency(previousActualBalanceTotal) : '--'}
              </p>
              <p className="mt-2 leading-6">
                {previousSnapshotMonth
                  ? `Lấy từ snapshot ${previousSnapshotMonth}. Khoản này chỉ để đối chiếu, không cộng vào ngân sách ${focusMonth || 'tháng hiện tại'}.`
                  : 'Chưa có snapshot số dư thực từ tháng trước để đối chiếu.'}
              </p>
            </div>
          </div>
        </div>

        <div
          id="dashboard-jars"
          data-assistant-target="dashboard-jars"
          className="grid gap-4 xl:grid-cols-3"
        >
          {jars.slice(0, 6).map((jar) => {
            const allocation = allocationMap.get(jar.jar_key);
            const amount = allocation?.allocated_amount || 0;
            const percentage = allocation?.allocation_percentage ?? jar.target_percentage ?? 0;
            const spentAmount = spentByJar[jar.jar_key] || 0;
            const positiveAdjustments = positiveAdjustmentsByJar[jar.jar_key] || 0;
            const remainingAmount = amount + positiveAdjustments - spentAmount;
            const previousActualBalance = previousActualBalanceMap.get(jar.jar_key)?.actual_balance_amount;

            return (
              <JarCard
                key={jar.jar_key}
                jar={jar}
                amount={amount}
                percentage={percentage}
                spentAmount={spentAmount}
                remainingAmount={remainingAmount}
                reserveAmount={typeof previousActualBalance === 'number' ? previousActualBalance : null}
                reserveLabel={previousSnapshotMonth ? `Giữ riêng ${previousSnapshotMonth}` : ''}
                deltaLabel={
                  allocation
                    ? positiveAdjustments > 0
                      ? `Phân bổ ${formatCurrency(amount)} + điều chỉnh ${formatCurrency(positiveAdjustments)}`
                      : `Phân bổ tháng ${allocation.month}`
                    : 'Chưa có phân bổ gần nhất'
                }
                monthLabel={focusMonth || 'tháng gần nhất'}
                onSecondaryAction={handleSpendFromJar}
                onPrimaryAction={handleViewJarHistory}
              />
            );
          })}
        </div>
      </section>

      <section className="grid gap-4">
        <article
          id="dashboard-recent-transactions"
          data-assistant-target="dashboard-recent-transactions"
          className="rounded-[28px] border border-white/10 bg-(--surface-strong) p-5 shadow-lg shadow-slate-950/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Recent transactions
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Giao dịch gần đây</h2>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300">
              {stats.recent_transaction_count} giao dịch
            </span>
          </div>

          <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
            {(dashboardData?.recent_transactions || []).map((transaction) => (
              <div
                key={transaction._id}
                className="min-w-[230px] rounded-3xl border border-white/10 bg-slate-950/40 p-4"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  {formatDate(transaction.transaction_date)}
                </p>
                <h3 className="mt-3 text-base font-semibold text-white">{transaction.description}</h3>
                <p className="mt-2 text-sm text-slate-400">{transaction.jar_key || 'chưa gắn hũ'}</p>
                <p
                  className={`mt-5 text-xl font-bold ${
                    transaction.direction === 'income_adjustment' ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {transaction.direction === 'income_adjustment' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
};

export default DashboardPage;
