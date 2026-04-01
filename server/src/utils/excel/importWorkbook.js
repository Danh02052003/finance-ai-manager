import XLSX from 'xlsx';

import {
  buildHeaderMap,
  detectSheetType,
  findHeaderRow,
  getRowValue,
  inferJarKey,
  isRowEmpty,
  parseAmount,
  parseDateValue,
  parseMonthValue,
  parseSheetMonth
} from './helpers.js';

const readSheetRows = (worksheet) =>
  XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: true,
    defval: ''
  });

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
    const totalIncome = parseAmount(getRowValue(row, headerMap.total_income));

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
      const amount = parseAmount(getRowValue(row, headerMap[jarKey]));

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

const parseTransactionsSheet = (sheetName, rows, report) => {
  const sheetMonth = parseSheetMonth(sheetName);

  if (!sheetMonth) {
    report.warnings.push(`Sheet "${sheetName}" looked like a monthly sheet but no month could be inferred.`);
    return { transactions: [], skipped: rows.length };
  }

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
    const amount = parseAmount(getRowValue(row, headerMap.amount));

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
      source: 'excel_import',
      external_row_ref: `${sheetName}:${rowIndex + 1}`,
      notes: String(getRowValue(row, headerMap.reason) || '').trim() || null
    });
  }

  return { transactions, skipped };
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
    const amount = parseAmount(getRowValue(row, headerMap.amount));
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
