import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { LicenseKey } from '../models/LicenseKey.js';
import { Subscriber } from '../models/Subscriber.js';

await mongoose.connect(process.env.MONGODB_URI);

const email = 'adityarajsir162@gmail.com';
const user = await User.findOne({ email }).lean();
if (!user) { console.log('User not found'); process.exit(1); }

console.log(`\nUser: ${user.email} (id: ${user._id})`);
console.log(`Created: ${user.createdAt}`);

const trialEnd = new Date(user.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
const now = new Date();
console.log(`Trial ends: ${trialEnd.toISOString()} — ${now > trialEnd ? '❌ EXPIRED' : '✅ active'}`);

const subscriber = await Subscriber.findOne({ ownerUserId: user._id }).lean();
console.log(`\nSubscriber status: ${subscriber?.status ?? 'no subscriber record'}`);
console.log(`trialExtensionDays: ${subscriber?.trialExtensionDays ?? 0}`);

const licenses = await LicenseKey.find({ activatedByUserId: user._id }).lean();
console.log(`\nLicense keys (${licenses.length}):`);
for (const l of licenses) {
  const expired = l.expiresAt && new Date(l.expiresAt) < now;
  console.log(`  key: ${l.key}`);
  console.log(`  status: ${l.status}`);
  console.log(`  expiresAt: ${l.expiresAt} — ${expired ? '❌ EXPIRED' : '✅ valid'}`);
  console.log(`  durationDays: ${l.durationDays}`);
  console.log('');
}

// Simulate what enforceTenantAccess does
const activeLicense = await LicenseKey.findOne({
  activatedByUserId: user._id,
  status: 'active',
  expiresAt: { $gt: now },
}).lean();
console.log(`enforceTenantAccess would find active license: ${activeLicense ? '✅ YES — access granted' : '❌ NO'}`);

await mongoose.disconnect();
