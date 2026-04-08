import { Jar, JarActualBalance, Transaction, User } from '../models/index.js';

const MOMO_TAX_RATE = 0.05;
const DAILY_START_DELAY_DAYS = 2;

const toDateOnly = (value) => {
  const parsedValue = value ? new Date(value) : new Date();

  if (Number.isNaN(parsedValue.getTime())) {
    throw new Error('processing_date must be a valid date.');
  }

  return new Date(parsedValue.getFullYear(), parsedValue.getMonth(), parsedValue.getDate());
};

const addDays = (value, days) => {
  const nextValue = new Date(value);
  nextValue.setDate(nextValue.getDate() + days);
  return nextValue;
};

const buildMonthKey = (value) =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;

const buildLateTopUpWindow = (processingDate) => {
  const windowStart = new Date(processingDate);
  windowStart.setHours(23, 30, 0, 0);

  const windowEnd = new Date(processingDate);
  windowEnd.setHours(23, 40, 59, 999);

  return {
    windowStart,
    windowEnd
  };
};

const isSameDate = (firstValue, secondValue) =>
  firstValue.getFullYear() === secondValue.getFullYear() &&
  firstValue.getMonth() === secondValue.getMonth() &&
  firstValue.getDate() === secondValue.getDate();

const normalizeAnnualYieldRate = (value) => {
  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
};

const normalizeYieldBoolean = (value, defaultValue = true) =>
  value == null ? defaultValue : Boolean(value);

export const createYieldDates = (activationDate) => {
  const normalizedActivationDate = activationDate ? toDateOnly(activationDate) : toDateOnly(new Date());
  return {
    yield_activation_date: normalizedActivationDate,
    yield_start_date: addDays(normalizedActivationDate, DAILY_START_DELAY_DAYS)
  };
};

export const ensureJarActualBalanceRecord = async (
  userId,
  { jar_key, month, initialAmount = 0, defaults = {} }
) => {
  const jar = await Jar.findOne({ user_id: userId, jar_key });

  if (!jar) {
    throw new Error('jar_key does not match an existing jar.');
  }

  const existingRecord = await JarActualBalance.findOne({
    user_id: userId,
    jar_id: jar._id,
    month
  });

  if (existingRecord) {
    return existingRecord;
  }

  const yieldDates = createYieldDates(defaults.yield_activation_date);

  return JarActualBalance.create({
    user_id: userId,
    jar_id: jar._id,
    jar_key: jar.jar_key,
    month,
    actual_balance_amount: initialAmount,
    yield_enabled: normalizeYieldBoolean(defaults.yield_enabled, true),
    yield_rate_annual: normalizeAnnualYieldRate(defaults.yield_rate_annual),
    gross_yield_amount: Number(defaults.gross_yield_amount || 0),
    withholding_tax_amount: Number(defaults.withholding_tax_amount || 0),
    net_yield_amount: Number(defaults.net_yield_amount || 0),
    note: defaults.note || null,
    ...yieldDates
  });
};

export const applyTransactionImpactToActualBalance = async (
  userId,
  transactionPayload,
  factor = 1
) => {
  if (!transactionPayload?.jar_key || !transactionPayload?.month) {
    return null;
  }

  let deltaAmount = 0;

  if (transactionPayload.direction === 'expense') {
    deltaAmount = -Number(transactionPayload.amount || 0) * factor;
  } else if (transactionPayload.direction === 'income_adjustment') {
    deltaAmount = Number(transactionPayload.amount || 0) * factor;
  }

  if (!deltaAmount) {
    return ensureJarActualBalanceRecord(userId, {
      jar_key: transactionPayload.jar_key,
      month: transactionPayload.month
    });
  }

  const actualBalance = await ensureJarActualBalanceRecord(userId, {
    jar_key: transactionPayload.jar_key,
    month: transactionPayload.month
  });

  actualBalance.actual_balance_amount += deltaAmount;
  await actualBalance.save();

  return actualBalance;
};

const buildYieldBreakdown = (balanceAmount, annualRatePercent) => {
  const normalizedBalance = Math.max(0, Math.floor(Number(balanceAmount || 0)));
  const normalizedRate = Math.max(0, Number(annualRatePercent || 0));
  const grossAmount = Math.floor((normalizedBalance * normalizedRate) / 100 / 365);
  const taxAmount = Math.floor(grossAmount * MOMO_TAX_RATE);
  const netAmount = Math.max(0, grossAmount - taxAmount);

  return {
    grossAmount,
    taxAmount,
    netAmount
  };
};

