import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';

const emailArg = process.argv[2];
const phoneArg = process.argv[3];

const email = String(emailArg || '').toLowerCase().trim();
const phone = String(phoneArg || '').trim();

if (!email || !phone) {
  console.error('Usage: node scripts/set-user-phone.mjs <email> <phoneE164>');
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is missing in backend .env');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

const user = await User.findOneAndUpdate({ email }, { $set: { phone } }, { new: true });

if (!user) {
  console.log('USER_NOT_FOUND');
} else {
  console.log({ id: String(user._id), email: user.email, phone: user.phone });
}

await mongoose.disconnect();
