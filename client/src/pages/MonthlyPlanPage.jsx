import { SparklesIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
import CurrencyInput from '../components/CurrencyInput.jsx';
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
  source_note: ''
};

const MonthlyPlanPage = () => {
  const { t, i18n } = useTranslation();
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
      setError(t('monthlyPlan.loadError', 'Không tải được dữ liệu kế hoạch tháng.'));
    }
  };

  useEffect(() => {
    loadMonthlyPlanData();
  }, []);

  const focusedIncome = monthlyIncomes.find((item) => item._id === editingIncomeId) || monthlyIncomes[0] || null;
  const focusedIncomeTotal = focusedIncome?.total_amount || 0;
  const incomeAmountPreview = parseMoneyInputPreview(incomeForm.total_amount);
  const activeMonth = incomeForm.income_date?.slice(0, 7) || incomeForm.month || getCurrentMonthValue();
  const activeJarCount = jars.length || 6;
  const ratioSummary = useMemo(
    () => Object.values(CLASSIC_JAR_RATIOS).join(' / ') + '%',
    []
  );

  const focusedAllocations = useMemo(
    () =>
      jarAllocations.filter(
        (item) =>
          item.monthly_income_id === focusedIncome?._id ||
          (focusedIncome?.month && item.month === focusedIncome.month)
      ),
    [focusedIncome, jarAllocations]
  );

  const allocationMap = useMemo(
    () => new Map(focusedAllocations.map((item) => [item.jar_key, item])),
    [focusedAllocations]
  );

  const detailedJarAllocations = useMemo(
    () =>
      Object.entries(CLASSIC_JAR_RATIOS).map(([jarKey, percentage]) => {
        const jar = jars.find((item) => item.jar_key === jarKey);
        const currentAllocation = allocationMap.get(jarKey);
        const fallbackAmount = focusedIncomeTotal > 0 ? Math.round((focusedIncomeTotal * percentage) / 100) : 0;

        return {
          jarKey,
          jarName: i18n.language === 'en' ? jarKey.replace(/_/g, ' ').toUpperCase() : (jar?.display_name_vi || jarKey),
          percentage,
          allocatedAmount: currentAllocation?.allocated_amount ?? fallbackAmount
        };
      }),
    [allocationMap, focusedIncomeTotal, jars]
  );

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

  const syncAutoAllocations = async (monthlyIncomeId, totalAmount, month) => {
    const existingAllocations = jarAllocations.filter(
      (item) => item.monthly_income_id === monthlyIncomeId || item.month === month
    );
    const desiredAllocations = Object.entries(CLASSIC_JAR_RATIOS).map(([jarKey, percentage]) => ({
      jar_key: jarKey,
      allocated_amount: Math.round((Number(totalAmount) * percentage) / 100),
      allocation_percentage: percentage,
      note: t('monthlyPlan.autoAllocatedNote', 'Tự chia theo tỷ lệ 6 hũ.')
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
          savedIncome?.month || normalizedIncomePayload.month
        );
        setMessage(t('monthlyPlan.updateSuccess', 'Đã cập nhật thu nhập tháng.'));
      } else {
        const response = await createMonthlyIncome(normalizedIncomePayload);
        const createdIncome = response?.data;

        if (createdIncome?._id) {
          await syncAutoAllocations(
            createdIncome._id,
            createdIncome.total_amount || incomeAmountPreview || 0,
            createdIncome.month || normalizedIncomePayload.month
          );
        }

        setMessage(t('monthlyPlan.createSuccess', 'Đã tạo thu nhập và tự chia theo 6 hũ.'));
      }

      resetIncomeForm();
      await loadMonthlyPlanData();
    } catch (requestError) {
      setError(requestError.message || t('monthlyPlan.saveError', 'Không lưu được thu nhập tháng.'));
    }
  };

  const handleEditIncome = (monthlyIncome) => {
    setEditingIncomeId(monthlyIncome._id);
    setIncomeForm({
      month: monthlyIncome.month || '',
      total_amount: monthlyIncome.total_amount?.toString() || '',
      income_date: monthlyIncome.income_date?.slice(0, 10) || `${monthlyIncome.month}-01`,
      source_note: monthlyIncome.source_note || ''
    });
    incomeFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDeleteIncome = async (monthlyIncome) => {
    if (!window.confirm(t('common.deleteConfirm', 'Xóa thu nhập này? Phân bổ liên quan cũng sẽ bị xóa.'))) {
      return;
    }

    try {
      await deleteMonthlyIncome(monthlyIncome._id);
      if (editingIncomeId === monthlyIncome._id) {
        resetIncomeForm();
      }
      setMessage(t('monthlyPlan.deleteSuccess', 'Đã xóa thu nhập tháng.'));
      await loadMonthlyPlanData();
    } catch (requestError) {
      setError(requestError.message || t('monthlyPlan.deleteError', 'Không xóa được thu nhập.'));
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
        <div className="flex flex-col gap-5">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {t('monthlyPlan.title', 'Kế hoạch tháng')}
            </h1>
            {message ? <p className="mt-3 text-sm text-emerald-300/80">{message}</p> : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.06] p-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{t('transactions.filterMonth', 'Tháng')}</p>
              <p className="mt-1.5 text-2xl font-bold tabular-nums text-white">{focusedIncome?.month || activeMonth}</p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.06] p-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{t('monthlyPlan.title', 'Thu nhập')}</p>
              <p className="mt-1.5 text-2xl font-bold tabular-nums text-white">{formatCurrency(focusedIncomeTotal)}</p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.06] p-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{t('jars.allocation', 'Chế độ')}</p>
              <p className="mt-1.5 text-sm font-semibold text-white">{t('monthlyPlan.autoAllocateDesc', { count: activeJarCount, ratio: ratioSummary })}</p>
              <p className="mt-1 text-xs text-slate-500">{ratioSummary}</p>
            </div>
          </div>
        </div>
      </motion.section>

      {error ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article
          id="monthly-plan-income-form"
          data-assistant-target="monthly-plan-income-form"
          ref={incomeFormRef}
          className="rounded-2xl border border-white/[0.06] bg-(--surface-strong) p-5"
        >
          <h2 className="text-base font-semibold text-white">
            {editingIncomeId ? t('monthlyPlan.editIncomeTitle', 'Chỉnh sửa thu nhập') : t('monthlyPlan.addIncomeTitle', 'Nhập thu nhập mới')}
          </h2>

          <form onSubmit={handleIncomeSubmit} className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">{t('monthlyPlan.totalAmountLabel', 'Tổng thu nhập')}</span>
                <CurrencyInput
                  name="total_amount"
                  value={incomeForm.total_amount}
                  onChange={handleIncomeChange}
                  required
                  placeholder={t('monthlyPlan.amountHint', moneyInputHint)}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                />
              </label>

              <label className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">{t('monthlyPlan.dateLabel', 'Ngày nhận')}</span>
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

            <label className="block rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
              <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">{t('monthlyPlan.sourceLabel', 'Ghi chú nguồn')}</span>
              <input
                name="source_note"
                value={incomeForm.source_note}
                onChange={handleIncomeChange}
                placeholder={t('monthlyPlan.sourceHint', 'VD: Lương tháng 4, thưởng...')}
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
              />
            </label>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={resetIncomeForm}
                className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06]"
              >
                {t('common.cancel', 'Làm mới')}
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-(--hero-gradient) py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/20 transition hover:shadow-indigo-900/30"
              >
                {editingIncomeId ? t('monthlyPlan.updateBtn', 'Cập nhật') : t('monthlyPlan.createBtn', 'Tạo thu nhập')}
              </button>
            </div>
          </form>
        </article>

        <aside className="rounded-2xl border border-white/[0.06] bg-(--surface-strong) p-5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
            <SparklesIcon className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-white">{t('monthlyPlan.autoAllocateTitle', 'Tự động chia 6 hũ')}</h2>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{t('monthlyPlan.saveMonth', 'Tháng lưu')}</p>
              <p className="mt-1.5 text-sm font-semibold tabular-nums text-white">{activeMonth}</p>
            </div>
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.06] p-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-400/70">{t('monthlyPlan.value', 'Giá trị')}</p>
              <p className="mt-1.5 text-sm font-semibold tabular-nums text-white">
                {incomeAmountPreview != null ? formatCurrency(incomeAmountPreview) : '--'}
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-(--surface-strong) p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">{t('monthlyPlan.jarDetails', { month: focusedIncome?.month || activeMonth })}</h2>
          </div>
          <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300">
            {formatCurrency(focusedIncomeTotal)}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {detailedJarAllocations.map((item) => (
            <article
              key={item.jarKey}
              className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{item.jarName}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.percentage}%</p>
                </div>
                <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-slate-400">
                  {item.jarKey}
                </span>
              </div>
              <p className="mt-4 text-2xl font-bold tabular-nums text-white">
                {formatCurrency(item.allocatedAmount)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <MonthlyIncomeTable items={monthlyIncomes} onEdit={handleEditIncome} onDelete={handleDeleteIncome} t={t} />
    </div>
  );
};

export default MonthlyPlanPage;
