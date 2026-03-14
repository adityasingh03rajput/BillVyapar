import { User } from '../models/User.js';
import { LicenseKey } from '../models/LicenseKey.js';

const TRIAL_DAYS = 7;

export async function enforceTenantAccess(req, res, next) {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(401).json({ error: 'User not found' });

    // Check if user has an active license key
    const activeLicense = await LicenseKey.findOne({
      activatedByUserId: req.userId,
      status: 'active',
      expiresAt: { $gt: new Date() },
    }).lean();

    if (activeLicense) {
      req.licenseKey = activeLicense;
      return next();
    }

    // Check trial period (7 days from account creation)
    const trialEnd = new Date(user.createdAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const now = new Date();

    if (now <= trialEnd) {
      req.trialActive = true;
      req.trialEndsAt = trialEnd;
      return next();
    }

    // Trial expired, no active license
    return res.status(402).json({
      error: 'Trial expired',
      message: 'Your 7-day free trial has ended. Please activate a license key to continue.',
      code: 'TRIAL_EXPIRED',
      trialEndedAt: trialEnd.toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

// Keep for backward compat — no-op now since we removed grace period
export function blockCreateInGrace(req, res, next) {
  next();
}
