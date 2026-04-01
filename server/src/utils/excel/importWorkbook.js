import XLSX from 'xlsx';

import {
  buildHeaderMap,
  detectSheetType,
  findHeaderRow,
  getRowValue,
  getNonEmptyCellTexts,
  inferJarKey,
  isRowEmpty,
  parseAmount,
  parseDateValue,
  parseImportedMoneyValue,
  parseMonthValue,
  parseSheetMonth
} from './helpers.js';

const readSheetRows = (worksheet) =>
  XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: true,
    defval: ''
  });

const MONTHLY_TABLE_HEADER_ALIASES = {
  day_number: ['songay'],
  usage: ['dungcho'],
  amount_breakdown: ['sotien'],
  total_amount: ['tongtien'],
  remaining_amount: ['sotienconlai'],
  daily_budget: ['sotienduoctieumoingay'],
  spend_equivalent_days: ['sotieuhomnaybangngay'],
  overspend_amount: ['sotientieubilosovoidukien'],
  added_money: ['tienduocthem'],
  reason: ['lydo']
};

const buildMonthlyTableHeaderMap = (row) => {
  const headerMap = {};

  row.forEach((cell, columnIndex) => {
    const normalizedCell = String(cell ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');

    if (!normalizedCell) {
      return;
    }

    for (const [key, aliases] of Object.entries(MONTHLY_TABLE_HEADER_ALIASES)) {
      if (aliases.some((alias) => normalizedCell === alias)) {
        if (headerMap[key] == null) {
          headerMap[key] = columnIndex;
        }
        return;
      }
    }
  });

  return headerMap;
};

const isMonthlyTableHeaderRow = (row) => {
  const headerMap = buildMonthlyTableHeaderMap(row);
  return headerMap.day_number != null && headerMap.usage != null && headerMap.total_amount != null;
};

const findNextMonthlyHeaderRow = (rows, startIndex) => {
  for (let rowIndex = startIndex; rowIndex < Math.min(rows.length, startIndex + 4); rowIndex += 1) {
    if (isMonthlyTableHeaderRow(rows[rowIndex])) {
      return rowIndex;
    }
  }

  return -1;
};

const inferJarKeyFromRow = (row) => {
  const nonEmptyTexts = getNonEmptyCellTexts(row);

  if (!nonEmptyTexts.length) {
    return null;
  }

  return inferJarKey(nonEmptyTexts.join(' ')) || nonEmptyTexts.map((item) => inferJarKey(item)).find(Boolean) || null;
};

const splitPlusValues = (value) =>
  String(value ?? '')
    .split('+')
    .map((item) => item.trim())
    .filter(Boolean);

const buildRowTransactions = ({
  sheetName,
  sheetMonth,
  jarKey,
  rowIndex,
  transactionDate,
  usageText,
  amountText,
  totalAmount,
  remainingAmount,
  dailyBudget,
  overspendAmount,
  addedMoney,
  reason
}) => {
  const usageParts = splitPlusValues(usageText);
  const amountParts = splitPlusValues(amountText)
    .map((item) => parseImportedMoneyValue(item))
    .filter((item) => item != null);
  const computedTotal =
    totalAmount != null ? totalAmount : amountParts.reduce((sum, item) => sum + (item || 0), 0);
  const notes = [
    remainingAmount != null ? `Con lai: ${remainingAmount}` : null,
    dailyBudget != null ? `Muc chi tieu ngay: ${dailyBudget}` : null,
    overspendAmount != null ? `Vuot du kien: ${overspendAmount}` : null,
    addedMoney != null && addedMoney > 0 ? `Tien duoc them: ${addedMoney}` : null,
    reason ? `Ly do: ${reason}` : null
  ]
    .filter(Boolean)
    .join(' | ');

  if (computedTotal <= 0) {
    return [];
  }

  if (usageParts.length > 1 && usageParts.length === amountParts.length) {
    return usageParts.map((description, partIndex) => ({
      month: sheetMonth,
      transaction_date: transactionDate,
      amount: amountParts[partIndex],
      currency: 'VND',
      direction: 'expense',
      description,
      jar_key: jarKey,
      category: 'uncategorized',
      source: 'excel_import',
      external_row_ref: `${sheetName}:${jarKey}:${rowIndex + 1}:${partIndex + 1}`,
      notes: notes || null
    }));
  }

  return [
    {
      month: sheetMonth,
      transaction_date: transactionDate,
      amount: computedTotal,
      currency: 'VND',
      direction: 'expense',
      description: usageText,
      jar_key: jarKey,
      category: 'uncategorized',
      source: 'excel_import',
      external_row_ref: `${sheetName}:${jarKey}:${rowIndex + 1}:1`,
      notes: notes || null
    }
  ];
};

const parseSixJarsSheet = (sheetName, rows, report) => {
  const headerRowIndex = findHeaderRow(rows, (row) => {
    const headerMap = buildHeaderMap(row);
    const jarColumnCount = Object.keys(headerMap).filter((key) =>
      [
        'essentials',
        'long_term_saving',
        'education',
        'enjoyment',
        'financial_freedom',
        'charity'
      ].includes(key)
    ).length;

    return headerMap.month != null && headerMap.total_income != null && jarColumnCount >= 1;
  });

  if (headerRowIndex === -1) {
    report.warnings.push(`Sheet "${sheetName}" was detected as 6 hũ but no header row was recognized.`);
    return { monthlyIncomes: [], jarAllocations: [], skipped: 0 };
  }

  const headerMap = buildHeaderMap(rows[headerRowIndex]);
  const monthlyIncomes = [];
  const jarAllocations = [];
  let skipped = 0;

  for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];

    if (isRowEmpty(row)) {
      continue;
    }

    const month = parseMonthValue(getRowValue(row, headerMap.month));
    const totalIncome = parseImportedMoneyValue(getRowValue(row, headerMap.total_income));

    if (!month || totalIncome == null) {
      skipped += 1;
      report.warnings.push(`Skipped row ${rowIndex + 1} in "${sheetName}" because month or income was invalid.`);
      continue;
    }

    monthlyIncomes.push({
      month,
      total_amount: totalIncome,
      income_date: null,
      source_note: `Imported from ${sheetName}`,
      source_sheet: sheetName,
      source_row: rowIndex + 1
    });

    [
      'essentials',
      'long_term_saving',
      'education',
      'enjoyment',
      'financial_freedom',
      'charity'
    ].forEach((jarKey) => {
      const amount = parseImportedMoneyValue(getRowValue(row, headerMap[jarKey]));

      if (amount == null) {
        return;
      }

      jarAllocations.push({
        month,
        jar_key: jarKey,
        allocated_amount: amount,
        allocation_percentage:
          totalIncome > 0 ? Math.round((amount / totalIncome) * 10000) / 100 : null,
        note: `Imported from ${sheetName}`,
        source_sheet: sheetName,
        source_row: rowIndex + 1
      });
    });
  }

  return { monthlyIncomes, jarAllocations, skipped };
};

