import mongoose from 'mongoose';

import { JAR_KEYS } from './constants.js';

const { Schema } = mongoose;

const jarSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    jar_key: {
      type: String,
      required: true,
      enum: JAR_KEYS
    },
    display_name_vi: {
      type: String,
      required: true,
      trim: true
    },
    display_order: {
      type: Number,
      required: true
    },
    target_percentage: {
      type: Number
    },
    is_active: {
      type: Boolean,
      required: true,
      default: true
    }
  },
  {
    collection: 'jars',
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

jarSchema.index({ user_id: 1, jar_key: 1 }, { unique: true });
jarSchema.index({ user_id: 1, display_order: 1 });

export default mongoose.model('Jar', jarSchema);
