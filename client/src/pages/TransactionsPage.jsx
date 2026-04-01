import { useEffect, useState } from 'react';

import {
  createTransaction,
  deleteTransaction,
  getJars,
  getTransactions,
  updateTransaction
} from '../api/dashboardApi.js';
import FormSection from '../components/FormSection.jsx';
import TransactionTable from '../components/TransactionTable.jsx';

const defaultForm = {
  month: '',
  transaction_date: '',
  amount: '',
  jar_key: '',
  direction: 'expense',
  description: '',
  source: 'manual',
  notes: ''
};

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [jars, setJars] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('Đang tải');
  const [error, setError] = useState('');

  const loadTransactions = async () => {
    try {
      const [transactionResponse, jarResponse] = await Promise.all([
        getTransactions(),
        getJars()
      ]);
      setTransactions(Array.isArray(transactionResponse.data) ? transactionResponse.data : []);
      setJars(Array.isArray(jarResponse.data) ? jarResponse.data : []);
      setMessage(transactionResponse.message || 'Sẵn sàng kết nối');
      setError('');
    } catch (requestError) {
      setError('Không tải được danh sách giao dịch từ backend.');
    }
  };

  useEffect(() => {
    loadTransactions();
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
        await updateTransaction(editingId, form);
        setMessage('Đã cập nhật giao dịch.');
      } else {
        await createTransaction(form);
        setMessage('Đã tạo giao dịch mới.');
      }

      resetForm();
      await loadTransactions();
    } catch (requestError) {
      setError(requestError.message || 'Không lưu được giao dịch.');
    }
  };

  const handleEdit = (transaction) => {
    setEditingId(transaction._id);
    setForm({
      month: transaction.month || '',
      transaction_date: transaction.transaction_date?.slice(0, 10) || '',
      amount: transaction.amount?.toString() || '',
      jar_key: transaction.jar_key || '',
      direction: transaction.direction || 'expense',
      description: transaction.description || '',
      source: transaction.source || 'manual',
      notes: transaction.notes || ''
    });
  };

  const handleDelete = async (transaction) => {
    const isConfirmed = window.confirm('Bạn có chắc muốn xóa giao dịch này?');

    if (!isConfirmed) {
      return;
    }

    try {
      await deleteTransaction(transaction._id);
      if (editingId === transaction._id) {
        resetForm();
      }
      setMessage('Đã xóa giao dịch.');
      await loadTransactions();
    } catch (requestError) {
      setError(requestError.message || 'Không xóa được giao dịch.');
    }
  };

  return (
    <div className="page-stack">
      <section className="card section-card">
        <p className="card-label">Giao dịch</p>
        <h3>Danh sách chi tiêu và giao dịch</h3>
        <p className="section-copy">{message}</p>
        {error ? <p className="callout callout-warning">{error}</p> : null}
      </section>

      <FormSection
        label="Nhập liệu"
        title={editingId ? 'Chỉnh sửa giao dịch' : 'Tạo giao dịch mới'}
      >
        <form className="entity-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field-group">
              <span>Tháng</span>
              <input name="month" value={form.month} onChange={handleChange} placeholder="2026-04" required />
            </label>

            <label className="field-group">
              <span>Ngày giao dịch</span>
              <input
                type="date"
                name="transaction_date"
                value={form.transaction_date}
                onChange={handleChange}
                required
              />
            </label>

            <label className="field-group">
              <span>Số tiền</span>
              <input name="amount" type="number" value={form.amount} onChange={handleChange} required />
            </label>

            <label className="field-group">
              <span>Hũ</span>
              <select name="jar_key" value={form.jar_key} onChange={handleChange}>
                <option value="">Không gắn hũ</option>
                {jars.map((jar) => (
                  <option key={jar._id} value={jar.jar_key}>
                    {jar.display_name_vi}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-group">
              <span>Loại</span>
              <select name="direction" value={form.direction} onChange={handleChange} required>
                <option value="expense">expense</option>
                <option value="income_adjustment">income_adjustment</option>
                <option value="transfer">transfer</option>
              </select>
            </label>

            <label className="field-group">
              <span>Nguồn</span>
              <input name="source" value={form.source} onChange={handleChange} />
            </label>
          </div>

          <label className="field-group">
            <span>Mô tả</span>
            <input name="description" value={form.description} onChange={handleChange} required />
          </label>

          <label className="field-group">
            <span>Ghi chú</span>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows="3" />
          </label>

          <div className="form-actions">
            <button type="submit" className="primary-button">
              {editingId ? 'Lưu thay đổi' : 'Tạo giao dịch'}
            </button>
            <button type="button" className="secondary-button" onClick={resetForm}>
              Làm mới form
            </button>
          </div>
        </form>
      </FormSection>

      <TransactionTable items={transactions} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  );
};

export default TransactionsPage;
