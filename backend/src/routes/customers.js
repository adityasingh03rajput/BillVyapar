import { Router } from 'express';
import { requireAuth, requireValidDeviceSession } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/subscription.js';
import { requireProfile } from '../middleware/profile.js';
import { Customer } from '../models/Customer.js';

export const customersRouter = Router();

customersRouter.use(requireAuth, requireValidDeviceSession, requireActiveSubscription, requireProfile);

customersRouter.post('/', async (req, res, next) => {
  try {
    const data = req.body || {};
    const customer = await Customer.create({ userId: req.userId, profileId: req.profileId, ...data });

    res.json({
      id: String(customer._id),
      ...customer.toObject(),
      _id: undefined,
      userId: undefined,
      createdAt: customer.createdAt?.toISOString?.() ?? customer.createdAt,
      updatedAt: customer.updatedAt?.toISOString?.() ?? customer.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

customersRouter.get('/', async (req, res, next) => {
  try {
    const customers = await Customer.find({ userId: req.userId, profileId: req.profileId }).sort({ createdAt: 1 });
    res.json(
      customers.map(c => ({
        id: String(c._id),
        ...c.toObject(),
        _id: undefined,
        userId: undefined,
        createdAt: c.createdAt?.toISOString?.() ?? c.createdAt,
        updatedAt: c.updatedAt?.toISOString?.() ?? c.updatedAt,
      }))
    );
  } catch (err) {
    next(err);
  }
});

customersRouter.put('/:id', async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      userId: req.userId,
      profileId: req.profileId,
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    Object.assign(customer, req.body || {});
    await customer.save();

    res.json({
      id: String(customer._id),
      ...customer.toObject(),
      _id: undefined,
      userId: undefined,
      createdAt: customer.createdAt?.toISOString?.() ?? customer.createdAt,
      updatedAt: customer.updatedAt?.toISOString?.() ?? customer.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});
