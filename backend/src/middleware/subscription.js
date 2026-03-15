/**
 * subscription.js — access gate middleware
 *
 * Single source of truth: LicenseKey + 7-day trial.
 * The old Subscription model is no longer consulted.
 *
 * Access is granted when ANY of the following is true:
 *   1. User has an active LicenseKey (status='active', expiresAt > now)
 *   2. User is within their trial window (createdAt + 7 days + trialExtensionDays)
 *
 * Suspended subscribers are always blocked regardless.
 */

import { User }        from '../models/User.js';
import { LicenseKey }  from '../models/LicenseKey.js';
import { Subscriber }  from '../models/Subscriber.js';

const TRIAL_DAYS = 7;

async function checkAccess(userId) {
  const [user, subscriber] = await Promise.all([
    User.findById(userId).lean(),
    Subscriber.findOne({ ownerUserId: userId }).lean(),
  ]);

  if (!user) return { ok: false, code: 'USER_NOT_FOUND', status: 401, message: 'User not found' };

  // Suspended always blocked
  if (subscriber?.status === 'suspended') {
    return { ok: false, code: 'TENANT_SUSPENDED', status: 403, message: 'Your account has been suspended. Please contact support.' };
  }

  // ── 1. Active license key ──────────────────────────────────────────────────
  const now = new Date();
  const activeLicense = await LicenseKey.findOne({
    activatedByUserId: userId,
    status: 'active',
    expiresAt: { $gt: now },
  }).lean();

  if (activeLicense) {
    // Sync expired keys in the background (fire-and-forget)
    LicenseKey.updateMany(
      { activatedByUserId: userId, status: 'active', expiresAt: { $lte: now } },
      { $set: { status: 'expired' } }
    ).catch(() => {});

    // Ensure Subscriber.status is 'active' when license is valid
    if (subscriber && subscriber.status !== 'active' && subscriber.status !== 'suspended') {
      Subscriber.updateOne({ ownerUserId: userId }, { $set: { status: 'active' } }).catch(() => {});
    }

    const daysRemaining = Math.ceil((new Date(activeLicense.expiresAt) - now) / (1000 * 60 * 60 * 24));
    return {
      ok: true,
      source: 'license',
      license: activeLicense,
      daysRemaining,
      endDate: activeLicense.expiresAt,
      subscriber,
    };
  }

  // Sync any stale 'active' keys that have actually expired
  await LicenseKey.updateMany(
    { activatedByUserId: userId, status: 'active', expiresAt: { $lte: now } },
    { $set: { status: 'expired' } }
  ).catch(() => {});

  // ── 2. Trial window ────────────────────────────────────────────────────────
  const extensionDays = Number(subscriber?.trialExtensionDays || 0);
  const trialEnd = new Date(user.createdAt.getTime() + (TRIAL_DAYS + extensionDays) * 24 * 60 * 60 * 1000);

  if (now <= trialEnd) {
    const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
    return {
      ok: true,
      source: 'trial',
      daysRemaining,
      endDate: trialEnd,
      subscriber,
    };
  }

  // ── No valid access ────────────────────────────────────────────────────────
  // Sync Subscriber.status to 'expired' so dashboard counts are accurate
  if (subscriber && subscriber.status === 'active') {
    Subscriber.updateOne({ ownerUserId: userId }, { $set: { status: 'expired' } }).catch(() => {});
  }

  return {
    ok: false,
    code: 'LICENSE_EXPIRED',
    status: 402,
    message: 'Your license has expired. Please activate a new license key to continue.',
    trialEndedAt: trialEnd.toISOString(),
  };
}

// ── Drop-in replacement for requireActiveSubscription ─────────────────────────
export async function requireActiveSubscription(req, res, next) {
  try {
    const result = await checkAccess(req.userId);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.message, code: result.code });
    }
    req.subscription = { plan: result.source, endDate: result.endDate, daysRemaining: result.daysRemaining };
    req.tenant       = result.subscriber;
    req.tenantLimits = result.subscriber?.limits  || {};
    req.tenantFeatures = result.subscriber?.features || {};
    next();
  } catch (err) {
    next(err);
  }
}

// ── Drop-in replacement for requireActiveSubscriptionOrAllowReadonlyGet ────────
export function requireActiveSubscriptionOrAllowReadonlyGet(allowBaseUrls = []) {
  return async function (req, res, next) {
    try {
      const result = await checkAccess(req.userId);
      if (!result.ok) {
        // Allow GET on whitelisted base URLs even when expired
        if (req.method === 'GET' && allowBaseUrls.includes(req.baseUrl)) {
          return next();
        }
        return res.status(result.status).json({ error: result.message, code: result.code });
      }
      req.subscription = { plan: result.source, endDate: result.endDate, daysRemaining: result.daysRemaining };
      req.tenant       = result.subscriber;
      req.tenantLimits = result.subscriber?.limits  || {};
      req.tenantFeatures = result.subscriber?.features || {};
      next();
    } catch (err) {
      next(err);
    }
  };
}
