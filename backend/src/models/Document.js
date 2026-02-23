import mongoose from 'mongoose';

const documentItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    hsnSac: { type: String, default: null },
    quantity: { type: Number, default: 0 },
    unit: { type: String, default: null },
    rate: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    discount: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessProfile', required: false, index: true, default: null },

    documentNumber: { type: String, required: true, index: true },
    type: { type: String, required: true },

    customerName: { type: String, default: null },
    customerAddress: { type: String, default: null },
    customerGstin: { type: String, default: null },
    date: { type: String, default: null },
    dueDate: { type: String, default: null },

    invoiceNo: { type: String, default: null },
    challanNo: { type: String, default: null },
    ewayBillNo: { type: String, default: null },
    transport: { type: String, default: null },
    transportId: { type: String, default: null },
    placeOfSupply: { type: String, default: null },

    bankName: { type: String, default: null },
    bankBranch: { type: String, default: null },
    bankAccountNumber: { type: String, default: null },
    bankIfsc: { type: String, default: null },
    upiId: { type: String, default: null },
    upiQrText: { type: String, default: null },

    items: { type: [documentItemSchema], default: [] },

    transportCharges: { type: Number, default: 0 },
    additionalCharges: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },

    notes: { type: String, default: null },
    termsConditions: { type: String, default: null },

    paymentStatus: { type: String, default: 'unpaid' },
    paymentMode: { type: String, default: null },
    status: { type: String, default: 'draft' },

    currency: { type: String, default: 'INR' },

    itemsTotal: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    totalCgst: { type: Number, default: 0 },
    totalSgst: { type: Number, default: 0 },
    totalIgst: { type: Number, default: 0 },

    version: { type: Number, required: true, default: 1 },

    convertedFrom: { type: String, default: null },
  },
  { timestamps: true }
);

export const Document = mongoose.model('Document', documentSchema);
