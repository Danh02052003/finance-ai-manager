import {
  CheckCircleIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

import { formatCurrency, formatDate } from './formatters.js';

const categoryLabels = {
  food_drink: 'Ăn uống',
  bills: 'Hóa đơn',
  investment: 'Đầu tư',
  learning: 'Học tập',
  family: 'Gia đình',
  charity: 'Từ thiện',
  uncategorized: 'Chưa phân loại'
};

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

const formatDayTitle = (dayKey) => {
  if (!dayKey) {
    return 'Không rõ ngày';
  }

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  if (dayKey === todayKey) {
    return 'Hôm nay';
  }

  if (dayKey === yesterdayKey) {
    return 'Hôm qua';
  }

  return formatDate(dayKey);
};

const getAmountToneClass = (item) =>
  item.direction === 'income_adjustment' ? 'text-emerald-300' : 'text-rose-300';

const getAmountPrefix = (item) => (item.direction === 'income_adjustment' ? '+' : '-');

const getSourceBadge = (item) => {
  if (item.source === 'momo_yield') {
    return 'Lãi MoMo';
  }

  if (item.direction === 'income_adjustment') {
    return 'Điều chỉnh tăng';
  }

  return '';
};

const groupTransactionsByDay = (items) => {
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
        title: formatDayTitle(dayKey),
        items: dayItems.sort((firstItem, secondItem) =>
          String(secondItem.transaction_date || '').localeCompare(String(firstItem.transaction_date || ''))
        ),
        expenseTotal,
        adjustmentTotal
      };
    })
    .sort((firstItem, secondItem) => secondItem.dayKey.localeCompare(firstItem.dayKey));
};

const TransactionRow = ({ item, index, jarNameByKey, selectedIds, onToggleSelection, onEdit, onDelete }) => (
  <div className="grid gap-3 rounded-2xl border border-white/6 bg-white/[0.03] p-3 md:grid-cols-[auto_88px_minmax(0,1fr)_170px_140px_auto] md:items-center md:gap-4">
    <label className="inline-flex items-center gap-2 text-sm text-slate-300">
      <input
        aria-label={`Chọn giao dịch ${item.description || index + 1}`}
        type="checkbox"
        checked={selectedIds.includes(item._id)}
        onChange={() => onToggleSelection?.(item._id)}
        className="h-4 w-4 rounded border-white/20 bg-transparent"
      />
      <span className="md:hidden">{formatTime(item.transaction_date)}</span>
    </label>

    <div className="hidden text-sm text-slate-400 md:block">{formatTime(item.transaction_date)}</div>

    <div className="min-w-0">
      <div className="flex items-start justify-between gap-3 md:block">
        <p className="truncate text-sm font-semibold text-white">{item.description || 'Không có mô tả'}</p>
        <p className={`text-sm font-semibold md:hidden ${getAmountToneClass(item)}`}>
          {getAmountPrefix(item)}
          {typeof item.amount === 'number' ? formatCurrency(item.amount) : '-'}
        </p>
      </div>
      {item.notes ? <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.notes}</p> : null}
    </div>

    <div className="flex flex-wrap gap-2">
      <span className="rounded-full bg-white/6 px-2.5 py-1 text-xs font-medium text-slate-300">
        {jarNameByKey[item.jar_key] || item.jar_key || 'Không rõ hũ'}
      </span>
      <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
        {categoryLabels[item.category] || categoryLabels.uncategorized}
      </span>
      {getSourceBadge(item) ? (
        <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-200">
          {getSourceBadge(item)}
        </span>
      ) : null}
    </div>

    <div className={`hidden text-right text-sm font-semibold md:block ${getAmountToneClass(item)}`}>
      {getAmountPrefix(item)}
      {typeof item.amount === 'number' ? formatCurrency(item.amount) : '-'}
    </div>

    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
        onClick={() => onEdit?.(item)}
        aria-label={`Sửa giao dịch ${item.description || index + 1}`}
      >
        <PencilSquareIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-400/10 text-rose-100 transition hover:bg-rose-400/15"
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
  eyebrow = 'Lịch sử giao dịch',
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
  const areAllVisibleSelected =
    items.length > 0 && items.every((item) => selectedIds.includes(item._id));
  const dayGroups = groupTransactionsByDay(items);

  return (
    <section className="rounded-3xl border border-white/10 bg-[rgba(26,26,46,0.88)] p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            {eyebrow}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onToggleSelectAll}
            disabled={!items.length}
          >
            {areAllVisibleSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
          </button>
          <button
            type="button"
            className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onDeleteSelected}
            disabled={!selectedIds.length}
          >
            Xóa đã chọn ({selectedIds.length})
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {dayGroups.length ? (
          dayGroups.map((group) => {
            const isHighlighted = highlightDate && group.dayKey === highlightDate;

            return (
              <details
                key={group.dayKey}
                open={isHighlighted || dayGroups.length <= 3}
                className={[
                  'overflow-hidden rounded-2xl border bg-[#12182b]',
                  isHighlighted ? 'border-emerald-400/40' : 'border-white/8'
                ].join(' ')}
              >
                <summary className="flex cursor-pointer list-none flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{group.title}</p>
                      {isHighlighted ? (
                        <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
                          Đang xem
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {group.items.length} giao dịch · {formatDate(group.dayKey)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-full bg-rose-400/10 px-3 py-1 font-medium text-rose-200">
                      Chi {formatCurrency(group.expenseTotal)}
                    </span>
                    {group.adjustmentTotal > 0 ? (
                      <span className="rounded-full bg-emerald-400/10 px-3 py-1 font-medium text-emerald-200">
                        + {formatCurrency(group.adjustmentTotal)}
                      </span>
                    ) : null}
                  </div>
                </summary>

                <div className="space-y-3 border-t border-white/6 p-3">
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
                    />
                  ))}
                </div>
              </details>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-10 text-center">
            <CheckCircleIcon className="mx-auto h-8 w-8 text-slate-500" />
            <p className="mt-3 text-sm font-medium text-slate-200">Chưa có giao dịch khớp bộ lọc hiện tại.</p>
            <p className="mt-1 text-sm text-slate-500">Thử bỏ bớt filter hoặc nhập giao dịch mới từ nút “Nhập hôm nay”.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default TransactionTable;
