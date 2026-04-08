import { useEffect, useRef, useState } from 'react';

import {
  createDebt,
  deleteDebt,
  getDebts,
  getJars,
  updateDebt
} from '../api/dashboardApi.js';
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
  const formRef = useRef(null);
  const [debts, setDebts] = useState([]);
  const [jars, setJars] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState('');
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
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId('');
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
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  return (
    <div className="space-y-5">
      <section
        id="debts-overview"
        data-assistant-target="debts-overview"
        className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(135deg,rgba(245,158,11,0.1)_0%,rgba(239,68,68,0.08)_45%,rgba(10,10,26,0.97)_100%)] p-5 sm:p-6"
      >
        <h1 className="text-xl font-bold text-white">Nợ giữa các hũ</h1>
        <p className="mt-2 max-w-lg text-sm text-slate-400">
          Theo dõi các khoản tạm ứng và hoàn trả nội bộ giữa các hũ trong mô hình 6 hũ.
        </p>
        {message ? <p className="mt-3 text-sm text-emerald-300/80">{message}</p> : null}
        {error ? (
          <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{error}</div>
        ) : null}
      </section>

      <section
        ref={formRef}
        id="debts-form"
        data-assistant-target="debts-form"
        className="rounded-2xl border border-white/[0.06] bg-(--surface-strong) p-5"
      >
        <h2 className="text-base font-semibold text-white">
          {editingId ? 'Chỉnh sửa khoản nợ' : 'Tạo khoản nợ mới'}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
              <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Từ hũ</span>
              <select name="from_jar_key" value={form.from_jar_key} onChange={handleChange} required className="w-full bg-transparent text-sm text-white outline-none">
                <option value="">Chọn hũ nguồn</option>
                {jars.map((jar) => <option key={jar._id} value={jar.jar_key}>{jar.display_name_vi}</option>)}
              </select>
            </label>

            <label className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
              <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Sang hũ</span>
              <select name="to_jar_key" value={form.to_jar_key} onChange={handleChange} required className="w-full bg-transparent text-sm text-white outline-none">
                <option value="">Chọn hũ đích</option>
                {jars.map((jar) => <option key={jar._id} value={jar.jar_key}>{jar.display_name_vi}</option>)}
              </select>
            </label>

            <label className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
              <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Tháng</span>
              <input aria-label="Tháng" name="month" type="month" value={form.month} onChange={handleChange} required className="w-full bg-transparent text-sm text-white outline-none" />
            </label>

            <label className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
              <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Số tiền</span>
              <input aria-label="Số tiền" name="amount" type="number" value={form.amount} onChange={handleChange} required className="w-full bg-transparent text-sm text-white outline-none" />
            </label>

            <label className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
              <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Ngày ghi nhận</span>
              <input aria-label="Ngày ghi nhận" type="date" name="debt_date" value={form.debt_date} onChange={handleChange} required className="w-full bg-transparent text-sm text-white outline-none" />
            </label>

            <label className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
              <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Trạng thái</span>
              <select name="status" value={form.status} onChange={handleChange} required className="w-full bg-transparent text-sm text-white outline-none">
                <option value="open">Đang mở</option>
                <option value="settled">Đã tất toán</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
              <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Ngày tất toán</span>
              <input aria-label="Ngày tất toán" type="date" name="settled_at" value={form.settled_at} onChange={handleChange} className="w-full bg-transparent text-sm text-white outline-none" />
            </label>

            <label className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
              <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Lý do</span>
              <input aria-label="Lý do" name="reason" value={form.reason} onChange={handleChange} placeholder="VD: Ứng tiền ăn từ hũ hưởng thụ" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600" />
            </label>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={resetForm} className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06]">Làm mới</button>
            <button type="submit" className="flex-1 rounded-xl bg-indigo-500 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400">{editingId ? 'Cập nhật' : 'Tạo khoản nợ'}</button>
          </div>
        </form>
      </section>

      <div id="debts-table" data-assistant-target="debts-table">
        <DebtTable items={debts} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
  );
};

export default DebtsPage;
