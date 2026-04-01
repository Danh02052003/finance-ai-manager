import { formatCurrency, formatDate } from './formatters.js';

const DebtTable = ({ items, onEdit, onDelete }) => (
  <section className="rounded-[28px] border border-white/10 bg-(--surface-strong) p-5 shadow-lg shadow-slate-950/20">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Danh sách</p>
      <h3 className="mt-2 text-2xl font-semibold text-white">Bảng nợ giữa các hũ</h3>
    </div>

    <div className="mt-5 space-y-3 md:hidden">
      {items.length > 0 ? (
        items.map((item, index) => (
          <article
            key={item._id || `${item.from_jar_key}-${index}`}
            className="rounded-[24px] border border-white/10 bg-slate-950/35 p-4"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{formatDate(item.debt_date)}</p>
            <h4 className="mt-2 text-lg font-semibold text-white">
              {item.from_jar_key || '-'} → {item.to_jar_key || '-'}
            </h4>
            <p className="mt-3 text-2xl font-bold text-white">
              {typeof item.amount === 'number' ? formatCurrency(item.amount) : '-'}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {item.month || '-'} · {item.status || '-'}
            </p>
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
          Chưa có dữ liệu nợ từ backend.
        </div>
      )}
    </div>

    <div className="mt-5 hidden overflow-hidden rounded-[24px] border border-white/10 md:block">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            <tr>
              <th className="px-4 py-4">Ngày ghi nhận</th>
              <th className="px-4 py-4">Từ hũ</th>
              <th className="px-4 py-4">Sang hũ</th>
              <th className="px-4 py-4">Tháng</th>
              <th className="px-4 py-4">Số tiền</th>
              <th className="px-4 py-4">Trạng thái</th>
              <th className="px-4 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-slate-950/20">
            {items.length > 0 ? (
              items.map((item, index) => (
                <tr key={item._id || `${item.from_jar_key}-${index}`}>
                  <td className="px-4 py-4 text-slate-400">{formatDate(item.debt_date)}</td>
                  <td className="px-4 py-4 text-white">{item.from_jar_key || '-'}</td>
                  <td className="px-4 py-4 text-white">{item.to_jar_key || '-'}</td>
                  <td className="px-4 py-4 text-slate-300">{item.month || '-'}</td>
                  <td className="px-4 py-4 text-slate-200">
                    {typeof item.amount === 'number' ? formatCurrency(item.amount) : '-'}
                  </td>
                  <td className="px-4 py-4 text-slate-300">{item.status || '-'}</td>
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
                  Chưa có dữ liệu nợ từ backend.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);

export default DebtTable;
