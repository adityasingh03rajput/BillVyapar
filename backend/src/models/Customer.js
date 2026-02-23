import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessProfile', required: false, index: true, default: null },

    name: { type: String, required: true },
    email: { type: String, default: null },
    phone: { type: String, default: null },
    address: { type: String, default: null },
    gstin: { type: String, default: null },
    pan: { type: String, default: null },
  },
  { timestamps: true }
);

export const Customer = mongoose.model('Customer', customerSchema);
