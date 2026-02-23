import { Router } from 'express';
import { requireAuth, requireValidDeviceSession } from '../middleware/auth.js';
import { requireActiveSubscriptionOrAllowReadonlyGet } from '../middleware/subscription.js';
import { requireProfile } from '../middleware/profile.js';
import { Document } from '../models/Document.js';

export const analyticsRouter = Router();

analyticsRouter.use(
  requireAuth,
  requireValidDeviceSession,
  requireActiveSubscriptionOrAllowReadonlyGet(['/analytics']),
  requireProfile
);

analyticsRouter.get('/', async (req, res, next) => {
  try {
    const documents = await Document.find({ userId: req.userId, profileId: req.profileId }).sort({ createdAt: -1 });

    const invoices = documents.filter(d => d.type === 'invoice');
    const quotations = documents.filter(d => d.type === 'quotation');

    const totalSales = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    const paidInvoices = invoices.filter(inv => inv.paymentStatus === 'paid');
    const unpaidInvoices = invoices.filter(inv => inv.paymentStatus !== 'paid');
    const outstanding = unpaidInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

    const itemSales = {};
    invoices.forEach(inv => {
      (inv.items || []).forEach(item => {
        if (!itemSales[item.name]) {
          itemSales[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        }
        itemSales[item.name].quantity += item.quantity || 0;
        itemSales[item.name].revenue += item.total || 0;
      });
    });

    const topItems = Object.values(itemSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const monthlyRevenue = {};
    invoices.forEach(inv => {
      if (inv.date) {
        const month = inv.date.substring(0, 7);
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (inv.grandTotal || 0);
      }
    });

    res.json({
      totalSales,
      outstanding,
      totalInvoices: invoices.length,
      totalQuotations: quotations.length,
      paidInvoices: paidInvoices.length,
      unpaidInvoices: unpaidInvoices.length,
      topItems,
      monthlyRevenue,
      conversionRate: quotations.length > 0 ? ((invoices.length / quotations.length) * 100).toFixed(1) : 0,
    });
  } catch (err) {
    next(err);
  }
});
