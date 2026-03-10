import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { PasswordResetOtp } from '../models/PasswordResetOtp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

function arg(name) {
  const idx = process.argv.findIndex((a) => a === name);
  if (idx === -1) return null;
  const v = process.argv[idx + 1];
  if (!v || v.startsWith('--')) return null;
  return v;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

async function main() {
  const email = String(arg('--email') || '').trim().toLowerCase();
  const password = String(arg('--password') || '');
  const confirm = hasFlag('--confirm');
  const force = hasFlag('--force');

  if (!email || !password) {
    throw new Error('Usage: node backend/src/scripts/reset_user_password.js --email <email> --password <newPassword> [--confirm] [--force]');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI is required');

  await mongoose.connect(mongoUri);

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error(`User not found for email: ${email}`);
  }

  const history = Array.isArray(user.passwordHistory) ? user.passwordHistory : [];
  const candidates = [user.passwordHash, ...history].filter(Boolean);

  if (!force) {
    for (const h of candidates) {
      const same = await bcrypt.compare(password, String(h));
      if (same) {
        throw new Error('You cannot reuse a previous password. Re-run with a different password, or pass --force to override.');
      }
    }
  }

  const prevHash = user.passwordHash;
  const nextHash = await bcrypt.hash(password, 10);

  const nextHistory = [prevHash, ...history].filter(Boolean);
  const max = Number(process.env.PASSWORD_HISTORY_LIMIT || 5);

  if (!confirm) {
    // eslint-disable-next-line no-console
    console.log('Dry run. No changes applied.');
    // eslint-disable-next-line no-console
    console.log({ email, userId: String(user._id), willClearSessions: true, willClearResetOtps: true });
    // eslint-disable-next-line no-console
    console.log('Re-run with --confirm to apply.');
    await mongoose.disconnect();
    return;
  }

  user.passwordHistory = nextHistory.slice(0, Math.max(1, max));
  user.passwordHash = nextHash;
  await user.save();

  await Session.deleteOne({ userId: user._id });
  await PasswordResetOtp.updateMany({ userId: user._id, usedAt: null }, { $set: { usedAt: new Date() } });

  // eslint-disable-next-line no-console
  console.log('Password reset successful.');
  // eslint-disable-next-line no-console
  console.log({ email, userId: String(user._id) });

  await mongoose.disconnect();
}

main().catch(async (e) => {
  // eslint-disable-next-line no-console
  console.error(e?.message || e);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
