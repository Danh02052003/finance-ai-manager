import { formatCurrency, formatDate } from './formatters.js';

const statusLabels = { open: 'Đang mở', settled: 'Đã tất toán' };
const statusStyles = { open: 'bg-amber-500/15 text-amber-300', settled: 'bg-emerald-500/15 text-emerald-300' };

const DebtTable = ({ items, onEdit, onDelete }) => (
  <section className="rounded-2xl border border-white/[0.06] bg-(--surface-strong) p-5">
    <h3 className="text-base font-semibold text-white">Danh sách nợ</h3>

    <div className="mt-4 space-y-2.5 md:hidden">
      {items.length > 0 ? (
        items.map((item, index) => (
          <article
            key={item._id || `${item.from_jar_key}-${index}`}
            className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs tabular-nums text-slate-500">{formatDate(item.debt_date)}</p>
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${statusStyles[item.status] || 'bg-white/[0.06] text-slate-400'}`}>
                {statusLabels[item.status] || item.status}
              </span>
            </div>
            <p className="mt-2 font-medium text-white">{item.from_jar_key || '-'} → {item.to_jar_key || '-'}</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-white">{typeof item.amount === 'number' ? formatCurrency(item.amount) : '-'}</p>
            {item.reason ? <p className="mt-2 text-xs text-slate-500">{item.reason}</p> : null}
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => onEdit?.(item)} className="flex-1 rounded-lg border border-white/[0.08] py-2 text-xs font-medium text-slate-300 transition hover:bg-white/[0.06]">Sửa</button>
              <button type="button" onClick={() => onDelete?.(item)} className="flex-1 rounded-lg bg-rose-500/10 py-2 text-xs font-medium text-rose-300 transition hover:bg-rose-500/15">Xóa</button>
            </div>
          </article>
        ))
      ) : (
        <div className="rounded-xl border border-dashed border-white/[0.08] px-4 py-8 text-center text-sm text-slate-500">
          Chưa có khoản nợ nào.
        </div>
      )}
    </div>

    <div className="mt-4 hidden overflow-hidden rounded-xl border border-white/[0.06] md:block">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white/[0.04] text-left text-[11px] font-medium uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Ngày</th>
              <th className="px-4 py-3">Từ hũ</th>
              <th className="px-4 py-3">Sang hũ</th>
              <th className="px-4 py-3">Tháng</th>
              <th className="px-4 py-3">Số tiền</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {items.length > 0 ? (
              items.map((item, index) => (
                <tr key={item._id || `${item.from_jar_key}-${index}`} className="transition hover:bg-white/[0.02]">
                  <td className="px-4 py-3 tabular-nums text-slate-400">{formatDate(item.debt_date)}</td>
                  <td className="px-4 py-3 font-medium text-white">{item.from_jar_key || '-'}</td>
                  <td className="px-4 py-3 font-medium text-white">{item.to_jar_key || '-'}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-400">{item.month || '-'}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-200">{typeof item.amount === 'number' ? formatCurrency(item.amount) : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${statusStyles[item.status] || 'bg-white/[0.06] text-slate-400'}`}>
                      {statusLabels[item.status] || item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button type="button" onClick={() => onEdit?.(item)} className="rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/[0.06]">Sửa</button>
                      <button type="button" onClick={() => onDelete?.(item)} className="rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/15">Xóa</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" className="px-4 py-10 text-center text-sm text-slate-500">Chưa có khoản nợ nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);

export default DebtTable;
