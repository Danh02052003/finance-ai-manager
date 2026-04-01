import { formatCurrency, formatDate } from './formatters.js';

const TransactionTable = ({ items, onEdit, onDelete }) => (
  <section className="card table-card">
    <div className="table-header">
      <div>
        <p className="card-label">Danh sách giao dịch</p>
        <h3>Bảng giao dịch MVP</h3>
      </div>
    </div>

    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Ngày</th>
            <th>Mô tả</th>
            <th>Hũ</th>
            <th>Loại</th>
            <th>Số tiền</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((item, index) => (
              <tr key={item._id || `${item.description}-${index}`}>
                <td>{formatDate(item.transaction_date)}</td>
                <td>{item.description || '-'}</td>
                <td>{item.jar_key || '-'}</td>
                <td>{item.direction || '-'}</td>
                <td>{typeof item.amount === 'number' ? formatCurrency(item.amount) : '-'}</td>
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
              <td colSpan="6" className="empty-cell">
                Chưa có dữ liệu giao dịch từ backend.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

export default TransactionTable;
