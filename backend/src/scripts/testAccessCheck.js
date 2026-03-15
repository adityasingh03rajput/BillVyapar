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

const TRIAL_DAYS = 7;
const email = 'adityarajsir162@gmail.com';
const now = new Date();

const [user, subscriber] = await Promise.all([
  User.findOne({ email }).lean(),
  Subscriber.findOne({}).lean(), // will refine below
]);

const sub = await Subscriber.findOne({ ownerUserId: user._id }).lean();

console.log(`\nChecking access for: ${email}`);
console.log(`Now: ${now.toISOString()}`);

// Step 1: suspended?
if (sub?.status === 'suspended') { console.log('❌ BLOCKED: suspended'); process.exit(0); }

// Step 2: active license?
const activeLicense = await LicenseKey.findOne({
  activatedByUserId: user._id,
  status: 'active',
  expiresAt: { $gt: now },
}).lean();

if (activeLicense) {
  console.log(`✅ ACCESS GRANTED via license — expires ${activeLicense.expiresAt}`);
  process.exit(0);
}

// Step 3: trial?
const ext = Number(sub?.trialExtensionDays || 0);
const trialEnd = new Date(user.createdAt.getTime() + (TRIAL_DAYS + ext) * 24 * 60 * 60 * 1000);
if (now <= trialEnd) {
  console.log(`✅ ACCESS GRANTED via trial — ends ${trialEnd.toISOString()}`);
  process.exit(0);
}

console.log(`❌ BLOCKED: license expired, trial ended ${trialEnd.toISOString()}`);
console.log(`   New middleware will return 402 License Expired`);

await mongoose.disconnect();
