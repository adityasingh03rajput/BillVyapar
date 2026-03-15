import { Router } from 'express';
import { Subscriber } from '../../models/Subscriber.js';
import { LicenseKey } from '../../models/LicenseKey.js';
import { Plan } from '../../models/Plan.js';
import { AuditLog } from '../../models/AuditLog.js';
import { requireMasterAdmin } from '../../middleware/masterAdmin.js';

export const masterAdminLicensesRouter = Router();

masterAdminLicensesRouter.use(requireMasterAdmin);

async function logAudit(actorId, action, tenantId, before, after, metadata) {
  await AuditLog.create({ actorMasterAdminId: actorId, tenantId, action, before, after, metadata });
}

// Assign/update license — writes to LicenseKey (the actual access-control source of truth)
masterAdminLicensesRouter.post('/:tenantId', async (req, res, next) => {
  try {
    const { planId, durationDays, assignedEmail } = req.body;

    const subscriber = await Subscriber.findById(req.params.tenantId).lean();
    if (!subscriber) return res.status(404).json({ error: 'Subscriber not found' });

    const plan = planId ? await Plan.findById(planId).lean() : null;

    const days = Number(durationDays) || 365;
    const email = assignedEmail || subscriber.email;

    if (!email) return res.status(400).json({ error: 'assignedEmail is required' });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // Generate a unique key
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let key = '';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) key += '-';
      key += chars[Math.floor(Math.random() * chars.length)];
    }

    // Expire any existing active keys for this subscriber
    const existingKey = await LicenseKey.findOne({
      activatedByUserId: subscriber.ownerUserId,
      status: 'active',
    });
    const before = existingKey ? existingKey.toObject() : null;
    if (existingKey) {
      existingKey.status = 'expired';
      await existingKey.save();
    }

    const license = await LicenseKey.create({
      key,
      assignedEmail: email,
      durationDays: days,
      status: 'active',
      activatedByUserId: subscriber.ownerUserId,
      activatedAt: now,
      expiresAt,
      generatedByAdminId: req.masterAdminId,
      notes: plan ? `Plan: ${plan.name}` : null,
    });

    // Sync subscriber status + apply plan limits if a plan was specified
    const subscriberUpdate = { status: 'active' };
    if (plan?.limits) {
      subscriberUpdate['limits.maxDocumentsPerMonth'] = plan.limits.maxDocumentsPerMonth ?? -1;
      subscriberUpdate['limits.maxCustomers']         = plan.limits.maxCustomers ?? -1;
      subscriberUpdate['limits.maxSuppliers']         = plan.limits.maxSuppliers ?? -1;
      subscriberUpdate['limits.maxItems']             = plan.limits.maxItems ?? -1;
      subscriberUpdate['limits.maxSessions']          = plan.limits.maxSessions ?? -1;
      subscriberUpdate['limits.maxPdfExportsPerMonth']= plan.limits.maxPdfExportsPerMonth ?? -1;
    }
    await Subscriber.updateOne({ _id: subscriber._id }, { $set: subscriberUpdate });

    await logAudit(req.masterAdminId, 'license_assigned', subscriber._id, before, license.toObject(), { durationDays: days });

    res.json({ license: { ...license.toObject(), _id: String(license._id) } });
  } catch (err) {
    next(err);
  }
});

// Extend license — extends the active LicenseKey expiresAt (works on expired keys too)
masterAdminLicensesRouter.post('/:tenantId/extend', async (req, res, next) => {
  try {
    const { days } = req.body;
    if (!days || days <= 0) return res.status(400).json({ error: 'Invalid days value' });

    const subscriber = await Subscriber.findById(req.params.tenantId).lean();
    if (!subscriber) return res.status(404).json({ error: 'Subscriber not found' });

    // Find most recent key (active or expired) — not revoked
    const license = await LicenseKey.findOne({
      activatedByUserId: subscriber.ownerUserId,
      status: { $in: ['active', 'expired'] },
    }).sort({ expiresAt: -1 });
    if (!license) return res.status(404).json({ error: 'No license found for this subscriber' });

    const before = license.toObject();
    const base = license.expiresAt && new Date(license.expiresAt) > new Date()
      ? new Date(license.expiresAt)   // still in future — extend from current expiry
      : new Date();                   // already expired — extend from now
    license.expiresAt = new Date(base.getTime() + Number(days) * 24 * 60 * 60 * 1000);
    license.status = 'active';        // reactivate if it was expired
    await license.save();

    // Sync subscriber status
    await Subscriber.updateOne({ _id: subscriber._id }, { $set: { status: 'active' } });

    await logAudit(req.masterAdminId, 'license_extended', subscriber._id, before, license.toObject(), { days });

    res.json({ license: { ...license.toObject(), _id: String(license._id) } });
  } catch (err) {
    next(err);
  }
});