const parseLegacyTransactionsSheet = (sheetName, rows, report, sheetMonth) => {
  const headerRowIndex = findHeaderRow(rows, (row) => {
    const headerMap = buildHeaderMap(row);
    return headerMap.date != null && headerMap.description != null && headerMap.amount != null;
  });

  const transactions = [];
  let skipped = 0;

  if (headerRowIndex === -1) {
    report.warnings.push(`Sheet "${sheetName}" had no recognizable expense header; using positional fallback.`);
  }

  const headerMap =
    headerRowIndex === -1
      ? {
          date: 0,
          description: 1,
          amount: 2,
          jar: 3,
          reason: 4
        }
      : buildHeaderMap(rows[headerRowIndex]);

  for (let rowIndex = Math.max(headerRowIndex, 0) + 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];

    if (isRowEmpty(row)) {
      continue;
    }

    const transactionDate = parseDateValue(getRowValue(row, headerMap.date), sheetMonth);
    const description = String(getRowValue(row, headerMap.description) || '').trim();
    const amount = parseImportedMoneyValue(getRowValue(row, headerMap.amount));

    if (!transactionDate || !description || amount == null) {
      skipped += 1;
      continue;
    }

    const jarKey = inferJarKey(getRowValue(row, headerMap.jar));

    transactions.push({
      month: sheetMonth,
      transaction_date: transactionDate,
      amount,
      currency: 'VND',
      direction: 'expense',
      description,
      jar_key: jarKey,
      category: 'uncategorized',
      source: 'excel_import',
      external_row_ref: `${sheetName}:${rowIndex + 1}`,
      notes: String(getRowValue(row, headerMap.reason) || '').trim() || null
    });
  }

  return { transactions, skipped };
};

