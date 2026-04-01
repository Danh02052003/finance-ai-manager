import { ArrowRightIcon } from '@heroicons/react/24/outline';

import { jarVisuals } from '../config/jarVisuals.js';
import { formatCurrency } from './formatters.js';

const clampPercentage = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
};

const JarCard = ({
  jar,
  amount = 0,
  percentage = null,
  deltaLabel = 'Sẵn sàng lên kế hoạch',
  spentAmount = 0,
  remainingAmount = null,
  reserveAmount = null,
  reserveLabel = '',
  monthLabel = '',
  dailyBudgetLabel = '',
  warningLabel = '',
  primaryActionLabel = 'Xem lịch sử',
  secondaryActionLabel = 'Chi từ hũ',
  onPrimaryAction,
  onSecondaryAction
}) => {
  const visual = jarVisuals[jar.jar_key] || jarVisuals.essentials;
  const Icon = visual.icon;
  const resolvedPercentage = clampPercentage(
    percentage ?? jar.target_percentage ?? jar.display_order * 10
  );

  return (
    <article
      className={`group overflow-hidden rounded-[28px] border border-white/10 bg-linear-to-br ${visual.gradient} p-5 shadow-xl shadow-slate-950/25 transition duration-200 hover:-translate-y-1 hover:shadow-2xl`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white backdrop-blur">
            <Icon className="h-6 w-6" />
          </span>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
            {jar.jar_key}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">{jar.display_name_vi}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-200/80">{visual.subtitle}</p>
        </div>
        <span
          className={[
            'rounded-full px-3 py-1 text-xs font-medium',
            jar.is_active ? 'bg-emerald-400/15 text-emerald-200' : 'bg-white/10 text-slate-300'
          ].join(' ')}
        >
          {jar.is_active ? 'Đang dùng' : 'Tạm ẩn'}
        </span>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-[1fr_112px] md:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-300/70">Phân bổ gần nhất</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white">
            {formatCurrency(amount)}
          </p>
          <p className="mt-2 text-sm text-emerald-200">{deltaLabel}</p>

          <div className="mt-5">
            <div
              className={`mb-3 grid gap-2 ${
                reserveAmount != null || reserveLabel ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
              }`}
            >
              <div className="rounded-2xl bg-white/5 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  Chi {monthLabel || 'tháng này'}
                </p>
                <p className="mt-1 text-sm font-semibold text-rose-200">
                  {formatCurrency(spentAmount)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/5 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  Còn lại
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {formatCurrency(remainingAmount ?? amount)}
                </p>
              </div>
              {reserveAmount != null || reserveLabel ? (
                <div className="rounded-2xl bg-sky-400/10 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-sky-100/80">
                    {reserveLabel || 'Giữ riêng'}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-sky-100">
                    {formatCurrency(reserveAmount || 0)}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mb-2 flex items-center justify-between text-sm text-slate-200/80">
              <span>Tỷ lệ mục tiêu</span>
              <span>{resolvedPercentage}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${resolvedPercentage}%`,
                  background: visual.accent
                }}
              />
            </div>

            {dailyBudgetLabel ? (
              <div className="mt-3 rounded-2xl bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">
                {dailyBudgetLabel}
              </div>
            ) : null}

            {warningLabel ? (
              <div className="mt-2 rounded-2xl bg-amber-400/12 px-3 py-2 text-sm text-amber-100">
                {warningLabel}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mx-auto flex h-28 w-28 items-center justify-center">
          <div
            className="relative flex h-28 w-28 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(${visual.accent} ${resolvedPercentage}%, rgba(255,255,255,0.08) 0)`
            }}
          >
            <div className="flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full bg-[rgba(15,15,35,0.92)] text-center">
              <span className={`text-lg font-bold ${visual.ring}`}>{resolvedPercentage}%</span>
              <span className="mt-1 text-[10px] uppercase tracking-[0.22em] text-slate-400">
                mục tiêu
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onSecondaryAction?.(jar)}
          className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
        >
          {secondaryActionLabel}
        </button>
        <button
          type="button"
          onClick={() => onPrimaryAction?.(jar)}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          {primaryActionLabel}
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
};

export default JarCard;
