import { Router } from 'express';
import { requireAuth, requireValidDeviceSession } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/subscription.js';
import { requireProfile } from '../middleware/profile.js';
import { Supplier } from '../models/Supplier.js';

export const suppliersRouter = Router();

suppliersRouter.use(requireAuth, requireValidDeviceSession, requireActiveSubscription, requireProfile);

suppliersRouter.post('/', async (req, res, next) => {
  try {
    const data = req.body || {};
    const supplier = await Supplier.create({ userId: req.userId, profileId: req.profileId, ...data });

    res.json({
      id: String(supplier._id),
      ...supplier.toObject(),
      _id: undefined,
      userId: undefined,
      createdAt: supplier.createdAt?.toISOString?.() ?? supplier.createdAt,
      updatedAt: supplier.updatedAt?.toISOString?.() ?? supplier.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

suppliersRouter.get('/', async (req, res, next) => {
  try {
    const suppliers = await Supplier.find({ userId: req.userId, profileId: req.profileId }).sort({ createdAt: 1 });
    res.json(
      suppliers.map(s => ({
        id: String(s._id),
        ...s.toObject(),
        _id: undefined,
        userId: undefined,
        createdAt: s.createdAt?.toISOString?.() ?? s.createdAt,
        updatedAt: s.updatedAt?.toISOString?.() ?? s.updatedAt,
      }))
    );
  } catch (err) {
    next(err);
  }
});

suppliersRouter.put('/:id', async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({
      _id: req.params.id,
      userId: req.userId,
      profileId: req.profileId,
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    Object.assign(supplier, req.body || {});
    await supplier.save();

    res.json({
      id: String(supplier._id),
      ...supplier.toObject(),
      _id: undefined,
      userId: undefined,
      createdAt: supplier.createdAt?.toISOString?.() ?? supplier.createdAt,
      updatedAt: supplier.updatedAt?.toISOString?.() ?? supplier.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});
