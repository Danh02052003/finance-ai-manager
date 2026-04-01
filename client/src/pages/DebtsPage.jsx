import { useEffect, useRef, useState } from 'react';

import {
  createDebt,
  deleteDebt,
  getDebts,
  getJars,
  updateDebt
} from '../api/dashboardApi.js';
import DebtTable from '../components/DebtTable.jsx';
import FormSection from '../components/FormSection.jsx';

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
      setMessage(debtResponse.message || 'Đã tải dữ liệu nợ.');
      setError('');
    } catch (requestError) {
      setError('Không tải được dữ liệu nợ giữa các hũ.');
    }
  };

  useEffect(() => {
    loadDebts();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
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
    const isConfirmed = window.confirm('Bạn có chắc muốn xóa khoản nợ này?');

    if (!isConfirmed) {
      return;
    }

    try {
      await deleteDebt(debt._id);
      if (editingId === debt._id) {
        resetForm();
      }
      setMessage('Đã xóa khoản nợ.');
      await loadDebts();
    } catch (requestError) {
      setError(requestError.message || 'Không xóa được khoản nợ.');
    }
  };

  return (
    <div className="space-y-6">
      <section
        id="debts-overview"
        data-assistant-target="debts-overview"
        className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(245,158,11,0.16)_0%,rgba(239,68,68,0.12)_45%,rgba(15,15,35,0.96)_100%)] p-6 shadow-2xl shadow-slate-950/20"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Nợ giữa các hũ</p>
        <h3 className="mt-2 text-3xl font-bold tracking-tight text-white">Theo dõi hoàn trả nội bộ</h3>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
          Màn hình này dành cho các khoản tạm ứng giữa các hũ trong mô hình 6 hũ.
        </p>
        {message ? <p className="mt-4 text-sm text-slate-400">{message}</p> : null}
        {error ? (
          <div className="mt-4 rounded-3xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {error}
          </div>
        ) : null}
      </section>

      <div ref={formRef} id="debts-form" data-assistant-target="debts-form">
        <FormSection
          label="Nhập liệu"
          title={editingId ? 'Chỉnh sửa khoản nợ' : 'Tạo khoản nợ mới'}
        >
          <form className="entity-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field-group">
              <span>Từ hũ</span>
              <select name="from_jar_key" value={form.from_jar_key} onChange={handleChange} required>
                <option value="">Chọn hũ nguồn</option>
                {jars.map((jar) => (
                  <option key={jar._id} value={jar.jar_key}>
                    {jar.display_name_vi}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-group">
              <span>Sang hũ</span>
              <select name="to_jar_key" value={form.to_jar_key} onChange={handleChange} required>
                <option value="">Chọn hũ đích</option>
                {jars.map((jar) => (
                  <option key={jar._id} value={jar.jar_key}>
                    {jar.display_name_vi}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-group">
              <span>Tháng</span>
              <input
                aria-label="Tháng khoản nợ"
                name="month"
                type="month"
                value={form.month}
                onChange={handleChange}
                required
              />
            </label>

            <label className="field-group">
              <span>Số tiền</span>
              <input
                aria-label="Số tiền khoản nợ"
                name="amount"
                type="number"
                value={form.amount}
                onChange={handleChange}
                required
              />
            </label>

            <label className="field-group">
              <span>Ngày ghi nhận</span>
              <input
                aria-label="Ngày ghi nhận nợ"
                type="date"
                name="debt_date"
                value={form.debt_date}
                onChange={handleChange}
                required
              />
            </label>

            <label className="field-group">
              <span>Trạng thái</span>
              <select name="status" value={form.status} onChange={handleChange} required>
                <option value="open">open</option>
                <option value="settled">settled</option>
              </select>
            </label>
          </div>

          <div className="form-grid">
            <label className="field-group">
              <span>Ngày tất toán</span>
              <input
                aria-label="Ngày tất toán khoản nợ"
                type="date"
                name="settled_at"
                value={form.settled_at}
                onChange={handleChange}
              />
            </label>

            <label className="field-group field-group-wide">
              <span>Lý do</span>
              <input
                aria-label="Lý do khoản nợ"
                name="reason"
                value={form.reason}
                onChange={handleChange}
              />
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-button">
              {editingId ? 'Lưu thay đổi' : 'Tạo khoản nợ'}
            </button>
            <button type="button" className="secondary-button" onClick={resetForm}>
              Làm mới form
            </button>
          </div>
          </form>
        </FormSection>
      </div>

      <div id="debts-table" data-assistant-target="debts-table">
        <DebtTable items={debts} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
  );
};

export default DebtsPage;
