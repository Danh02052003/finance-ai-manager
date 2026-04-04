import { jarVisuals } from '../config/jarVisuals.js';
import { formatCurrency } from './formatters.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const JarCardMini = ({
  jar,
  remainingAmount = 0,
  allocatedAmount = 0,
  spentAmount = 0,
  adjustmentAmount = 0,
  reserveAmount = 0,
  onClick
}) => {
  const visual = jarVisuals[jar.jar_key] || jarVisuals.essentials;
  const Icon = visual.icon;
  const baseBudget = Math.max(allocatedAmount + adjustmentAmount, 0);
  const usedRatio = baseBudget > 0 ? clamp(spentAmount / baseBudget, 0, 1.4) : 0;
  const usedPercent = Math.round(usedRatio * 100);
  const progressWidth = `${clamp(usedRatio * 100, 4, 100)}%`;
  const isOverBudget = spentAmount > baseBudget && baseBudget > 0;

  return (
    <button
      type="button"
      onClick={() => onClick?.(jar)}
      className="w-full rounded-2xl border border-white/8 bg-(--surface-strong) p-4 text-left shadow-sm transition hover:border-white/14 hover:bg-white/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5"
            style={{ color: visual.accent }}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{jar.display_name_vi}</p>
            <p className="truncate text-xs text-slate-500">{jar.jar_key}</p>
          </div>
        </div>
        <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] font-medium text-slate-400">
          {usedPercent}%
        </span>
      </div>

      <div className="mt-4">
        <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isOverBudget ? 'text-rose-300' : 'text-slate-500'}`}>
          {isOverBudget ? 'Vượt mức' : 'Còn lại tháng'}
        </p>
        <p className={`mt-1 text-[28px] font-bold leading-none ${isOverBudget ? 'text-rose-300' : 'text-white'}`}>
          {formatCurrency(remainingAmount)}
        </p>
      </div>

      <div className="mt-4 h-1.5 rounded-full bg-white/6">
        <div
          className={`h-1.5 rounded-full ${isOverBudget ? 'bg-rose-400' : ''}`}
          style={{
            width: progressWidth,
            background: isOverBudget ? undefined : visual.accent
          }}
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-xl bg-white/5 px-3 py-2">
          <p className="text-slate-500">Đã chi</p>
          <p className="mt-1 font-semibold text-slate-100">{formatCurrency(spentAmount)}</p>
        </div>
        <div className="rounded-xl bg-white/5 px-3 py-2">
          <p className="text-slate-500">Budget</p>
          <p className="mt-1 font-semibold text-slate-100">{formatCurrency(baseBudget)}</p>
        </div>
        <div className="rounded-xl bg-sky-400/10 px-3 py-2">
          <p className="text-sky-100/70">Dư thực</p>
          <p className="mt-1 font-semibold text-sky-100">{formatCurrency(reserveAmount)}</p>
        </div>
      </div>
    </button>
  );
};

export default JarCardMini;
