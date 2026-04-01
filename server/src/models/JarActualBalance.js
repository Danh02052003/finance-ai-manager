import mongoose from 'mongoose';

import { JAR_KEYS, MONTH_PATTERN } from './constants.js';

const { Schema } = mongoose;

const jarActualBalanceSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    jar_id: {
      type: Schema.Types.ObjectId,
      ref: 'Jar',
      required: true
    },
    jar_key: {
      type: String,
      required: true,
      enum: JAR_KEYS
    },
    month: {
      type: String,
      required: true,
      match: MONTH_PATTERN
    },
    actual_balance_amount: {
      type: Number,
      required: true
    },
    note: {
      type: String,
      trim: true
    }
  },
  {
    collection: 'jar_actual_balances',
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

jarActualBalanceSchema.index({ user_id: 1, month: 1, jar_key: 1 }, { unique: true });
jarActualBalanceSchema.index({ user_id: 1, month: -1, updated_at: -1 });
jarActualBalanceSchema.index({ jar_id: 1, month: 1 });

export default mongoose.model('JarActualBalance', jarActualBalanceSchema);
