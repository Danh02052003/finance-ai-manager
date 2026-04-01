import { formatCurrency, formatDate } from './formatters.js';

const MonthlyIncomeTable = ({ items, onEdit, onDelete }) => (
  <section className="card table-card">
    <div className="table-header">
      <div>
        <p className="card-label">Thu nhập theo tháng</p>
        <h3>Bảng thu nhập</h3>
      </div>
    </div>

    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Tháng</th>
            <th>Tổng thu nhập</th>
            <th>Ngày nhận</th>
            <th>Ghi chú</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((item, index) => (
              <tr key={item._id || `${item.month}-${index}`}>
                <td>{item.month || '-'}</td>
                <td>{typeof item.total_amount === 'number' ? formatCurrency(item.total_amount) : '-'}</td>
                <td>{formatDate(item.income_date)}</td>
                <td>{item.source_note || '-'}</td>
                <td>
                  <div className="table-actions">
                    <button type="button" className="action-button" onClick={() => onEdit?.(item)}>
                      Sửa
                    </button>
                    <button
                      type="button"
                      className="action-button action-button-danger"
                      onClick={() => onDelete?.(item)}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="empty-cell">
                Chưa có dữ liệu thu nhập theo tháng.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

export default MonthlyIncomeTable;
