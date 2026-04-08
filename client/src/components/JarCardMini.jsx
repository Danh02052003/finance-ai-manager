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
  const progressWidth = `${clamp(usedRatio * 100, 3, 100)}%`;
  const isOverBudget = spentAmount > baseBudget && baseBudget > 0;

  return (
    <button
      type="button"
      onClick={() => onClick?.(jar)}
      className="group w-full rounded-2xl border border-white/[0.06] bg-(--surface-strong) p-4 text-left transition-all duration-150 hover:border-white/[0.12] hover:bg-white/[0.04] hover:shadow-lg hover:shadow-black/10 active:scale-[0.99]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${visual.accent}15`, color: visual.accent }}
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{jar.display_name_vi}</p>
          </div>
        </div>
        <span
          className={[
            'shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums',
            isOverBudget
              ? 'bg-rose-500/15 text-rose-300'
              : 'bg-white/[0.06] text-slate-400'
          ].join(' ')}
        >
          {usedPercent}%
        </span>
      </div>

      <div className="mt-4">
        <p className={`text-[11px] font-medium uppercase tracking-wider ${isOverBudget ? 'text-rose-400' : 'text-slate-500'}`}>
          {isOverBudget ? 'Vượt mức' : 'Còn lại'}
        </p>
        <p className={`mt-1 text-2xl font-bold tabular-nums leading-none tracking-tight ${isOverBudget ? 'text-rose-300' : 'text-white'}`}>
          {formatCurrency(remainingAmount)}
        </p>
      </div>

      <div className="mt-3 h-1 rounded-full bg-white/[0.06]">
        <div
          className={`h-1 rounded-full transition-all duration-300 ${isOverBudget ? 'bg-rose-400' : ''}`}
          style={{
            width: progressWidth,
            background: isOverBudget ? undefined : visual.accent
          }}
        />
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs">
        <div className="flex-1">
          <p className="text-slate-500">Đã chi</p>
          <p className="mt-0.5 font-semibold tabular-nums text-slate-200">{formatCurrency(spentAmount)}</p>
        </div>
        <div className="flex-1">
          <p className="text-slate-500">Ngân sách</p>
          <p className="mt-0.5 font-semibold tabular-nums text-slate-200">{formatCurrency(baseBudget)}</p>
        </div>
        {reserveAmount > 0 ? (
          <div className="flex-1">
            <p className="text-sky-400/70">Giữ riêng</p>
            <p className="mt-0.5 font-semibold tabular-nums text-sky-300">{formatCurrency(reserveAmount)}</p>
          </div>
        ) : null}
      </div>
    </button>
  );
};

export default JarCardMini;
