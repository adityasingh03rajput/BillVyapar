import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth, requireValidDeviceSession } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/subscription.js';
import { requireProfile } from '../middleware/profile.js';
import { Payment } from '../models/Payment.js';
import { Document } from '../models/Document.js';

export const paymentsRouter = Router();

paymentsRouter.use(requireAuth, requireValidDeviceSession, requireActiveSubscription, requireProfile);

async function computeDocumentPaidAmount({ userId, profileId, documentId }) {
  const rows = await Payment.find({ userId, profileId, documentId });
  return rows.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
}

async function refreshDocumentPaymentStatus({ userId, profileId, documentId }) {
  const doc = await Document.findOne({ _id: documentId, userId, profileId });
  if (!doc) return null;

  const paidAmount = await computeDocumentPaidAmount({ userId, profileId, documentId });
  const total = Number(doc.grandTotal || 0);
  const remaining = Math.max(0, total - paidAmount);

  let status = 'unpaid';
  if (paidAmount > 0 && remaining > 0) status = 'partial';
  if (remaining <= 0 && total > 0) status = 'paid';
  if (total <= 0) status = 'paid';

  doc.paymentStatus = status;
  await doc.save();

  return {
    paymentStatus: doc.paymentStatus,
    paidAmount,
    remaining,
  };
}

paymentsRouter.post('/', async (req, res, next) => {
  try {
    const body = req.body || {};
    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const date = String(body.date || '').trim();
    if (!date) {
      return res.status(400).json({ error: 'date is required' });
    }

    const documentId = body.documentId ? String(body.documentId) : null;
    const customerId = body.customerId ? String(body.customerId) : null;

    if (documentId && !mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({ error: 'Invalid documentId' });
    }
    if (customerId && !mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ error: 'Invalid customerId' });
    }

    // Validate document belongs to current user/profile when provided
    if (documentId) {
      const doc = await Document.findOne({ _id: documentId, userId: req.userId, profileId: req.profileId });
      if (!doc) {
        return res.status(404).json({ error: 'Document not found' });
      }
    }

    const payment = await Payment.create({
      userId: req.userId,
      profileId: req.profileId,
      documentId,
      customerId,
      amount,
      currency: body.currency || 'INR',
      date,
      method: body.method || null,
      reference: body.reference || null,
      notes: body.notes || null,
    });

    let docUpdate = null;
    if (documentId) {
      docUpdate = await refreshDocumentPaymentStatus({
        userId: req.userId,
        profileId: req.profileId,
        documentId,
      });
    }

    res.json({
      id: String(payment._id),
      ...payment.toObject(),
      _id: undefined,
      userId: undefined,
      createdAt: payment.createdAt?.toISOString?.() ?? payment.createdAt,
      updatedAt: payment.updatedAt?.toISOString?.() ?? payment.updatedAt,
      document: docUpdate,
    });
  } catch (err) {
    next(err);
  }
});

paymentsRouter.get('/', async (req, res, next) => {
  try {
    const { documentId, customerId } = req.query || {};

    const filter = { userId: req.userId, profileId: req.profileId };

    if (documentId) {
      const id = String(documentId);
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid documentId' });
      }
      filter.documentId = id;
    }

    if (customerId) {
      const id = String(customerId);
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid customerId' });
      }
      filter.customerId = id;
    }

    const payments = await Payment.find(filter).sort({ date: -1, createdAt: -1 });

    res.json(
      payments.map(p => ({
        id: String(p._id),
        ...p.toObject(),
        _id: undefined,
        userId: undefined,
        createdAt: p.createdAt?.toISOString?.() ?? p.createdAt,
        updatedAt: p.updatedAt?.toISOString?.() ?? p.updatedAt,
      }))
    );
  } catch (err) {
    next(err);
  }
});

paymentsRouter.get('/outstanding', async (req, res, next) => {
  try {
    const docs = await Document.find({ userId: req.userId, profileId: req.profileId, type: 'invoice' }).sort({ createdAt: -1 });

    const results = [];
    let totalOutstanding = 0;

    for (const d of docs) {
      const paidAmount = await computeDocumentPaidAmount({
        userId: req.userId,
        profileId: req.profileId,
        documentId: d._id,
      });

      const total = Number(d.grandTotal || 0);
      const remaining = Math.max(0, total - paidAmount);
      totalOutstanding += remaining;

      results.push({
        documentId: String(d._id),
        documentNumber: d.documentNumber,
        customerName: d.customerName,
        date: d.date,
        total,
        paidAmount,
        remaining,
        paymentStatus: d.paymentStatus,
      });
    }

    res.json({ totalOutstanding, documents: results });
  } catch (err) {
    next(err);
  }
});
