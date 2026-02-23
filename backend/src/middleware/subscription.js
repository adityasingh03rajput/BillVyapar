import { Subscription } from '../models/Subscription.js';

export async function requireActiveSubscription(req, res, next) {
  try {
    const sub = await Subscription.findOne({ userId: req.userId });
    if (!sub?.endDate) {
      return res.status(403).json({ error: 'Subscription expired. Please renew.' });
    }

    const now = new Date();
    const end = new Date(sub.endDate);
    const diffMs = end.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return res.status(403).json({
        error: 'Subscription expired. Please renew.',
        endDate: end.toISOString(),
        daysRemaining,
      });
    }

    req.subscription = {
      plan: sub.plan,
      endDate: end,
      daysRemaining,
    };

    next();
  } catch (err) {
    next(err);
  }
}

export function requireActiveSubscriptionOrAllowReadonlyGet(allowBaseUrls = []) {
  return async function requireActiveSubscriptionOrAllowReadonlyGetMiddleware(req, res, next) {
    try {
      const sub = await Subscription.findOne({ userId: req.userId });
      if (!sub?.endDate) {
        if (req.method === 'GET' && allowBaseUrls.includes(req.baseUrl)) {
          return next();
        }
        return res.status(403).json({ error: 'Subscription expired. Please renew.' });
      }

      const now = new Date();
      const end = new Date(sub.endDate);
      const diffMs = end.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (daysRemaining < 0) {
        if (req.method === 'GET' && allowBaseUrls.includes(req.baseUrl)) {
          return next();
        }
        return res.status(403).json({
          error: 'Subscription expired. Please renew.',
          endDate: end.toISOString(),
          daysRemaining,
        });
      }

      req.subscription = {
        plan: sub.plan,
        endDate: end,
        daysRemaining,
      };

      next();
    } catch (err) {
      next(err);
    }
  };
}
