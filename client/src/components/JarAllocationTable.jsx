import { formatCurrency } from './formatters.js';

const JarAllocationTable = ({ items, onEdit, onDelete }) => (
  <section className="card table-card">
    <div className="table-header">
      <div>
        <p className="card-label">Phân bổ theo hũ</p>
        <h3>Bảng phân bổ</h3>
      </div>
    </div>

    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Tháng</th>
            <th>Hũ</th>
            <th>Số tiền</th>
            <th>Tỷ lệ</th>
            <th>Ghi chú</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((item, index) => (
              <tr key={item._id || `${item.month}-${item.jar_key}-${index}`}>
                <td>{item.month || '-'}</td>
                <td>{item.jar_key || '-'}</td>
                <td>{typeof item.allocated_amount === 'number' ? formatCurrency(item.allocated_amount) : '-'}</td>
                <td>
                  {typeof item.allocation_percentage === 'number'
                    ? `${item.allocation_percentage}%`
                    : '-'}
                </td>
                <td>{item.note || '-'}</td>
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
                Chưa có dữ liệu phân bổ hũ.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

export default JarAllocationTable;
