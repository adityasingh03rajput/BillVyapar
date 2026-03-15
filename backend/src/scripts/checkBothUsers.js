import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { LicenseKey } from '../models/LicenseKey.js';
import { Subscriber } from '../models/Subscriber.js';

await mongoose.connect(process.env.MONGODB_URI);

const emails = ['adityarajput167@gmail.com', 'adityarajsir162@gmail.com'];

for (const email of emails) {
  const user = await User.findOne({ email }).lean();
  if (!user) { console.log(`\n${email}: NOT FOUND`); continue; }

  const now = new Date();
  const subscriber = await Subscriber.findOne({ ownerUserId: user._id }).lean();
  const extensionDays = Number(subscriber?.trialExtensionDays || 0);
  const trialEnd = new Date(user.createdAt.getTime() + (7 + extensionDays) * 24 * 60 * 60 * 1000);
  const activeLicense = await LicenseKey.findOne({
    activatedByUserId: user._id, status: 'active', expiresAt: { $gt: now }
  }).lean();
  const anyLicense = await LicenseKey.findOne({ activatedByUserId: user._id }).sort({ expiresAt: -1 }).lean();

  console.log(`\n=== ${email} ===`);
  console.log(`  Created:            ${user.createdAt.toISOString()}`);
  console.log(`  Trial end:          ${trialEnd.toISOString()} → ${now > trialEnd ? '❌ EXPIRED' : '✅ ACTIVE'}`);
  console.log(`  Subscriber.status:  ${subscriber?.status ?? 'no record'}`);
  console.log(`  Active license:     ${activeLicense ? '✅ ' + activeLicense.key : '❌ NONE'}`);
  if (anyLicense) {
    console.log(`  Last license:       ${anyLicense.key} | ${anyLicense.status} | expires ${anyLicense.expiresAt}`);
  }
  console.log(`  REAL ACCESS:        ${activeLicense || now <= trialEnd ? '✅ GRANTED' : '❌ DENIED'}`);
}

await mongoose.disconnect();
