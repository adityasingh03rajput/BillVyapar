import mongoose from 'mongoose';

const licenseKeySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    assignedEmail: { type: String, required: true, index: true },
    durationDays: { type: Number, required: true },
    activatedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    activatedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null }, // set on activation
    status: { type: String, enum: ['pending', 'active', 'expired', 'revoked'], default: 'pending', index: true },
    generatedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'MasterAdmin', required: true },
    notes: { type: String, default: null },
  },
  { timestamps: true }
);

export const LicenseKey = mongoose.model('LicenseKey', licenseKeySchema);
