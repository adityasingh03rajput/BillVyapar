import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    deviceId: { type: String, required: true },
    lastActive: { type: Date, required: true },
  },
  { timestamps: true }
);

export const Session = mongoose.model('Session', sessionSchema);
