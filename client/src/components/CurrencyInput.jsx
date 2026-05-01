import React from 'react';

const autoFormatMoney = (value) => {
  if (!value) return '';
  const digits = String(value).replace(/[^\d]/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('vi-VN').format(Number(digits));
};

const CurrencyInput = ({ value, onChange, className, placeholder, name, required, autoFocus }) => {
  // We maintain a local formatted string for display
  const [displayValue, setDisplayValue] = React.useState('');

  React.useEffect(() => {
    // Whenever parent value changes programmatically (e.g. form reset, edit load)
    // we format it if it's not matching our display to avoid cursor jumping
    const formatted = autoFormatMoney(value);
    if (value === '' || formatted !== autoFormatMoney(displayValue)) {
      setDisplayValue(formatted);
    }
  }, [value]);

  const handleChange = (e) => {
    const rawVal = e.target.value;
    const formatted = autoFormatMoney(rawVal);
    setDisplayValue(formatted);
    // Send the formatted string to the parent (e.g. "1.234" or "50")
    if (onChange) {
      e.target.value = formatted;
      onChange(e);
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      name={name}
      value={displayValue}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
      required={required}
      autoFocus={autoFocus}
      aria-label="Số tiền"
      autoComplete="off"
    />
  );
};

export default CurrencyInput;
