export const getCurrentMonthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const parseMoneyInputPreview = (value) => {
  const rawValue = `${value ?? ''}`.trim();

  if (!rawValue) {
    return null;
  }

  const sign = rawValue.startsWith('-') ? -1 : 1;
  const unsignedValue = rawValue.replace(/^[+-]/, '').replace(/\s+/g, '');
  const hasK = unsignedValue.toLowerCase().endsWith('k');
  const sanitizedValue = unsignedValue.replace(/[^\d,.]/g, '');

  if (!sanitizedValue || !/\d/.test(sanitizedValue)) {
    return null;
  }

  const parsedDigits = Number(sanitizedValue.replace(/[,.]/g, ''));

  if (Number.isNaN(parsedDigits)) {
    return null;
  }

  if (hasK) {
    return sign * parsedDigits * 1000;
  }

  if (/[,.]/.test(sanitizedValue)) {
    return sign * parsedDigits;
  }

  if (parsedDigits >= 1000) {
    return sign * parsedDigits;
  }

  return sign * parsedDigits * 1000;
};

export const formatMoneyInputValue = (value) => {
  const parsedValue = Number(value);

  if (Number.isNaN(parsedValue)) {
    return '';
  }

  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0
  }).format(parsedValue);
};

export const moneyInputHint = 'Nhập 50 -> 50.000đ. Nhập 1234 -> 1.234đ. Nhập 1500k -> 1.500.000đ.';