const parseTransactionsSheet = (sheetName, rows, report) => {
  const sheetMonth = parseSheetMonth(sheetName);

  if (!sheetMonth) {
    report.warnings.push(`Sheet "${sheetName}" looked like a monthly sheet but no month could be inferred.`);
    return { transactions: [], skipped: rows.length };
  }

  const transactions = [];
  let skipped = 0;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const jarKey = inferJarKeyFromRow(rows[rowIndex]);

    if (!jarKey) {
      continue;
    }

    const headerRowIndex = findNextMonthlyHeaderRow(rows, rowIndex + 1);

    if (headerRowIndex === -1) {
      continue;
    }

    const headerMap = buildMonthlyTableHeaderMap(rows[headerRowIndex]);
    let parsedRowCount = 0;

    for (let dataRowIndex = headerRowIndex + 1; dataRowIndex < rows.length; dataRowIndex += 1) {
      const row = rows[dataRowIndex];

      if (parsedRowCount > 0 && inferJarKeyFromRow(row) && !isMonthlyTableHeaderRow(row)) {
        rowIndex = dataRowIndex - 1;
        break;
      }

      if (parsedRowCount > 0 && isMonthlyTableHeaderRow(row)) {
        rowIndex = dataRowIndex - 1;
        break;
      }

      if (isRowEmpty(row)) {
        if (parsedRowCount > 0) {
          rowIndex = dataRowIndex;
          break;
        }
        continue;
      }

      const dayNumber = Number(getRowValue(row, headerMap.day_number));
      const usageText = String(getRowValue(row, headerMap.usage) || '').trim();
      const amountText = String(getRowValue(row, headerMap.amount_breakdown) || '').trim();
      const totalAmount = parseImportedMoneyValue(getRowValue(row, headerMap.total_amount));
      const remainingAmount = parseImportedMoneyValue(getRowValue(row, headerMap.remaining_amount));
      const dailyBudget = parseImportedMoneyValue(getRowValue(row, headerMap.daily_budget));
      const overspendAmount = parseImportedMoneyValue(getRowValue(row, headerMap.overspend_amount));
      const addedMoney = parseImportedMoneyValue(getRowValue(row, headerMap.added_money));
      const reason = String(getRowValue(row, headerMap.reason) || '').trim() || null;

      if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 31) {
        skipped += 1;
        continue;
      }

      if (!usageText && (totalAmount == null || totalAmount === 0)) {
        continue;
      }

      const transactionDate = parseDateValue(String(dayNumber), sheetMonth);

      if (!transactionDate) {
        skipped += 1;
        continue;
      }

      const rowTransactions = buildRowTransactions({
        sheetName,
        sheetMonth,
        jarKey,
        rowIndex: dataRowIndex,
        transactionDate,
        usageText,
        amountText,
        totalAmount,
        remainingAmount,
        dailyBudget,
        overspendAmount,
        addedMoney,
        reason
      });

      if (!rowTransactions.length) {
        continue;
      }

      transactions.push(...rowTransactions);
      parsedRowCount += 1;
    }
  }

  if (transactions.length > 0) {
    return { transactions, skipped };
  }

  return parseLegacyTransactionsSheet(sheetName, rows, report, sheetMonth);
};

