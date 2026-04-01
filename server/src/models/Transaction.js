import mongoose from 'mongoose';

import { JAR_KEYS, MONTH_PATTERN, TRANSACTION_CATEGORIES, TRANSACTION_DIRECTIONS } from './constants.js';

const { Schema } = mongoose;

const transactionSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    jar_id: {
      type: Schema.Types.ObjectId,
      ref: 'Jar'
    },
    jar_key: {
      type: String,
      enum: JAR_KEYS
    },
    month: {
      type: String,
      required: true,
      match: MONTH_PATTERN
    },
    transaction_date: {
      type: Date,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      default: 'VND'
    },
    direction: {
      type: String,
      required: true,
      enum: TRANSACTION_DIRECTIONS
    },
    category: {
      type: String,
      enum: TRANSACTION_CATEGORIES,
      default: 'uncategorized'
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    source: {
      type: String,
      trim: true
    },
    external_row_ref: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    collection: 'transactions',
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

transactionSchema.index({ user_id: 1, month: 1, transaction_date: -1 });
transactionSchema.index({ user_id: 1, jar_key: 1, transaction_date: -1 });
transactionSchema.index({ source: 1, external_row_ref: 1 });

export default mongoose.model('Transaction', transactionSchema);
