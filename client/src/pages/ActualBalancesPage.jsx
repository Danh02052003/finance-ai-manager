import {
  ArrowPathIcon,
  BanknotesIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

import {
  createJarActualBalance,
  getJarActualBalances,
  getJars,
  getTransactions,
  updateJarActualBalance
} from '../api/dashboardApi.js';
import { formatCurrency } from '../components/formatters.js';
import {
  getActualBalanceMapByMonth,
  getPreviousActualBalanceMonth,
  sumActualBalanceMonth
} from '../utils/actualBalanceSnapshots.js';
import {
  formatMoneyInputValue,
  getCurrentMonthValue,
  moneyInputHint,
  parseMoneyInputPreview
} from '../utils/moneyInput.js';

const DEFAULT_MOMO_YIELD_RATE = 4.5;

const buildDateKey = (value) => {
  const parsedValue = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsedValue.getTime())) {
    return '';
  }

  const year = parsedValue.getFullYear();
  const month = String(parsedValue.getMonth() + 1).padStart(2, '0');
  const day = String(parsedValue.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (value) => {
  const parsedValue = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsedValue.getTime())) {
    return '--';
  }

  return new Intl.DateTimeFormat('vi-VN').format(parsedValue);
};

const getYesterdayDate = () => {
  const yesterday = new Date();
  yesterday.setHours(0, 0, 0, 0);
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
};

const buildFormState = (jars, actualBalanceMap) =>
  Object.fromEntries(
    jars.map((jar) => {
      const existingRecord = actualBalanceMap.get(jar.jar_key);

      return [
        jar.jar_key,
        {
          id: existingRecord?._id || '',
          actual_balance_amount: existingRecord ? formatMoneyInputValue(existingRecord.actual_balance_amount) : '',
          note: existingRecord?.note || '',
          last_yield_processed_at: existingRecord?.last_yield_processed_at?.slice?.(0, 10) || ''
        }
      ];
    })
  );

