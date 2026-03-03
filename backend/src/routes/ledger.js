import { Router } from 'express';
import mongoose from 'mongoose';

import { requireAuth, requireValidDeviceSession } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/subscription.js';
import { requireProfile } from '../middleware/profile.js';

import { LedgerEntry } from '../models/LedgerEntry.js';
import { Customer } from '../models/Customer.js';
import { Supplier } from '../models/Supplier.js';

export const ledgerRouter = Router();

ledgerRouter.use(requireAuth, requireValidDeviceSession, requireActiveSubscription, requireProfile);

function parseDateParam(value, fallback) {
  if (!value) return fallback;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? fallback : d;
}

function signedFromBalance(amount, type) {
  const a = Number(amount) || 0;
  return String(type || 'dr').toLowerCase() === 'cr' ? -Math.abs(a) : Math.abs(a);
}

function balanceFromSigned(signed) {
  const s = Number(signed) || 0;
  if (s < 0) return { amount: Math.abs(s), type: 'cr' };
  return { amount: Math.abs(s), type: 'dr' };
}

ledgerRouter.get('/statement', async (req, res, next) => {
  try {
    const partyType = String(req.query.partyType || '').trim().toLowerCase();
    const partyId = String(req.query.partyId || '').trim();

    if (partyType !== 'customer' && partyType !== 'supplier') {
      return res.status(400).json({ error: 'partyType must be customer or supplier' });
    }
    if (!mongoose.Types.ObjectId.isValid(partyId)) {
      return res.status(400).json({ error: 'Invalid partyId' });
    }

    const to = parseDateParam(req.query.to, new Date());
    const from = parseDateParam(req.query.from, new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000));

    const PartyModel = partyType === 'customer' ? Customer : Supplier;
    const party = await PartyModel.findOne({ _id: partyId, userId: req.userId, profileId: req.profileId }).lean();
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }

    const openingSignedBase = signedFromBalance(party.openingBalance || 0, party.openingBalanceType || (partyType === 'supplier' ? 'cr' : 'dr'));

    const beforeAgg = await LedgerEntry.aggregate([
      {
        $match: {
          userId: req.userId,
          profileId: req.profileId,
          partyType,
          partyId: new mongoose.Types.ObjectId(partyId),
          date: { $lt: from },
        },
      },
      {
        $group: {
          _id: null,
          debit: { $sum: '$debit' },
          credit: { $sum: '$credit' },
        },
      },
    ]);

    const before = beforeAgg?.[0] || { debit: 0, credit: 0 };
    const openingSigned = openingSignedBase + (Number(before.debit || 0) - Number(before.credit || 0));

    const entries = await LedgerEntry.find({
      userId: req.userId,
      profileId: req.profileId,
      partyType,
      partyId,
      date: { $gte: from, $lte: to },
    })
      .sort({ date: 1, createdAt: 1 })
      .lean();

    let running = openingSigned;
    const rows = entries.map((e) => {
      const debit = Number(e.debit || 0);
      const credit = Number(e.credit || 0);
      running += debit - credit;
      return {
        id: String(e._id),
        date: e.date?.toISOString?.() ?? e.date,
        particulars: e.particulars || '',
        voucherType: e.voucherType || '',
        voucherNo: e.voucherNo || '',
        debit,
        credit,
        balanceAfter: balanceFromSigned(running),
        sourceType: e.sourceType,
        sourceId: String(e.sourceId),
      };
    });

    const periodTotals = rows.reduce(
      (acc, r) => ({ debit: acc.debit + (Number(r.debit) || 0), credit: acc.credit + (Number(r.credit) || 0) }),
      { debit: 0, credit: 0 }
    );

    res.json({
      party: {
        id: String(party._id),
        name: String(party.name || ''),
        gstin: party.gstin || null,
        phone: party.phone || null,
        email: party.email || null,
      },
      range: { from: from.toISOString(), to: to.toISOString() },
      openingBalance: balanceFromSigned(openingSigned),
      periodTotals,
      closingBalance: balanceFromSigned(running),
      rows,
    });
  } catch (err) {
    next(err);
  }
});
