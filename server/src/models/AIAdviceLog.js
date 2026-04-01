import mongoose from 'mongoose';

import { AI_ADVICE_LOG_STATUSES, MONTH_PATTERN } from './constants.js';

const { Schema } = mongoose;

const aiAdviceLogSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    month: {
      type: String,
      match: MONTH_PATTERN
    },
    request_type: {
      type: String,
      required: true,
      trim: true
    },
    input_snapshot: {
      type: Schema.Types.Mixed
    },
    response_text: {
      type: String
    },
    response_payload: {
      type: Schema.Types.Mixed
    },
    provider: {
      type: String,
      trim: true
    },
    model_name: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      required: true,
      enum: AI_ADVICE_LOG_STATUSES
    },
    error_message: {
      type: String
    },
    completed_at: {
      type: Date
    }
  },
  {
    collection: 'ai_advice_logs',
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

aiAdviceLogSchema.index({ user_id: 1, created_at: -1 });
aiAdviceLogSchema.index({ user_id: 1, month: 1 });
aiAdviceLogSchema.index({ status: 1, created_at: -1 });

export default mongoose.model('AIAdviceLog', aiAdviceLogSchema);
