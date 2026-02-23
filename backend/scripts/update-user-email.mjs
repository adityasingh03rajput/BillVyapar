import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';

const oldEmailArg = process.argv[2];
const newEmailArg = process.argv[3];

const oldEmail = String(oldEmailArg || '').toLowerCase().trim();
const newEmail = String(newEmailArg || '').toLowerCase().trim();

if (!oldEmail || !newEmail) {
  console.error('Usage: node scripts/update-user-email.mjs <oldEmail> <newEmail>');
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is missing in backend .env');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

const existingNew = await User.findOne({ email: newEmail }).select({ _id: 1, email: 1 });
if (existingNew) {
  console.error('Target email already exists:', { id: String(existingNew._id), email: existingNew.email });
  await mongoose.disconnect();
  process.exit(1);
}

const updated = await User.findOneAndUpdate(
  { email: oldEmail },
  { $set: { email: newEmail } },
  { new: true }
).select({ email: 1, phone: 1, name: 1, createdAt: 1, updatedAt: 1 });

if (!updated) {
  console.log('USER_NOT_FOUND');
} else {
  console.log({ id: String(updated._id), email: updated.email, phone: updated.phone, name: updated.name });
}

await mongoose.disconnect();
