import { useEffect, useMemo, useState } from 'react';

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
import FormSection from '../components/FormSection.jsx';
import JarAllocationTable from '../components/JarAllocationTable.jsx';
import MonthlyIncomeTable from '../components/MonthlyIncomeTable.jsx';

const defaultIncomeForm = {
  month: '',
  total_amount: '',
  income_date: '',
  source_note: ''
};

const defaultAllocationForm = {
  monthly_income_id: '',
  jar_key: '',
  allocated_amount: '',
  allocation_percentage: '',
  note: ''
};

const MonthlyPlanPage = () => {
  const [monthlyIncomes, setMonthlyIncomes] = useState([]);
  const [jarAllocations, setJarAllocations] = useState([]);
  const [jars, setJars] = useState([]);
  const [incomeForm, setIncomeForm] = useState(defaultIncomeForm);
  const [allocationForm, setAllocationForm] = useState(defaultAllocationForm);
  const [editingIncomeId, setEditingIncomeId] = useState('');
  const [editingAllocationId, setEditingAllocationId] = useState('');
  const [message, setMessage] = useState('Đang tải dữ liệu kế hoạch tháng.');
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
      setMessage('Dữ liệu kế hoạch tháng đã được tải.');
      setError('');
    } catch (requestError) {
      setError('Không tải được dữ liệu kế hoạch tháng.');
    }
  };

  useEffect(() => {
    loadMonthlyPlanData();
  }, []);

  const monthlyIncomeOptions = useMemo(
    () =>
      monthlyIncomes.map((item) => ({
        value: item._id,
        label: `${item.month} - ${item.total_amount}`
      })),
    [monthlyIncomes]
  );

  const handleIncomeChange = (event) => {
    const { name, value } = event.target;
    setIncomeForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  };

  const handleAllocationChange = (event) => {
    const { name, value } = event.target;
    setAllocationForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  };

  const resetIncomeForm = () => {
    setIncomeForm(defaultIncomeForm);
    setEditingIncomeId('');
  };

  const resetAllocationForm = () => {
    setAllocationForm(defaultAllocationForm);
    setEditingAllocationId('');
  };

  const handleIncomeSubmit = async (event) => {
    event.preventDefault();

    try {
      if (editingIncomeId) {
        await updateMonthlyIncome(editingIncomeId, incomeForm);
        setMessage('Đã cập nhật thu nhập tháng.');
      } else {
        await createMonthlyIncome(incomeForm);
        setMessage('Đã tạo thu nhập tháng.');
      }

      resetIncomeForm();
      await loadMonthlyPlanData();
    } catch (requestError) {
      setError(requestError.message || 'Không lưu được thu nhập tháng.');
    }
  };

  const handleAllocationSubmit = async (event) => {
    event.preventDefault();

    try {
      if (editingAllocationId) {
        await updateJarAllocation(editingAllocationId, allocationForm);
        setMessage('Đã cập nhật phân bổ hũ.');
      } else {
        await createJarAllocation(allocationForm);
        setMessage('Đã tạo phân bổ hũ.');
      }

      resetAllocationForm();
      await loadMonthlyPlanData();
    } catch (requestError) {
      setError(requestError.message || 'Không lưu được phân bổ hũ.');
    }
  };

  const handleEditIncome = (monthlyIncome) => {
    setEditingIncomeId(monthlyIncome._id);
    setIncomeForm({
      month: monthlyIncome.month || '',
      total_amount: monthlyIncome.total_amount?.toString() || '',
      income_date: monthlyIncome.income_date?.slice(0, 10) || '',
      source_note: monthlyIncome.source_note || ''
    });
  };

  const handleEditAllocation = (jarAllocation) => {
    setEditingAllocationId(jarAllocation._id);
    setAllocationForm({
      monthly_income_id: jarAllocation.monthly_income_id || '',
      jar_key: jarAllocation.jar_key || '',
      allocated_amount: jarAllocation.allocated_amount?.toString() || '',
      allocation_percentage: jarAllocation.allocation_percentage?.toString() || '',
      note: jarAllocation.note || ''
    });
  };

  const handleDeleteIncome = async (monthlyIncome) => {
    const isConfirmed = window.confirm(
      'Bạn có chắc muốn xóa thu nhập tháng này? Các phân bổ liên quan cũng sẽ bị xóa.'
    );

    if (!isConfirmed) {
      return;
    }

    try {
      await deleteMonthlyIncome(monthlyIncome._id);
      if (editingIncomeId === monthlyIncome._id) {
        resetIncomeForm();
      }
      setMessage('Đã xóa thu nhập tháng.');
      await loadMonthlyPlanData();
    } catch (requestError) {
      setError(requestError.message || 'Không xóa được thu nhập tháng.');
    }
  };

  const handleDeleteAllocation = async (jarAllocation) => {
    const isConfirmed = window.confirm('Bạn có chắc muốn xóa phân bổ hũ này?');

    if (!isConfirmed) {
      return;
    }

    try {
      await deleteJarAllocation(jarAllocation._id);
      if (editingAllocationId === jarAllocation._id) {
        resetAllocationForm();
      }
      setMessage('Đã xóa phân bổ hũ.');
      await loadMonthlyPlanData();
    } catch (requestError) {
      setError(requestError.message || 'Không xóa được phân bổ hũ.');
    }
  };

  return (
    <div className="page-stack">
      <section className="card section-card">
        <p className="card-label">Kế hoạch tháng</p>
        <h3>Nhập thu nhập và phân bổ 6 hũ</h3>
        <p className="section-copy">{message}</p>
        {error ? <p className="callout callout-warning">{error}</p> : null}
      </section>

      <section className="stats-grid">
        <FormSection
          label="Thu nhập tháng"
          title={editingIncomeId ? 'Chỉnh sửa thu nhập' : 'Tạo thu nhập mới'}
        >
          <form className="entity-form" onSubmit={handleIncomeSubmit}>
            <div className="form-grid">
              <label className="field-group">
                <span>Tháng</span>
                <input
                  name="month"
                  value={incomeForm.month}
                  onChange={handleIncomeChange}
                  placeholder="2026-04"
                  required
                />
              </label>

              <label className="field-group">
                <span>Tổng thu nhập</span>
                <input
                  name="total_amount"
                  type="number"
                  value={incomeForm.total_amount}
                  onChange={handleIncomeChange}
                  required
                />
              </label>

              <label className="field-group">
                <span>Ngày nhận</span>
                <input
                  type="date"
                  name="income_date"
                  value={incomeForm.income_date}
                  onChange={handleIncomeChange}
                />
              </label>

              <label className="field-group field-group-wide">
                <span>Ghi chú nguồn</span>
                <input
                  name="source_note"
                  value={incomeForm.source_note}
                  onChange={handleIncomeChange}
                />
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-button">
                {editingIncomeId ? 'Lưu thu nhập' : 'Tạo thu nhập'}
              </button>
              <button type="button" className="secondary-button" onClick={resetIncomeForm}>
                Làm mới form
              </button>
            </div>
          </form>
        </FormSection>

        <FormSection
          label="Phân bổ hũ"
          title={editingAllocationId ? 'Chỉnh sửa phân bổ' : 'Tạo phân bổ mới'}
        >
          <form className="entity-form" onSubmit={handleAllocationSubmit}>
            <div className="form-grid">
              <label className="field-group">
                <span>Thu nhập tháng</span>
                <select
                  name="monthly_income_id"
                  value={allocationForm.monthly_income_id}
                  onChange={handleAllocationChange}
                  required
                >
                  <option value="">Chọn tháng thu nhập</option>
                  {monthlyIncomeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-group">
                <span>Hũ</span>
                <select
                  name="jar_key"
                  value={allocationForm.jar_key}
                  onChange={handleAllocationChange}
                  required
                >
                  <option value="">Chọn hũ</option>
                  {jars.map((jar) => (
                    <option key={jar._id} value={jar.jar_key}>
                      {jar.display_name_vi}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-group">
                <span>Số tiền phân bổ</span>
                <input
                  name="allocated_amount"
                  type="number"
                  value={allocationForm.allocated_amount}
                  onChange={handleAllocationChange}
                  required
                />
              </label>

              <label className="field-group">
                <span>Tỷ lệ phân bổ</span>
                <input
                  name="allocation_percentage"
                  type="number"
                  value={allocationForm.allocation_percentage}
                  onChange={handleAllocationChange}
                />
              </label>
            </div>

            <label className="field-group">
              <span>Ghi chú</span>
              <input name="note" value={allocationForm.note} onChange={handleAllocationChange} />
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-button">
                {editingAllocationId ? 'Lưu phân bổ' : 'Tạo phân bổ'}
              </button>
              <button type="button" className="secondary-button" onClick={resetAllocationForm}>
                Làm mới form
              </button>
            </div>
          </form>
        </FormSection>
      </section>

      <MonthlyIncomeTable
        items={monthlyIncomes}
        onEdit={handleEditIncome}
        onDelete={handleDeleteIncome}
      />

      <JarAllocationTable
        items={jarAllocations}
        onEdit={handleEditAllocation}
        onDelete={handleDeleteAllocation}
      />
    </div>
  );
};

export default MonthlyPlanPage;
