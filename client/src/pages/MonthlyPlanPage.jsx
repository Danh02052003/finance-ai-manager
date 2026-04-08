import { SparklesIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  createJarAllocation,
  createMonthlyIncome,
  deleteJarAllocation,
  deleteMonthlyIncome,
  getJarAllocations,
  getJars,
  getMonthlyIncomes,
  updateJarAllocation,
  updateMonthlyIncome
} from '../api/dashboardApi.js';
import JarAllocationTable from '../components/JarAllocationTable.jsx';
import MonthlyIncomeTable from '../components/MonthlyIncomeTable.jsx';
import { formatCurrency } from '../components/formatters.js';
import {
  formatMoneyInputValue,
  getCurrentMonthValue,
  moneyInputHint,
  parseMoneyInputPreview
} from '../utils/moneyInput.js';

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CLASSIC_JAR_RATIOS = {
  essentials: 55,
  long_term_saving: 10,
  education: 10,
  enjoyment: 10,
  financial_freedom: 10,
  charity: 5
};

const defaultIncomeForm = {
  month: getCurrentMonthValue(),
  total_amount: '',
  income_date: getTodayDateString(),
  source_note: '',
  allocation_mode: 'split_classic',
  target_jar_key: 'essentials'
};

const MonthlyPlanPage = () => {
  const incomeFormRef = useRef(null);
  const [monthlyIncomes, setMonthlyIncomes] = useState([]);
  const [jarAllocations, setJarAllocations] = useState([]);
  const [jars, setJars] = useState([]);
  const [incomeForm, setIncomeForm] = useState(defaultIncomeForm);
  const [editingIncomeId, setEditingIncomeId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadMonthlyPlanData = async () => {
    try {
      const [incomeResponse, allocationResponse, jarResponse] = await Promise.all([
        getMonthlyIncomes(),
        getJarAllocations(),
        getJars()
      ]);
      setMonthlyIncomes(Array.isArray(incomeResponse.data) ? incomeResponse.data : []);
      setJarAllocations(Array.isArray(allocationResponse.data) ? allocationResponse.data : []);
      setJars(Array.isArray(jarResponse.data) ? jarResponse.data : []);
      setError('');
    } catch {
      setError('Không tải được dữ liệu kế hoạch tháng.');
    }
  };

  useEffect(() => {
    loadMonthlyPlanData();
  }, []);

  const focusedIncome = monthlyIncomes.find((item) => item._id === editingIncomeId) || monthlyIncomes[0] || null;
  const focusedAllocations = useMemo(
    () =>
      jarAllocations.filter(
        (item) =>
          item.monthly_income_id === focusedIncome?._id ||
          (focusedIncome?.month && item.month === focusedIncome.month)
      ),
    [focusedIncome, jarAllocations]
  );
  const allocatedTotal = focusedAllocations.reduce((sum, item) => sum + (item.allocated_amount || 0), 0);
  const focusedIncomeTotal = focusedIncome?.total_amount || 0;
  const remainingAmount = focusedIncomeTotal - allocatedTotal;
  const completionRate = focusedIncomeTotal
    ? Math.min(100, Math.max(0, Math.round((allocatedTotal / focusedIncomeTotal) * 100)))
    : 0;
  const incomeAmountPreview = parseMoneyInputPreview(incomeForm.total_amount);

  const handleIncomeChange = (event) => {
    const { name, value } = event.target;
    setIncomeForm((currentForm) => ({
      ...currentForm,
      [name]: value,
      ...(name === 'income_date' && value ? { month: value.slice(0, 7) } : {})
    }));
  };

  const resetIncomeForm = () => {
    setIncomeForm(defaultIncomeForm);
    setEditingIncomeId('');
  };

  const syncAutoAllocations = async (monthlyIncomeId, totalAmount, month, allocationMode, targetJarKey) => {
    const existingAllocations = jarAllocations.filter(
      (item) => item.monthly_income_id === monthlyIncomeId || item.month === month
    );
    const desiredAllocations =
      allocationMode === 'single_jar'
        ? [{ jar_key: targetJarKey, allocated_amount: Math.round(Number(totalAmount)), allocation_percentage: 100, note: 'Dồn toàn bộ vào một hũ.' }]
        : Object.entries(CLASSIC_JAR_RATIOS).map(([jarKey, percentage]) => ({
            jar_key: jarKey,
            allocated_amount: Math.round((Number(totalAmount) * percentage) / 100),
            allocation_percentage: percentage,
            note: 'Tự chia theo tỷ lệ 6 hũ.'
          }));

    await Promise.all(
      existingAllocations
        .filter((item) => !desiredAllocations.some((allocation) => allocation.jar_key === item.jar_key))
        .map((item) => deleteJarAllocation(item._id))
    );

    await Promise.all(
      desiredAllocations.map(async (allocation) => {
        const existing = existingAllocations.find((item) => item.jar_key === allocation.jar_key);
        const payload = {
          monthly_income_id: monthlyIncomeId,
          jar_key: allocation.jar_key,
          allocated_amount: String(allocation.allocated_amount),
          allocation_percentage: String(allocation.allocation_percentage),
          note: allocation.note
        };

        if (existing?._id) {
          await updateJarAllocation(existing._id, payload);
          return;
        }

        await createJarAllocation(payload);
      })
    );
  };

  const handleIncomeSubmit = async (event) => {
    event.preventDefault();

    try {
      const normalizedIncomePayload = {
        month: incomeForm.income_date?.slice(0, 7) || incomeForm.month,
        total_amount: incomeForm.total_amount,
        income_date: incomeForm.income_date,
        source_note: incomeForm.source_note
      };

      if (editingIncomeId) {
        const response = await updateMonthlyIncome(editingIncomeId, normalizedIncomePayload);
        const savedIncome = response?.data;
        await syncAutoAllocations(
          editingIncomeId,
          savedIncome?.total_amount || incomeAmountPreview || 0,
          savedIncome?.month || normalizedIncomePayload.month,
          incomeForm.allocation_mode,
          incomeForm.target_jar_key
        );
        setMessage('Đã cập nhật thu nhập và phân bổ lại.');
      } else {
        const response = await createMonthlyIncome(normalizedIncomePayload);
        const createdIncome = response?.data;

        if (createdIncome?._id) {
          await syncAutoAllocations(
            createdIncome._id,
            createdIncome.total_amount || incomeAmountPreview || 0,
            createdIncome.month || normalizedIncomePayload.month,
            incomeForm.allocation_mode,
            incomeForm.target_jar_key
          );
        }

        setMessage(
          incomeForm.allocation_mode === 'single_jar'
            ? 'Đã tạo thu nhập và dồn vào hũ đã chọn.'
            : 'Đã tạo thu nhập và phân bổ tự động theo 6 hũ.'
        );
      }

      resetIncomeForm();
      await loadMonthlyPlanData();
    } catch (requestError) {
      setError(requestError.message || 'Không lưu được thu nhập tháng.');
    }
  };

  const handleEditIncome = (monthlyIncome) => {
    const relatedAllocations = jarAllocations.filter(
      (item) =>
        item.monthly_income_id === monthlyIncome._id ||
        (monthlyIncome.month && item.month === monthlyIncome.month)
    );
    const singleAllocation =
      relatedAllocations.length === 1 && Number(relatedAllocations[0]?.allocation_percentage || 0) === 100
        ? relatedAllocations[0]
        : null;

    setEditingIncomeId(monthlyIncome._id);
    setIncomeForm({
      month: monthlyIncome.month || '',
      total_amount: formatMoneyInputValue(monthlyIncome.total_amount),
      income_date: monthlyIncome.income_date?.slice(0, 10) || `${monthlyIncome.month}-01`,
      source_note: monthlyIncome.source_note || '',
      allocation_mode: singleAllocation ? 'single_jar' : 'split_classic',
      target_jar_key: singleAllocation?.jar_key || 'essentials'
    });
    incomeFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDeleteIncome = async (monthlyIncome) => {
    if (!window.confirm('Xóa thu nhập này? Phân bổ liên quan cũng sẽ bị xóa.')) {
      return;
    }

    try {
      await deleteMonthlyIncome(monthlyIncome._id);
      if (editingIncomeId === monthlyIncome._id) resetIncomeForm();
      setMessage('Đã xóa thu nhập tháng.');
      await loadMonthlyPlanData();
    } catch (requestError) {
      setError(requestError.message || 'Không xóa được.');
    }
  };

  return (
    <div className="space-y-5">
      <motion.section
        id="monthly-plan-overview"
        data-assistant-target="monthly-plan-overview"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(135deg,rgba(99,102,241,0.15)_0%,rgba(139,92,246,0.1)_45%,rgba(10,10,26,0.97)_100%)] p-5 sm:p-6"
      >
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Kế hoạch tháng
            </h1>
            <p className="mt-2 max-w-lg text-sm text-slate-400">
              Nhập thu nhập để hệ thống tự phân bổ 6 hũ. Cập nhật bất cứ lúc nào và phân bổ sẽ được đồng bộ tự động.
            </p>
            {message ? <p className="mt-3 text-sm text-emerald-300/80">{message}</p> : null}

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.06] p-4">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Tháng</p>
                <p className="mt-1.5 text-2xl font-bold tabular-nums text-white">{focusedIncome?.month || '--'}</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.06] p-4">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Thu nhập</p>
                <p className="mt-1.5 text-2xl font-bold tabular-nums text-white">{formatCurrency(focusedIncomeTotal)}</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.06] p-4">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Chưa phân bổ</p>
                <p className="mt-1.5 text-2xl font-bold tabular-nums text-white">{formatCurrency(remainingAmount)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Tiến độ phân bổ</h2>
              <span className="rounded-md bg-indigo-500/15 px-2 py-0.5 text-xs font-semibold tabular-nums text-indigo-300">
                {completionRate}%
              </span>
            </div>

            <div className="mt-4 h-2 rounded-full bg-white/[0.08]">
              <div
                className="h-2 rounded-full bg-(--hero-gradient) transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>

            <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.04] p-4">
              <div className="flex items-center gap-2 text-indigo-300">
                <SparklesIcon className="h-4 w-4" />
                <span className="text-xs font-semibold">Gợi ý</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                Khi cập nhật thu nhập, hệ thống tự đồng bộ phân bổ theo tỷ lệ chuẩn hoặc hũ bạn chọn.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {error ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{error}</div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <article
          id="monthly-plan-income-form"
          data-assistant-target="monthly-plan-income-form"
          ref={incomeFormRef}
          className="rounded-2xl border border-white/[0.06] bg-(--surface-strong) p-5"
        >
          <h2 className="text-base font-semibold text-white">
            {editingIncomeId ? 'Chỉnh sửa thu nhập' : 'Nhập thu nhập mới'}
          </h2>

          <form onSubmit={handleIncomeSubmit} className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Tổng thu nhập</span>
                <input name="total_amount" type="text" value={incomeForm.total_amount} onChange={handleIncomeChange} required className="w-full bg-transparent text-sm text-white outline-none" />
                <p className="mt-1.5 text-[11px] text-slate-600">{moneyInputHint}</p>
              </label>
              <label className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Ngày nhận</span>
                <input type="date" name="income_date" value={incomeForm.income_date} onChange={handleIncomeChange} onFocus={(e) => e.target.showPicker?.()} onClick={(e) => e.target.showPicker?.()} required className="w-full bg-transparent text-sm text-white outline-none" />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Tháng lưu</p>
                <p className="mt-1.5 text-sm font-semibold tabular-nums text-white">{incomeForm.income_date?.slice(0, 7) || '--'}</p>
              </div>
              <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.06] px-3 py-2.5">
                <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-400/70">Giá trị</p>
                <p className="mt-1.5 text-sm font-semibold tabular-nums text-white">{incomeAmountPreview != null ? formatCurrency(incomeAmountPreview) : '--'}</p>
              </div>
            </div>

            <label className="block rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
              <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Ghi chú nguồn</span>
              <input name="source_note" value={incomeForm.source_note} onChange={handleIncomeChange} placeholder="VD: Lương tháng 4, thưởng..." className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600" />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Cách phân bổ</span>
                <select aria-label="Cách phân bổ" name="allocation_mode" value={incomeForm.allocation_mode} onChange={handleIncomeChange} className="w-full bg-transparent text-sm text-white outline-none">
                  <option value="split_classic">Chia 6 hũ chuẩn</option>
                  <option value="single_jar">Dồn vào một hũ</option>
                </select>
              </label>

              {incomeForm.allocation_mode === 'single_jar' ? (
                <label className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                  <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Hũ nhận</span>
                  <select aria-label="Hũ nhận" name="target_jar_key" value={incomeForm.target_jar_key} onChange={handleIncomeChange} className="w-full bg-transparent text-sm text-white outline-none">
                    {jars.map((jar) => <option key={jar._id} value={jar.jar_key}>{jar.display_name_vi}</option>)}
                  </select>
                </label>
              ) : (
                <div className="rounded-xl border border-indigo-500/15 bg-indigo-500/[0.06] px-3 py-2.5 text-xs text-indigo-300/80">
                  55% cần thiết · 10% cho 4 hũ tiếp · 5% từ thiện
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={resetIncomeForm} className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06]">Làm mới</button>
              <button type="submit" className="flex-1 rounded-xl bg-(--hero-gradient) py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/20 transition hover:shadow-indigo-900/30">{editingIncomeId ? 'Cập nhật' : 'Tạo thu nhập'}</button>
            </div>
          </form>
        </article>

        <article
          id="monthly-plan-allocation-board"
          data-assistant-target="monthly-plan-allocation-board"
          className="rounded-2xl border border-white/[0.06] bg-(--surface-strong) p-5"
        >
          <h2 className="text-base font-semibold text-white">Phân bổ hiện tại</h2>

          <div className="mt-4 space-y-2.5">
            {focusedAllocations.length > 0 ? (
              focusedAllocations.map((item) => {
                const progress = focusedIncomeTotal
                  ? Math.min(100, Math.round(((item.allocated_amount || 0) / focusedIncomeTotal) * 100))
                  : item.allocation_percentage || 0;

                return (
                  <div key={item._id} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-white">{item.jar_key}</span>
                      <span className="tabular-nums text-slate-400">{formatCurrency(item.allocated_amount || 0)}</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-white/[0.08]">
                      <div className="h-1.5 rounded-full bg-(--hero-gradient) transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{item.note || ''}</span>
                      <span className="tabular-nums">{typeof item.allocation_percentage === 'number' ? `${item.allocation_percentage}%` : `${progress}%`}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-white/[0.08] px-4 py-8 text-center text-sm text-slate-500">
                Chưa có phân bổ nào.
              </div>
            )}
          </div>
        </article>
      </section>

      <MonthlyIncomeTable items={monthlyIncomes} onEdit={handleEditIncome} onDelete={handleDeleteIncome} />
      <JarAllocationTable items={jarAllocations} />
    </div>
  );
};

export default MonthlyPlanPage;
