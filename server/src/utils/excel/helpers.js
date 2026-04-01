import XLSX from 'xlsx';

const JAR_LABEL_MAP = new Map([
  ['huchitieucanthiet', 'essentials'],
  ['chitieucanthiet', 'essentials'],
  ['essentials', 'essentials'],
  ['tietkiemdaihan', 'long_term_saving'],
  ['longtermsaving', 'long_term_saving'],
  ['quygiaoduc', 'education'],
  ['giaoduc', 'education'],
  ['education', 'education'],
  ['huongthu', 'enjoyment'],
  ['enjoyment', 'enjoyment'],
  ['quytudotaichinh', 'financial_freedom'],
  ['taichinhtudo', 'financial_freedom'],
  ['financialfreedom', 'financial_freedom'],
  ['quytuthientaichinh', 'financial_freedom'],
  ['quytuthien', 'charity'],
  ['charity', 'charity']
]);

const HEADER_ALIASES = {
  month: ['thang', 'month', 'ky', 'period'],
  total_income: ['thunhap', 'tongthunhap', 'tongthu', 'income'],
  date: ['ngay', 'date', 'thoigian'],
  description: ['mota', 'diengiai', 'noidung', 'description'],
  amount: ['sotien', 'tongtien', 'chi', 'thu', 'amount', 'giatri'],
  jar: ['hu', 'quy', 'jar', 'fund'],
  from_jar: ['tuhu', 'tuquy', 'nguonquy', 'fromjar', 'fromfund'],
  to_jar: ['denhu', 'sanghu', 'toihu', 'tojar', 'tofund', 'quyno', 'noquy'],
  status: ['trangthai', 'status'],
  reason: ['lydo', 'ghichu', 'reason', 'note']
};

export const normalizeText = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

export const normalizeHeaderCell = (value) => normalizeText(value);

const simplifyText = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();

const parseExcelSerialDate = (value) => {
  const parsedValue = XLSX.SSF.parse_date_code(value);

  if (!parsedValue) {
    return null;
  }

  return new Date(Date.UTC(parsedValue.y, parsedValue.m - 1, parsedValue.d));
};

export const parseAmount = (value) => {
  if (value == null || value === '') {
    return null;
  }

  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }

  const rawValue = String(value).trim();

  if (!rawValue) {
    return null;
  }

  if (rawValue.includes('+')) {
    const parts = rawValue.split('+').map((item) => parseAmount(item));
    if (parts.some((item) => item == null)) {
      return null;
    }
    return parts.reduce((total, item) => total + item, 0);
  }

  const compactValue = rawValue.replace(/\s+/g, '');

  if (/^-?\d{1,3}(?:[,.]\d{3})+$/.test(compactValue)) {
    const parsedValue = Number(compactValue.replace(/[,.]/g, ''));
    return Number.isNaN(parsedValue) ? null : parsedValue;
  }

  if (/^-?\d{1,3}(?: \d{3})+$/.test(rawValue)) {
    const parsedValue = Number(rawValue.replace(/\s+/g, ''));
    return Number.isNaN(parsedValue) ? null : parsedValue;
  }

  if (/[,;]/.test(rawValue)) {
    return rawValue
      .split(/[,;]/)
      .map((item) => parseAmount(item))
      .filter((item) => item != null)
      .reduce((total, item) => total + item, 0);
  }

  const digitsOnly = rawValue.replace(/[^\d-]/g, '');

  if (!digitsOnly || digitsOnly === '-') {
    return null;
  }

  const parsedValue = Number(digitsOnly);
  return Number.isNaN(parsedValue) ? null : parsedValue;
};

export const parseSheetMonth = (sheetName, fallbackYear = new Date().getFullYear()) => {
  const simplifiedSheetName = simplifyText(sheetName);
  const monthMatch = simplifiedSheetName.match(/thang\s*(\d{1,2})(?:\D+(20\d{2}))?/);

  if (!monthMatch) {
    return null;
  }

  const month = Number(monthMatch[1]);
  const year = monthMatch[2] ? Number(monthMatch[2]) : fallbackYear;

  if (!month || month < 1 || month > 12) {
    return null;
  }

  return `${year}-${String(month).padStart(2, '0')}`;
};

