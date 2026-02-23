import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessProfile', required: false, index: true, default: null },

    name: { type: String, required: true },
    hsnSac: { type: String, default: null },
    unit: { type: String, required: true },
    rate: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    cgst: { type: Number, required: true },
    sgst: { type: Number, required: true },
    igst: { type: Number, required: true },
    description: { type: String, default: null },
  },
  { timestamps: true }
);

export const Item = mongoose.model('Item', itemSchema);
