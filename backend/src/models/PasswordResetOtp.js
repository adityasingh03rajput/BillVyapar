import mongoose from 'mongoose';

const passwordResetOtpSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, required: true, index: true, lowercase: true, trim: true },

    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },

    attempts: { type: Number, required: true, default: 0 },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

passwordResetOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetOtp = mongoose.model('PasswordResetOtp', passwordResetOtpSchema);
