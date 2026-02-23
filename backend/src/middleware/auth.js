import { verifyAccessToken } from '../lib/jwt.js';
import { Session } from '../models/Session.js';

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

    next();
  } catch (err) {
    next(err);
  }
}

export async function requireValidDeviceSession(req, res, next) {
  try {
    const deviceId = req.header('X-Device-ID') || `web-${Date.now()}`;

    const session = await Session.findOne({ userId: req.userId });
    if (session && session.deviceId !== deviceId) {
      return res.status(403).json({ error: 'Session expired. Login detected from another device.' });
    }

    await Session.findOneAndUpdate(
      { userId: req.userId },
      { $set: { deviceId, lastActive: new Date() } },
      { upsert: true, new: true }
    );

    next();
  } catch (err) {
    next(err);
  }
}
