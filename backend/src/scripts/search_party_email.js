import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import mongoose from 'mongoose';

import { Customer } from '../models/Customer.js';
import { Supplier } from '../models/Supplier.js';
import { User } from '../models/User.js';
import { BusinessProfile } from '../models/BusinessProfile.js';

// Load .env from backend directory (same behavior as backend/src/index.js)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

async function main() {
  const query = String(process.argv[2] || '').trim();
  if (!query) {
    // eslint-disable-next-line no-console
    console.error('Usage: node backend/src/scripts/search_party_email.js <name_or_email_fragment>');
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    // eslint-disable-next-line no-console
    console.error('MONGODB_URI is missing. Make sure backend/.env contains MONGODB_URI.');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);

  const rx = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  const customers = await Customer.find({ $or: [{ name: rx }, { email: rx }] })
    .select({ name: 1, email: 1, phone: 1, profileId: 1, userId: 1 })
    .limit(25)
    .lean();

  const suppliers = await Supplier.find({ $or: [{ name: rx }, { email: rx }] })
    .select({ name: 1, email: 1, phone: 1, profileId: 1, userId: 1 })
    .limit(25)
    .lean();

  const users = await User.find({ $or: [{ name: rx }, { email: rx }, { phone: rx }] })
    .select({ name: 1, email: 1, phone: 1 })
    .limit(25)
    .lean();

  const profiles = await BusinessProfile.find({ $or: [{ businessName: rx }, { ownerName: rx }, { email: rx }, { phone: rx }] })
    .select({ businessName: 1, ownerName: 1, email: 1, phone: 1 })
    .limit(25)
    .lean();

  // eslint-disable-next-line no-console
  console.log('\n=== Customers (top 25) ===');
  // eslint-disable-next-line no-console
  console.table(
    customers.map((c) => ({
      id: String(c._id),
      name: c.name,
      email: c.email,
      phone: c.phone,
      profileId: c.profileId ? String(c.profileId) : null,
      userId: c.userId ? String(c.userId) : null,
    }))
  );

  // eslint-disable-next-line no-console
  console.log('\n=== Suppliers (top 25) ===');
  // eslint-disable-next-line no-console
  console.table(
    suppliers.map((s) => ({
      id: String(s._id),
      name: s.name,
      email: s.email,
      phone: s.phone,
      profileId: s.profileId ? String(s.profileId) : null,
      userId: s.userId ? String(s.userId) : null,
    }))
  );

  // eslint-disable-next-line no-console
  console.log('\n=== Users (top 25) ===');
  // eslint-disable-next-line no-console
  console.table(
    users.map((u) => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      phone: u.phone,
    }))
  );

  // eslint-disable-next-line no-console
  console.log('\n=== Business Profiles (top 25) ===');
  // eslint-disable-next-line no-console
  console.table(
    profiles.map((p) => ({
      id: String(p._id),
      businessName: p.businessName,
      ownerName: p.ownerName,
      email: p.email,
      phone: p.phone,
    }))
  );

  await mongoose.disconnect();
}

main().catch(async (e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
