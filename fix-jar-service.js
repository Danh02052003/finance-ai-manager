const fs = require('fs');

let content = fs.readFileSync('server/src/services/jarActualBalanceService.js', 'utf8');

const replacement = `const buildJarActualBalancePayload = async (userId, payload, existingRecord = null) => {
  const month = requireMonth(payload.month);
  const jar = await resolveJarByKey(userId, payload.jar_key);

  return {
    user_id: userId,
    jar_id: jar._id,
    jar_key: jar.jar_key,
    month,
    actual_balance_amount: requireMoneyInput(
      payload.actual_balance_amount ?? existingRecord?.actual_balance_amount ?? 0,
      'actual_balance_amount'
    ),
    note: parseOptionalString(payload.note) || existingRecord?.note || null
  };
};

export const ensureJarActualBalanceRecord = async (
  userId,
  { jar_key, month, initialAmount = 0 }
) => {
  const jar = await resolveJarByKey(userId, jar_key);

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

  return JarActualBalance.create({
    user_id: userId,
    jar_id: jar._id,
    jar_key: jar.jar_key,
    month,
    actual_balance_amount: initialAmount,
    note: null
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
};`;

content = content.replace(/\} from '\.\/mvpDataService\.js';[\s\S]*?note: parseOptionalString\(payload\.note\) \|\| existingRecord\?\.note \|\| null\n  };\n};/m, replacement);
content = content.replace(/export const triggerDailyYield = async.*?$/m, '');
content = content.replace(/\} from '\.\/mvpDataService\.js';\s*\} from '\.\/mvpDataService\.js';/m, "} from './mvpDataService.js';"); // Fix duplicated from line 11 earlier if any

fs.writeFileSync('server/src/services/jarActualBalanceService.js', content);
console.log('Fixed jarActualBalanceService.js');
