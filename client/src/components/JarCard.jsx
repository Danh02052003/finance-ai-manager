import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

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
  deltaLabel = 'So với sàn lên kế hoạch',
  spentAmount = 0,
  remainingAmount = null,
  reserveAmount = null,
  reserveLabel = '',
  monthLabel = '',
  dailyBudgetLabel = '',
  warningLabel = '',
  primaryActionLabel = 'Xem lịch sử',
  onPrimaryAction
}) => {
  const { t, i18n } = useTranslation();
  const visual = jarVisuals[jar.jar_key] || jarVisuals.essentials;
  const Icon = visual.icon;
  const resolvedPercentage = clampPercentage(
    percentage ?? jar.target_percentage ?? jar.display_order * 10
  );

  return (
    <article
      className={`group overflow-hidden rounded-2xl border border-white/[0.08] bg-linear-to-br ${visual.gradient} p-5 transition duration-200 hover:border-white/[0.14] hover:shadow-xl hover:shadow-black/10`}
    >
      <div className="flex items-start gap-3">
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white backdrop-blur"
          style={{ color: visual.accent }}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-white">{i18n.language === 'en' ? jar.jar_key.replace(/_/g, ' ').toUpperCase() : jar.display_name_vi}</h3>
          <p className="mt-0.5 text-xs text-white/50">{t(`jars.visual.${jar.jar_key}.subtitle`, visual.subtitle)}</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs text-white/50">{deltaLabel}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-white">
          {formatCurrency(amount)}
        </p>

        <div
          className={`mt-4 grid gap-2 ${reserveAmount != null || reserveLabel ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}
        >
          <div className="rounded-lg bg-white/[0.06] px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">
              {t('jars.spent')} {monthLabel || t('jars.thisMonth', 'tháng này')}
            </p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-rose-300">
              {formatCurrency(spentAmount)}
            </p>
          </div>
          <div className="rounded-lg bg-white/[0.06] px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">{t('jars.remaining', 'Còn lại')}</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-white">
              {formatCurrency(remainingAmount ?? amount)}
            </p>
          </div>
          {reserveAmount != null || reserveLabel ? (
            <div className="rounded-lg bg-sky-500/10 px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-sky-300/60">
                {reserveLabel || t('jars.reserved', 'Giữ riêng')}
              </p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-sky-200">
                {formatCurrency(reserveAmount || 0)}
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-white/50">
            <span>{t('jars.targetPercentage', 'Tỷ lệ mục tiêu')}</span>
            <span className="font-semibold tabular-nums" style={{ color: visual.accent }}>
              {resolvedPercentage}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.08]">
            <div
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${resolvedPercentage}%`,
                background: visual.accent
              }}
            />
          </div>
        </div>

        {dailyBudgetLabel ? (
          <div className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
            {dailyBudgetLabel}
          </div>
        ) : null}

        {warningLabel ? (
          <div className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            {warningLabel}
          </div>
        ) : null}
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={() => onPrimaryAction?.(jar)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-white/[0.06] px-3.5 py-2 text-sm font-medium text-white transition hover:bg-white/[0.1]"
        >
          {primaryActionLabel === 'Xem lịch sử' ? t('jars.viewHistory', 'Xem lịch sử') : primaryActionLabel}
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
};

export default JarCard;
