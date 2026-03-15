import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGODB_URI);

const User = mongoose.model('User', new mongoose.Schema({ email: String, createdAt: Date }, { timestamps: true }));
const LicenseKey = mongoose.model('LicenseKey', new mongoose.Schema({
  key: String, assignedEmail: String, activatedByUserId: mongoose.Schema.Types.ObjectId,
  status: String, expiresAt: Date, activatedAt: Date, durationDays: Number
}));
const Subscriber = mongoose.model('Subscriber', new mongoose.Schema({
  ownerUserId: mongoose.Schema.Types.ObjectId, status: String, trialExtensionDays: Number
}));

const email = 'adityarajsir162@gmail.com';
const user = await User.findOne({ email }).lean();
console.log('User:', user ? { id: String(user._id), email: user.email, createdAt: user.createdAt } : 'NOT FOUND');

if (user) {
  const licenses = await LicenseKey.find({ activatedByUserId: user._id }).lean();
  const now = new Date();
  console.log('\nLicense keys for this user:');
  if (licenses.length === 0) console.log('  (none)');
  licenses.forEach(l => console.log(
    ' -', l.key, '| status:', l.status,
    '| expiresAt:', l.expiresAt?.toISOString?.(),
    '| expired:', now > new Date(l.expiresAt)
  ));

  // Also check by email
  const byEmail = await LicenseKey.find({ assignedEmail: email }).lean();
  console.log('\nLicense keys assigned to this email:');
  if (byEmail.length === 0) console.log('  (none)');
  byEmail.forEach(l => console.log(
    ' -', l.key, '| status:', l.status,
    '| activatedByUserId:', l.activatedByUserId,
    '| expiresAt:', l.expiresAt?.toISOString?.()
  ));

  const sub = await Subscriber.findOne({ ownerUserId: user._id }).lean();
  console.log('\nSubscriber:', sub ? { status: sub.status, trialExtensionDays: sub.trialExtensionDays } : 'NOT FOUND');

  const TRIAL_DAYS = 7;
  const ext = Number(sub?.trialExtensionDays || 0);
  const trialEnd = new Date(user.createdAt.getTime() + (TRIAL_DAYS + ext) * 24 * 60 * 60 * 1000);
  console.log('\nTrial end:', trialEnd.toISOString());
  console.log('Now:      ', now.toISOString());
  console.log('Trial expired:', now > trialEnd);
}

await mongoose.disconnect();
