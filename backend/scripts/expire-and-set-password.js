import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../src/models/User.js';
import { Subscription } from '../src/models/Subscription.js';
import { Session } from '../src/models/Session.js';

const emailArg = process.argv[2] || '';
const passwordArg = process.argv[3] || '';

const email = String(emailArg).toLowerCase().trim();
const newPassword = String(passwordArg);

if (!email) {
  console.error('Usage: node ./scripts/expire-and-set-password.js <email> <newPassword>');
  process.exit(1);
}

if (!newPassword) {
  console.error('newPassword is required');
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is required');
}

await mongoose.connect(process.env.MONGODB_URI);

const user = await User.findOne({ email });
if (!user) {
  console.error('User not found:', email);
  await mongoose.disconnect();
  process.exit(1);
}

const passwordHash = await bcrypt.hash(newPassword, 10);
await User.updateOne({ _id: user._id }, { $set: { passwordHash } });

const endDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
const subRes = await Subscription.updateOne({ userId: user._id }, { $set: { endDate } });

const sessRes = await Session.deleteMany({ userId: user._id });

const sub = await Subscription.findOne({ userId: user._id });
const now = new Date();
const end = sub?.endDate ? new Date(sub.endDate) : null;
const remaining = end ? Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

console.log(
  JSON.stringify(
    {
      ok: true,
      email,
      userId: String(user._id),
      passwordUpdated: true,
      subscriptionMatched: subRes.matchedCount,
      subscriptionModified: subRes.modifiedCount,
      newEndDate: end ? end.toISOString() : null,
      daysRemaining: remaining,
      isExpired: typeof remaining === 'number' ? remaining < 0 : null,
      sessionsDeleted: sessRes.deletedCount,
    },
    null,
    2
  )
);

await mongoose.disconnect();
