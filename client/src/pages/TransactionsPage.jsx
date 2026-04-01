import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  createTransaction,
  deleteTransaction,
  getJarAllocations,
  getJars,
  getTransactions,
  updateTransaction
} from '../api/dashboardApi.js';
import { formatCurrency, formatDate } from '../components/formatters.js';
import JarHistoryInsights from '../components/JarHistoryInsights.jsx';
import TransactionTable from '../components/TransactionTable.jsx';

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatAmountForForm = (amount) => {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return '';
  }

  return String(amount / 1000);
};

const createDefaultForm = () => {
  const today = getTodayDateString();

  return {
    month: today.slice(0, 7),
    transaction_date: today,
    amount: '',
    jar_key: 'essentials',
    category: '',
    description: '',
    notes: ''
  };
};

const categoryOptions = [
  { value: '', label: 'Chưa phân loại, để AI phân tích sau' },
  { value: 'food_drink', label: 'Ăn Uống' },
  { value: 'bills', label: 'Hóa đơn' },
  { value: 'investment', label: 'Đầu tư' },
  { value: 'learning', label: 'Học Tập' },
  { value: 'family', label: 'Người thân' },
  { value: 'charity', label: 'Từ thiện' }
];

const categoryLabels = {
  food_drink: 'Ăn Uống',
  bills: 'Hóa đơn',
  investment: 'Đầu tư',
  learning: 'Học Tập',
  family: 'Người thân',
  charity: 'Từ thiện',
  uncategorized: 'Chưa phân loại'
};

const normalizeSearchText = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/₫/g, 'đ')
    .replace(/\bvnd\b/g, 'đ')
    .replace(/[.\s,_-]+/g, '');

const parseAmountSearchValue = (value) => {
  const rawValue = String(value || '').trim().toLowerCase();

  if (!rawValue) {
    return null;
  }

  const compactValue = rawValue.replace(/\s+/g, '');

  if (!/^[\d.,]+(?:đ|₫|vnd|k)?$/.test(compactValue)) {
    return null;
  }

  const hasThousandUnit = /(k|đ|₫|vnd)$/.test(compactValue);
  const numericValue = Number(compactValue.replace(/[^\d.,]/g, '').replace(/,/g, '.'));

  if (Number.isNaN(numericValue)) {
    return null;
  }

  if (hasThousandUnit) {
    return Math.round(numericValue * 1000);
  }

  return Math.round(numericValue);
};

const getDaysInMonth = (monthValue) => {
  if (!monthValue) {
    return 0;
  }

  const [year, month] = monthValue.split('-').map(Number);

  if (!year || !month) {
    return 0;
  }

  return new Date(year, month, 0).getDate();
};

const TransactionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [transactions, setTransactions] = useState([]);
  const [jars, setJars] = useState([]);
  const [jarAllocations, setJarAllocations] = useState([]);
  const [form, setForm] = useState(createDefaultForm);
  const [editingId, setEditingId] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJarFilter, setSelectedJarFilter] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('');
  const [message, setMessage] = useState('Đang tải');
  const [error, setError] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const availableJars = useMemo(() => jars.filter((jar) => jar?.jar_key), [jars]);
  const jarNameByKey = useMemo(
    () => Object.fromEntries(availableJars.map((jar) => [jar.jar_key, jar.display_name_vi])),
    [availableJars]
  );
  const availableMonthFilters = useMemo(
    () => Array.from(new Set(transactions.map((item) => item.month).filter(Boolean))).sort().reverse(),
    [transactions]
  );
  const selectedMonthTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.month === selectedMonthFilter),
    [selectedMonthFilter, transactions]
  );
  const monthAllocationMap = useMemo(
    () =>
      new Map(
        jarAllocations
          .filter((item) => item.month === selectedMonthFilter)
          .map((item) => [item.jar_key, item])
      ),
    [jarAllocations, selectedMonthFilter]
  );
  const selectedJarHistoryEnabled = Boolean(selectedJarFilter && selectedMonthFilter);
  const selectedJarName = jarNameByKey[selectedJarFilter] || selectedJarFilter || 'Hũ đã chọn';
  const selectedJarAllocation = monthAllocationMap.get(selectedJarFilter)?.allocated_amount || 0;
  const selectedJarSpent = selectedMonthTransactions.reduce(
    (sum, transaction) =>
      transaction.direction === 'expense' && transaction.jar_key === selectedJarFilter
        ? sum + (transaction.amount || 0)
        : sum,
    0
  );
  const selectedJarRemaining = selectedJarAllocation - selectedJarSpent;
  const daysInSelectedMonth = getDaysInMonth(selectedMonthFilter);
  const jarDailyBudget = daysInSelectedMonth > 0 ? Math.max(0, Math.floor(selectedJarAllocation / daysInSelectedMonth)) : 0;
  const jarHistoryDaySummaries = useMemo(() => {
    if (!selectedJarHistoryEnabled) {
      return [];
    }

    const groups = selectedMonthTransactions.reduce((accumulator, transaction) => {
      if (transaction.direction !== 'expense') {
        return accumulator;
      }

      const dayKey = transaction.transaction_date?.slice?.(0, 10) || '';

      if (!dayKey) {
        return accumulator;
      }

      if (!accumulator[dayKey]) {
        accumulator[dayKey] = [];
      }

      accumulator[dayKey].push(transaction);
      return accumulator;
    }, {});

    return Object.entries(groups)
      .map(([date, dayItems]) => {
        const selectedJarSpentInDay = dayItems.reduce(
          (sum, item) => (item.jar_key === selectedJarFilter ? sum + (item.amount || 0) : sum),
          0
        );

        if (selectedJarSpentInDay <= 0) {
          return null;
        }

        const totalSpentAllJars = dayItems.reduce((sum, item) => sum + (item.amount || 0), 0);
        const jarBreakdown = Object.entries(
          dayItems.reduce((accumulator, item) => {
            const jarKey = item.jar_key || 'unknown';

            if (!accumulator[jarKey]) {
              accumulator[jarKey] = 0;
            }

            accumulator[jarKey] += item.amount || 0;
            return accumulator;
          }, {})
        ).map(([jarKey, amount]) => {
          const dailyBudget = daysInSelectedMonth > 0
            ? Math.max(0, Math.floor((monthAllocationMap.get(jarKey)?.allocated_amount || 0) / daysInSelectedMonth))
            : 0;

          return {
            jarKey,
            jarName: jarNameByKey[jarKey] || jarKey,
            amount,
            dailyBudget,
            overspendAmount: Math.max(0, amount - dailyBudget)
          };
        });

        return {
          date,
          label: formatDate(date),
          selectedJarSpent: selectedJarSpentInDay,
          selectedJarDailyBudget: jarDailyBudget,
          selectedJarOverspendAmount: Math.max(0, selectedJarSpentInDay - jarDailyBudget),
          totalSpentAllJars,
          jarBreakdown
        };
      })
      .filter(Boolean)
      .sort((firstItem, secondItem) => secondItem.date.localeCompare(firstItem.date));
  }, [
    daysInSelectedMonth,
    jarDailyBudget,
    jarNameByKey,
    monthAllocationMap,
    selectedJarFilter,
    selectedJarHistoryEnabled,
    selectedMonthTransactions
  ]);

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchTerm);
    const exactAmountQuery = parseAmountSearchValue(searchTerm);

    return transactions.filter((transaction) => {
      if (selectedJarFilter && transaction.jar_key !== selectedJarFilter) {
        return false;
      }

      if (
        selectedCategoryFilter &&
        (transaction.category || 'uncategorized') !== selectedCategoryFilter
      ) {
        return false;
      }

      if (selectedMonthFilter && transaction.month !== selectedMonthFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      if (exactAmountQuery != null) {
        return Number(transaction.amount) === exactAmountQuery;
      }

      const jarDisplayName =
        jars.find((jar) => jar.jar_key === transaction.jar_key)?.display_name_vi || '';
      const amountDisplay = formatCurrency(transaction.amount);
      const searchableText = [
        transaction.description,
        transaction.notes,
        transaction.jar_key,
        jarDisplayName,
        categoryLabels[transaction.category] || transaction.category,
        formatDate(transaction.transaction_date),
        transaction.transaction_date?.slice?.(0, 10),
        transaction.month,
        amountDisplay,
        transaction.amount,
        transaction.amount != null ? transaction.amount / 1000 : ''
      ]
        .filter(Boolean)
        .join(' ');

      return normalizeSearchText(searchableText).includes(normalizedQuery);
    });
  }, [
    jars,
    searchTerm,
    selectedJarFilter,
    selectedCategoryFilter,
    selectedMonthFilter,
    transactions
  ]);

  const loadTransactions = async () => {
    try {
      const [transactionResponse, jarResponse, allocationResponse] = await Promise.all([
        getTransactions(),
        getJars(),
        getJarAllocations()
      ]);
      const loadedTransactions = Array.isArray(transactionResponse.data) ? transactionResponse.data : [];

      setTransactions(loadedTransactions);
      setJars(Array.isArray(jarResponse.data) ? jarResponse.data : []);
      setJarAllocations(Array.isArray(allocationResponse.data) ? allocationResponse.data : []);
      setSelectedIds((currentIds) =>
        currentIds.filter((id) => loadedTransactions.some((item) => item._id === id))
      );
      setMessage(transactionResponse.message || 'Sẵn sàng kết nối');
      setError('');
    } catch (requestError) {
      setError('Không tải được danh sách giao dịch từ backend.');
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    const jarFromQuery = searchParams.get('jar') || '';
    const monthFromQuery = searchParams.get('month') || '';

    if (jarFromQuery) {
      setSelectedJarFilter(jarFromQuery);
    }

    if (monthFromQuery) {
      setSelectedMonthFilter(monthFromQuery);
    }

    if (searchParams.get('quickAdd') === '1') {
      setEditingId('');
      setForm((currentForm) => ({
        ...createDefaultForm(),
        jar_key: jarFromQuery || currentForm.jar_key || 'essentials',
        month: monthFromQuery || currentForm.month,
        transaction_date: monthFromQuery
          ? `${monthFromQuery}-01`
          : currentForm.transaction_date || createDefaultForm().transaction_date
      }));
      setIsEditorOpen(true);
    }
  }, [searchParams]);

  const clearQuickAddQuery = () => {
    if (!searchParams.get('quickAdd')) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('quickAdd');
    setSearchParams(nextParams, { replace: true });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  };

  const resetForm = () => {
    setForm(createDefaultForm());
    setEditingId('');
  };

  const openCreateModal = () => {
    resetForm();
    setIsEditorOpen(true);
    clearQuickAddQuery();
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    resetForm();
    clearQuickAddQuery();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.transaction_date) {
      setError('Vui lòng chọn ngày giao dịch.');
      return;
    }

    if (!form.month) {
      setError('Vui lòng chọn tháng giao dịch.');
      return;
    }

    const payload = {
      month: form.month,
      transaction_date: form.transaction_date,
      amount: form.amount,
      jar_key: form.jar_key || 'essentials',
      direction: 'expense',
      category: form.category || 'uncategorized',
      description: form.description,
      notes: form.notes
    };

    try {
      if (editingId) {
        await updateTransaction(editingId, payload);
        setMessage('Đã cập nhật giao dịch.');
      } else {
        await createTransaction(payload);
        setMessage('Đã tạo giao dịch mới.');
      }

      closeEditor();
      await loadTransactions();
    } catch (requestError) {
      setError(requestError.message || 'Không lưu được giao dịch.');
    }
  };

  const handleEdit = (transaction) => {
    const transactionDate = transaction.transaction_date?.slice(0, 10) || getTodayDateString();

    setEditingId(transaction._id);
    setForm({
      month: transaction.month || transactionDate.slice(0, 7),
      transaction_date: transactionDate,
      amount: formatAmountForForm(transaction.amount),
      jar_key: transaction.jar_key || 'essentials',
      category: transaction.category === 'uncategorized' ? '' : transaction.category || '',
      description: transaction.description || '',
      notes: transaction.notes || ''
    });
    setIsEditorOpen(true);
  };

  const handleDelete = async (transaction) => {
    const isConfirmed = window.confirm('Bạn có chắc muốn xóa giao dịch này?');

    if (!isConfirmed) {
      return;
    }

    try {
      await deleteTransaction(transaction._id);
      if (editingId === transaction._id) {
        closeEditor();
      }
      setMessage('Đã xóa giao dịch.');
      await loadTransactions();
    } catch (requestError) {
      setError(requestError.message || 'Không xóa được giao dịch.');
    }
  };

  const handleToggleSelection = (transactionId) => {
    setSelectedIds((currentIds) =>
      currentIds.includes(transactionId)
        ? currentIds.filter((id) => id !== transactionId)
        : [...currentIds, transactionId]
    );
  };

  const handleToggleSelectAll = () => {
    const visibleIds = filteredTransactions.map((transaction) => transaction._id);
    const areAllVisibleSelected =
      visibleIds.length > 0 &&
      visibleIds.every((transactionId) => selectedIds.includes(transactionId));

    if (areAllVisibleSelected) {
      setSelectedIds((currentIds) => currentIds.filter((id) => !visibleIds.includes(id)));
      return;
    }

    setSelectedIds((currentIds) => Array.from(new Set([...currentIds, ...visibleIds])));
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) {
      return;
    }

    const isConfirmed = window.confirm(
      `Bạn có chắc muốn xóa ${selectedIds.length} giao dịch đã chọn?`
    );

    if (!isConfirmed) {
      return;
    }

    try {
      await Promise.all(selectedIds.map((transactionId) => deleteTransaction(transactionId)));

      if (editingId && selectedIds.includes(editingId)) {
        closeEditor();
      }

      setSelectedIds([]);
      setMessage(`Đã xóa ${selectedIds.length} giao dịch.`);
      await loadTransactions();
    } catch (requestError) {
      setError(requestError.message || 'Không xóa được các giao dịch đã chọn.');
    }
  };

  return (
    <div className="space-y-6">
      <motion.section
        id="transactions-overview"
        data-assistant-target="transactions-overview"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(102,126,234,0.2)_0%,rgba(118,75,162,0.16)_45%,rgba(15,15,35,0.96)_100%)] p-6 shadow-2xl shadow-slate-950/20"
      >
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-100/80">
              Daily transactions
            </div>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Nhập nhanh, lọc nhanh và dọn giao dịch mà không bị nặng như bảng kế toán.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              {message}. Bạn có thể tìm theo tiền chính xác như `0đ`, theo mô tả, hũ hoặc mục chi
              tiêu để dọn dữ liệu trong vài thao tác.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Tổng giao dịch</p>
                <p className="mt-2 text-3xl font-bold text-white">{transactions.length}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Đang hiển thị</p>
                <p className="mt-2 text-3xl font-bold text-white">{filteredTransactions.length}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Đã chọn</p>
                <p className="mt-2 text-3xl font-bold text-white">{selectedIds.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-5 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Quick actions</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Thao tác hôm nay</h2>
              </div>
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-2xl bg-(--hero-gradient) px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:scale-[1.01]"
              >
                <PlusIcon className="h-5 w-5" />
                Thêm giao dịch
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">Mẹo tìm kiếm</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Gõ `0đ`, `74k`, `74000`, tên hũ hoặc mô tả để lọc real-time. Khi ô tìm kiếm mang
                  dạng số tiền, hệ thống sẽ so đúng amount thay vì chỉ match ký tự.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">Phiên nhập liệu</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Số tiền nhập theo nghìn đồng, hũ mặc định là Hũ Cần Thiết, mục chi tiêu có thể để
                  trống để AI phân tích sau.
                </p>
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
        id="transactions-filters"
        data-assistant-target="transactions-filters"
        className="rounded-[28px] border border-white/10 bg-(--surface-strong) p-5 shadow-lg shadow-slate-950/20"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Search & filters
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Tìm và lọc giao dịch</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedJarFilter('');
              setSelectedCategoryFilter('');
              setSelectedMonthFilter('');
            }}
            className="self-start rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Xoá filter
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr]">
          <label className="rounded-3xl border border-white/10 bg-slate-950/35 px-4 py-3">
            <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <MagnifyingGlassIcon className="h-4 w-4" />
              Search
            </span>
            <input
              aria-label="Tìm kiếm giao dịch"
              name="searchTerm"
              type="text"
              placeholder="Ví dụ: 0đ hoặc ăn"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </label>

          <label className="rounded-3xl border border-white/10 bg-slate-950/35 px-4 py-3">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Hũ
            </span>
            <select
              value={selectedJarFilter}
              onChange={(event) => setSelectedJarFilter(event.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none"
            >
              <option value="">Tất cả hũ</option>
              {availableJars.map((jar) => (
                <option key={jar._id} value={jar.jar_key}>
                  {jar.display_name_vi}
                </option>
              ))}
            </select>
          </label>

          <label className="rounded-3xl border border-white/10 bg-slate-950/35 px-4 py-3">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Mục chi tiêu
            </span>
            <select
              value={selectedCategoryFilter}
              onChange={(event) => setSelectedCategoryFilter(event.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none"
            >
              <option value="">Tất cả mục</option>
              {categoryOptions.map((option) => (
                <option key={option.label} value={option.value || 'uncategorized'}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="rounded-3xl border border-white/10 bg-slate-950/35 px-4 py-3">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Tháng
            </span>
            <select
              value={selectedMonthFilter}
              onChange={(event) => setSelectedMonthFilter(event.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none"
            >
              <option value="">Tất cả tháng</option>
              {availableMonthFilters.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {selectedJarHistoryEnabled ? (
        <JarHistoryInsights
          jarName={selectedJarName}
          month={selectedMonthFilter}
          remainingAmount={selectedJarRemaining}
          allocatedAmount={selectedJarAllocation}
          spentAmount={selectedJarSpent}
          dailyBudget={jarDailyBudget}
          daySummaries={jarHistoryDaySummaries}
        />
      ) : null}

      <div id="transactions-table" data-assistant-target="transactions-table">
        <TransactionTable
          items={filteredTransactions}
          eyebrow={selectedJarHistoryEnabled ? 'Lịch sử theo hũ' : 'Danh sách giao dịch'}
          title={
            selectedJarHistoryEnabled
              ? `${selectedJarName} · ${selectedMonthFilter}`
              : 'Giao dịch gần nhất'
          }
          jarNameByKey={jarNameByKey}
          selectedIds={selectedIds}
          onToggleSelection={handleToggleSelection}
          onToggleSelectAll={handleToggleSelectAll}
          onDeleteSelected={handleDeleteSelected}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {isEditorOpen ? (
        <div
          id="transactions-editor"
          data-assistant-target="transactions-editor"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur sm:items-center"
        >
          <div className="w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/10 bg-[#111428] shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {editingId ? 'Edit transaction' : 'Quick add'}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {editingId ? 'Chỉnh sửa giao dịch' : 'Tạo giao dịch mới'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="rounded-3xl border border-white/10 bg-slate-950/35 px-4 py-3">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Tháng giao dịch
                  </span>
                  <input
                    aria-label="Tháng giao dịch"
                    name="month"
                    value={form.month}
                    onChange={handleChange}
                    type="month"
                    required
                    className="w-full bg-transparent text-sm text-white outline-none"
                  />
                </label>

                <label className="rounded-3xl border border-white/10 bg-slate-950/35 px-4 py-3">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Ngày giao dịch
                  </span>
                  <input
                    aria-label="Ngày giao dịch"
                    name="transaction_date"
                    type="date"
                    value={form.transaction_date}
                    onChange={handleChange}
                    required
                    className="w-full bg-transparent text-sm text-white outline-none"
                  />
                </label>

                <label className="rounded-3xl border border-white/10 bg-slate-950/35 px-4 py-3">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Số tiền
                  </span>
                  <input
                    aria-label="Số tiền giao dịch"
                    name="amount"
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.amount}
                    onChange={handleChange}
                    required
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Nhập theo nghìn đồng. Ví dụ `100` = `100.000đ`.
                  </p>
                </label>

                <label className="rounded-3xl border border-white/10 bg-slate-950/35 px-4 py-3">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Hũ
                  </span>
                  <select
                    name="jar_key"
                    value={form.jar_key}
                    onChange={handleChange}
                    required
                    className="w-full bg-transparent text-sm text-white outline-none"
                  >
                    {availableJars.map((jar) => (
                      <option key={jar._id} value={jar.jar_key}>
                        {jar.display_name_vi}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Mục chi tiêu
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {categoryOptions.map((option) => {
                    const optionValue = option.value || '';
                    const isActive = form.category === optionValue;

                    return (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() =>
                          setForm((currentForm) => ({
                            ...currentForm,
                            category: optionValue
                          }))
                        }
                        className={[
                          'rounded-full px-4 py-2 text-sm font-medium transition',
                          isActive
                            ? 'bg-white text-slate-950'
                            : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                        ].join(' ')}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block rounded-3xl border border-white/10 bg-slate-950/35 px-4 py-3">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Mô tả
                </span>
                <input
                  aria-label="Mô tả giao dịch"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  autoFocus
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </label>

              <label className="block rounded-3xl border border-white/10 bg-slate-950/35 px-4 py-3">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Ghi chú
                </span>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </label>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-(--hero-gradient) px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:scale-[1.01]"
                >
                  <PencilSquareIcon className="h-5 w-5" />
                  {editingId ? 'Lưu thay đổi' : 'Tạo giao dịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default TransactionsPage;
