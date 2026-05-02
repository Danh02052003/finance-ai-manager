import { useEffect, useState } from 'react';

import {
  createDebt,
  deleteDebt,
  getDebts,
  getJars,
  updateDebt
} from '../api/dashboardApi.js';
import CurrencyInput from '../components/CurrencyInput.jsx';
import DebtTable from '../components/DebtTable.jsx';

const defaultForm = {
  from_jar_key: '',
  to_jar_key: '',
  month: '',
  amount: '',
  debt_date: '',
  status: 'open',
  settled_at: '',
  reason: ''
};

const DebtsPage = () => {
  const [debts, setDebts] = useState([]);
  const [jars, setJars] = useState([]);
  const [filterStatus, setFilterStatus] = useState('open'); // Mặc định hiển thị nợ chưa trả
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadDebts = async () => {
    try {
      const [debtResponse, jarResponse] = await Promise.all([getDebts(), getJars()]);
      setDebts(Array.isArray(debtResponse.data) ? debtResponse.data : []);
      setJars(Array.isArray(jarResponse.data) ? jarResponse.data : []);
      setError('');
    } catch (requestError) {
      setError('Không tải được dữ liệu nợ.');
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
      from_jar_key: 'long_term_saving',
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
        await updateDebt(editingId, form);
        setMessage('Đã cập nhật khoản nợ.');
      } else {
        await createDebt(form);
        setMessage('Đã tạo khoản nợ mới.');
      }

      resetForm();
      await loadDebts();
    } catch (requestError) {
      setError(requestError.message || 'Không lưu được khoản nợ.');
    }
  };

  const handleEdit = (debt) => {
    setEditingId(debt._id);
    setForm({
      from_jar_key: debt.from_jar_key || '',
      to_jar_key: debt.to_jar_key || '',
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
    if (!window.confirm('Xóa khoản nợ này?')) return;

    try {
      await deleteDebt(debt._id);
      if (editingId === debt._id) resetForm();
      setMessage('Đã xóa khoản nợ.');
      await loadDebts();
    } catch (requestError) {
      setError(requestError.message || 'Không xóa được.');
    }
  };

  const handleQuickSettle = async (debt) => {
    if (!window.confirm('Tất toán khoản nợ này ngay bây giờ? Hệ thống sẽ tự động tạo giao dịch hoàn tiền.')) return;
    
    try {
      const today = new Date().toISOString().slice(0, 10);
      const updatedDebt = {
        from_jar_key: debt.from_jar_key,
        to_jar_key: debt.to_jar_key,
        month: debt.month,
        amount: debt.amount,
        debt_date: debt.debt_date?.slice(0, 10),
        status: 'settled',
        settled_at: today,
        reason: debt.reason
      };
      await updateDebt(debt._id, updatedDebt);
      setMessage('Đã tất toán khoản nợ thành công.');
      await loadDebts();
    } catch (requestError) {
      setError(requestError.message || 'Không thể tất toán.');
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

  return (
    <div className="space-y-6 pb-24">
      {/* Header Section */}
      <section
        id="debts-overview"
        data-assistant-target="debts-overview"
        className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[linear-gradient(135deg,rgba(245,158,11,0.1)_0%,rgba(239,68,68,0.08)_45%,rgba(10,10,26,0.97)_100%)] p-6 sm:p-8"
      >
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Nợ nội bộ</h1>
          </div>
          <button 
            onClick={openNewForm}
            className="shrink-0 rounded-2xl bg-white text-indigo-900 px-5 py-3 text-sm font-semibold shadow-lg shadow-white/10 transition-all hover:bg-slate-100 hover:scale-[1.02] active:scale-95"
          >
            + Ghi nợ mới
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

      {/* Filter Area */}
      <div className="flex items-center gap-2 mb-4">
        <button 
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === 'all' ? 'bg-white/10 text-white border border-white/20' : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
        >
          Tất cả
        </button>
        <button 
          onClick={() => setFilterStatus('open')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === 'open' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-transparent text-slate-400 hover:text-amber-200/70 hover:bg-white/5'}`}
        >
          Chưa trả (Đang mở)
        </button>
        <button 
          onClick={() => setFilterStatus('settled')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === 'settled' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-transparent text-slate-400 hover:text-emerald-200/70 hover:bg-white/5'}`}
        >
          Đã trả (Tất toán)
        </button>
      </div>

      {/* Main Table Area */}
      <div id="debts-table" data-assistant-target="debts-table">
        <DebtTable 
          items={debts.filter(d => filterStatus === 'all' || d.status === filterStatus)} 
          jars={jars} 
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
                {editingId ? 'Chỉnh sửa khoản nợ' : 'Tạo khoản nợ mới'}
              </h2>
              <button onClick={resetForm} className="rounded-full p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white transition">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-1">
                  <label className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition focus-within:border-indigo-500/50 focus-within:bg-white/[0.04]">
                    <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Người mượn (Sang hũ)</span>
                    <select name="to_jar_key" value={form.to_jar_key} onChange={handleChange} required className="w-full bg-transparent text-sm font-medium text-white outline-none">
                      <option value="" className="text-slate-800">Chọn hũ đích</option>
                      {jars.map((jar) => <option key={jar._id} value={jar.jar_key} className="text-slate-800">{jar.display_name_vi}</option>)}
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition focus-within:border-indigo-500/50 focus-within:bg-white/[0.04]">
                    <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Số tiền (₫)</span>
                    <CurrencyInput name="amount" value={form.amount} onChange={handleChange} required className="w-full bg-transparent text-sm font-medium text-white outline-none" placeholder="VD: 50 -> 50.000đ" />
                  </label>

                  <label className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition focus-within:border-indigo-500/50 focus-within:bg-white/[0.04]">
                    <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Ngày ghi nhận</span>
                    <input aria-label="Ngày ghi nhận" type="date" name="debt_date" value={form.debt_date} onChange={handleChange} required className="w-full bg-transparent text-sm font-medium text-white outline-none" />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-12">
                  {editingId && (
                    <label className="col-span-12 sm:col-span-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition focus-within:border-indigo-500/50 focus-within:bg-white/[0.04]">
                      <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Trạng thái</span>
                      <select name="status" value={form.status} onChange={handleChange} required className="w-full bg-transparent text-sm font-medium text-white outline-none">
                        <option value="open" className="text-slate-800">Đang mở</option>
                        <option value="settled" className="text-slate-800">Đã tất toán</option>
                      </select>
                    </label>
                  )}

                  {editingId && form.status === 'settled' && (
                    <label className="col-span-12 sm:col-span-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition focus-within:border-indigo-500/50 focus-within:bg-white/[0.04]">
                      <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Ngày tất toán</span>
                      <input aria-label="Ngày tất toán" type="date" name="settled_at" value={form.settled_at} onChange={handleChange} className="w-full bg-transparent text-sm font-medium text-white outline-none" />
                    </label>
                  )}

                  <label className={`col-span-12 ${editingId ? (form.status === 'settled' ? 'sm:col-span-4' : 'sm:col-span-8') : 'sm:col-span-12'} rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition focus-within:border-indigo-500/50 focus-within:bg-white/[0.04]`}>
                    <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Lý do / Ghi chú</span>
                    <input aria-label="Lý do" name="reason" value={form.reason} onChange={handleChange} placeholder="VD: Ứng tiền ăn từ hũ hưởng thụ" className="w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-slate-600" />
                  </label>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
                  <button type="button" onClick={resetForm} className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06]">Hủy bỏ</button>
                  <button type="submit" className="rounded-xl bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 hover:scale-[1.02] active:scale-95">
                    {editingId ? 'Cập nhật khoản nợ' : 'Tạo khoản nợ'}
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

export default DebtsPage;
