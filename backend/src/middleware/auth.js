import { verifyAccessToken } from '../lib/jwt.js';
import { Session } from '../models/Session.js';
import { Employee } from '../models/Employee.js';

// Throttle session lastActive updates — only write to DB once per 5 min per device
// This cuts DB writes by ~99% for active users
const sessionUpdateCache = new Map(); // key: `${userId}:${deviceId}` → last update timestamp
const SESSION_UPDATE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// ── Employee isActive cache (Flaw #3 & #15 fix) ───────────────────────────────
// Avoids a DB hit on every request while still enforcing deactivation within 60s.
const employeeActiveCache = new Map(); // key: employeeId → { isActive, ts }
const EMPLOYEE_CACHE_TTL_MS = 60 * 1000; // 60 seconds

export async function requireAuth(req, res, next) {
  try {
    const header = req.header('Authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    req.userId = payload.sub;
    req.user = payload.user;

    // ── Flaw #3 & #15: enforce isActive for employee tokens ──────────────────
    // Deactivating an employee now takes effect within 60s even for existing sessions.
    if (payload.user?.userType === 'employee') {
      const cached = employeeActiveCache.get(payload.sub);
      const now = Date.now();
      if (!cached || now - cached.ts > EMPLOYEE_CACHE_TTL_MS) {
        const emp = await Employee.findById(payload.sub).select('isActive').lean();
        const isActive = emp?.isActive ?? false;
        employeeActiveCache.set(payload.sub, { isActive, ts: now });
        if (!isActive) {
          return res.status(401).json({ error: 'Your account has been deactivated. Contact your employer.' });
        }
      } else if (!cached.isActive) {
        return res.status(401).json({ error: 'Your account has been deactivated. Contact your employer.' });
      }
    }

    next();
  } catch (err) {
    next(err);
  }
}

// Exported so the employees route can invalidate the cache immediately on deactivation
export function invalidateEmployeeActiveCache(employeeId) {
  employeeActiveCache.delete(String(employeeId));
}

export async function requireValidDeviceSession(req, res, next) {
  try {
    const deviceId = req.header('X-Device-ID') || `web-${Date.now()}`;
    const cacheKey = `${req.userId}:${deviceId}`;
    const now = Date.now();
    const lastUpdate = sessionUpdateCache.get(cacheKey) || 0;

    // Only write to DB if 5+ minutes have passed since last update
    if (now - lastUpdate > SESSION_UPDATE_INTERVAL_MS) {
      sessionUpdateCache.set(cacheKey, now);
      // Fire-and-forget — don't block the request
      Session.findOneAndUpdate(
        { userId: req.userId, deviceId },
        { $set: { lastActive: new Date() } },
        { upsert: true, new: true }
      ).catch(() => {});
    }

    next();
  } catch (err) {
    next(err);
  }
}
