import mongoose from 'mongoose';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { Document } from '../models/Document.js';

function parseBestDate(value, fallback) {
  const d = value ? new Date(String(value)) : null;
  if (d && !Number.isNaN(d.getTime())) return d;
  const f = fallback ? new Date(fallback) : new Date();
  return Number.isNaN(f.getTime()) ? new Date() : f;
}

function normalizeDocType(t) {
  return String(t || '').trim().toLowerCase();
}

function computeDocVoucher({ docType, amount, partyType }) {
  const t = normalizeDocType(docType);
  const amt = Number(amount) || 0;

  if (partyType === 'customer') {
    if (t === 'invoice' || t === 'billing') return { voucherType: 'GST Sales', debit: amt, credit: 0 };
    if (t === 'credit_note') return { voucherType: 'Credit Note', debit: 0, credit: amt };
    if (t === 'debit_note') return { voucherType: 'Debit Note', debit: amt, credit: 0 };
  }

  if (partyType === 'supplier') {
    if (t === 'purchase') return { voucherType: 'GST Purchase', debit: 0, credit: amt };
    if (t === 'credit_note') return { voucherType: 'Credit Note', debit: amt, credit: 0 };
    if (t === 'debit_note') return { voucherType: 'Debit Note', debit: 0, credit: amt };
  }

  if (t === 'journal') return { voucherType: 'Journal', debit: 0, credit: 0 };

  return null;
}

export async function upsertLedgerForDocument({ userId, profileId, documentId }) {
  if (!mongoose.Types.ObjectId.isValid(String(documentId))) return null;

  const doc = await Document.findOne({ _id: documentId, userId, profileId }).lean();
  if (!doc) return null;

  if (String(doc.status || '').toLowerCase() === 'draft') {
    await LedgerEntry.deleteOne({ userId, profileId, sourceType: 'document', sourceId: doc._id });
    return null;
  }

  const partyType = doc.customerId ? 'customer' : doc.supplierId ? 'supplier' : null;
  const partyId = doc.customerId || doc.supplierId;
  if (!partyType || !partyId) return null;

  const amount = Number(doc.grandTotal || 0);
  const voucher = computeDocVoucher({ docType: doc.type, amount, partyType });
  if (!voucher) {
    await LedgerEntry.deleteOne({ userId, profileId, sourceType: 'document', sourceId: doc._id });
    return null;
  }

  const date = parseBestDate(doc.date, doc.createdAt);
  const particulars = String(doc.customerName || '').trim() || null;

  const entry = await LedgerEntry.findOneAndUpdate(
    { userId, profileId, sourceType: 'document', sourceId: doc._id },
    {
      $set: {
        userId,
        profileId,
        partyType,
        partyId,
        date,
        voucherType: voucher.voucherType,
        voucherNo: String(doc.documentNumber || '').trim() || null,
        particulars,
        debit: Number(voucher.debit || 0),
        credit: Number(voucher.credit || 0),
        sourceType: 'document',
        sourceId: doc._id,
        isReversal: false,
        reversalOf: null,
      },
    },
    { upsert: true, new: true }
  );

  return entry;
}

export async function createLedgerForPayment({ userId, profileId, payment }) {
  const partyType = payment.customerId ? 'customer' : payment.supplierId ? 'supplier' : null;
  const partyId = payment.customerId || payment.supplierId;
  if (!partyType || !partyId) return null;

  const date = parseBestDate(payment.date, payment.createdAt);
  const amount = Number(payment.amount || 0);

  const voucherType = partyType === 'customer' ? 'Receipt' : 'Payment';
  const debit = partyType === 'supplier' ? amount : 0;
  const credit = partyType === 'customer' ? amount : 0;

  const entry = await LedgerEntry.create({
    userId,
    profileId,
    partyType,
    partyId,
    date,
    voucherType,
    voucherNo: String(payment.reference || '').trim() || null,
    particulars: String(payment.method || '').trim() || null,
    debit,
    credit,
    sourceType: 'payment',
    sourceId: payment._id,
    isReversal: false,
    reversalOf: null,
  });

  return entry;
}
