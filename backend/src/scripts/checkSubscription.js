import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Subscription } from '../models/Subscription.js';
import { LicenseKey } from '../models/LicenseKey.js';

await mongoose.connect(process.env.MONGODB_URI);

const email = 'adityarajsir162@gmail.com';
const user = await User.findOne({ email }).lean();
const now = new Date();

const sub = await Subscription.findOne({ userId: user._id }).lean();
console.log('\n=== Subscription model ===');
if (!sub) {
  console.log('No Subscription record found');
} else {
  const end = new Date(sub.endDate);
  const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  console.log(`plan: ${sub.plan}`);
  console.log(`endDate: ${sub.endDate}`);
  console.log(`daysRemaining: ${days} — ${days < 0 ? '❌ EXPIRED' : '✅ active'}`);
}

const license = await LicenseKey.findOne({ activatedByUserId: user._id }).lean();
console.log('\n=== LicenseKey model ===');
if (!license) {
  console.log('No LicenseKey found');
} else {
  const expired = license.expiresAt && new Date(license.expiresAt) < now;
  console.log(`key: ${license.key}`);
  console.log(`status: ${license.status}`);
  console.log(`expiresAt: ${license.expiresAt} — ${expired ? '❌ EXPIRED' : '✅ valid'}`);
}

await mongoose.disconnect();
