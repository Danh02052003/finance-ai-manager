import {
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  createTransaction,
  deleteTransaction,
  getJars,
  getTransactions,
  updateTransaction
} from '../api/dashboardApi.js';
import TransactionTable from '../components/TransactionTable.jsx';

const todayString = () => new Date().toISOString().slice(0, 10);
const currentMonth = () => todayString().slice(0, 7);
const dateForMonth = (month = '') => (month && !todayString().startsWith(month) ? `${month}-01` : todayString());

const createDefaultForm = (month = currentMonth(), jar = 'essentials') => ({
  transaction_date: dateForMonth(month),
  amount: '',
  jar_key: jar,
  direction: 'expense',
  category: '',
  description: '',
  notes: ''
});

const categoryOptions = [
  { value: '', label: 'Để AI phân loại' },
  { value: 'food_drink', label: 'Ăn uống' },
  { value: 'bills', label: 'Hóa đơn' },
  { value: 'investment', label: 'Đầu tư' },
  { value: 'learning', label: 'Học tập' },
  { value: 'family', label: 'Gia đình' },
  { value: 'charity', label: 'Từ thiện' }
];

const categoryLabels = Object.fromEntries(
  categoryOptions.map((item) => [item.value || 'uncategorized', item.label])
);

const normalizeSearchText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[.\s,_-]+/g, '');

const parseAmountSearchValue = (value) => {
  const compact = String(value || '').trim().toLowerCase().replace(/\s+/g, '');

  if (!compact || !/^[\d.,]+(?:đ|d|vnd|k)?$/i.test(compact)) {
    return null;
  }

  const hasK = compact.endsWith('k');
  const hasCurrencySuffix = /(đ|d|vnd)$/i.test(compact);
  const base = compact.replace(/(đ|d|vnd|k)$/i, '');
  const decimalLike = /[.,]\d{1,2}$/.test(base) && hasK;
  const normalized = decimalLike ? base.replace(/\./g, '').replace(',', '.') : base.replace(/[.,]/g, '');
  const parsed = Number(normalized);

  if (Number.isNaN(parsed)) {
    return null;
  }

  if (hasK) {
    return Math.round(parsed * 1000);
  }

  return hasCurrencySuffix ? Math.round(parsed) : Math.round(parsed);
};

const amountForForm = (amount) => (typeof amount === 'number' && !Number.isNaN(amount) ? String(amount / 1000) : '');
const isIncomeDirection = (value) => value === 'income_adjustment';

const TransactionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [transactions, setTransactions] = useState([]);
  const [jars, setJars] = useState([]);
  const [form, setForm] = useState(createDefaultForm);
  const [editingId, setEditingId] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJarFilter, setSelectedJarFilter] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const availableJars = useMemo(() => jars.filter((jar) => jar?.jar_key), [jars]);
  const jarNameByKey = useMemo(
    () => Object.fromEntries(availableJars.map((jar) => [jar.jar_key, jar.display_name_vi])),
    [availableJars]
  );
  const availableMonthFilters = useMemo(
    () => Array.from(new Set(transactions.map((item) => item.month).filter(Boolean))).sort().reverse(),
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchTerm);
    const exactAmountQuery = parseAmountSearchValue(searchTerm);

    return transactions.filter((transaction) => {
      if (selectedJarFilter && transaction.jar_key !== selectedJarFilter) return false;
      if (selectedCategoryFilter && (transaction.category || 'uncategorized') !== selectedCategoryFilter) return false;
      if (selectedMonthFilter && transaction.month !== selectedMonthFilter) return false;
      if (!normalizedQuery) return true;
      if (exactAmountQuery != null) return Number(transaction.amount) === exactAmountQuery;

      const jarName = jars.find((jar) => jar.jar_key === transaction.jar_key)?.display_name_vi || '';
      const searchBlob = [
        transaction.description,
        transaction.notes,
        transaction.jar_key,
        jarName,
        categoryLabels[transaction.category] || transaction.category,
        transaction.transaction_date?.slice?.(0, 10),
        transaction.month,
        transaction.amount,
        typeof transaction.amount === 'number' ? transaction.amount / 1000 : ''
      ]
        .filter(Boolean)
        .join(' ');

      return normalizeSearchText(searchBlob).includes(normalizedQuery);
    });
  }, [jars, searchTerm, selectedCategoryFilter, selectedJarFilter, selectedMonthFilter, transactions]);

  const selectedJarName = jarNameByKey[selectedJarFilter] || '';

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const [transactionResponse, jarResponse] = await Promise.all([getTransactions(), getJars()]);
      const loadedTransactions = Array.isArray(transactionResponse.data) ? transactionResponse.data : [];

      setTransactions(loadedTransactions);
      setJars(Array.isArray(jarResponse.data) ? jarResponse.data : []);
      setSelectedIds((current) => current.filter((id) => loadedTransactions.some((item) => item._id === id)));
      setError('');
    } catch {
      setError('Không tải được danh sách giao dịch.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    if (!selectedMonthFilter && availableMonthFilters.length) {
      setSelectedMonthFilter(availableMonthFilters[0]);
    }
  }, [availableMonthFilters, selectedMonthFilter]);

  useEffect(() => {
    const jarFromQuery = searchParams.get('jar') || '';
    const monthFromQuery = searchParams.get('month') || '';
    const quickAdd = searchParams.get('quickAdd') === '1';

    if (jarFromQuery) setSelectedJarFilter(jarFromQuery);
    if (monthFromQuery) {
      setSelectedMonthFilter(monthFromQuery);
    }

    if (quickAdd) {
      const targetMonth = monthFromQuery || selectedMonthFilter || currentMonth();
      setForm({
        ...createDefaultForm(targetMonth, jarFromQuery || 'essentials'),
        direction: 'expense'
      });
      setEditingId('');
      setIsEditorOpen(true);
    }
  }, [searchParams, selectedMonthFilter]);

  const clearQuickAddQuery = () => {
    if (!searchParams.get('quickAdd')) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('quickAdd');
    setSearchParams(nextParams, { replace: true });
  };

  const resetForm = (
    month = selectedMonthFilter || currentMonth(),
    jar = selectedJarFilter || 'essentials',
    direction = 'expense'
  ) => {
    setForm({
      ...createDefaultForm(month, jar),
      direction
    });
    setEditingId('');
  };

  const openCreateModal = (direction = 'expense') => {
    resetForm(selectedMonthFilter || currentMonth(), selectedJarFilter || 'essentials', direction);
    setIsEditorOpen(true);
    clearQuickAddQuery();
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    resetForm();
    clearQuickAddQuery();
  };

  const handleChange = ({ target: { name, value } }) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.transaction_date) {
      setError('Vui lòng chọn ngày giao dịch.');
      return;
    }

    const payload = {
      month: form.transaction_date.slice(0, 7),
      transaction_date: form.transaction_date,
      amount: form.amount,
      jar_key: form.jar_key || 'essentials',
      direction: form.direction || 'expense',
      category: form.category || '',
      description: form.description,
      notes: form.notes
    };

    try {
      if (editingId) {
        await updateTransaction(editingId, payload);
        setMessage(isIncomeDirection(payload.direction) ? 'Đã cập nhật khoản thu.' : 'Đã cập nhật giao dịch.');
      } else {
        await createTransaction(payload);
        setMessage(isIncomeDirection(payload.direction) ? 'Đã ghi nhận thu vào hũ.' : 'Đã lưu chi tiêu.');
      }

      closeEditor();
      setSelectedMonthFilter(payload.month);
      await loadTransactions();
    } catch (requestError) {
      setError(requestError.message || 'Không lưu được giao dịch.');
    }
  };

  const handleEdit = (transaction) => {
    setEditingId(transaction._id);
    setForm({
      transaction_date: transaction.transaction_date?.slice(0, 10) || todayString(),
      amount: amountForForm(transaction.amount),
      jar_key: transaction.jar_key || 'essentials',
      direction: transaction.direction || 'expense',
      category: transaction.category === 'uncategorized' ? '' : transaction.category || '',
      description: transaction.description || '',
      notes: transaction.notes || ''
    });
    setIsEditorOpen(true);
  };

  const handleDelete = async (transaction) => {
    if (!window.confirm('Xóa giao dịch này?')) return;
    try {
      await deleteTransaction(transaction._id);
      if (editingId === transaction._id) closeEditor();
      setMessage('Đã xóa giao dịch.');
      await loadTransactions();
    } catch (requestError) {
      setError(requestError.message || 'Không xóa được giao dịch.');
    }
  };

  const handleToggleSelection = (transactionId) => {
    setSelectedIds((current) =>
      current.includes(transactionId) ? current.filter((id) => id !== transactionId) : [...current, transactionId]
    );
  };

  const handleToggleSelectAll = () => {
    const visibleIds = filteredTransactions.map((item) => item._id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) =>
      allSelected ? current.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...current, ...visibleIds]))
    );
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length || !window.confirm(`Xóa ${selectedIds.length} giao dịch đã chọn?`)) return;
    try {
      await Promise.all(selectedIds.map((transactionId) => deleteTransaction(transactionId)));
      if (editingId && selectedIds.includes(editingId)) closeEditor();
      setSelectedIds([]);
      setMessage(`Đã xóa ${selectedIds.length} giao dịch.`);
      await loadTransactions();
    } catch (requestError) {
      setError(requestError.message || 'Không xóa được các giao dịch đã chọn.');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedJarFilter('');
    setSelectedCategoryFilter('');
    setSelectedMonthFilter(availableMonthFilters[0] || currentMonth());
  };

  const hasActiveFilters = searchTerm || selectedJarFilter || selectedCategoryFilter;

  return (
    <div className="space-y-4">
      {error ? <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{error}</div> : null}
      {!error && message ? <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</div> : null}

      <section className="rounded-2xl border border-white/[0.06] bg-(--surface-strong) p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-white">Bộ lọc và tìm kiếm</h2>
          <div className="flex flex-wrap gap-2">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/[0.08]"
              >
                Xóa bộ lọc
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => openCreateModal('expense')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-400"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Chi từ hũ
            </button>
            <button
              type="button"
              onClick={() => openCreateModal('income_adjustment')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-400"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Thu vào hũ
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          <label className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
            <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              <MagnifyingGlassIcon className="h-3.5 w-3.5" />
              Tìm kiếm
            </span>
            <input
              aria-label="Tìm kiếm giao dịch"
              name="searchTerm"
              type="text"
              placeholder="74k, cafe, trả tiền..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
            />
          </label>

          <label className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
            <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              <FunnelIcon className="h-3.5 w-3.5" />
              Tháng
            </span>
            <select
              value={selectedMonthFilter}
              onChange={(event) => setSelectedMonthFilter(event.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none"
            >
              <option value="">Tất cả</option>
              {availableMonthFilters.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </label>

          <label className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Hũ</span>
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

          <label className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Danh mục</span>
            <select
              value={selectedCategoryFilter}
              onChange={(event) => setSelectedCategoryFilter(event.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none"
            >
              <option value="">Tất cả</option>
              {categoryOptions.map((option) => (
                <option key={option.label} value={option.value || 'uncategorized'}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <TransactionTable
        items={filteredTransactions}
        title={selectedJarName ? `${selectedJarName} / ${selectedMonthFilter || 'tất cả'}` : 'Giao dịch gần đây'}
        jarNameByKey={jarNameByKey}
        selectedIds={selectedIds}
        onToggleSelection={handleToggleSelection}
        onToggleSelectAll={handleToggleSelectAll}
        onDeleteSelected={handleDeleteSelected}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {isEditorOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0d20] shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <h2 className="text-base font-semibold text-white">
                {editingId
                  ? isIncomeDirection(form.direction)
                    ? 'Chỉnh sửa khoản thu'
                    : 'Chỉnh sửa giao dịch'
                  : isIncomeDirection(form.direction)
                    ? 'Thu vào hũ'
                    : 'Ghi chi tiêu'}
              </h2>
              <button
                type="button"
                onClick={closeEditor}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
                aria-label="Đóng"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, direction: 'expense' }))}
                  className={[
                    'flex-1 rounded-lg py-2 text-sm font-medium transition',
                    !isIncomeDirection(form.direction)
                      ? 'bg-rose-500 text-white'
                      : 'border border-white/[0.08] text-slate-400 hover:text-white'
                  ].join(' ')}
                >
                  Chi từ hũ
                </button>
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, direction: 'income_adjustment' }))}
                  className={[
                    'flex-1 rounded-lg py-2 text-sm font-medium transition',
                    isIncomeDirection(form.direction)
                      ? 'bg-emerald-500 text-white'
                      : 'border border-white/[0.08] text-slate-400 hover:text-white'
                  ].join(' ')}
                >
                  Thu vào hũ
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                  <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Ngày</span>
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
                <label className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                  <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Số tiền (nghìn đồng)
                  </span>
                  <input
                    aria-label="Số tiền"
                    name="amount"
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.amount}
                    onChange={handleChange}
                    required
                    autoFocus
                    placeholder="VD: 100 = 100.000đ"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                  />
                </label>
                <label className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                  <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Hũ</span>
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
                <label className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                  <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Mô tả</span>
                  <input
                    aria-label="Mô tả"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    required
                    placeholder={isIncomeDirection(form.direction) ? 'VD: Bạn trả lại 65k' : 'VD: Cafe sáng'}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                  />
                </label>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Phân loại</p>
                <div className="flex flex-wrap gap-1.5">
                  {categoryOptions.map((option) => {
                    const optionValue = option.value || '';
                    const isActive = form.category === optionValue;

                    return (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, category: optionValue }))}
                        className={[
                          'rounded-lg px-3 py-1.5 text-xs font-medium transition',
                          isActive
                            ? 'bg-indigo-500 text-white'
                            : 'border border-white/[0.08] text-slate-400 hover:text-white'
                        ].join(' ')}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Ghi chú</span>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows="2"
                  className="w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                />
              </label>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition ${
                    isIncomeDirection(form.direction) ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-indigo-500 hover:bg-indigo-400'
                  }`}
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  {editingId ? 'Cập nhật' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="fixed bottom-20 right-4 z-20 flex flex-col gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => openCreateModal('income_adjustment')}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-400"
        >
          <PlusIcon className="h-4 w-4" />
          Thu vào hũ
        </button>
        <button
          type="button"
          onClick={() => openCreateModal('expense')}
          className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-900/30 transition hover:bg-rose-400"
        >
          <PlusIcon className="h-4 w-4" />
          Chi từ hũ
        </button>
      </div>

      {isLoading ? <div className="rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-slate-500">Đang tải...</div> : null}
    </div>
  );
};

export default TransactionsPage;
