import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deviceId: { type: String, required: true },
    lastActive: { type: Date, required: true },
  },
  { timestamps: true }
);

// One session per user+device combo
sessionSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

export const Session = mongoose.model('Session', sessionSchema);