export const parseMonthValue = (value, fallbackYear = new Date().getFullYear()) => {
  if (value == null || value === '') {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  const rawValue = String(value).trim();
  const simplifiedValue = simplifyText(rawValue);

  if (/^\d{4}-\d{2}$/.test(rawValue)) {
    return rawValue;
  }

  const yearMonthMatch = rawValue.match(/(20\d{2})[/-](\d{1,2})/);

  if (yearMonthMatch) {
    return `${yearMonthMatch[1]}-${String(Number(yearMonthMatch[2])).padStart(2, '0')}`;
  }

  const monthYearMatch = simplifiedValue.match(/thang\s*(\d{1,2})(?:\D+(20\d{2}))?/);

  if (monthYearMatch) {
    const month = Number(monthYearMatch[1]);
    const year = monthYearMatch[2] ? Number(monthYearMatch[2]) : fallbackYear;
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  if (/^\d{1,2}$/.test(rawValue)) {
    return `${fallbackYear}-${String(Number(rawValue)).padStart(2, '0')}`;
  }

  return null;
};

export const parseDateValue = (value, monthContext) => {
  if (value == null || value === '') {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'number') {
    if (value >= 1 && value <= 31 && monthContext) {
      const [year, month] = monthContext.split('-').map(Number);
      return new Date(Date.UTC(year, month - 1, value));
    }

    return parseExcelSerialDate(value);
  }

  const rawValue = String(value).trim();

  if (!rawValue) {
    return null;
  }

  if (/^\d{1,2}$/.test(rawValue) && monthContext) {
    const [year, month] = monthContext.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, Number(rawValue)));
  }

  const dayMonthYearMatch = rawValue.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?$/);

  if (dayMonthYearMatch) {
    const day = Number(dayMonthYearMatch[1]);
    const month = Number(dayMonthYearMatch[2]);
    const parsedYear = dayMonthYearMatch[3]
      ? Number(dayMonthYearMatch[3].length === 2 ? `20${dayMonthYearMatch[3]}` : dayMonthYearMatch[3])
      : Number((monthContext || `${new Date().getFullYear()}-01`).split('-')[0]);

    return new Date(Date.UTC(parsedYear, month - 1, day));
  }

  const parsedValue = new Date(rawValue);
  return Number.isNaN(parsedValue.getTime()) ? null : parsedValue;
};

export const detectSheetType = (sheetName) => {
  const normalizedSheetName = normalizeText(sheetName);

  if (normalizedSheetName.includes('noquy')) {
    return 'jar_debts';
  }

  if (normalizedSheetName.includes('6hu') && !normalizedSheetName.includes('conlai')) {
    return 'six_jars';
  }

  if (normalizedSheetName.includes('thang')) {
    return 'transactions';
  }

  return 'unsupported';
};

export const findHeaderRow = (rows, predicate) => {
  for (let rowIndex = 0; rowIndex < Math.min(rows.length, 20); rowIndex += 1) {
    const row = rows[rowIndex];
    if (predicate(row)) {
      return rowIndex;
    }
  }

  return -1;
};

export const isRowEmpty = (row) => row.every((cell) => String(cell ?? '').trim() === '');

export const inferJarKey = (value) => {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return null;
  }

  if (JAR_LABEL_MAP.has(normalizedValue)) {
    return JAR_LABEL_MAP.get(normalizedValue);
  }

  for (const [label, jarKey] of JAR_LABEL_MAP.entries()) {
    if (normalizedValue.includes(label)) {
      return jarKey;
    }
  }

  return null;
};

export const buildHeaderMap = (row) => {
  const headerMap = {};

  row.forEach((cell, columnIndex) => {
    const normalizedValue = normalizeHeaderCell(cell);

    if (!normalizedValue) {
      return;
    }

    const jarKey = inferJarKey(normalizedValue);
    if (jarKey) {
      headerMap[jarKey] = columnIndex;
      return;
    }

    for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.some((alias) => normalizedValue.includes(alias))) {
        if (headerMap[key] == null) {
          headerMap[key] = columnIndex;
        }
        return;
      }
    }
  });

  return headerMap;
};

export const getRowValue = (row, index) => {
  if (index == null || index < 0) {
    return '';
  }

  return row[index];
};
