import { Router } from 'express';
import { requireAuth, requireValidDeviceSession } from '../middleware/auth.js';
import { requireActiveSubscriptionOrAllowReadonlyGet } from '../middleware/subscription.js';
import { requireProfile } from '../middleware/profile.js';
import { Counter } from '../models/Counter.js';
import { Document } from '../models/Document.js';

export const documentsRouter = Router();

documentsRouter.use(
  requireAuth,
  requireValidDeviceSession,
  requireActiveSubscriptionOrAllowReadonlyGet(['/documents']),
  requireProfile
);

async function nextDocumentNumber(userId, profileId, type) {
  const counter = await Counter.findOneAndUpdate(
    { userId, profileId, docType: type },
    { $inc: { value: 1 } },
    { upsert: true, new: true }
  );

  const num = String(counter.value).padStart(5, '0');
  return `${String(type).toUpperCase()}-${num}`;
}

documentsRouter.post('/', async (req, res, next) => {
  try {
    const docData = req.body || {};
    const documentNumber = await nextDocumentNumber(req.userId, req.profileId, docData.type);

    const doc = await Document.create({
      userId: req.userId,
      profileId: req.profileId,
      documentNumber,
      ...docData,
      version: 1,
    });

    res.json({
      id: String(doc._id),
      ...doc.toObject(),
      _id: undefined,
      userId: undefined,
      createdAt: doc.createdAt?.toISOString?.() ?? doc.createdAt,
      updatedAt: doc.updatedAt?.toISOString?.() ?? doc.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

documentsRouter.get('/', async (req, res, next) => {
  try {
    const docs = await Document.find({ userId: req.userId, profileId: req.profileId }).sort({ createdAt: -1 });
    res.json(
      docs.map(d => ({
        id: String(d._id),
        ...d.toObject(),
        _id: undefined,
        userId: undefined,
        createdAt: d.createdAt?.toISOString?.() ?? d.createdAt,
        updatedAt: d.updatedAt?.toISOString?.() ?? d.updatedAt,
      }))
    );
  } catch (err) {
    next(err);
  }
});

documentsRouter.get('/:id', async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.userId, profileId: req.profileId });
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({
      id: String(doc._id),
      ...doc.toObject(),
      _id: undefined,
      userId: undefined,
      createdAt: doc.createdAt?.toISOString?.() ?? doc.createdAt,
      updatedAt: doc.updatedAt?.toISOString?.() ?? doc.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

documentsRouter.put('/:id', async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.userId, profileId: req.profileId });
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    Object.assign(doc, req.body || {});
    doc.version = (doc.version || 1) + 1;

    await doc.save();

    res.json({
      id: String(doc._id),
      ...doc.toObject(),
      _id: undefined,
      userId: undefined,
      createdAt: doc.createdAt?.toISOString?.() ?? doc.createdAt,
      updatedAt: doc.updatedAt?.toISOString?.() ?? doc.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

documentsRouter.post('/:id/duplicate', async (req, res, next) => {
  try {
    const existing = await Document.findOne({ _id: req.params.id, userId: req.userId, profileId: req.profileId });
    if (!existing) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const documentNumber = await nextDocumentNumber(req.userId, req.profileId, existing.type);

    const newDoc = await Document.create({
      ...existing.toObject(),
      _id: undefined,
      userId: req.userId,
      profileId: req.profileId,
      documentNumber,
      status: 'draft',
      version: 1,
      createdAt: undefined,
      updatedAt: undefined,
    });

    res.json({
      id: String(newDoc._id),
      ...newDoc.toObject(),
      _id: undefined,
      userId: undefined,
      createdAt: newDoc.createdAt?.toISOString?.() ?? newDoc.createdAt,
      updatedAt: newDoc.updatedAt?.toISOString?.() ?? newDoc.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

documentsRouter.post('/:id/convert', async (req, res, next) => {
  try {
    const { targetType } = req.body || {};

    const existing = await Document.findOne({ _id: req.params.id, userId: req.userId, profileId: req.profileId });
    if (!existing) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const documentNumber = await nextDocumentNumber(req.userId, req.profileId, targetType);

    const newDoc = await Document.create({
      ...existing.toObject(),
      _id: undefined,
      userId: req.userId,
      profileId: req.profileId,
      type: targetType,
      documentNumber,
      convertedFrom: String(existing._id),
      status: 'draft',
      version: 1,
      createdAt: undefined,
      updatedAt: undefined,
    });

    res.json({
      id: String(newDoc._id),
      ...newDoc.toObject(),
      _id: undefined,
      userId: undefined,
      createdAt: newDoc.createdAt?.toISOString?.() ?? newDoc.createdAt,
      updatedAt: newDoc.updatedAt?.toISOString?.() ?? newDoc.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});
