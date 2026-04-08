import mongoose from 'mongoose';

const { Schema } = mongoose;

const authSessionSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    token_hash: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    expires_at: {
      type: Date,
      required: true
    },
    ip_address: {
      type: String,
      trim: true
    },
    user_agent: {
      type: String,
      trim: true
    },
    last_seen_at: {
      type: Date
    }
  },
  {
    collection: 'auth_sessions',
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

authSessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
authSessionSchema.index({ user_id: 1, created_at: -1 });

export default mongoose.model('AuthSession', authSessionSchema);
