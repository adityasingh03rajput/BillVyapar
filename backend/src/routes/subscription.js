import { Router } from 'express';
import { requireAuth, requireValidDeviceSession } from '../middleware/auth.js';
import { Subscription } from '../models/Subscription.js';
import { requireProfile } from '../middleware/profile.js';
import { signSubscriptionToken } from '../lib/jwt.js';

export const subscriptionRouter = Router();

subscriptionRouter.use(requireAuth, requireValidDeviceSession);

subscriptionRouter.get('/validate', requireProfile, async (req, res, next) => {
  try {
    const sub = await Subscription.findOne({ userId: req.userId });
    if (!sub) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const token = signSubscriptionToken({
      userId: req.userId,
      profileId: req.profileId,
      plan: sub.plan,
      endDate: sub.endDate,
    });

    res.json({
      ok: true,
      serverNow: new Date().toISOString(),
      token,
      subscription: {
        userId: String(sub.userId),
        plan: sub.plan,
        startDate: sub.startDate.toISOString(),
        endDate: sub.endDate.toISOString(),
        active: sub.active,
        previousPlan: sub.previousPlan ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
});

subscriptionRouter.get('/', async (req, res, next) => {
  try {
    const sub = await Subscription.findOne({ userId: req.userId });
    if (!sub) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    res.json({
      userId: String(sub.userId),
      plan: sub.plan,
      startDate: sub.startDate.toISOString(),
      endDate: sub.endDate.toISOString(),
      active: sub.active,
      previousPlan: sub.previousPlan ?? null,
    });
  } catch (err) {
    next(err);
  }
});

subscriptionRouter.post('/update', async (req, res, next) => {
  try {
    const { plan } = req.body || {};
    const now = new Date();
    const durationDays = plan === 'yearly' ? 365 : 30;

    const existing = await Subscription.findOne({ userId: req.userId });
    const base = existing?.endDate && new Date(existing.endDate) > now ? new Date(existing.endDate) : now;
    const endDate = new Date(base.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const startDate = existing?.startDate && existing?.endDate && new Date(existing.endDate) > now
      ? new Date(existing.startDate)
      : now;

    const sub = await Subscription.findOneAndUpdate(
      { userId: req.userId },
      {
        $set: {
          userId: req.userId,
          plan,
          startDate,
          endDate,
          active: true,
          previousPlan: existing?.plan || null,
        },
      },
      { upsert: true, new: true }
    );

    res.json({
      userId: String(sub.userId),
      plan: sub.plan,
      startDate: sub.startDate.toISOString(),
      endDate: sub.endDate.toISOString(),
      active: sub.active,
      previousPlan: sub.previousPlan ?? null,
    });
  } catch (err) {
    next(err);
  }
});
