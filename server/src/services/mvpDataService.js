import mongoose from 'mongoose';

import { Jar, MonthlyIncome } from '../models/index.js';
import { MONTH_PATTERN } from '../models/constants.js';
import { getDemoUser } from './demoSeedService.js';

export const requireDemoUser = async () => {
  const user = await getDemoUser();

  if (!user) {
    throw new Error('Demo user not found.');
  }

  return user;
};

export const requireObjectId = (value, fieldName) => {
  if (!mongoose.isValidObjectId(value)) {
    throw new Error(`${fieldName} is invalid.`);
  }

  return value;
};

export const requireMonth = (value) => {
  if (!value || !MONTH_PATTERN.test(value)) {
    throw new Error('month must use YYYY-MM format.');
  }

  return value;
};

export const requireNumber = (value, fieldName) => {
  const parsedValue = Number(value);

  if (Number.isNaN(parsedValue)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }

  return parsedValue;
};

export const requireMoneyInput = (value, fieldName) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const rawValue = `${value ?? ''}`.trim();

  if (!rawValue) {
    throw new Error(`${fieldName} is required.`);
  }

  const sign = rawValue.startsWith('-') ? -1 : 1;
  const unsignedValue = rawValue.replace(/^[+-]/, '').replace(/\s+/g, '');
  const sanitizedValue = unsignedValue.replace(/[^\d,.]/g, '');

  if (!sanitizedValue || !/\d/.test(sanitizedValue)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }

  const parsedDigits = Number(sanitizedValue.replace(/[,.]/g, ''));

  if (Number.isNaN(parsedDigits)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }

  return sign * (/[,.]/.test(sanitizedValue) ? parsedDigits : parsedDigits * 1000);
};

export const requireString = (value, fieldName) => {
  const parsedValue = value?.trim();

  if (!parsedValue) {
    throw new Error(`${fieldName} is required.`);
  }

  return parsedValue;
};

export const parseOptionalString = (value) => {
  const parsedValue = value?.trim();
  return parsedValue || undefined;
};

export const requireDate = (value, fieldName) => {
  const parsedValue = new Date(value);

  if (Number.isNaN(parsedValue.getTime())) {
    throw new Error(`${fieldName} must be a valid date.`);
  }

  return parsedValue;
};

export const parseOptionalDate = (value, fieldName) => {
  if (!value) {
    return undefined;
  }

  return requireDate(value, fieldName);
};

export const resolveJarByKey = async (userId, jarKey, fieldName = 'jar_key') => {
  const parsedJarKey = requireString(jarKey, fieldName);
  const jar = await Jar.findOne({
    user_id: userId,
    jar_key: parsedJarKey
  });

  if (!jar) {
    throw new Error(`${fieldName} does not match an existing jar.`);
  }

  return jar;
};

export const resolveMonthlyIncome = async (userId, monthlyIncomeId) => {
  requireObjectId(monthlyIncomeId, 'monthly_income_id');

  const monthlyIncome = await MonthlyIncome.findOne({
    _id: monthlyIncomeId,
    user_id: userId
  });

  if (!monthlyIncome) {
    throw new Error('monthly_income_id does not match an existing monthly income.');
  }

  return monthlyIncome;
};
