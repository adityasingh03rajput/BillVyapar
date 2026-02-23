import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    plan: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    active: { type: Boolean, required: true, default: true },
    previousPlan: { type: String, default: null },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
