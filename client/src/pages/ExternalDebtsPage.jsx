import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  createExternalDebt,
  deleteExternalDebt,
  getExternalDebts,
  updateExternalDebt
} from '../api/dashboardApi.js';
import CurrencyInput from '../components/CurrencyInput.jsx';
import ExternalDebtTable from '../components/ExternalDebtTable.jsx';
import { formatCurrency } from '../components/formatters.js';

const defaultForm = {
  creditor_name: '',
  debt_type: 'borrowed', // or 'lent'
  month: '',
  amount: '',
  debt_date: '',
  status: 'open',
  settled_at: '',
  reason: ''
};

const ExternalDebtsPage = () => {
  const { t, i18n } = useTranslation();
  const [debts, setDebts] = useState([]);
  const [filterStatus, setFilterStatus] = useState('open'); // Mặc định hiển thị nợ chưa trả
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadDebts = async () => {
    try {
      const response = await getExternalDebts();
      setDebts(Array.isArray(response.data) ? response.data : []);
      setError('');
    } catch (requestError) {
      setError(t('debts.loadError', 'Không tải được dữ liệu nợ.'));
    }
  };

  useEffect(() => {
    loadDebts();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => {
      const nextForm = { ...currentForm, [name]: value };
      if (name === 'debt_date' && value) {
        nextForm.month = value.substring(0, 7);
      }
      return nextForm;
    });
  };

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId('');
    setIsFormOpen(false);
  };

  const openNewForm = () => {
    const today = new Date().toISOString().slice(0, 10);
    setForm({
      ...defaultForm,
      debt_date: today,
      month: today.substring(0, 7)
    });
    setEditingId('');
    setIsFormOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (editingId) {
        await updateExternalDebt(editingId, form);
        setMessage(t('debts.updateSuccess', 'Đã cập nhật khoản nợ.'));
      } else {
        await createExternalDebt(form);
        setMessage(t('debts.createSuccess', 'Đã tạo khoản nợ mới.'));
      }

      resetForm();
      await loadDebts();
    } catch (requestError) {
      setError(requestError.message || t('debts.saveError', 'Không lưu được khoản nợ.'));
    }
  };

  const handleEdit = (debt) => {
    setEditingId(debt._id);
    setForm({
      creditor_name: debt.creditor_name || '',
      debt_type: debt.debt_type || 'borrowed',
      month: debt.month || '',
      amount: debt.amount?.toString() || '',
      debt_date: debt.debt_date?.slice(0, 10) || '',
      status: debt.status || 'open',
      settled_at: debt.settled_at?.slice(0, 10) || '',
      reason: debt.reason || ''
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (debt) => {
    if (!window.confirm(t('debts.deleteConfirm', 'Xóa khoản nợ này?'))) return;

    try {
      await deleteExternalDebt(debt._id);
      if (editingId === debt._id) resetForm();
      setMessage(t('debts.deleteSuccess', 'Đã xóa khoản nợ.'));
      await loadDebts();
    } catch (requestError) {
      setError(requestError.message || t('debts.deleteError', 'Không xóa được.'));
    }
  };

  const handleQuickSettle = async (debt) => {
    if (!window.confirm(t('debts.settleConfirmExt', 'Đánh dấu khoản nợ này đã tất toán (Đã trả)?'))) return;
    
    try {
      const today = new Date().toISOString().slice(0, 10);
      const updatedDebt = {
        creditor_name: debt.creditor_name,
        debt_type: debt.debt_type,
        month: debt.month,
        amount: debt.amount,
        debt_date: debt.debt_date?.slice(0, 10),
        status: 'settled',
        settled_at: today,
        reason: debt.reason
      };
      await updateExternalDebt(debt._id, updatedDebt);
      setMessage(t('debts.settleSuccess', 'Đã tất toán khoản nợ thành công.'));
      await loadDebts();
    } catch (requestError) {
      setError(requestError.message || t('debts.settleError', 'Không thể tất toán.'));
    }
  };

  // Clear messages after 3s
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage('');
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  const debtStats = useMemo(() => {
    let totalBorrowed = 0;
    let totalLent = 0;
    
    debts.filter(d => d.status === 'open').forEach(debt => {
      if (debt.debt_type === 'borrowed') {
        totalBorrowed += debt.amount || 0;
      } else {
        totalLent += debt.amount || 0;
      }
    });

    return { totalBorrowed, totalLent };
  }, [debts]);

  return (
    <div className="space-y-6 pb-24">
      {/* Header Section */}
      <section
        id="ext-debts-overview"
        data-assistant-target="ext-debts-overview"
        className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[linear-gradient(135deg,rgba(16,185,129,0.1)_0%,rgba(59,130,246,0.08)_45%,rgba(10,10,26,0.97)_100%)] p-6 sm:p-8"
      >
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{t('debts.extTitle', 'Nợ người khác')}</h1>
            <p className="mt-1 text-sm text-slate-400">Theo dõi các khoản tiền mượn người khác hoặc cho người khác mượn.</p>
          </div>
          <button 
            onClick={openNewForm}
            className="shrink-0 rounded-2xl bg-white text-emerald-900 px-5 py-3 text-sm font-semibold shadow-lg shadow-white/10 transition-all hover:bg-slate-100 hover:scale-[1.02] active:scale-95"
          >
            {t('debts.newExtDebt', '+ Ghi nợ ngoài')}
          </button>
        </div>

        {/* Floating Success/Error Toast */}
        <div className={`absolute top-4 right-4 transition-all duration-300 transform ${message || error ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
          {message ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-300 backdrop-blur-md shadow-xl">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-300 backdrop-blur-md shadow-xl">
              {error}
            </div>
          ) : null}
        </div>
      </section>

      {/* Debt Summary Section */}
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 flex flex-col justify-center">
          <h3 className="text-sm font-semibold text-rose-300 mb-2">{t('debts.totalBorrowed', 'Tổng nợ người khác')}</h3>
          <div className="text-3xl font-bold text-rose-400 tabular-nums">
            {formatCurrency(debtStats.totalBorrowed)}
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 flex flex-col justify-center">
          <h3 className="text-sm font-semibold text-emerald-300 mb-2">{t('debts.totalLent', 'Tổng tiền cho mượn')}</h3>
          <div className="text-3xl font-bold text-emerald-400 tabular-nums">
            {formatCurrency(debtStats.totalLent)}
          </div>
        </div>
      </section>

      {/* Filter Area */}
      <div className="flex items-center gap-2 mb-4">
        <button 
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === 'all' ? 'bg-white/10 text-white border border-white/20' : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
        >
          {t('debts.all', 'Tất cả')}
        </button>
        <button 
          onClick={() => setFilterStatus('open')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === 'open' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-transparent text-slate-400 hover:text-amber-200/70 hover:bg-white/5'}`}
        >
          {t('debts.open', 'Chưa trả (Đang mở)')}
        </button>
        <button 
          onClick={() => setFilterStatus('settled')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === 'settled' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-transparent text-slate-400 hover:text-emerald-200/70 hover:bg-white/5'}`}
        >
          {t('debts.settled', 'Đã trả (Tất toán)')}
        </button>
      </div>

      {/* Main Table Area */}
      <div id="ext-debts-table" data-assistant-target="ext-debts-table">
        <ExternalDebtTable 
          items={debts.filter(d => filterStatus === 'all' || d.status === filterStatus)} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
          onSettle={handleQuickSettle}
        />
      </div>

      {/* Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={resetForm}></div>
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0f0f1b] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="border-b border-white/[0.06] bg-white/[0.02] px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {editingId ? t('debts.editExtTitle', 'Chỉnh sửa nợ ngoài') : t('debts.createExtTitle', 'Ghi nợ ngoài mới')}
              </h2>
              <button onClick={resetForm} className="rounded-full p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white transition">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition focus-within:border-indigo-500/50 focus-within:bg-white/[0.04]">
                    <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-slate-500">{t('debts.extTypeLabel', 'Loại nợ')}</span>
                    <select name="debt_type" value={form.debt_type} onChange={handleChange} required className="w-full bg-transparent text-sm font-medium text-white outline-none">
                      <option value="borrowed" className="text-slate-800">{t('debts.borrowedType', 'Mượn tiền người khác')}</option>
                      <option value="lent" className="text-slate-800">{t('debts.lentType', 'Cho người khác mượn')}</option>
                    </select>
                  </label>

                  <label className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition focus-within:border-indigo-500/50 focus-within:bg-white/[0.04]">
                    <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-slate-500">{t('debts.personNameLabel', 'Tên người mượn/cho mượn')}</span>
                    <input name="creditor_name" value={form.creditor_name} onChange={handleChange} required placeholder="VD: Nguyễn Văn A" className="w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-slate-600" />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition focus-within:border-indigo-500/50 focus-within:bg-white/[0.04]">
                    <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-slate-500">{t('debts.amountLabel', 'Số tiền (₫)')}</span>
                    <CurrencyInput name="amount" value={form.amount} onChange={handleChange} required className="w-full bg-transparent text-sm font-medium text-white outline-none" placeholder="VD: 50 -> 50.000đ" />
                  </label>

                  <label className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition focus-within:border-indigo-500/50 focus-within:bg-white/[0.04]">
                    <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-slate-500">{t('debts.dateLabel', 'Ngày ghi nhận')}</span>
                    <input aria-label={t('debts.dateLabel', 'Ngày ghi nhận')} type="date" name="debt_date" value={form.debt_date} onChange={handleChange} required className="w-full bg-transparent text-sm font-medium text-white outline-none" />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-12">
                  {editingId && (
                    <label className="col-span-12 sm:col-span-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition focus-within:border-indigo-500/50 focus-within:bg-white/[0.04]">
                      <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-slate-500">{t('debts.statusLabel', 'Trạng thái')}</span>
                      <select name="status" value={form.status} onChange={handleChange} required className="w-full bg-transparent text-sm font-medium text-white outline-none">
                        <option value="open" className="text-slate-800">{t('debts.statusOpen', 'Đang mở')}</option>
                        <option value="settled" className="text-slate-800">{t('debts.statusSettled', 'Đã tất toán')}</option>
                      </select>
                    </label>
                  )}

                  {editingId && form.status === 'settled' && (
                    <label className="col-span-12 sm:col-span-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition focus-within:border-indigo-500/50 focus-within:bg-white/[0.04]">
                      <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-slate-500">{t('debts.settledDateLabel', 'Ngày tất toán')}</span>
                      <input aria-label={t('debts.settledDateLabel', 'Ngày tất toán')} type="date" name="settled_at" value={form.settled_at} onChange={handleChange} className="w-full bg-transparent text-sm font-medium text-white outline-none" />
                    </label>
                  )}

                  <label className={`col-span-12 ${editingId ? (form.status === 'settled' ? 'sm:col-span-4' : 'sm:col-span-8') : 'sm:col-span-12'} rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition focus-within:border-indigo-500/50 focus-within:bg-white/[0.04]`}>
                    <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-slate-500">{t('debts.reasonLabel', 'Lý do / Ghi chú')}</span>
                    <input aria-label={t('debts.reasonLabel', 'Lý do / Ghi chú')} name="reason" value={form.reason} onChange={handleChange} placeholder={t('debts.extReasonPlaceholder', 'VD: Mượn tiền mua laptop')} className="w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-slate-600" />
                  </label>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
                  <button type="button" onClick={resetForm} className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06]">{t('debts.cancel', 'Hủy bỏ')}</button>
                  <button type="submit" className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 hover:scale-[1.02] active:scale-95">
                    {editingId ? t('debts.updateBtn', 'Cập nhật khoản nợ') : t('debts.createExtBtn', 'Tạo khoản nợ ngoài')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalDebtsPage;
