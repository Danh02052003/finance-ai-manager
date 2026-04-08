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
          actual_balance_amount: existingRecord ? formatMoneyInputValue(existingRecord.actual_balance_amount) : '',
          note: existingRecord?.note || '',
          yield_enabled: existingRecord?.yield_enabled ?? true,
          yield_activation_date: existingRecord?.yield_activation_date?.slice?.(0, 10) || '',
          yield_rate_annual: existingRecord?.yield_rate_annual != null ? String(existingRecord.yield_rate_annual) : '',
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
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [savingJarKey, setSavingJarKey] = useState('');
  const [isRunningYield, setIsRunningYield] = useState(false);
  const [yieldProcessingDate, setYieldProcessingDate] = useState(() => new Date().toISOString().slice(0, 10));

  const loadActualBalanceData = async () => {
    try {
      const [jarResponse, actualBalanceResponse] = await Promise.all([getJars(), getJarActualBalances()]);
      setJars(Array.isArray(jarResponse.data) ? jarResponse.data : []);
      setActualBalances(Array.isArray(actualBalanceResponse.data) ? actualBalanceResponse.data : []);
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Không tải được dữ liệu.');
    }
  };

  useEffect(() => { loadActualBalanceData(); }, []);

  const selectedMonthActualBalanceMap = useMemo(() => getActualBalanceMapByMonth(actualBalances, selectedMonth), [actualBalances, selectedMonth]);
  const previousMonth = useMemo(() => getPreviousActualBalanceMonth(actualBalances, selectedMonth), [actualBalances, selectedMonth]);
  const previousMonthActualBalanceMap = useMemo(() => getActualBalanceMapByMonth(actualBalances, previousMonth), [actualBalances, previousMonth]);

  useEffect(() => { setFormState(buildFormState(jars, selectedMonthActualBalanceMap)); }, [jars, selectedMonthActualBalanceMap]);

  const selectedMonthTotal = useMemo(() => jars.reduce((sum, jar) => { const v = parseMoneyInputPreview(formState[jar.jar_key]?.actual_balance_amount); return sum + (v || 0); }, 0), [formState, jars]);
  const previousMonthTotal = useMemo(() => sumActualBalanceMonth(actualBalances, previousMonth), [actualBalances, previousMonth]);
  const selectedMonthGrossYieldTotal = useMemo(() => (actualBalances || []).filter((i) => i.month === selectedMonth).reduce((s, i) => s + (i.gross_yield_amount || 0), 0), [actualBalances, selectedMonth]);
  const selectedMonthTaxTotal = useMemo(() => (actualBalances || []).filter((i) => i.month === selectedMonth).reduce((s, i) => s + (i.withholding_tax_amount || 0), 0), [actualBalances, selectedMonth]);
  const selectedMonthNetYieldTotal = useMemo(() => (actualBalances || []).filter((i) => i.month === selectedMonth).reduce((s, i) => s + (i.net_yield_amount || 0), 0), [actualBalances, selectedMonth]);

  const handleFieldChange = (jarKey, fieldName, value) => {
    setFormState((s) => ({ ...s, [jarKey]: { ...s[jarKey], [fieldName]: value } }));
  };

  const handleYieldToggle = (jarKey) => {
    setFormState((s) => ({ ...s, [jarKey]: { ...s[jarKey], yield_enabled: !s[jarKey]?.yield_enabled } }));
  };

  const handleSaveJar = async (jarKey) => {
    const row = formState[jarKey];
    if (!row?.actual_balance_amount?.trim()) { setError('Nhập số dư trước khi lưu.'); return; }
    setSavingJarKey(jarKey); setError('');
    try {
      const payload = { month: selectedMonth, jar_key: jarKey, actual_balance_amount: row.actual_balance_amount, note: row.note, yield_enabled: row.yield_enabled, yield_activation_date: row.yield_activation_date, yield_rate_annual: row.yield_rate_annual };
      if (row.id) { await updateJarActualBalance(row.id, payload); } else { await createJarActualBalance(payload); }
      setMessage(`Đã lưu số dư hũ ${jarKey}.`);
      await loadActualBalanceData();
    } catch (e) { setError(e.message || 'Không lưu được.'); } finally { setSavingJarKey(''); }
  };

  const handleDeleteJar = async (jarKey) => {
    const row = formState[jarKey];
    if (!row?.id) { handleFieldChange(jarKey, 'actual_balance_amount', ''); handleFieldChange(jarKey, 'note', ''); return; }
    if (!window.confirm('Xóa snapshot này?')) return;
    setSavingJarKey(jarKey); setError('');
    try { await deleteJarActualBalance(row.id); setMessage(`Đã xóa snapshot hũ ${jarKey}.`); await loadActualBalanceData(); }
    catch (e) { setError(e.message || 'Không xóa được.'); } finally { setSavingJarKey(''); }
  };

  const handleSaveAll = async () => {
    const rows = jars.filter((j) => formState[j.jar_key]?.actual_balance_amount?.trim());
    if (!rows.length) { setError('Chưa có hũ nào có dữ liệu.'); return; }
    setIsSavingAll(true); setError('');
    try {
      await Promise.all(rows.map(async (jar) => {
        const row = formState[jar.jar_key];
        const payload = { month: selectedMonth, jar_key: jar.jar_key, actual_balance_amount: row.actual_balance_amount, note: row.note, yield_enabled: row.yield_enabled, yield_activation_date: row.yield_activation_date, yield_rate_annual: row.yield_rate_annual };
        if (row.id) { await updateJarActualBalance(row.id, payload); } else { await createJarActualBalance(payload); }
      }));
      setMessage(`Đã lưu tất cả số dư tháng ${selectedMonth}.`);
      await loadActualBalanceData();
    } catch (e) { setError(e.message || 'Không lưu được.'); } finally { setIsSavingAll(false); }
  };

  const handleCopyPreviousMonth = () => {
    if (!previousMonth) { setError('Chưa có dữ liệu tháng trước.'); return; }
    setFormState((s) => Object.fromEntries(jars.map((jar) => {
      const prev = previousMonthActualBalanceMap.get(jar.jar_key);
      return [jar.jar_key, {
        id: s[jar.jar_key]?.id || '',
        actual_balance_amount: prev ? formatMoneyInputValue(prev.actual_balance_amount) : s[jar.jar_key]?.actual_balance_amount || '',
        note: prev?.note || s[jar.jar_key]?.note || '',
        yield_enabled: prev?.yield_enabled ?? s[jar.jar_key]?.yield_enabled ?? true,
        yield_activation_date: prev?.yield_activation_date?.slice?.(0, 10) || s[jar.jar_key]?.yield_activation_date || '',
        yield_rate_annual: prev?.yield_rate_annual != null ? String(prev.yield_rate_annual) : s[jar.jar_key]?.yield_rate_annual || '',
        gross_yield_amount: s[jar.jar_key]?.gross_yield_amount || 0,
        withholding_tax_amount: s[jar.jar_key]?.withholding_tax_amount || 0,
        net_yield_amount: s[jar.jar_key]?.net_yield_amount || 0,
        yield_start_date: s[jar.jar_key]?.yield_start_date || '',
        last_yield_processed_at: s[jar.jar_key]?.last_yield_processed_at || ''
      }];
    })));
    setMessage(`Đã sao chép từ tháng ${previousMonth}. Nhấn lưu để tạo snapshot mới.`);
    setError('');
  };

  const handleRunDailyYield = async () => {
    try {
      setIsRunningYield(true); setError('');
      const response = await runDailyYield({ processing_date: yieldProcessingDate });
      setMessage(`Tính lãi ngày ${response.processing_date}: ${response.processed} hũ có lợi nhuận.`);
      await loadActualBalanceData();
    } catch (e) { setError(e.message || 'Không tính được lãi.'); } finally { setIsRunningYield(false); }
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
              Ghi nhận số tiền thực đang giữ theo từng hũ. Tách riêng khỏi ngân sách tháng mới để tránh ảo giác còn nhiều tiền.
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
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Tham chiếu</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-white">{previousMonth ? formatCurrency(previousMonthTotal) : '--'}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{previousMonth ? `Từ ${previousMonth}` : 'Chưa có'}</p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.06] p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Lãi gộp</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-white">{formatCurrency(selectedMonthGrossYieldTotal)}</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.06] p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Thuế 5%</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-white">{formatCurrency(selectedMonthTaxTotal)}</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.06] p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Lãi ròng</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-white">{formatCurrency(selectedMonthNetYieldTotal)}</p>
              </div>
            </div>
          </div>

          <div id="actual-balances-rule" data-assistant-target="actual-balances-rule" className="rounded-2xl border border-white/[0.08] bg-black/20 p-5 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-emerald-500/15 p-2.5 text-emerald-300"><BanknotesIcon className="h-5 w-5" /></span>
              <div>
                <p className="text-sm font-semibold text-white">Hướng dẫn nhập</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.04] p-3 text-xs leading-relaxed text-slate-400">
              <p>{moneyInputHint}</p>
              <p className="mt-2">VD: `83,869` = 83.869đ · `83869` = 83.869.000đ</p>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5">
                <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Tháng</span>
                <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full bg-transparent text-sm text-white outline-none" />
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="block flex-1 rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5">
                  <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Ngày tính lãi</span>
                  <input type="date" value={yieldProcessingDate} onChange={(e) => setYieldProcessingDate(e.target.value)} onFocus={(e) => e.target.showPicker?.()} onClick={(e) => e.target.showPicker?.()} className="w-full bg-transparent text-sm text-white outline-none" />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={handleCopyPreviousMonth} className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/[0.08]"><DocumentDuplicateIcon className="h-3.5 w-3.5" />Sao chép tháng trước</button>
                <button type="button" onClick={handleRunDailyYield} disabled={isRunningYield} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/15 disabled:opacity-50"><ArrowPathIcon className={`h-3.5 w-3.5 ${isRunningYield ? 'animate-spin' : ''}`} />{isRunningYield ? 'Đang tính...' : 'Tính lãi ngày'}</button>
                <button type="button" onClick={handleSaveAll} disabled={isSavingAll} className="inline-flex items-center gap-1.5 rounded-lg bg-(--hero-gradient) px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-900/20 transition hover:shadow-indigo-900/30 disabled:opacity-50"><ArrowPathIcon className={`h-3.5 w-3.5 ${isSavingAll ? 'animate-spin' : ''}`} />{isSavingAll ? 'Đang lưu...' : 'Lưu tất cả'}</button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {error ? <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{error}</div> : null}

      <section id="actual-balances-grid" data-assistant-target="actual-balances-grid" className="grid gap-4 xl:grid-cols-2">
        {jars.map((jar) => {
          const row = formState[jar.jar_key] || { id: '', actual_balance_amount: '', note: '', yield_enabled: true, yield_activation_date: '', yield_rate_annual: '', gross_yield_amount: 0, withholding_tax_amount: 0, net_yield_amount: 0, yield_start_date: '', last_yield_processed_at: '' };
          const previewAmount = parseMoneyInputPreview(row.actual_balance_amount);
          const previousRecord = previousMonthActualBalanceMap.get(jar.jar_key);
          const isSavingJar = savingJarKey === jar.jar_key;

          return (
            <article key={jar.jar_key} className="rounded-2xl border border-white/[0.06] bg-(--surface-strong) p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-white">{jar.display_name_vi}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Snapshot tháng {selectedMonth}</p>
                </div>
                <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${row.id ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/[0.06] text-slate-500'}`}>
                  {row.id ? 'Đã lưu' : 'Mới'}
                </span>
              </div>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Tham chiếu</p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-white">{previousRecord ? formatCurrency(previousRecord.actual_balance_amount) : '--'}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{previousMonth ? `Tháng ${previousMonth}` : 'Chưa có'}</p>
                </div>
                <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.06] p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-400/70">Sẽ lưu</p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-white">{previewAmount != null ? formatCurrency(previewAmount) : '--'}</p>
                </div>
              </div>

              <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Lãi gộp</p>
                  <p className="mt-1 text-sm font-bold tabular-nums text-white">{formatCurrency(row.gross_yield_amount || 0)}</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Thuế</p>
                  <p className="mt-1 text-sm font-bold tabular-nums text-white">{formatCurrency(row.withholding_tax_amount || 0)}</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Lãi ròng</p>
                  <p className="mt-1 text-sm font-bold tabular-nums text-white">{formatCurrency(row.net_yield_amount || 0)}</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <label className="block rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                  <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Số dư thực</span>
                  <input value={row.actual_balance_amount} onChange={(e) => handleFieldChange(jar.jar_key, 'actual_balance_amount', e.target.value)} placeholder="VD: 83,869" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600" />
                </label>
                <label className="block rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                  <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Ghi chú</span>
                  <input value={row.note} onChange={(e) => handleFieldChange(jar.jar_key, 'note', e.target.value)} placeholder="Ghi chú tùy chọn" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600" />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Sinh lời MoMo</p>
                        <p className="mt-1 text-sm text-white">{row.yield_enabled ? 'Bật' : 'Tắt'}</p>
                      </div>
                      <button type="button" onClick={() => handleYieldToggle(jar.jar_key)} className={['rounded-lg px-3 py-1.5 text-xs font-medium transition', row.yield_enabled ? 'bg-emerald-500/15 text-emerald-300' : 'border border-white/[0.08] text-slate-400'].join(' ')}>{row.yield_enabled ? 'Bật' : 'Tắt'}</button>
                    </div>
                  </div>
                  <label className="block rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                    <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Tỷ suất năm (%)</span>
                    <input value={row.yield_rate_annual} onChange={(e) => handleFieldChange(jar.jar_key, 'yield_rate_annual', e.target.value)} placeholder="VD: 4.5" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600" />
                  </label>
                  <label className="block rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                    <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Ngày kích hoạt</span>
                    <input type="date" value={row.yield_activation_date} onChange={(e) => handleFieldChange(jar.jar_key, 'yield_activation_date', e.target.value)} onFocus={(e) => e.target.showPicker?.()} onClick={(e) => e.target.showPicker?.()} className="w-full bg-transparent text-sm text-white outline-none" />
                  </label>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Lần chạy gần nhất</p>
                    <p className="mt-1.5 text-sm text-white">{row.last_yield_processed_at || '--'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => handleDeleteJar(jar.jar_key)} disabled={isSavingJar} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] disabled:opacity-50"><TrashIcon className="h-4 w-4" />{row.id ? 'Xóa' : 'Xoá nội dung'}</button>
                <button type="button" onClick={() => handleSaveJar(jar.jar_key)} disabled={isSavingJar} className="flex-1 rounded-xl bg-(--hero-gradient) py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/20 transition hover:shadow-indigo-900/30 disabled:opacity-50">{isSavingJar ? 'Đang lưu...' : 'Lưu hũ này'}</button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
};

export default ActualBalancesPage;