const ActualBalancesPage = () => {
  const [jars, setJars] = useState([]);
  const [actualBalances, setActualBalances] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  const [formState, setFormState] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [savingJarKey, setSavingJarKey] = useState('');
  const [usesMomoWallet, setUsesMomoWallet] = useState(true);
  const [sharedYieldRateAnnual, setSharedYieldRateAnnual] = useState(String(DEFAULT_MOMO_YIELD_RATE));

  const yesterdayDate = useMemo(() => getYesterdayDate(), []);
  const yesterdayDateKey = useMemo(() => buildDateKey(yesterdayDate), [yesterdayDate]);
  const yesterdayLabel = useMemo(() => formatDisplayDate(yesterdayDate), [yesterdayDate]);

  const loadActualBalanceData = async () => {
    try {
      const [jarResponse, actualBalanceResponse, transactionResponse] = await Promise.all([
        getJars(),
        getJarActualBalances(),
        getTransactions()
      ]);

      setJars(Array.isArray(jarResponse.data) ? jarResponse.data : []);
      setActualBalances(Array.isArray(actualBalanceResponse.data) ? actualBalanceResponse.data : []);
      setTransactions(Array.isArray(transactionResponse.data) ? transactionResponse.data : []);
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải dữ liệu.');
    }
  };

  useEffect(() => {
    loadActualBalanceData();
  }, []);

  const selectedMonthActualBalanceMap = useMemo(
    () => getActualBalanceMapByMonth(actualBalances, selectedMonth),
    [actualBalances, selectedMonth]
  );
  const previousMonth = useMemo(
    () => getPreviousActualBalanceMonth(actualBalances, selectedMonth),
    [actualBalances, selectedMonth]
  );
  const previousMonthActualBalanceMap = useMemo(
    () => getActualBalanceMapByMonth(actualBalances, previousMonth),
    [actualBalances, previousMonth]
  );
  const selectedMonthRecords = useMemo(
    () => jars.map((jar) => selectedMonthActualBalanceMap.get(jar.jar_key)).filter(Boolean),
    [jars, selectedMonthActualBalanceMap]
  );

  const selectedMonthYieldTransactions = useMemo(
    () =>
      (transactions || []).filter(
        (item) => item?.source === 'momo_yield' && item?.month === selectedMonth && item?.jar_key
      ),
    [transactions, selectedMonth]
  );

  const effectiveYieldTransactions = useMemo(
    () => (usesMomoWallet ? selectedMonthYieldTransactions : []),
    [selectedMonthYieldTransactions, usesMomoWallet]
  );

  const yesterdayYieldTransactions = useMemo(
    () =>
      effectiveYieldTransactions.filter((item) => buildDateKey(item.transaction_date) === yesterdayDateKey),
    [effectiveYieldTransactions, yesterdayDateKey]
  );

  const yesterdayYieldByJar = useMemo(() => {
    const map = new Map();

    yesterdayYieldTransactions.forEach((item) => {
      const currentAmount = map.get(item.jar_key) || 0;
      map.set(item.jar_key, currentAmount + Number(item.amount || 0));
    });

    return map;
  }, [yesterdayYieldTransactions]);

  useEffect(() => {
    setFormState(buildFormState(jars, selectedMonthActualBalanceMap));

    const firstRateRecord = selectedMonthRecords.find((item) => item?.yield_rate_annual != null);
    setUsesMomoWallet(selectedMonthRecords.length ? selectedMonthRecords.some((item) => item.yield_enabled) : true);
    setSharedYieldRateAnnual(
      firstRateRecord?.yield_rate_annual != null
        ? String(firstRateRecord.yield_rate_annual)
        : String(DEFAULT_MOMO_YIELD_RATE)
    );
  }, [jars, selectedMonthActualBalanceMap, selectedMonthRecords]);

  const selectedMonthTotal = useMemo(
    () =>
      jars.reduce((sum, jar) => {
        const value = parseMoneyInputPreview(formState[jar.jar_key]?.actual_balance_amount);
        return sum + (value || 0);
      }, 0),
    [formState, jars]
  );

  const previousMonthTotal = useMemo(
    () => sumActualBalanceMonth(actualBalances, previousMonth),
    [actualBalances, previousMonth]
  );

  const yesterdayYieldTotal = useMemo(
    () => yesterdayYieldTransactions.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [yesterdayYieldTransactions]
  );

  const yesterdayYieldJarCount = useMemo(() => yesterdayYieldByJar.size, [yesterdayYieldByJar]);

  const latestYieldRunLabel = useMemo(() => {
    if (!usesMomoWallet) {
      return '--';
    }

    const timestamps = selectedMonthRecords
      .map((item) => item?.last_yield_processed_at)
      .filter(Boolean)
      .map((value) => new Date(value))
      .filter((value) => !Number.isNaN(value.getTime()));

    if (!timestamps.length) {
      return '--';
    }

    const latestTimestamp = timestamps.reduce((latest, current) =>
      current.getTime() > latest.getTime() ? current : latest
    );

    return formatDisplayDate(latestTimestamp);
  }, [selectedMonthRecords, usesMomoWallet]);

  const normalizedSharedYieldRate = Number(sharedYieldRateAnnual || DEFAULT_MOMO_YIELD_RATE);

  const handleFieldChange = (jarKey, fieldName, value) => {
    setFormState((currentState) => ({
      ...currentState,
      [jarKey]: {
        ...currentState[jarKey],
        [fieldName]: value
      }
    }));
  };

  const buildJarPayload = (jarKey) => {
    const row = formState[jarKey];

    return {
      month: selectedMonth,
      jar_key: jarKey,
      actual_balance_amount: row.actual_balance_amount,
      note: row.note,
      yield_enabled: usesMomoWallet,
      yield_rate_annual: normalizedSharedYieldRate
    };
  };

  const handleSaveJar = async (jarKey) => {
    const row = formState[jarKey];

    if (!row?.actual_balance_amount?.trim()) {
      setError('Nhập số dư thực trước khi lưu.');
      return;
    }

    setSavingJarKey(jarKey);
    setError('');

    try {
      const payload = buildJarPayload(jarKey);

      if (row.id) {
        await updateJarActualBalance(row.id, payload);
      } else {
        await createJarActualBalance(payload);
      }

      setMessage(`Đã lưu số dư hũ ${jarKey}.`);
      await loadActualBalanceData();
    } catch (requestError) {
      setError(requestError.message || 'Không lưu được dữ liệu.');
    } finally {
      setSavingJarKey('');
    }
  };

  const handleSaveAll = async () => {
    const rows = jars.filter((jar) => formState[jar.jar_key]?.actual_balance_amount?.trim());

    if (!rows.length) {
      setError('Chưa có hũ nào có dữ liệu để lưu.');
      return;
    }

    setIsSavingAll(true);
    setError('');

    try {
      await Promise.all(
        rows.map(async (jar) => {
          const row = formState[jar.jar_key];
          const payload = buildJarPayload(jar.jar_key);

          if (row.id) {
            await updateJarActualBalance(row.id, payload);
          } else {
            await createJarActualBalance(payload);
          }
        })
      );

      setMessage(`Đã lưu toàn bộ số dư tháng ${selectedMonth}.`);
      await loadActualBalanceData();
    } catch (requestError) {
      setError(requestError.message || 'Không lưu được dữ liệu.');
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleCopyPreviousMonth = () => {
    if (!previousMonth) {
      setError('Chưa có dữ liệu tháng trước để sao chép.');
      return;
    }

    const previousMonthRecords = jars
      .map((jar) => previousMonthActualBalanceMap.get(jar.jar_key))
      .filter(Boolean);
    const firstRateRecord = previousMonthRecords.find((item) => item?.yield_rate_annual != null);

    setFormState((currentState) =>
      Object.fromEntries(
        jars.map((jar) => {
          const previousRecord = previousMonthActualBalanceMap.get(jar.jar_key);

          return [
            jar.jar_key,
            {
              id: currentState[jar.jar_key]?.id || '',
              actual_balance_amount: previousRecord
                ? formatMoneyInputValue(previousRecord.actual_balance_amount)
                : currentState[jar.jar_key]?.actual_balance_amount || '',
              note: previousRecord?.note || currentState[jar.jar_key]?.note || '',
              last_yield_processed_at: currentState[jar.jar_key]?.last_yield_processed_at || ''
            }
          ];
        })
      )
    );

    setUsesMomoWallet(previousMonthRecords.length ? previousMonthRecords.some((item) => item.yield_enabled) : true);
    setSharedYieldRateAnnual(
      firstRateRecord?.yield_rate_annual != null
        ? String(firstRateRecord.yield_rate_annual)
        : String(DEFAULT_MOMO_YIELD_RATE)
    );
    setMessage(`Đã sao chép dữ liệu từ tháng ${previousMonth}. Nhớ lưu lại để tạo snapshot mới.`);
    setError('');
  };

  return (
    <div className="space-y-5">
      <motion.section
        id="actual-balances-overview"
        data-assistant-target="actual-balances-overview"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(135deg,rgba(16,185,129,0.1)_0%,rgba(59,130,246,0.1)_45%,rgba(10,10,26,0.97)_100%)] p-5 sm:p-6"
      >
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Số dư thực tế</h1>
            <p className="mt-2 max-w-lg text-sm text-slate-400">
              Ghi nhận số tiền thực đang giữ theo từng hũ. Lãi MoMo sẽ tự cộng hằng ngày nếu bạn bật
              Túi Thần Tài.
            </p>
            {message ? <p className="mt-3 text-sm text-emerald-300/80">{message}</p> : null}

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.06] p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Tháng</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-white">{selectedMonth}</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.06] p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Tổng số dư</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-white">{formatCurrency(selectedMonthTotal)}</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.06] p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Số dư tháng trước</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-white">
                  {previousMonth ? formatCurrency(previousMonthTotal) : '--'}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">{previousMonth ? `Từ ${previousMonth}` : 'Chưa có'}</p>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-300/70">
                  Tổng lãi cộng hôm qua
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums text-white">{formatCurrency(yesterdayYieldTotal)}</p>
                <p className="mt-0.5 text-[11px] text-emerald-200/70">{yesterdayLabel}</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.06] p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Số hũ được cộng</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-white">
                  {yesterdayYieldJarCount}/{jars.length || 0}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">{yesterdayLabel}</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.06] p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Lần chạy gần nhất</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-white">{latestYieldRunLabel}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {usesMomoWallet ? 'Đang bật Túi Thần Tài' : 'Đang tắt Túi Thần Tài'}
                </p>
              </div>
            </div>
          </div>

          <div
            id="actual-balances-rule"
            data-assistant-target="actual-balances-rule"
            className="rounded-2xl border border-white/[0.08] bg-black/20 p-5 backdrop-blur"
          >
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-emerald-500/15 p-2.5 text-emerald-300">
                <BanknotesIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Thiết lập chung</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.04] p-3 text-xs leading-relaxed text-slate-400">
              <p>{moneyInputHint}</p>
              <p className="mt-2">Ví dụ: `83,869` = 83.869đ, `83869` = 83.869.000đ</p>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5">
                <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Tháng</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none"
                />
              </label>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Dùng Túi Thần Tài MoMo</p>
                <div className="mt-3 inline-flex rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
                  <button
                    type="button"
                    onClick={() => setUsesMomoWallet(true)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      usesMomoWallet ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Có
                  </button>
                  <button
                    type="button"
                    onClick={() => setUsesMomoWallet(false)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      !usesMomoWallet ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Không
                  </button>
                </div>
              </div>

              <label className="block rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5">
                <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Lãi suất năm (%)
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={sharedYieldRateAnnual}
                  onChange={(event) => setSharedYieldRateAnnual(event.target.value)}
                  disabled={!usesMomoWallet}
                  className="w-full bg-transparent text-sm text-white outline-none"
                />
                <p className="mt-1.5 text-[11px] text-slate-500">
                  {usesMomoWallet
                    ? 'Mặc định 4.5%/năm và áp dụng cho toàn bộ hũ trong tháng này.'
                    : 'Đang tắt MoMo nên hiện không cộng lãi.'}
                </p>
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopyPreviousMonth}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/[0.08]"
                >
                  <DocumentDuplicateIcon className="h-3.5 w-3.5" />
                  Sao chép tháng trước
                </button>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={isSavingAll}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-(--hero-gradient) px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-900/20 transition hover:shadow-indigo-900/30 disabled:opacity-50"
                >
                  <ArrowPathIcon className={`h-3.5 w-3.5 ${isSavingAll ? 'animate-spin' : ''}`} />
                  {isSavingAll ? 'Đang lưu...' : 'Lưu tất cả'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {error ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {error}
        </div>
      ) : null}

      <section id="actual-balances-grid" data-assistant-target="actual-balances-grid" className="grid gap-4 xl:grid-cols-2">
        {jars.map((jar) => {
          const row = formState[jar.jar_key] || {
            id: '',
            actual_balance_amount: '',
            note: '',
            last_yield_processed_at: ''
          };
          const previewAmount = parseMoneyInputPreview(row.actual_balance_amount);
          const previousRecord = previousMonthActualBalanceMap.get(jar.jar_key);
          const isSavingJar = savingJarKey === jar.jar_key;
          const yesterdayYieldAmount = yesterdayYieldByJar.get(jar.jar_key) || 0;

          return (
            <article key={jar.jar_key} className="rounded-2xl border border-white/[0.06] bg-(--surface-strong) p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-white">{jar.display_name_vi}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Snapshot tháng {selectedMonth}</p>
                </div>
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                    row.id ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/[0.06] text-slate-500'
                  }`}
                >
                  {row.id ? 'Đã lưu' : 'Mới'}
                </span>
              </div>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Số dư tháng trước</p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-white">
                    {previousRecord ? formatCurrency(previousRecord.actual_balance_amount) : '--'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{previousMonth ? `Tháng ${previousMonth}` : 'Chưa có'}</p>
                </div>
                <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.06] p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-400/70">Sẽ lưu</p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-white">
                    {previewAmount != null ? formatCurrency(previewAmount) : '--'}
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Lãi cộng hôm qua</p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-white">{formatCurrency(yesterdayYieldAmount)}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{yesterdayLabel}</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <label className="block rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                  <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Số dư thực</span>
                  <input
                    value={row.actual_balance_amount}
                    onChange={(event) => handleFieldChange(jar.jar_key, 'actual_balance_amount', event.target.value)}
                    placeholder="VD: 83,869"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                  />
                </label>

                <label className="block rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                  <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Ghi chú</span>
                  <input
                    value={row.note}
                    onChange={(event) => handleFieldChange(jar.jar_key, 'note', event.target.value)}
                    placeholder="Ví dụ: tiền thật sự đang giữ"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                  />
                </label>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Lần chạy lãi gần nhất</p>
                  <p className="mt-1.5 text-sm text-white">
                    {row.last_yield_processed_at ? formatDisplayDate(row.last_yield_processed_at) : '--'}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveJar(jar.jar_key)}
                  disabled={isSavingJar}
                  className="flex-1 rounded-xl bg-(--hero-gradient) py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/20 transition hover:shadow-indigo-900/30 disabled:opacity-50"
                >
                  {isSavingJar ? 'Đang lưu...' : 'Lưu hũ này'}
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
};

export default ActualBalancesPage;
