import { formatCurrency } from './formatters.js';

const JarAllocationTable = ({ items }) => (
  <section className="rounded-2xl border border-white/[0.06] bg-(--surface-strong) p-5">
    <h3 className="text-base font-semibold text-white">Lịch sử phân bổ</h3>

    <div className="mt-4 space-y-2.5 md:hidden">
      {items.length > 0 ? (
        items.map((item, index) => (
          <article
            key={item._id || `${item.month}-${item.jar_key}-${index}`}
            className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium tabular-nums text-slate-500">{item.month || '-'}</p>
              <p className="text-lg font-bold tabular-nums text-white">
                {typeof item.allocated_amount === 'number' ? formatCurrency(item.allocated_amount) : '-'}
              </p>
            </div>
            <p className="mt-2 text-sm font-medium text-white">{item.jar_key || '-'}</p>
            <p className="mt-1 text-xs text-slate-500">
              {typeof item.allocation_percentage === 'number' ? `${item.allocation_percentage}%` : '-'}
              {item.note ? ` · ${item.note}` : ''}
            </p>
          </article>
        ))
      ) : (
        <div className="rounded-xl border border-dashed border-white/[0.08] px-4 py-8 text-center text-sm text-slate-500">
          Chưa có dữ liệu phân bổ.
        </div>
      )}
    </div>

    <div className="mt-4 hidden overflow-hidden rounded-xl border border-white/[0.06] md:block">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white/[0.04] text-left text-[11px] font-medium uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Tháng</th>
              <th className="px-4 py-3">Hũ</th>
              <th className="px-4 py-3">Số tiền</th>
              <th className="px-4 py-3">Tỷ lệ</th>
              <th className="px-4 py-3">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {items.length > 0 ? (
              items.map((item, index) => (
                <tr key={item._id || `${item.month}-${item.jar_key}-${index}`} className="transition hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-semibold tabular-nums text-white">{item.month || '-'}</td>
                  <td className="px-4 py-3 text-slate-200">{item.jar_key || '-'}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-200">{typeof item.allocated_amount === 'number' ? formatCurrency(item.allocated_amount) : '-'}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-400">{typeof item.allocation_percentage === 'number' ? `${item.allocation_percentage}%` : '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{item.note || '-'}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="px-4 py-10 text-center text-sm text-slate-500">Chưa có dữ liệu.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);

export default JarAllocationTable;
