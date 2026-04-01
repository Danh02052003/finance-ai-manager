import { formatCurrency, formatDate } from './formatters.js';

const MonthlyIncomeTable = ({ items, onEdit, onDelete }) => (
  <section className="rounded-[28px] border border-white/10 bg-(--surface-strong) p-5 shadow-lg shadow-slate-950/20">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
        Thu nhập theo tháng
      </p>
      <h3 className="mt-2 text-2xl font-semibold text-white">Lịch sử thu nhập</h3>
    </div>

    <div className="mt-5 space-y-3 md:hidden">
      {items.length > 0 ? (
        items.map((item, index) => (
          <article
            key={item._id || `${item.month}-${index}`}
            className="rounded-[24px] border border-white/10 bg-slate-950/35 p-4"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.month || '-'}</p>
            <p className="mt-2 text-2xl font-bold text-white">
              {typeof item.total_amount === 'number' ? formatCurrency(item.total_amount) : '-'}
            </p>
            <p className="mt-3 text-sm text-slate-400">Ngày nhận: {formatDate(item.income_date)}</p>
            <p className="mt-1 text-sm text-slate-500">{item.source_note || 'Không có ghi chú'}</p>
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
          Chưa có dữ liệu thu nhập theo tháng.
        </div>
      )}
    </div>

    <div className="mt-5 hidden overflow-hidden rounded-[24px] border border-white/10 md:block">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            <tr>
              <th className="px-4 py-4">Tháng</th>
              <th className="px-4 py-4">Tổng thu nhập</th>
              <th className="px-4 py-4">Ngày nhận</th>
              <th className="px-4 py-4">Ghi chú</th>
              <th className="px-4 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-slate-950/20">
            {items.length > 0 ? (
              items.map((item, index) => (
                <tr key={item._id || `${item.month}-${index}`}>
                  <td className="px-4 py-4 font-semibold text-white">{item.month || '-'}</td>
                  <td className="px-4 py-4 text-slate-200">
                    {typeof item.total_amount === 'number' ? formatCurrency(item.total_amount) : '-'}
                  </td>
                  <td className="px-4 py-4 text-slate-400">{formatDate(item.income_date)}</td>
                  <td className="px-4 py-4 text-slate-400">{item.source_note || '-'}</td>
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
                <td colSpan="5" className="px-4 py-10 text-center text-sm text-slate-400">
                  Chưa có dữ liệu thu nhập theo tháng.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);

export default MonthlyIncomeTable;
