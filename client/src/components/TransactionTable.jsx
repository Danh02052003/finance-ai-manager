import { formatCurrency, formatDate } from './formatters.js';

const categoryLabels = {
  food_drink: 'Ăn Uống',
  bills: 'Hóa đơn',
  investment: 'Đầu tư',
  learning: 'Học Tập',
  family: 'Người thân',
  charity: 'Từ thiện',
  uncategorized: 'Chưa phân loại'
};

const TransactionTable = ({
  items,
  jarNameByKey = {},
  selectedIds = [],
  onToggleSelection,
  onToggleSelectAll,
  onDeleteSelected,
  onEdit,
  onDelete
}) => {
  const areAllVisibleSelected =
    items.length > 0 && items.every((item) => selectedIds.includes(item._id));

  return (
    <section className="rounded-[28px] border border-white/10 bg-(--surface-strong) p-5 shadow-lg shadow-slate-950/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Danh sách giao dịch
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Giao dịch gần nhất</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onToggleSelectAll}
            disabled={!items.length}
          >
            {areAllVisibleSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
          </button>
          <button
            type="button"
            className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2.5 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onDeleteSelected}
            disabled={!selectedIds.length}
          >
            Xóa đã chọn ({selectedIds.length})
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-3 md:hidden">
        {items.length > 0 ? (
          items.map((item, index) => (
            <article
              key={item._id || `${item.description}-${index}`}
              className="rounded-[24px] border border-white/10 bg-slate-950/35 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                  <input
                    aria-label={`Chọn giao dịch ${item.description || index + 1}`}
                    type="checkbox"
                    checked={selectedIds.includes(item._id)}
                    onChange={() => onToggleSelection?.(item._id)}
                    className="h-4 w-4 rounded border-white/20 bg-transparent"
                  />
                  {formatDate(item.transaction_date)}
                </label>
                <span className="text-right text-lg font-bold text-rose-300">
                  -{typeof item.amount === 'number' ? formatCurrency(item.amount) : '-'}
                </span>
              </div>

              <h4 className="mt-3 text-base font-semibold text-white">{item.description || '-'}</h4>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                  {jarNameByKey[item.jar_key] || item.jar_key || 'Không rõ hũ'}
                </span>
                <span className="rounded-full bg-indigo-400/10 px-3 py-1 text-xs font-medium text-indigo-100">
                  {categoryLabels[item.category] || 'Chưa phân loại'}
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  onClick={() => onEdit?.(item)}
                >
                  Sửa
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2.5 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/15"
                  onClick={() => onDelete?.(item)}
                >
                  Xóa
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-slate-400">
            Chưa có dữ liệu giao dịch từ backend.
          </div>
        )}
      </div>

      <div className="mt-5 hidden overflow-hidden rounded-[24px] border border-white/10 md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-4 py-4">
                  <input
                    aria-label="Chọn tất cả giao dịch"
                    type="checkbox"
                    checked={areAllVisibleSelected}
                    onChange={onToggleSelectAll}
                    className="h-4 w-4 rounded border-white/20 bg-transparent"
                  />
                </th>
                <th className="px-4 py-4">Ngày</th>
                <th className="px-4 py-4">Mô tả</th>
                <th className="px-4 py-4">Hũ</th>
                <th className="px-4 py-4">Mục chi tiêu</th>
                <th className="px-4 py-4 text-right">Số tiền</th>
                <th className="px-4 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-slate-950/20">
              {items.length > 0 ? (
                items.map((item, index) => (
                  <tr key={item._id || `${item.description}-${index}`} className="text-slate-200">
                    <td className="px-4 py-4">
                      <input
                        aria-label={`Chọn giao dịch ${item.description || index + 1}`}
                        type="checkbox"
                        checked={selectedIds.includes(item._id)}
                        onChange={() => onToggleSelection?.(item._id)}
                        className="h-4 w-4 rounded border-white/20 bg-transparent"
                      />
                    </td>
                    <td className="px-4 py-4 text-slate-400">{formatDate(item.transaction_date)}</td>
                    <td className="px-4 py-4 font-medium text-white">{item.description || '-'}</td>
                    <td className="px-4 py-4 text-slate-300">
                      {jarNameByKey[item.jar_key] || item.jar_key || '-'}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-indigo-400/10 px-3 py-1 text-xs font-medium text-indigo-100">
                        {categoryLabels[item.category] || 'Chưa phân loại'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-rose-300">
                      {typeof item.amount === 'number' ? formatCurrency(item.amount) : '-'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 font-semibold text-white transition hover:bg-white/10"
                          onClick={() => onEdit?.(item)}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 font-semibold text-rose-100 transition hover:bg-rose-400/15"
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
                  <td colSpan="7" className="px-4 py-10 text-center text-sm text-slate-400">
                    Chưa có dữ liệu giao dịch từ backend.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default TransactionTable;
