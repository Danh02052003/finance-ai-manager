import {
  ArrowPathIcon,
  BanknotesIcon,
  DocumentDuplicateIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

import {
  createJarActualBalance,
  deleteJarActualBalance,
  getJarActualBalances,
  getJars,
  runDailyYield,
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

const buildFormState = (jars, actualBalanceMap) =>
  Object.fromEntries(
    jars.map((jar) => {
      const existingRecord = actualBalanceMap.get(jar.jar_key);

      return [
        jar.jar_key,
        {
          id: existingRecord?._id || '',
          actual_balance_amount: existingRecord
            ? formatMoneyInputValue(existingRecord.actual_balance_amount)
            : '',
          note: existingRecord?.note || '',
          yield_enabled: existingRecord?.yield_enabled ?? true,
          yield_activation_date: existingRecord?.yield_activation_date?.slice?.(0, 10) || '',
          yield_rate_annual:
            existingRecord?.yield_rate_annual != null ? String(existingRecord.yield_rate_annual) : '',
          gross_yield_amount: existingRecord?.gross_yield_amount || 0,
          withholding_tax_amount: existingRecord?.withholding_tax_amount || 0,
          net_yield_amount: existingRecord?.net_yield_amount || 0,
          yield_start_date: existingRecord?.yield_start_date?.slice?.(0, 10) || '',
          last_yield_processed_at: existingRecord?.last_yield_processed_at?.slice?.(0, 10) || ''
        }
      ];
    })
  );

const ActualBalancesPage = () => {
  const [jars, setJars] = useState([]);
  const [actualBalances, setActualBalances] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  const [formState, setFormState] = useState({});
  const [message, setMessage] = useState('Đang tải số dư thực.');
  const [error, setError] = useState('');
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [savingJarKey, setSavingJarKey] = useState('');
  const [isRunningYield, setIsRunningYield] = useState(false);
  const [yieldProcessingDate, setYieldProcessingDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  const loadActualBalanceData = async () => {
    try {
      const [jarResponse, actualBalanceResponse] = await Promise.all([getJars(), getJarActualBalances()]);
      const loadedJars = Array.isArray(jarResponse.data) ? jarResponse.data : [];
      const loadedActualBalances = Array.isArray(actualBalanceResponse.data)
        ? actualBalanceResponse.data
        : [];

      setJars(loadedJars);
      setActualBalances(loadedActualBalances);
      setMessage('Số dư thực đã sẵn sàng để bạn nhập theo từng tháng.');
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Không tải được số dư thực.');
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

  useEffect(() => {
    setFormState(buildFormState(jars, selectedMonthActualBalanceMap));
  }, [jars, selectedMonthActualBalanceMap]);

  const selectedMonthTotal = useMemo(
    () =>
      jars.reduce((sum, jar) => {
        const parsedValue = parseMoneyInputPreview(formState[jar.jar_key]?.actual_balance_amount);
        return sum + (parsedValue || 0);
      }, 0),
    [formState, jars]
  );
  const previousMonthTotal = useMemo(
    () => sumActualBalanceMonth(actualBalances, previousMonth),
    [actualBalances, previousMonth]
  );
  const selectedMonthGrossYieldTotal = useMemo(
    () =>
      (actualBalances || [])
        .filter((item) => item.month === selectedMonth)
        .reduce((sum, item) => sum + (item.gross_yield_amount || 0), 0),
    [actualBalances, selectedMonth]
  );
  const selectedMonthTaxTotal = useMemo(
    () =>
      (actualBalances || [])
        .filter((item) => item.month === selectedMonth)
        .reduce((sum, item) => sum + (item.withholding_tax_amount || 0), 0),
    [actualBalances, selectedMonth]
  );
  const selectedMonthNetYieldTotal = useMemo(
    () =>
      (actualBalances || [])
        .filter((item) => item.month === selectedMonth)
        .reduce((sum, item) => sum + (item.net_yield_amount || 0), 0),
    [actualBalances, selectedMonth]
  );

  const handleFieldChange = (jarKey, fieldName, value) => {
    setFormState((currentState) => ({
      ...currentState,
      [jarKey]: {
        ...currentState[jarKey],
        [fieldName]: value
      }
    }));
  };

  const handleYieldToggle = (jarKey) => {
    setFormState((currentState) => ({
      ...currentState,
      [jarKey]: {
        ...currentState[jarKey],
        yield_enabled: !currentState[jarKey]?.yield_enabled
      }
    }));
  };

  const handleSaveJar = async (jarKey) => {
    const row = formState[jarKey];

    if (!row?.actual_balance_amount?.trim()) {
      setError('Hãy nhập số dư thực trước khi lưu.');
      return;
    }

    setSavingJarKey(jarKey);
    setError('');

    try {
      const payload = {
        month: selectedMonth,
        jar_key: jarKey,
        actual_balance_amount: row.actual_balance_amount,
        note: row.note,
        yield_enabled: row.yield_enabled,
        yield_activation_date: row.yield_activation_date,
        yield_rate_annual: row.yield_rate_annual
      };

      if (row.id) {
        await updateJarActualBalance(row.id, payload);
      } else {
        await createJarActualBalance(payload);
      }

      setMessage(`Đã lưu số dư thực cho hũ ${jarKey} ở tháng ${selectedMonth}.`);
      await loadActualBalanceData();
    } catch (requestError) {
      setError(requestError.message || 'Không lưu được số dư thực của hũ.');
    } finally {
      setSavingJarKey('');
    }
  };

  const handleDeleteJar = async (jarKey) => {
    const row = formState[jarKey];

    if (!row?.id) {
      handleFieldChange(jarKey, 'actual_balance_amount', '');
      handleFieldChange(jarKey, 'note', '');
      return;
    }

    const isConfirmed = window.confirm('Bạn có chắc muốn xóa snapshot số dư thực của hũ này không?');

    if (!isConfirmed) {
      return;
    }

    setSavingJarKey(jarKey);
    setError('');

    try {
      await deleteJarActualBalance(row.id);
      setMessage(`Đã xóa số dư thực của hũ ${jarKey} ở tháng ${selectedMonth}.`);
      await loadActualBalanceData();
    } catch (requestError) {
      setError(requestError.message || 'Không xóa được snapshot số dư thực.');
    } finally {
      setSavingJarKey('');
    }
  };

  const handleSaveAll = async () => {
    const rowsToSave = jars.filter((jar) => formState[jar.jar_key]?.actual_balance_amount?.trim());

    if (rowsToSave.length === 0) {
      setError('Chưa có hũ nào có số dư để lưu.');
      return;
    }

    setIsSavingAll(true);
    setError('');

    try {
      await Promise.all(
        rowsToSave.map(async (jar) => {
          const row = formState[jar.jar_key];
          const payload = {
            month: selectedMonth,
            jar_key: jar.jar_key,
            actual_balance_amount: row.actual_balance_amount,
            note: row.note,
            yield_enabled: row.yield_enabled,
            yield_activation_date: row.yield_activation_date,
            yield_rate_annual: row.yield_rate_annual
          };

          if (row.id) {
            await updateJarActualBalance(row.id, payload);
            return;
          }

          await createJarActualBalance(payload);
        })
      );

      setMessage(`Đã lưu toàn bộ số dư thực của tháng ${selectedMonth}.`);
      await loadActualBalanceData();
    } catch (requestError) {
      setError(requestError.message || 'Không lưu được toàn bộ số dư thực.');
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleCopyPreviousMonth = () => {
    if (!previousMonth) {
      setError('Chưa có tháng trước nào để sao chép.');
      return;
    }

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
              note: previousRecord?.note || currentState[jar.jar_key]?.note || ''
              ,
              yield_enabled: previousRecord?.yield_enabled ?? currentState[jar.jar_key]?.yield_enabled ?? true,
              yield_activation_date:
                previousRecord?.yield_activation_date?.slice?.(0, 10) ||
                currentState[jar.jar_key]?.yield_activation_date ||
                '',
              yield_rate_annual:
                previousRecord?.yield_rate_annual != null
                  ? String(previousRecord.yield_rate_annual)
                  : currentState[jar.jar_key]?.yield_rate_annual || '',
              gross_yield_amount: currentState[jar.jar_key]?.gross_yield_amount || 0,
              withholding_tax_amount: currentState[jar.jar_key]?.withholding_tax_amount || 0,
              net_yield_amount: currentState[jar.jar_key]?.net_yield_amount || 0,
              yield_start_date: currentState[jar.jar_key]?.yield_start_date || '',
              last_yield_processed_at: currentState[jar.jar_key]?.last_yield_processed_at || ''
            }
          ];
        })
      )
    );
    setMessage(
      `Đã đổ dữ liệu tham chiếu từ tháng ${previousMonth}. Bạn cần bấm lưu để tạo snapshot mới cho tháng ${selectedMonth}.`
    );
    setError('');
  };

  const handleRunDailyYield = async () => {
    try {
      setIsRunningYield(true);
      setError('');
      const response = await runDailyYield({ processing_date: yieldProcessingDate });
      setMessage(
        `Đã chạy sinh lời ngày ${response.processing_date}. Có ${response.processed} hũ phát sinh lợi nhuận ròng.`
      );
      await loadActualBalanceData();
    } catch (requestError) {
      setError(requestError.message || 'Không chạy được sinh lời hằng ngày.');
    } finally {
      setIsRunningYield(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.section
        id="actual-balances-overview"
        data-assistant-target="actual-balances-overview"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(16,185,129,0.18)_0%,rgba(59,130,246,0.18)_45%,rgba(15,15,35,0.96)_100%)] p-6 shadow-2xl shadow-slate-950/20"
      >
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100/80">
              Actual balances
            </div>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Lưu số dư thực từng hũ theo tháng để tháng mới không tạo cảm giác còn nhiều tiền.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              {message}. Màn này dành cho phần tiền bạn thực sự đang giữ lại, tách riêng khỏi ngân
              sách đang vận hành của tháng mới.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Tháng đang nhập</p>
                <p className="mt-2 text-3xl font-bold text-white">{selectedMonth}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Tổng số dư thực</p>
                <p className="mt-2 text-3xl font-bold text-white">{formatCurrency(selectedMonthTotal)}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Tháng tham chiếu</p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {previousMonth ? formatCurrency(previousMonthTotal) : '--'}
                </p>
                <p className="mt-2 text-xs text-slate-300">
                  {previousMonth ? `Lấy từ ${previousMonth}` : 'Chưa có tháng trước'}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Lãi gộp tháng</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {formatCurrency(selectedMonthGrossYieldTotal)}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Thuế tạm khấu trừ</p>
                <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(selectedMonthTaxTotal)}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Lãi ròng tháng</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {formatCurrency(selectedMonthNetYieldTotal)}
                </p>
              </div>
            </div>
          </div>

          <div
            id="actual-balances-rule"
            data-assistant-target="actual-balances-rule"
            className="rounded-[28px] border border-white/10 bg-slate-950/35 p-5 backdrop-blur"
          >
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-200">
                <BanknotesIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Rule nhập tiền</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Không để lệch đơn vị</h2>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-300">
              <p>{moneyInputHint}</p>
              <p className="mt-3">Ví dụ: `83,869` sẽ lưu là 83.869đ, còn `83869` sẽ hiểu là 83.869.000đ.</p>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Chọn tháng
                </span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none"
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="block flex-1 rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Ngày chạy sinh lời
                  </span>
                  <input
                    type="date"
                    value={yieldProcessingDate}
                    onChange={(event) => setYieldProcessingDate(event.target.value)}
                    onFocus={(event) => event.target.showPicker?.()}
                    onClick={(event) => event.target.showPicker?.()}
                    className="w-full bg-transparent text-sm text-white outline-none"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleCopyPreviousMonth}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <DocumentDuplicateIcon className="h-4 w-4" />
                  Dùng dữ liệu tháng trước
                </button>
                <button
                  type="button"
                  onClick={handleRunDailyYield}
                  disabled={isRunningYield}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${isRunningYield ? 'animate-spin' : ''}`} />
                  {isRunningYield ? 'Đang tính lãi...' : 'Chạy sinh lời ngày'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={isSavingAll}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-(--hero-gradient) px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${isSavingAll ? 'animate-spin' : ''}`} />
                  {isSavingAll ? 'Đang lưu toàn bộ' : 'Lưu toàn bộ tháng'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {error ? (
        <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      <section
        id="actual-balances-grid"
        data-assistant-target="actual-balances-grid"
        className="grid gap-4 xl:grid-cols-2"
      >
        {jars.map((jar) => {
          const row = formState[jar.jar_key] || {
            id: '',
            actual_balance_amount: '',
            note: '',
            yield_enabled: true,
            yield_activation_date: '',
            yield_rate_annual: '',
            gross_yield_amount: 0,
            withholding_tax_amount: 0,
            net_yield_amount: 0,
            yield_start_date: '',
            last_yield_processed_at: ''
          };
          const previewAmount = parseMoneyInputPreview(row.actual_balance_amount);
          const previousRecord = previousMonthActualBalanceMap.get(jar.jar_key);
          const isSavingJar = savingJarKey === jar.jar_key;

          return (
            <article
              key={jar.jar_key}
              className="rounded-[28px] border border-white/10 bg-(--surface-strong) p-5 shadow-lg shadow-slate-950/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    {jar.jar_key}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{jar.display_name_vi}</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Snapshot tháng {selectedMonth} chỉ để ghi nhận tiền thực bạn đang giữ.
                  </p>
                </div>
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                  {row.id ? 'Đã lưu' : 'Chưa lưu'}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Số dư tham chiếu</p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {previousRecord ? formatCurrency(previousRecord.actual_balance_amount) : '--'}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {previousMonth ? `Snapshot ${previousMonth}` : 'Chưa có snapshot tháng trước'}
                  </p>
                </div>
                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/80">Giá trị sẽ lưu</p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {previewAmount != null ? formatCurrency(previewAmount) : '--'}
                  </p>
                  <p className="mt-2 text-xs text-emerald-100/80">Đây là số sau khi app chuẩn hóa đơn vị.</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Lãi gộp</p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {formatCurrency(row.gross_yield_amount || 0)}
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Thuế 5%</p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {formatCurrency(row.withholding_tax_amount || 0)}
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Lãi ròng</p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {formatCurrency(row.net_yield_amount || 0)}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <label className="block rounded-3xl border border-white/10 bg-slate-950/35 px-4 py-3">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Số dư thực
                  </span>
                  <input
                    value={row.actual_balance_amount}
                    onChange={(event) =>
                      handleFieldChange(jar.jar_key, 'actual_balance_amount', event.target.value)
                    }
                    placeholder="Ví dụ: 83,869 hoặc 83869"
                    className="w-full bg-transparent text-sm text-white outline-none"
                  />
                </label>

                <label className="block rounded-3xl border border-white/10 bg-slate-950/35 px-4 py-3">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Ghi chú
                  </span>
                  <input
                    value={row.note}
                    onChange={(event) => handleFieldChange(jar.jar_key, 'note', event.target.value)}
                    placeholder="Ví dụ: Tiền còn lại giữ riêng, chưa nhập vào plan tháng mới"
                    className="w-full bg-transparent text-sm text-white outline-none"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-slate-950/35 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Sinh lời MoMo
                        </p>
                        <p className="mt-2 text-sm text-white">
                          {row.yield_enabled ? 'Đang bật' : 'Đang tắt'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleYieldToggle(jar.jar_key)}
                        className={[
                          'rounded-full px-4 py-2 text-sm font-semibold transition',
                          row.yield_enabled
                            ? 'bg-emerald-400/15 text-emerald-200'
                            : 'border border-white/10 bg-white/5 text-slate-300'
                        ].join(' ')}
                      >
                        {row.yield_enabled ? 'Bật' : 'Tắt'}
                      </button>
                    </div>
                  </div>

                  <label className="block rounded-3xl border border-white/10 bg-slate-950/35 px-4 py-3">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Tỷ suất năm (%)
                    </span>
                    <input
                      value={row.yield_rate_annual}
                      onChange={(event) =>
                        handleFieldChange(jar.jar_key, 'yield_rate_annual', event.target.value)
                      }
                      placeholder="Ví dụ: 4.5"
                      className="w-full bg-transparent text-sm text-white outline-none"
                    />
                  </label>

                  <label className="block rounded-3xl border border-white/10 bg-slate-950/35 px-4 py-3">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Ngày kích hoạt sinh lời
                    </span>
                    <input
                      type="date"
                      value={row.yield_activation_date}
                      onChange={(event) =>
                        handleFieldChange(jar.jar_key, 'yield_activation_date', event.target.value)
                      }
                      onFocus={(event) => event.target.showPicker?.()}
                      onClick={(event) => event.target.showPicker?.()}
                      className="w-full bg-transparent text-sm text-white outline-none"
                    />
                  </label>

                  <div className="rounded-3xl border border-white/10 bg-slate-950/35 px-4 py-3">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Bắt đầu tính lãi
                    </span>
                    <p className="text-sm text-white">{row.yield_start_date || '--'}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      App tính sau 2 ngày kể từ ngày kích hoạt.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-slate-950/35 px-4 py-3 sm:col-span-2">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Lần chạy gần nhất
                    </span>
                    <p className="text-sm text-white">{row.last_yield_processed_at || '--'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => handleDeleteJar(jar.jar_key)}
                  disabled={isSavingJar}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <TrashIcon className="h-4 w-4" />
                  {row.id ? 'Xóa snapshot' : 'Xóa nội dung đang nhập'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveJar(jar.jar_key)}
                  disabled={isSavingJar}
                  className="rounded-2xl bg-(--hero-gradient) px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
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
