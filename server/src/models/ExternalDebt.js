import mongoose from 'mongoose';

import { MONTH_PATTERN } from './constants.js';

const { Schema } = mongoose;

const externalDebtSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    creditor_name: {
      type: String,
      required: true,
      trim: true
    },
    debt_type: {
      type: String,
      required: true,
      enum: ['borrowed', 'lent'],
      default: 'borrowed'
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
      enum: ['open', 'settled'],
      default: 'open'
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
    collection: 'external_debts',
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

externalDebtSchema.index({ user_id: 1, month: 1, status: 1 });
externalDebtSchema.index({ user_id: 1, debt_type: 1 });
externalDebtSchema.index({ debt_date: -1 });

export default mongoose.model('ExternalDebt', externalDebtSchema);
