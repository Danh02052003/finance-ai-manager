import { formatCurrency, formatDate } from './formatters.js';

const statusLabels = { open: 'Đang mở', settled: 'Đã tất toán' };
const statusStyles = { 
  open: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]', 
  settled: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
};

const DebtTable = ({ items, jars = [], onEdit, onDelete, onSettle }) => {
  const getJarName = (key) => {
    const jar = jars.find(j => j.jar_key === key);
    return jar ? jar.display_name_vi : key;
  };

  return (
  <section className="rounded-3xl border border-white/[0.08] bg-black/20 backdrop-blur-md p-6 shadow-2xl">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-bold text-white tracking-tight">Danh sách nợ</h3>
      <div className="text-sm font-medium text-slate-400">
        Tổng số: <span className="text-white">{items.length}</span>
      </div>
    </div>

    {/* Mobile View */}
    <div className="space-y-4 md:hidden">
      {items.length > 0 ? (
        items.map((item, index) => (
          <article
            key={item._id || `${item.from_jar_key}-${index}`}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition-all hover:bg-white/[0.04] hover:shadow-lg hover:shadow-indigo-500/5"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${statusStyles[item.status] || 'bg-white/[0.06] text-slate-400 border border-white/10'}`}>
                  {statusLabels[item.status] || item.status}
                </span>
                <p className="text-xs font-medium tabular-nums text-slate-400">{formatDate(item.debt_date)}</p>
              </div>
              
              <div className="flex items-center gap-2 mb-4 text-sm bg-white/[0.02] p-3 rounded-xl border border-white/[0.02] justify-center">
                <span className="font-semibold text-indigo-300">{getJarName(item.from_jar_key) || '-'}</span>
                <span className="text-slate-600 mx-1">➔</span>
                <span className="font-semibold text-rose-300">{getJarName(item.to_jar_key) || '-'}</span>
              </div>

              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1">Số tiền</p>
                  <p className="text-2xl font-bold tabular-nums text-white tracking-tight">
                    {typeof item.amount === 'number' ? formatCurrency(item.amount) : '-'}
                  </p>
                </div>
                {item.reason && (
                  <div className="text-right max-w-[50%]">
                    <p className="text-xs text-slate-400 truncate" title={item.reason}>{item.reason}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-white/[0.06]">
                {item.status === 'open' && (
                  <button 
                    type="button" 
                    onClick={() => onSettle?.(item)} 
                    className="flex-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 py-2.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                  >
                    Tất toán ngay
                  </button>
                )}
                <button type="button" onClick={() => onEdit?.(item)} className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white">Sửa</button>
                <button type="button" onClick={() => onDelete?.(item)} className="flex-none rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-2.5 text-xs font-medium text-rose-400 transition hover:bg-rose-500/10 hover:text-rose-300">Xóa</button>
              </div>
            </div>
          </article>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/[0.1] bg-white/[0.02] py-16 px-6 text-center">
          <div className="rounded-full bg-white/[0.05] p-4 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <p className="text-base font-medium text-white mb-1">Chưa có khoản nợ nào</p>
          <p className="text-sm text-slate-500">Các khoản tạm ứng giữa các hũ sẽ xuất hiện ở đây.</p>
        </div>
      )}
    </div>

    {/* Desktop View */}
    <div className="hidden overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] md:block">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white/[0.04] border-b border-white/[0.08]">
            <tr>
              <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 w-[30%]">Thông tin</th>
              <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 w-[40%]">Giao dịch</th>
              <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-slate-400 w-[30%]">Số tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {items.length > 0 ? (
              items.map((item, index) => (
                <tr key={item._id || `${item.from_jar_key}-${index}`} className="group transition hover:bg-white/[0.02]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full shadow-sm ${item.status === 'settled' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-amber-500 shadow-amber-500/50'}`} title={statusLabels[item.status]} />
                      <div className="font-medium tabular-nums text-slate-300">{formatDate(item.debt_date)}</div>
                    </div>
                    {item.reason && <div className="text-[12px] text-slate-500 mt-1.5 ml-4">{item.reason}</div>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-sm bg-white/[0.02] border border-white/[0.02] w-fit px-3 py-1.5 rounded-lg">
                      <span className="font-semibold text-indigo-300">{getJarName(item.from_jar_key) || '-'}</span>
                      <span className="text-slate-600 font-bold">➔</span>
                      <span className="font-semibold text-rose-300">{getJarName(item.to_jar_key) || '-'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right relative">
                    <div className="text-base font-bold tabular-nums text-white group-hover:opacity-0 transition-opacity duration-200">
                      {typeof item.amount === 'number' ? formatCurrency(item.amount) : '-'}
                    </div>
                    <div className="absolute inset-y-0 right-5 flex items-center justify-end gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      {item.status === 'open' && (
                        <button 
                          type="button" 
                          onClick={() => onSettle?.(item)} 
                          className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20 hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                          title="Tất toán nhanh"
                        >
                          Tất toán
                        </button>
                      )}
                      <button 
                        type="button" 
                        onClick={() => onEdit?.(item)} 
                        className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-1.5 text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                        title="Chỉnh sửa"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => onDelete?.(item)} 
                        className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-1.5 text-rose-400 transition hover:bg-rose-500/10 hover:text-rose-300"
                        title="Xóa"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="rounded-full bg-white/[0.02] p-3 mb-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </div>
                    <p className="text-sm font-medium text-slate-400">Chưa có khoản nợ nào</p>
                  </div>
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

export default DebtTable;