const parseDebtSheet = (sheetName, rows, report) => {
  const headerRowIndex = findHeaderRow(rows, (row) => {
    const headerMap = buildHeaderMap(row);
    return headerMap.amount != null && (headerMap.from_jar != null || headerMap.jar != null);
  });

  if (headerRowIndex === -1) {
    report.warnings.push(`Sheet "${sheetName}" was detected as Nợ quỹ but no header row was recognized.`);
    return { debts: [], skipped: rows.length };
  }

  const headerMap = buildHeaderMap(rows[headerRowIndex]);
  const debts = [];
  let skipped = 0;

  for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];

    if (isRowEmpty(row)) {
      continue;
    }

    const fromJarKey = inferJarKey(getRowValue(row, headerMap.from_jar ?? headerMap.jar));
    const toJarKey = inferJarKey(getRowValue(row, headerMap.to_jar ?? (headerMap.jar != null ? headerMap.jar + 1 : null)));
    const amount = parseImportedMoneyValue(getRowValue(row, headerMap.amount));
    const month =
      parseMonthValue(getRowValue(row, headerMap.month)) ||
      (parseDateValue(getRowValue(row, headerMap.date), null)
        ? parseMonthValue(parseDateValue(getRowValue(row, headerMap.date), null))
        : null);
    const debtDate =
      parseDateValue(getRowValue(row, headerMap.date), month || undefined) ||
      (month ? parseDateValue('1', month) : null);

    if (!fromJarKey || !toJarKey || !month || !debtDate || amount == null || fromJarKey === toJarKey) {
      skipped += 1;
      continue;
    }

    debts.push({
      from_jar_key: fromJarKey,
      to_jar_key: toJarKey,
      month,
      amount,
      debt_date: debtDate,
      status: String(getRowValue(row, headerMap.status) || 'open').trim().toLowerCase() || 'open',
      reason: String(getRowValue(row, headerMap.reason) || '').trim() || null,
      settled_at: null
    });
  }

  return { debts, skipped };
};

export const parseWorkbookForImport = (filePath) => {
  const workbook = XLSX.readFile(filePath, {
    cellDates: true
  });

  const report = {
    detectedSheets: workbook.SheetNames,
    warnings: [],
    errors: []
  };

  const normalizedData = {
    monthlyIncomes: [],
    jarAllocations: [],
    transactions: [],
    jarDebts: [],
    skipped: 0,
    detectedSheets: workbook.SheetNames,
    warnings: report.warnings,
    errors: report.errors
  };

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const rows = readSheetRows(worksheet);
    const sheetType = detectSheetType(sheetName);

    if (sheetType === 'unsupported') {
      report.warnings.push(`Ignored unsupported sheet "${sheetName}".`);
      return;
    }

    if (sheetType === 'six_jars') {
      const parsedResult = parseSixJarsSheet(sheetName, rows, report);
      normalizedData.monthlyIncomes.push(...parsedResult.monthlyIncomes);
      normalizedData.jarAllocations.push(...parsedResult.jarAllocations);
      normalizedData.skipped += parsedResult.skipped;
      return;
    }

    if (sheetType === 'transactions') {
      const parsedResult = parseTransactionsSheet(sheetName, rows, report);
      normalizedData.transactions.push(...parsedResult.transactions);
      normalizedData.skipped += parsedResult.skipped;
      return;
    }

    if (sheetType === 'jar_debts') {
      const parsedResult = parseDebtSheet(sheetName, rows, report);
      normalizedData.jarDebts.push(...parsedResult.debts);
      normalizedData.skipped += parsedResult.skipped;
    }
  });

  return normalizedData;
};