export const runDailyYield = async ({ userId, processing_date } = {}) => {
  if (!userId) {
    throw new Error('userId is required.');
  }

  const processingDate = toDateOnly(processing_date);
  const processingMonth = buildMonthKey(processingDate);
  const actualBalances = await JarActualBalance.find({
    user_id: userId,
    month: processingMonth,
    yield_enabled: true,
    yield_rate_annual: { $gt: 0 }
  });

  const results = [];
  const { windowStart, windowEnd } = buildLateTopUpWindow(processingDate);

  for (const actualBalance of actualBalances) {
    const yieldStartDate = actualBalance.yield_start_date
      ? toDateOnly(actualBalance.yield_start_date)
      : createYieldDates(actualBalance.yield_activation_date).yield_start_date;

    if (yieldStartDate > processingDate) {
      results.push({
        jar_key: actualBalance.jar_key,
        status: 'pending_start',
        net_amount: 0
      });
      continue;
    }

    if (
      actualBalance.last_yield_processed_at &&
      isSameDate(toDateOnly(actualBalance.last_yield_processed_at), processingDate)
    ) {
      results.push({
        jar_key: actualBalance.jar_key,
        status: 'already_processed',
        net_amount: 0
      });
      continue;
    }

    const lateTopUpAmount = await Transaction.aggregate([
      {
        $match: {
          user_id: userId,
          jar_id: actualBalance.jar_id,
          month: processingMonth,
          direction: 'income_adjustment',
          source: { $ne: 'momo_yield' },
          created_at: {
            $gte: windowStart,
            $lte: windowEnd
          }
        }
      },
      {
        $group: {
          _id: null,
          total_amount: { $sum: '$amount' }
        }
      }
    ]);
    const eligibleBalanceAmount = Math.max(
      0,
      Number(actualBalance.actual_balance_amount || 0) - Number(lateTopUpAmount[0]?.total_amount || 0)
    );
    const { grossAmount, taxAmount, netAmount } = buildYieldBreakdown(
      eligibleBalanceAmount,
      actualBalance.yield_rate_annual
    );

    if (netAmount <= 0) {
      actualBalance.last_yield_processed_at = processingDate;
      await actualBalance.save();
      results.push({
        jar_key: actualBalance.jar_key,
        status: 'zero_yield',
        net_amount: 0
      });
      continue;
    }

    const externalRowRef = `momo-yield:${actualBalance.jar_key}:${processingMonth}:${processingDate.toISOString().slice(0, 10)}`;
    const existingTransaction = await Transaction.findOne({
      user_id: userId,
      source: 'momo_yield',
      external_row_ref: externalRowRef
    });

    if (existingTransaction) {
      actualBalance.last_yield_processed_at = processingDate;
      await actualBalance.save();
      results.push({
        jar_key: actualBalance.jar_key,
        status: 'already_exists',
        net_amount: existingTransaction.amount || 0
      });
      continue;
    }

    await Transaction.create({
      user_id: userId,
      jar_id: actualBalance.jar_id,
      jar_key: actualBalance.jar_key,
      month: processingMonth,
      transaction_date: processingDate,
      amount: netAmount,
      currency: 'VND',
      direction: 'income_adjustment',
      category: 'investment',
      description: 'Lợi nhuận sinh lời MoMo',
      source: 'momo_yield',
      external_row_ref: externalRowRef,
      notes: `Lãi gộp ${grossAmount}đ, thuế tạm khấu trừ ${taxAmount}đ, lãi ròng ${netAmount}đ.`
    });

    actualBalance.actual_balance_amount += netAmount;
    actualBalance.gross_yield_amount += grossAmount;
    actualBalance.withholding_tax_amount += taxAmount;
    actualBalance.net_yield_amount += netAmount;
    actualBalance.last_yield_processed_at = processingDate;
    await actualBalance.save();

    results.push({
      jar_key: actualBalance.jar_key,
      status: 'processed',
        eligible_balance_amount: eligibleBalanceAmount,
      gross_amount: grossAmount,
      tax_amount: taxAmount,
      net_amount: netAmount
    });
  }

  return {
    success: true,
    message: `Daily yield processed for ${processingMonth}.`,
    processing_date: processingDate.toISOString().slice(0, 10),
    month: processingMonth,
    processed: results.filter((item) => item.status === 'processed').length,
    results
  };
};

export const runDailyYieldForAllUsers = async ({ processing_date } = {}) => {
  const users = await User.find({
    password_hash: { $exists: true, $nin: [null, ''] }
  })
    .select({ _id: 1 })
    .lean();

  const results = await Promise.all(
    users.map((user) =>
      runDailyYield({
        userId: user._id,
        processing_date
      })
    )
  );

  return {
    success: true,
    processed_users: results.length,
    processed_yields: results.reduce((sum, item) => sum + (item.processed || 0), 0),
    results
  };
};
