export const getActualBalanceMapByMonth = (items, month) =>
  new Map(
    (items || [])
      .filter((item) => item.month === month)
      .map((item) => [item.jar_key, item])
  );

export const getPreviousActualBalanceMonth = (items, month) =>
  Array.from(new Set((items || []).map((item) => item.month).filter((value) => value && value < month)))
    .sort()
    .reverse()[0] || '';

export const sumActualBalanceMonth = (items, month) =>
  (items || [])
    .filter((item) => item.month === month)
    .reduce((sum, item) => sum + (item.actual_balance_amount || 0), 0);
