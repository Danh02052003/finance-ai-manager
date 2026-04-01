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
  const sanitizedValue = unsignedValue.replace(/[^\d,.]/g, '');

  if (!sanitizedValue || !/\d/.test(sanitizedValue)) {
    return null;
  }

  const parsedDigits = Number(sanitizedValue.replace(/[,.]/g, ''));

  if (Number.isNaN(parsedDigits)) {
    return null;
  }

  return sign * (/[,.]/.test(sanitizedValue) ? parsedDigits : parsedDigits * 1000);
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

export const moneyInputHint =
  'Nhập 83,869 hoặc 83.869 nếu muốn lưu đúng 83.869đ. Nếu nhập 83869 thì app sẽ hiểu là 83.869.000đ.';
