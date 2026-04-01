import { useEffect, useState } from 'react';

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
    <div className="page-stack">
      <section className="card section-card">
        <p className="card-label">Nợ giữa các hũ</p>
        <h3>Theo dõi hoàn trả nội bộ</h3>
        <p className="section-copy">
          Màn hình này dành cho các khoản tạm ứng giữa các hũ trong mô hình 6 hũ.
        </p>
        {message ? <p className="section-copy">{message}</p> : null}
        {error ? <p className="callout callout-warning">{error}</p> : null}
      </section>

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
              <input name="month" value={form.month} onChange={handleChange} placeholder="2026-04" required />
            </label>

            <label className="field-group">
              <span>Số tiền</span>
              <input name="amount" type="number" value={form.amount} onChange={handleChange} required />
            </label>

            <label className="field-group">
              <span>Ngày ghi nhận</span>
              <input type="date" name="debt_date" value={form.debt_date} onChange={handleChange} required />
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
              <input type="date" name="settled_at" value={form.settled_at} onChange={handleChange} />
            </label>

            <label className="field-group field-group-wide">
              <span>Lý do</span>
              <input name="reason" value={form.reason} onChange={handleChange} />
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

      <DebtTable items={debts} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  );
};

export default DebtsPage;
