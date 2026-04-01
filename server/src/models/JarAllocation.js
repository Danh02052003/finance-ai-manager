import mongoose from 'mongoose';

import { JAR_KEYS, MONTH_PATTERN } from './constants.js';

const { Schema } = mongoose;

const jarAllocationSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    monthly_income_id: {
      type: Schema.Types.ObjectId,
      ref: 'MonthlyIncome',
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
    allocated_amount: {
      type: Number,
      required: true
    },
    allocation_percentage: {
      type: Number
    },
    note: {
      type: String,
      trim: true
    }
  },
  {
    collection: 'jar_allocations',
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

jarAllocationSchema.index({ user_id: 1, month: 1, jar_key: 1 });
jarAllocationSchema.index({ monthly_income_id: 1, jar_id: 1 }, { unique: true });
jarAllocationSchema.index({ jar_id: 1, month: 1 });

export default mongoose.model('JarAllocation', jarAllocationSchema);
