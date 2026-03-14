/**
 * resetTrials.js
 *
 * Resets every existing user's trial so they get a fresh 7-day window from now.
 * - Users whose trial is still active (signed up < 7 days ago) are left untouched.
 * - Users whose trial has expired (signed up > 7 days ago) get createdAt reset to now,
 *   giving them a fresh 7-day trial.
 *
 * Run: node --experimental-vm-modules backend/src/scripts/resetTrials.js
 *   or: cd backend && node src/scripts/resetTrials.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const TRIAL_DAYS = 7;

// Minimal inline schema — avoids importing the full model tree
const userSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const User = mongoose.models.User || mongoose.model('User', userSchema, 'users');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB:', process.env.MONGODB_URI.split('@')[1]);

  const now = new Date();
  const trialCutoff = new Date(now.getTime() - TRIAL_DAYS * 24 * 60 * 60 * 1000);

  // Find users whose trial has already expired
  const expired = await User.find({ createdAt: { $lt: trialCutoff } }).lean();
  console.log(`\nFound ${expired.length} user(s) with expired trials.`);

  if (expired.length === 0) {
    console.log('Nothing to update — all users are within their trial window.');
    await mongoose.disconnect();
    return;
  }

  // Reset createdAt to now for all expired-trial users
  const ids = expired.map(u => u._id);
  const result = await User.updateMany(
    { _id: { $in: ids } },
    { $set: { createdAt: now } }
  );

  console.log(`✅ Reset trial for ${result.modifiedCount} user(s). They now have 7 days from ${now.toISOString()}.`);

  // Summary
  const still_active = await User.countDocuments({ createdAt: { $gte: trialCutoff } });
  console.log(`\nSummary:`);
  console.log(`  Users with active trial : ${still_active}`);
  console.log(`  Users reset to new trial: ${result.modifiedCount}`);

  await mongoose.disconnect();
  console.log('\nDone. Disconnected.');
}

run().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
