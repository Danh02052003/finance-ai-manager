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
  const [message, setMessage] = useState('Đang tải dữ liệu kế hoạch tháng.');
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
      setMessage('Dữ liệu kế hoạch tháng đã sẵn sàng.');
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

  const syncAutoAllocations = async (
    monthlyIncomeId,
    totalAmount,
    month,
    allocationMode,
    targetJarKey
  ) => {
    const existingAllocations = jarAllocations.filter(
      (item) => item.monthly_income_id === monthlyIncomeId || item.month === month
    );
    const desiredAllocations =
      allocationMode === 'single_jar'
        ? [
            {
              jar_key: targetJarKey,
              allocated_amount: Math.round(Number(totalAmount)),
              allocation_percentage: 100,
              note: 'Dồn toàn bộ thu nhập tháng vào một hũ.'
            }
          ]
        : Object.entries(CLASSIC_JAR_RATIOS).map(([jarKey, percentage]) => ({
            jar_key: jarKey,
            allocated_amount: Math.round((Number(totalAmount) * percentage) / 100),
            allocation_percentage: percentage,
            note: 'Tự chia theo tỷ lệ 6 hũ chuẩn.'
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
        setMessage('Đã cập nhật thu nhập tháng và làm mới phân bổ.');
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
            ? 'Đã tạo thu nhập tháng và dồn toàn bộ vào hũ đã chọn.'
            : 'Đã tạo thu nhập tháng và tự chia theo tỷ lệ 6 hũ.'
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
      relatedAllocations.length === 1 &&
      Number(relatedAllocations[0]?.allocation_percentage || 0) === 100
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
    const isConfirmed = window.confirm(
      'Bạn có chắc muốn xóa thu nhập tháng này? Các phân bổ liên quan cũng sẽ bị xóa.'
    );

    if (!isConfirmed) {
      return;
    }

    try {
      await deleteMonthlyIncome(monthlyIncome._id);
      if (editingIncomeId === monthlyIncome._id) {
        resetIncomeForm();
      }
      setMessage('Đã xóa thu nhập tháng.');
      await loadMonthlyPlanData();
    } catch (requestError) {
      setError(requestError.message || 'Không xóa được thu nhập tháng.');
    }
  };

  return (
    <div className="space-y-6">
      <motion.section
        id="monthly-plan-overview"
        data-assistant-target="monthly-plan-overview"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(102,126,234,0.24)_0%,rgba(118,75,162,0.18)_45%,rgba(15,15,35,0.96)_100%)] p-6 shadow-2xl shadow-slate-950/20"
      >
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-100/80">
              Monthly planning
            </div>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Biến thu nhập tháng thành plan 6 hũ rõ ràng và dễ theo dõi.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              {message}. Đây là khối summary duy nhất của tháng đang focus, nên tôi đã bỏ các khối nhắc lại cùng bộ
              số ở phía dưới.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Tháng focus</p>
                <p className="mt-2 text-3xl font-bold text-white">{focusedIncome?.month || '--'}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Thu nhập</p>
                <p className="mt-2 text-3xl font-bold text-white">{formatCurrency(focusedIncomeTotal)}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Còn lại</p>
                <p className="mt-2 text-3xl font-bold text-white">{formatCurrency(remainingAmount)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Progress</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Mức hoàn thiện plan</h2>
              </div>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-300">
                {completionRate}%
              </span>
            </div>

            <div className="mt-6 h-3 rounded-full bg-white/10">
              <div
                className="h-3 rounded-full bg-(--hero-gradient)"
                style={{ width: `${completionRate}%` }}
              />
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-emerald-200">
                <SparklesIcon className="h-5 w-5" />
                <span className="text-sm font-semibold">Planning note</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Khi bạn cập nhật thu nhập tháng, app sẽ tự đồng bộ allocations thay vì bắt nhập tay từng hũ.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {error ? (
        <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <article
          id="monthly-plan-income-form"
          data-assistant-target="monthly-plan-income-form"
          ref={incomeFormRef}
          className="rounded-[28px] border border-white/10 bg-(--surface-strong) p-5 shadow-lg shadow-slate-950/20"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Thu nhập tháng
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {editingIncomeId ? 'Chỉnh sửa thu nhập' : 'Tạo thu nhập mới'}
          </h2>

          <form onSubmit={handleIncomeSubmit} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="rounded-3xl border border-white/10 bg-slate-950/35 px-4 py-3">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Tổng thu nhập
                </span>
                <input
                  name="total_amount"
                  type="text"
                  value={incomeForm.total_amount}
                  onChange={handleIncomeChange}
                  required
                  className="w-full bg-transparent text-sm text-white outline-none"
                />
                <p className="mt-2 text-xs text-slate-500">{moneyInputHint}</p>
              </label>

              <label className="rounded-3xl border border-white/10 bg-slate-950/35 px-4 py-3">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Ngày nhận
                </span>
                <input
                  type="date"
                  name="income_date"
                  value={incomeForm.income_date}
                  onChange={handleIncomeChange}
                  onFocus={(event) => event.target.showPicker?.()}
                  onClick={(event) => event.target.showPicker?.()}
                  required
                  className="w-full bg-transparent text-sm text-white outline-none"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Tháng sẽ lưu
                </p>
                <p className="mt-2 font-semibold text-white">{incomeForm.income_date?.slice(0, 7) || '--'}</p>
              </div>
              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/80">
                  Giá trị sẽ lưu
                </p>
                <p className="mt-2 font-semibold text-white">
                  {incomeAmountPreview != null ? formatCurrency(incomeAmountPreview) : '--'}
                </p>
              </div>
            </div>

            <label className="block rounded-3xl border border-white/10 bg-slate-950/35 px-4 py-3">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Ghi chú nguồn
              </span>
              <input
                name="source_note"
                value={incomeForm.source_note}
                onChange={handleIncomeChange}
                className="w-full bg-transparent text-sm text-white outline-none"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="rounded-3xl border border-white/10 bg-slate-950/35 px-4 py-3">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Cách xử lý thu nhập
                </span>
                <select
                  aria-label="Cách xử lý thu nhập"
                  name="allocation_mode"
                  value={incomeForm.allocation_mode}
                  onChange={handleIncomeChange}
                  className="w-full bg-transparent text-sm text-white outline-none"
                >
                  <option value="split_classic">Chia theo 6 hũ chuẩn</option>
                  <option value="single_jar">Dồn vào một hũ</option>
                </select>
              </label>

              {incomeForm.allocation_mode === 'single_jar' ? (
                <label className="rounded-3xl border border-white/10 bg-slate-950/35 px-4 py-3">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Dồn vào hũ
                  </span>
                  <select
                    aria-label="Hũ nhận thu nhập"
                    name="target_jar_key"
                    value={incomeForm.target_jar_key}
                    onChange={handleIncomeChange}
                    className="w-full bg-transparent text-sm text-white outline-none"
                  >
                    {jars.map((jar) => (
                      <option key={jar._id} value={jar.jar_key}>
                        {jar.display_name_vi}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                  App tự chia theo tỷ lệ chuẩn: 55% cần thiết, 10% cho 4 hũ tiếp theo và 5% từ thiện.
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={resetIncomeForm}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Làm mới form
              </button>
              <button
                type="submit"
                className="rounded-2xl bg-(--hero-gradient) px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:scale-[1.01]"
              >
                {editingIncomeId ? 'Lưu thu nhập' : 'Tạo thu nhập'}
              </button>
            </div>
          </form>
        </article>

        <article
          id="monthly-plan-allocation-board"
          data-assistant-target="monthly-plan-allocation-board"
          className="rounded-[28px] border border-white/10 bg-(--surface-strong) p-5 shadow-lg shadow-slate-950/20"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Allocation board
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Phân bổ tự động hiện tại</h2>
          </div>

          <div className="mt-5 space-y-3">
            {focusedAllocations.length > 0 ? (
              focusedAllocations.map((item) => {
                const progress = focusedIncomeTotal
                  ? Math.min(100, Math.round(((item.allocated_amount || 0) / focusedIncomeTotal) * 100))
                  : item.allocation_percentage || 0;

                return (
                  <div key={item._id} className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-white">{item.jar_key}</span>
                      <span className="text-slate-400">{formatCurrency(item.allocated_amount || 0)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-(--hero-gradient)"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>{item.note || 'Không có ghi chú'}</span>
                      <span>
                        {typeof item.allocation_percentage === 'number'
                          ? `${item.allocation_percentage}%`
                          : `${progress}%`}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-400">
                Chưa có phân bổ nào cho tháng đang focus.
              </div>
            )}
          </div>
        </article>
      </section>

      <MonthlyIncomeTable
        items={monthlyIncomes}
        onEdit={handleEditIncome}
        onDelete={handleDeleteIncome}
      />

      <JarAllocationTable items={jarAllocations} />
    </div>
  );
};

export default MonthlyPlanPage;
