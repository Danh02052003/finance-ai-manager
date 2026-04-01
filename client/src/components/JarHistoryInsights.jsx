import { formatCurrency } from './formatters.js';

const JarHistoryInsights = ({
  jarName = '',
  month = '',
  remainingAmount = 0,
  allocatedAmount = 0,
  spentAmount = 0,
  dailyBudget = 0,
  daySummaries = []
}) => {
  const hasDaySummaries = daySummaries.length > 0;

  return (
    <section className="space-y-4">
      <div className="rounded-[28px] border border-sky-400/20 bg-sky-400/10 p-5 shadow-lg shadow-slate-950/20">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">
          Lịch sử hũ theo tháng
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          {jarName || 'Hũ đã chọn'} trong tháng {month}
        </h2>
        <p className="mt-3 text-sm leading-7 text-sky-100">
          Khu này cho bạn thấy hũ còn bao nhiêu, mức nên tiêu mỗi ngày và từng ngày đã chi ở hũ nào,
          bao nhiêu, có lố nhịp hay không.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-[28px] border border-white/10 bg-(--surface-strong) p-5 shadow-lg shadow-slate-950/20">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Còn lại trong hũ
          </p>
          <p className="mt-2 text-3xl font-bold text-white">{formatCurrency(remainingAmount)}</p>
          <p className="mt-2 text-sm text-slate-400">
            Phân bổ {formatCurrency(allocatedAmount)} · Đã chi {formatCurrency(spentAmount)}
          </p>
        </article>

        <article className="rounded-[28px] border border-white/10 bg-(--surface-strong) p-5 shadow-lg shadow-slate-950/20">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Nên tiêu mỗi ngày
          </p>
          <p className="mt-2 text-3xl font-bold text-white">{formatCurrency(dailyBudget)}</p>
          <p className="mt-2 text-sm text-slate-400">
            Mốc này dùng để so từng ngày bạn có đang chi quá nhịp của hũ hay không.
          </p>
        </article>

        <article className="rounded-[28px] border border-white/10 bg-(--surface-strong) p-5 shadow-lg shadow-slate-950/20">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Số ngày đã phát sinh
          </p>
          <p className="mt-2 text-3xl font-bold text-white">{daySummaries.length}</p>
          <p className="mt-2 text-sm text-slate-400">
            Chỉ tính các ngày có giao dịch ở hũ này trong tháng đang xem.
          </p>
        </article>
      </div>

      <section className="space-y-3">
        {hasDaySummaries ? (
          daySummaries.map((day) => (
            <article
              key={day.date}
              className="rounded-[28px] border border-white/10 bg-(--surface-strong) p-5 shadow-lg shadow-slate-950/20"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Ngày {day.label}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    Hũ {jarName}: {formatCurrency(day.selectedJarSpent)}
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Tổng chi trong ngày: {formatCurrency(day.totalSpentAllJars)}
                  </p>
                </div>
                <div
                  className={[
                    'rounded-2xl px-4 py-3 text-sm font-semibold',
                    day.selectedJarOverspendAmount > 0
                      ? 'bg-rose-400/15 text-rose-200'
                      : 'bg-emerald-400/15 text-emerald-200'
                  ].join(' ')}
                >
                  {day.selectedJarOverspendAmount > 0
                    ? `Lố ${formatCurrency(day.selectedJarOverspendAmount)} so với mức ${formatCurrency(
                        day.selectedJarDailyBudget
                      )}/ngày`
                    : `Không lố so với mức ${formatCurrency(day.selectedJarDailyBudget)}/ngày`}
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {day.jarBreakdown.map((jarItem) => (
                  <div
                    key={`${day.date}-${jarItem.jarKey}`}
                    className="rounded-3xl border border-white/10 bg-slate-950/35 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{jarItem.jarName}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                          {jarItem.jarKey}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-white">{formatCurrency(jarItem.amount)}</p>
                    </div>
                    <p className="mt-3 text-sm text-slate-400">
                      Mức nên tiêu: {formatCurrency(jarItem.dailyBudget)}
                    </p>
                    <p
                      className={[
                        'mt-2 text-sm font-medium',
                        jarItem.overspendAmount > 0 ? 'text-rose-200' : 'text-emerald-200'
                      ].join(' ')}
                    >
                      {jarItem.overspendAmount > 0
                        ? `Lố ${formatCurrency(jarItem.overspendAmount)}`
                        : 'Không lố trong ngày'}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-slate-400">
            Chưa có ngày nào phát sinh giao dịch cho hũ này trong tháng đang xem.
          </div>
        )}
      </section>
    </section>
  );
};

export default JarHistoryInsights;
