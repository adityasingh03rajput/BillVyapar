import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Session } from '../src/models/Session.js';
import { Subscription } from '../src/models/Subscription.js';
import { BusinessProfile } from '../src/models/BusinessProfile.js';
import { Customer } from '../src/models/Customer.js';
import { Item } from '../src/models/Item.js';
import { Document } from '../src/models/Document.js';
import { Counter } from '../src/models/Counter.js';

const keepEmailArg = process.argv[2] || '';
const keepEmail = String(keepEmailArg).toLowerCase().trim();

if (!keepEmail) {
  console.error('Usage: node ./scripts/delete-all-except.js <keepEmail>');
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is required');
}

await mongoose.connect(process.env.MONGODB_URI);

const keepUser = await User.findOne({ email: keepEmail });
if (!keepUser) {
  console.error('Keep user not found:', keepEmail);
  await mongoose.disconnect();
  process.exit(1);
}

const deleteUsers = await User.find({ _id: { $ne: keepUser._id } }, { _id: 1, email: 1 });
const deleteUserIds = deleteUsers.map(u => u._id);

if (deleteUserIds.length === 0) {
  console.log(JSON.stringify({ ok: true, keptEmail: keepEmail, deletedUsers: 0, message: 'No other users to delete' }, null, 2));
  await mongoose.disconnect();
  process.exit(0);
}

const [
  sessionsRes,
  subsRes,
  profilesRes,
  customersRes,
  itemsRes,
  documentsRes,
  countersRes,
  usersRes,
] = await Promise.all([
  Session.deleteMany({ userId: { $in: deleteUserIds } }),
  Subscription.deleteMany({ userId: { $in: deleteUserIds } }),
  BusinessProfile.deleteMany({ userId: { $in: deleteUserIds } }),
  Customer.deleteMany({ userId: { $in: deleteUserIds } }),
  Item.deleteMany({ userId: { $in: deleteUserIds } }),
  Document.deleteMany({ userId: { $in: deleteUserIds } }),
  Counter.deleteMany({ userId: { $in: deleteUserIds } }),
  User.deleteMany({ _id: { $in: deleteUserIds } }),
]);

console.log(
  JSON.stringify(
    {
      ok: true,
      keptEmail: keepEmail,
      keptUserId: String(keepUser._id),
      deletedUserEmails: deleteUsers.map(u => u.email),
      deletedCounts: {
        users: usersRes.deletedCount,
        sessions: sessionsRes.deletedCount,
        subscriptions: subsRes.deletedCount,
        profiles: profilesRes.deletedCount,
        customers: customersRes.deletedCount,
        items: itemsRes.deletedCount,
        documents: documentsRes.deletedCount,
        counters: countersRes.deletedCount,
      },
    },
    null,
    2
  )
);

await mongoose.disconnect();
