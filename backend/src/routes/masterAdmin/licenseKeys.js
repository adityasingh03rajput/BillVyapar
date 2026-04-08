import { Router } from 'express';
import crypto from 'crypto';
import { LicenseKey } from '../../models/LicenseKey.js';
import { AuditLog } from '../../models/AuditLog.js';
import { User } from '../../models/User.js';
import { Subscriber } from '../../models/Subscriber.js';
import { requireMasterAdmin } from '../../middleware/masterAdmin.js';
import { canSendEmail, sendEmail } from '../../lib/email.js';

export const masterAdminLicenseKeysRouter = Router();
masterAdminLicenseKeysRouter.use(requireMasterAdmin);

function generateKey() {
  // Format: BVYP-XXXX-XXXX-XXXX
  const part = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `BVYP-${part()}-${part()}-${part()}`;
}

// GET /master-admin/license-keys — list all keys
masterAdminLicenseKeysRouter.get('/', async (req, res, next) => {
  try {
    const { status, email, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (email) filter.assignedEmail = { $regex: email, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const keys = await LicenseKey.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await LicenseKey.countDocuments(filter);

    res.json({
      keys: keys.map(k => ({ ...k, _id: String(k._id) })),
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
});

// POST /master-admin/license-keys — generate a new key and email it
masterAdminLicenseKeysRouter.post('/', async (req, res, next) => {
  try {
    const { assignedEmail, durationDays, notes, sendEmail: doSendEmail = true } = req.body || {};

    if (!assignedEmail || !durationDays) {
      return res.status(400).json({ error: 'assignedEmail and durationDays are required' });
    }

    // Generate unique key
    let key;
    for (let i = 0; i < 10; i++) {
      const candidate = generateKey();
      const exists = await LicenseKey.findOne({ key: candidate }).lean();
      if (!exists) { key = candidate; break; }
    }
    if (!key) return res.status(500).json({ error: 'Failed to generate unique key' });

    const licenseKey = await LicenseKey.create({
      key,
      assignedEmail: String(assignedEmail).toLowerCase().trim(),
      durationDays: Number(durationDays),
      generatedByAdminId: req.masterAdminId,
      notes: notes || null,
    });

    // Look up subscriber for audit tenantId
    const user = await User.findOne({ email: String(assignedEmail).toLowerCase().trim() }).lean();
    const subscriber = user ? await Subscriber.findOne({ ownerUserId: user._id }).lean() : null;

    await AuditLog.create({
      actorMasterAdminId: req.masterAdminId,
      action: 'license_key_generated',
      tenantId: subscriber?._id ?? null,
      after: { key, assignedEmail, durationDays },
    });

    // Send email with the key
    if (doSendEmail) {
      const html = `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#2563eb">Your BillVyapar License Key</h2>
          <p>Hello,</p>
          <p>Your license key for BillVyapar has been generated. Use it to activate your subscription.</p>
          <div style="background:#f1f5f9;border-radius:8px;padding:20px;text-align:center;margin:24px 0">
            <p style="font-size:13px;color:#64748b;margin:0 0 8px">Your License Key</p>
            <p style="font-size:24px;font-weight:bold;letter-spacing:2px;color:#1e293b;margin:0">${key}</p>
          </div>
          <p><strong>Valid for:</strong> ${durationDays} days after activation</p>
          <p>To activate, open BillVyapar → Subscription → Enter your license key.</p>
          <p style="color:#64748b;font-size:12px">This key is assigned to ${assignedEmail} and cannot be used by others.</p>
        </div>
      `;

      if (canSendEmail()) {
        try {
          await sendEmail({
            to: assignedEmail,
            subject: 'Your BillVyapar License Key',
            html,
            text: `Hello,\n\nYour license key for BillVyapar is: ${key}\n\nValid for ${durationDays} days after activation. To activate, open BillVyapar > Subscription > Enter License Key.`,
          });
        } catch (e) {
          console.error('[LicenseKey] Email send failed:', e);
        }
      } else {
        console.log(`[DEV] License key for ${assignedEmail}: ${key}`);
      }
    }

    res.json({ licenseKey: { ...licenseKey.toObject(), _id: String(licenseKey._id) } });
  } catch (err) {
    next(err);
  }
});

// POST /master-admin/license-keys/:id/revoke
masterAdminLicenseKeysRouter.post('/:id/revoke', async (req, res, next) => {
  try {
    const lk = await LicenseKey.findById(req.params.id);
    if (!lk) return res.status(404).json({ error: 'License key not found' });

    const before = lk.toObject();
    lk.status = 'revoked';
    await lk.save();

    await AuditLog.create({
      actorMasterAdminId: req.masterAdminId,
      action: 'license_key_revoked',
      before,
      after: lk.toObject(),
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
