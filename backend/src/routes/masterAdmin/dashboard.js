import { Router } from 'express';
import { Subscriber as Tenant } from '../../models/Subscriber.js';
import { LicenseKey } from '../../models/LicenseKey.js';
import { TenantPayment } from '../../models/SubscriberPayment.js';
import { User } from '../../models/User.js';
import { requireMasterAdmin } from '../../middleware/masterAdmin.js';

export const masterAdminDashboardRouter = Router();

masterAdminDashboardRouter.use(requireMasterAdmin);

masterAdminDashboardRouter.get('/stats', async (req, res, next) => {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalTenants,
      activeTenants,
      expiredTenants,
      suspendedTenants,
      expiringIn7Days,
      expiringIn30Days,
      totalRevenue,
      monthlySignups,
    ] = await Promise.all([
      Tenant.countDocuments(),
      Tenant.countDocuments({ status: 'active' }),
      Tenant.countDocuments({ status: 'expired' }),
      Tenant.countDocuments({ status: 'suspended' }),
      LicenseKey.countDocuments({
        status: 'active',
        expiresAt: { $gte: now, $lte: sevenDaysFromNow },
      }),
      LicenseKey.countDocuments({
        status: 'active',
        expiresAt: { $gte: now, $lte: thirtyDaysFromNow },
      }),
      TenantPayment.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Real monthly signup counts from User collection
      User.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const signupTrend = monthlySignups.map(r => ({
      month: `${monthNames[r._id.month - 1]} ${r._id.year}`,
      subscribers: r.count,
    }));

    res.json({
      totalTenants,
      activeTenants,
      expiredTenants,
      suspendedTenants,
      expiringIn7Days,
      expiringIn30Days,
      totalRevenue: totalRevenue[0]?.total || 0,
      signupTrend,
    });
  } catch (err) {
    next(err);
  }
});
