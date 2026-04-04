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
import { formatCurrency } from '../components/formatters.js';
import TransactionTable from '../components/TransactionTable.jsx';

const todayString = () => new Date().toISOString().slice(0, 10);
const currentMonth = () => todayString().slice(0, 7);
const dateForMonth = (month = '') => (month && !todayString().startsWith(month) ? `${month}-01` : todayString());

const createDefaultForm = (month = currentMonth(), jar = 'essentials') => ({
  transaction_date: dateForMonth(month),
  amount: '',
  jar_key: jar,
  category: '',
  description: '',
  notes: ''
});

const categoryOptions = [
  { value: '', label: 'Để AI phân tích sau' },
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
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [message, setMessage] = useState('Sẵn sàng ghi nhận giao dịch mới.');
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
      if (selectedDateFilter && String(transaction.transaction_date || '').slice(0, 10) !== selectedDateFilter) return false;
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
  }, [jars, searchTerm, selectedCategoryFilter, selectedDateFilter, selectedJarFilter, selectedMonthFilter, transactions]);

  const selectedJarName = jarNameByKey[selectedJarFilter] || '';

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const [transactionResponse, jarResponse] = await Promise.all([getTransactions(), getJars()]);
      const loadedTransactions = Array.isArray(transactionResponse.data) ? transactionResponse.data : [];

      setTransactions(loadedTransactions);
      setJars(Array.isArray(jarResponse.data) ? jarResponse.data : []);
      setSelectedIds((current) => current.filter((id) => loadedTransactions.some((item) => item._id === id)));
      setMessage(transactionResponse.message || 'Đã đồng bộ dữ liệu giao dịch.');
      setError('');
    } catch {
      setError('Không tải được danh sách giao dịch từ backend.');
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
    const dateFromQuery = searchParams.get('date') || '';
    const quickAdd = searchParams.get('quickAdd') === '1';

    if (jarFromQuery) setSelectedJarFilter(jarFromQuery);
    if (dateFromQuery) {
      setSelectedDateFilter(dateFromQuery);
      setSelectedMonthFilter(dateFromQuery.slice(0, 7));
    } else if (monthFromQuery) {
      setSelectedMonthFilter(monthFromQuery);
    }

    if (quickAdd) {
      const targetMonth = dateFromQuery?.slice(0, 7) || monthFromQuery || selectedMonthFilter || currentMonth();
      setForm(createDefaultForm(targetMonth, jarFromQuery || 'essentials'));
      if (dateFromQuery) {
        setForm((current) => ({ ...current, transaction_date: dateFromQuery }));
      }
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

  const resetForm = (month = selectedMonthFilter || currentMonth(), jar = selectedJarFilter || 'essentials') => {
    setForm(createDefaultForm(month, jar));
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
        setMessage('Lưu giao dịch hôm nay thành công.');
      }

      closeEditor();
      setSelectedMonthFilter(payload.month);
      setSelectedDateFilter(form.transaction_date);
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
      category: transaction.category === 'uncategorized' ? '' : transaction.category || '',
      description: transaction.description || '',
      notes: transaction.notes || ''
    });
    setIsEditorOpen(true);
  };

  const handleDelete = async (transaction) => {
    if (!window.confirm('Bạn có chắc muốn xóa giao dịch này?')) return;
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
    if (!selectedIds.length || !window.confirm(`Bạn có chắc muốn xóa ${selectedIds.length} giao dịch đã chọn?`)) return;
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
    setSelectedDateFilter('');
    setSelectedMonthFilter(availableMonthFilters[0] || currentMonth());
  };

  return (
    <div className="space-y-4">
      {error ? <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{error}</div> : null}

      {!error && message ? (
        <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-300">{message}</div>
      ) : null}

      <section className="rounded-3xl border border-white/10 bg-[rgba(26,26,46,0.88)] p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Filters</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Tìm nhanh theo tiền, hũ, ngày hoặc mô tả</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={clearFilters} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10">Xóa filter</button>
            <button type="button" onClick={openCreateModal} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"><PlusIcon className="h-4 w-4" />Nhập hôm nay</button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))]">
          <label className="rounded-2xl border border-white/8 bg-[#12182b] px-4 py-3">
            <span className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500"><MagnifyingGlassIcon className="h-4 w-4" />Search</span>
            <input aria-label="Tìm kiếm giao dịch" name="searchTerm" type="text" placeholder="74k, cafe, momo yield" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
          </label>

          <label className="rounded-2xl border border-white/8 bg-[#12182b] px-4 py-3">
            <span className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500"><FunnelIcon className="h-4 w-4" />Tháng</span>
            <select value={selectedMonthFilter} onChange={(event) => setSelectedMonthFilter(event.target.value)} className="w-full bg-transparent text-sm text-white outline-none">
              <option value="">Tất cả tháng</option>
              {availableMonthFilters.map((month) => <option key={month} value={month}>{month}</option>)}
            </select>
          </label>

          <label className="rounded-2xl border border-white/8 bg-[#12182b] px-4 py-3">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Hũ</span>
            <select value={selectedJarFilter} onChange={(event) => setSelectedJarFilter(event.target.value)} className="w-full bg-transparent text-sm text-white outline-none">
              <option value="">Tất cả hũ</option>
              {availableJars.map((jar) => <option key={jar._id} value={jar.jar_key}>{jar.display_name_vi}</option>)}
            </select>
          </label>

          <label className="rounded-2xl border border-white/8 bg-[#12182b] px-4 py-3">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Category</span>
            <select value={selectedCategoryFilter} onChange={(event) => setSelectedCategoryFilter(event.target.value)} className="w-full bg-transparent text-sm text-white outline-none">
              <option value="">Tất cả nhóm</option>
              {categoryOptions.map((option) => <option key={option.label} value={option.value || 'uncategorized'}>{option.label}</option>)}
            </select>
          </label>

          <label className="rounded-2xl border border-white/8 bg-[#12182b] px-4 py-3">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Ngày cụ thể</span>
            <input aria-label="Lọc theo ngày cụ thể" type="date" value={selectedDateFilter} onChange={(event) => { setSelectedDateFilter(event.target.value); if (event.target.value) setSelectedMonthFilter(event.target.value.slice(0, 7)); }} className="w-full bg-transparent text-sm text-white outline-none" />
          </label>
        </div>
      </section>

      <TransactionTable
        items={filteredTransactions}
        eyebrow={selectedJarFilter ? 'Lịch sử theo hũ' : 'Lịch sử theo ngày'}
        title={selectedJarName ? `${selectedJarName} · ${selectedMonthFilter || 'tất cả tháng'}` : 'Giao dịch gần đây'}
        subtitle={selectedDateFilter ? `Đang khóa theo ngày ${selectedDateFilter}` : 'Accordion theo ngày để xem nhanh lịch sử và thao tác sửa/xóa.'}
        jarNameByKey={jarNameByKey}
        selectedIds={selectedIds}
        highlightDate={selectedDateFilter}
        onToggleSelection={handleToggleSelection}
        onToggleSelectAll={handleToggleSelectAll}
        onDeleteSelected={handleDeleteSelected}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <button type="button" onClick={openCreateModal} className="fixed bottom-24 right-4 z-20 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-400 lg:hidden">
        <PlusIcon className="h-5 w-5" />Nhập hôm nay
      </button>

      {isEditorOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur sm:items-center">
          <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/10 bg-[#111428] shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{editingId ? 'Edit transaction' : 'Quick transaction'}</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{editingId ? 'Chỉnh sửa giao dịch' : 'Nhập chi tiêu hôm nay'}</h2>
              </div>
              <button type="button" onClick={closeEditor} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10" aria-label="Đóng form giao dịch"><XMarkIcon className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="rounded-2xl border border-white/8 bg-[#12182b] px-4 py-3">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Ngày</span>
                  <input aria-label="Ngày giao dịch" name="transaction_date" type="date" value={form.transaction_date} onChange={handleChange} required className="w-full bg-transparent text-sm text-white outline-none" />
                </label>
                <label className="rounded-2xl border border-white/8 bg-[#12182b] px-4 py-3">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Số tiền</span>
                  <input aria-label="Số tiền giao dịch" name="amount" type="number" min="0" step="0.1" value={form.amount} onChange={handleChange} required autoFocus className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
                  <p className="mt-2 text-xs text-slate-500">Nhập theo nghìn đồng. Ví dụ `100` = `100.000đ`.</p>
                </label>
                <label className="rounded-2xl border border-white/8 bg-[#12182b] px-4 py-3">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Hũ</span>
                  <select name="jar_key" value={form.jar_key} onChange={handleChange} required className="w-full bg-transparent text-sm text-white outline-none">
                    {availableJars.map((jar) => <option key={jar._id} value={jar.jar_key}>{jar.display_name_vi}</option>)}
                  </select>
                </label>
                <label className="rounded-2xl border border-white/8 bg-[#12182b] px-4 py-3">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Mô tả</span>
                  <input aria-label="Mô tả giao dịch" name="description" value={form.description} onChange={handleChange} required className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
                </label>
              </div>

              <div className="rounded-2xl border border-white/8 bg-[#12182b] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Category</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {categoryOptions.map((option) => {
                    const optionValue = option.value || '';
                    const isActive = form.category === optionValue;
                    return (
                      <button key={option.label} type="button" onClick={() => setForm((current) => ({ ...current, category: optionValue }))} className={[ 'rounded-full px-3 py-1.5 text-sm font-medium transition', isActive ? 'bg-white text-slate-950' : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10' ].join(' ')}>
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block rounded-2xl border border-white/8 bg-[#12182b] px-4 py-3">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Ghi chú</span>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows="3" className="w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
              </label>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeEditor} className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Hủy</button>
                <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"><PencilSquareIcon className="h-5 w-5" />{editingId ? 'Lưu thay đổi' : 'Lưu giao dịch'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isLoading ? <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-400">Đang tải giao dịch...</div> : null}
    </div>
  );
};

export default TransactionsPage;
