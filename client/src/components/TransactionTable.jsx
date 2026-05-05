import {
  CheckCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

import { formatCurrency, formatDate } from './formatters.js';



const getDayKey = (value) => {
  if (!value) {
    return '';
  }

  return String(value).slice(0, 10);
};

const formatTime = (value) => {
  if (!value) {
    return '--:--';
  }

  const parsedValue = new Date(value);

  if (Number.isNaN(parsedValue.getTime())) {
    return '--:--';
  }

  return parsedValue.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDayTitle = (dayKey, t) => {
  if (!dayKey) {
    return t('transactions.unknownDate', { defaultValue: 'Không rõ ngày' });
  }

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  if (dayKey === todayKey) {
    return t('transactions.today', { defaultValue: 'Hôm nay' });
  }

  if (dayKey === yesterdayKey) {
    return t('transactions.yesterday', { defaultValue: 'Hôm qua' });
  }

  return formatDate(dayKey);
};

const getAmountToneClass = (item) =>
  item.direction === 'income_adjustment' ? 'text-emerald-400' : 'text-rose-400';

const getAmountPrefix = (item) => (item.direction === 'income_adjustment' ? '+' : '-');



const groupTransactionsByDay = (items, t) => {
  const groups = items.reduce((accumulator, item) => {
    const dayKey = getDayKey(item.transaction_date) || 'unknown';

    if (!accumulator[dayKey]) {
      accumulator[dayKey] = [];
    }

    accumulator[dayKey].push(item);
    return accumulator;
  }, {});

  return Object.entries(groups)
    .map(([dayKey, dayItems]) => {
      const expenseTotal = dayItems.reduce(
        (sum, item) => (item.direction === 'expense' ? sum + (item.amount || 0) : sum),
        0
      );
      const adjustmentTotal = dayItems.reduce(
        (sum, item) => (item.direction === 'income_adjustment' ? sum + (item.amount || 0) : sum),
        0
      );

      return {
        dayKey,
        title: formatDayTitle(dayKey, t),
        items: dayItems.sort((firstItem, secondItem) =>
          String(secondItem.transaction_date || '').localeCompare(String(firstItem.transaction_date || ''))
        ),
        expenseTotal,
        adjustmentTotal
      };
    })
    .sort((firstItem, secondItem) => secondItem.dayKey.localeCompare(firstItem.dayKey));
};

const TransactionRow = ({ item, index, jarNameByKey, selectedIds, onToggleSelection, onEdit, onDelete, t }) => (
  <div className="group grid gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 transition hover:bg-white/[0.04] md:grid-cols-[auto_80px_minmax(0,1fr)_auto_130px_auto] md:items-center md:gap-4 relative">
    <label className="inline-flex items-center gap-2 text-sm text-slate-400">
      <input
        aria-label={`Chọn giao dịch ${item.description || index + 1}`}
        type="checkbox"
        checked={selectedIds.includes(item._id)}
        onChange={() => onToggleSelection?.(item._id)}
        className="h-4 w-4 rounded border-white/20 bg-transparent accent-indigo-500"
      />
      <span className="md:hidden">{formatTime(item.transaction_date)}</span>
    </label>

    <div className="hidden text-xs tabular-nums text-slate-500 md:block">{formatTime(item.transaction_date)}</div>

    <div className="min-w-0">
      <div className="flex items-start justify-between gap-3 md:block">
        <p className="truncate text-sm font-medium text-white">{item.description || t('transactions.noDescription', { defaultValue: 'Không có mô tả' })}</p>
        <p className={`shrink-0 text-sm font-semibold tabular-nums md:hidden ${getAmountToneClass(item)}`}>
          {getAmountPrefix(item)}
          {typeof item.amount === 'number' ? formatCurrency(item.amount) : '-'}
        </p>
      </div>
      {item.notes ? <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{item.notes}</p> : null}
    </div>

    <div className="flex flex-wrap gap-1.5">
      <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-slate-400">
        {jarNameByKey[item.jar_key] || item.jar_key || t('transactions.unknownJar', { defaultValue: 'Không rõ hũ' })}
      </span>
      <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-slate-400">
        {item.is_ai_classified ? <SparklesIcon className="h-3 w-3 text-indigo-400" title={t('transactions.aiClassified', { defaultValue: 'Phân loại bởi AI' })} /> : null}
        {t(`category.${item.category || 'uncategorized'}`)}
      </span>
    </div>

    <div className={`hidden text-right text-sm font-semibold tabular-nums md:block ${getAmountToneClass(item)}`}>
      {getAmountPrefix(item)}
      {typeof item.amount === 'number' ? formatCurrency(item.amount) : '-'}
    </div>

    <div className="flex items-center justify-end gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 absolute right-3 md:relative md:right-0">
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
        onClick={() => onEdit?.(item)}
        aria-label={`Sửa giao dịch ${item.description || index + 1}`}
      >
        <PencilSquareIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-400"
        onClick={() => onDelete?.(item)}
        aria-label={`Xóa giao dịch ${item.description || index + 1}`}
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const TransactionTable = ({
  items,
  title = 'Theo ngày',
  subtitle = '',
  jarNameByKey = {},
  selectedIds = [],
  highlightDate = '',
  onToggleSelection,
  onToggleSelectAll,
  onDeleteSelected,
  onEdit,
  onDelete
}) => {
  const { t } = useTranslation();
  const areAllVisibleSelected =
    items.length > 0 && items.every((item) => selectedIds.includes(item._id));
  const dayGroups = groupTransactionsByDay(items, t);

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-(--surface-strong) p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-40"
            onClick={onToggleSelectAll}
            disabled={!items.length}
          >
            {areAllVisibleSelected ? t('transactions.deselect', { defaultValue: 'Bỏ chọn' }) : t('transactions.selectAll', { defaultValue: 'Chọn tất cả' })}
          </button>
          {selectedIds.length > 0 ? (
            <button
              type="button"
              className="rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20"
              onClick={onDeleteSelected}
            >
              {t('transactions.deleteCount', { count: selectedIds.length, defaultValue: `Xóa ${selectedIds.length} mục` })}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {dayGroups.length ? (
          dayGroups.map((group) => {
            const isHighlighted = highlightDate && group.dayKey === highlightDate;

            return (
              <details
                key={group.dayKey}
                open={isHighlighted || dayGroups.length <= 3}
                className={[
                  'overflow-hidden rounded-xl border',
                  isHighlighted
                    ? 'border-indigo-500/30 bg-indigo-500/[0.03]'
                    : 'border-white/[0.06] bg-white/[0.02]'
                ].join(' ')}
              >
                <summary className="flex cursor-pointer list-none flex-col gap-2 px-4 py-3 transition hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">{group.title}</p>
                    <span className="text-xs text-slate-500">{t('transactions.itemCount', { count: group.items.length, defaultValue: `${group.items.length} giao dịch` })}</span>
                    {isHighlighted ? (
                      <span className="rounded-md bg-indigo-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300">
                        {t('transactions.viewing', { defaultValue: 'Đang xem' })}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-medium tabular-nums text-rose-300">
                      -{formatCurrency(group.expenseTotal)}
                    </span>
                    {group.adjustmentTotal > 0 ? (
                      <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium tabular-nums text-emerald-300">
                        +{formatCurrency(group.adjustmentTotal)}
                      </span>
                    ) : null}
                  </div>
                </summary>

                <div className="space-y-2 border-t border-white/[0.04] p-3">
                  {group.items.map((item, index) => (
                    <TransactionRow
                      key={item._id || `${item.description}-${index}`}
                      item={item}
                      index={index}
                      jarNameByKey={jarNameByKey}
                      selectedIds={selectedIds}
                      onToggleSelection={onToggleSelection}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      t={t}
                    />
                  ))}
                </div>
              </details>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-white/[0.08] px-4 py-10 text-center">
            <CheckCircleIcon className="mx-auto h-7 w-7 text-slate-600" />
            <p className="mt-2 text-sm text-slate-400">{t('transactions.noTransactions', { defaultValue: 'Không có giao dịch.' })}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default TransactionTable;
