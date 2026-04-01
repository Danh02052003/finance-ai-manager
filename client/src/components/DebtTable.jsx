import { formatCurrency, formatDate } from './formatters.js';

const DebtTable = ({ items, onEdit, onDelete }) => (
  <section className="card table-card">
    <div className="table-header">
      <div>
        <p className="card-label">Danh sách</p>
        <h3>Bảng nợ giữa các hũ</h3>
      </div>
    </div>

    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Ngày ghi nhận</th>
            <th>Từ hũ</th>
            <th>Sang hũ</th>
            <th>Tháng</th>
            <th>Số tiền</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((item, index) => (
              <tr key={item._id || `${item.from_jar_key}-${index}`}>
                <td>{formatDate(item.debt_date)}</td>
                <td>{item.from_jar_key || '-'}</td>
                <td>{item.to_jar_key || '-'}</td>
                <td>{item.month || '-'}</td>
                <td>{typeof item.amount === 'number' ? formatCurrency(item.amount) : '-'}</td>
                <td>{item.status || '-'}</td>
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
              <td colSpan="7" className="empty-cell">
                Chưa có dữ liệu nợ từ backend.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

export default DebtTable;
