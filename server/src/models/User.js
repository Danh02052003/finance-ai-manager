import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    display_name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    base_currency: {
      type: String,
      required: true,
      trim: true,
      default: 'VND'
    },
    locale: {
      type: String,
      trim: true
    },
    timezone: {
      type: String,
      trim: true
    }
  },
  {
    collection: 'users',
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ created_at: -1 });

export default mongoose.model('User', userSchema);
