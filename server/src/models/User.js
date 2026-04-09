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
    password_hash: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      trim: true,
      enum: ['super_admin', 'user'],
      default: 'user'
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
    },
    last_login_at: {
      type: Date
    },
    is_demo: {
      type: Boolean,
      default: false
    },
    demo_migrated_at: {
      type: Date
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
