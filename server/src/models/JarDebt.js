import mongoose from 'mongoose';

import { JAR_DEBT_STATUSES, JAR_KEYS, MONTH_PATTERN } from './constants.js';

const { Schema } = mongoose;

const jarDebtSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    from_jar_id: {
      type: Schema.Types.ObjectId,
      ref: 'Jar',
      required: true
    },
    from_jar_key: {
      type: String,
      required: true,
      enum: JAR_KEYS
    },
    to_jar_id: {
      type: Schema.Types.ObjectId,
      ref: 'Jar',
      required: true
    },
    to_jar_key: {
      type: String,
      required: true,
      enum: JAR_KEYS
    },
    month: {
      type: String,
      required: true,
      match: MONTH_PATTERN
    },
    amount: {
      type: Number,
      required: true
    },
    debt_date: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: JAR_DEBT_STATUSES
    },
    settled_at: {
      type: Date
    },
    reason: {
      type: String,
      trim: true
    }
  },
  {
    collection: 'jar_debts',
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

jarDebtSchema.index({ user_id: 1, month: 1, status: 1 });
jarDebtSchema.index({ user_id: 1, from_jar_key: 1, to_jar_key: 1 });
jarDebtSchema.index({ debt_date: -1 });

export default mongoose.model('JarDebt', jarDebtSchema);
