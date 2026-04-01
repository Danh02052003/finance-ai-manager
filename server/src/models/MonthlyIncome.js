import mongoose from 'mongoose';

import { MONTH_PATTERN } from './constants.js';

const { Schema } = mongoose;

const monthlyIncomeSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    month: {
      type: String,
      required: true,
      match: MONTH_PATTERN
    },
    total_amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      default: 'VND'
    },
    income_date: {
      type: Date
    },
    source_note: {
      type: String,
      trim: true
    }
  },
  {
    collection: 'monthly_incomes',
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

monthlyIncomeSchema.index({ user_id: 1, month: 1 }, { unique: true });
monthlyIncomeSchema.index({ month: 1 });

export default mongoose.model('MonthlyIncome', monthlyIncomeSchema);
