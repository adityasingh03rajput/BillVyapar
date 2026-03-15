import jwt from 'jsonwebtoken';
import fs from 'fs';

// App user tokens
export function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

// Master admin tokens — separate secret so admin JWTs can't be used on app routes and vice versa
const MASTER_ADMIN_SECRET = process.env.MASTER_ADMIN_JWT_SECRET || process.env.JWT_SECRET + '_master_admin';

export function signMasterAdminToken(payload) {
  return jwt.sign({ ...payload, _scope: 'master_admin' }, MASTER_ADMIN_SECRET, { expiresIn: '12h' });
}

export function verifyMasterAdminToken(token) {
  const decoded = jwt.verify(token, MASTER_ADMIN_SECRET);
  if (decoded._scope !== 'master_admin') throw new Error('Invalid token scope');
  return decoded;
}

export function decodeAccessToken(token) {
  // Decode without verifying expiry — used for signout so expired tokens can still clear sessions
  return jwt.decode(token);
}

export function signSubscriptionToken({ userId, profileId, plan, endDate }) {
  const serverNowSec = Math.floor(Date.now() / 1000);
  const endDateSec = Math.floor(new Date(endDate).getTime() / 1000);
  const maxOfflineSeconds = Number(process.env.SUBSCRIPTION_MAX_OFFLINE_SECONDS || 60 * 60 * 24 * 7);

  const payload = {
    sub: String(userId),
    profileId: String(profileId),
    plan: String(plan),
    endDate: endDateSec,
    srv: serverNowSec,
    maxOffline: maxOfflineSeconds,
  };

  const privateKeyFromFile = process.env.SUBSCRIPTION_JWT_PRIVATE_KEY_FILE
    ? fs.readFileSync(process.env.SUBSCRIPTION_JWT_PRIVATE_KEY_FILE, 'utf8')
    : null;
  const privateKey = privateKeyFromFile || process.env.SUBSCRIPTION_JWT_PRIVATE_KEY;
  if (privateKey) {
    return jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      expiresIn: Math.max(1, Math.min(maxOfflineSeconds, endDateSec - serverNowSec)),
      keyid: process.env.SUBSCRIPTION_JWT_KID || undefined,
    });
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: Math.max(1, Math.min(maxOfflineSeconds, endDateSec - serverNowSec)),
  });
}
