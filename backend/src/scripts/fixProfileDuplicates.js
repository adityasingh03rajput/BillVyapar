import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error('MONGODB_URI is required');

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run') || args.has('-n');

const normalizeKey = (v) => String(v ?? '').trim().toLowerCase();

async function ensureUniqueNames({ collectionName, fieldName }) {
  const db = mongoose.connection.db;
  const col = db.collection(collectionName);

  const profileIds = await col.distinct('profileId', { profileId: { $ne: null } });
  let updated = 0;

  for (const profileId of profileIds) {
    const docs = await col
      .find({ profileId, [fieldName]: { $type: 'string' } }, { projection: { [fieldName]: 1 } })
      .sort({ [fieldName]: 1, _id: 1 })
      .toArray();

    const used = new Set();
    for (const d of docs) {
      const raw = String(d?.[fieldName] ?? '');
      const trimmed = raw.trim();
      if (!trimmed) continue;
      used.add(normalizeKey(trimmed));
    }

    const seen = new Map();
    for (const d of docs) {
      const raw = String(d?.[fieldName] ?? '');
      const base = raw.trim();
      if (!base) continue;

      const nk = normalizeKey(base);
      const currCount = (seen.get(nk) ?? 0) + 1;
      seen.set(nk, currCount);

      if (currCount === 1) continue;

      let suffix = currCount;
      let candidate = `${base} ${suffix}`;
      while (used.has(normalizeKey(candidate))) {
        suffix += 1;
        candidate = `${base} ${suffix}`;
      }

      used.add(normalizeKey(candidate));

      if (!dryRun) {
        await col.updateOne({ _id: d._id }, { $set: { [fieldName]: candidate } });
      }
      updated += 1;
      console.log(`[${collectionName}] profileId=${String(profileId)} _id=${String(d._id)} ${fieldName}="${base}" -> "${candidate}"`);
    }
  }

  return updated;
}

async function ensureUniqueDocumentNumbers() {
  const db = mongoose.connection.db;
  const col = db.collection('documents');

  const profileIds = await col.distinct('profileId', { profileId: { $ne: null } });
  let updated = 0;

  for (const profileId of profileIds) {
    const docs = await col
      .find(
        { profileId, documentNumber: { $type: 'string' } },
        { projection: { documentNumber: 1, type: 1, fiscalYear: 1 } }
      )
      .sort({ type: 1, fiscalYear: 1, documentNumber: 1, _id: 1 })
      .toArray();

    const used = new Set();
    for (const d of docs) {
      const dn = String(d?.documentNumber ?? '').trim();
      if (!dn) continue;
      const t = String(d?.type ?? '').trim();
      const fy = String(d?.fiscalYear ?? '').trim();
      used.add(`${t}||${fy}||${normalizeKey(dn)}`);
    }

    const seen = new Map();
    for (const d of docs) {
      const dn = String(d?.documentNumber ?? '').trim();
      if (!dn) continue;

      const t = String(d?.type ?? '').trim();
      const fy = String(d?.fiscalYear ?? '').trim();
      const baseKey = `${t}||${fy}||${normalizeKey(dn)}`;
      const currCount = (seen.get(baseKey) ?? 0) + 1;
      seen.set(baseKey, currCount);

      if (currCount === 1) continue;

      let suffix = currCount;
      let candidate = `${dn} ${suffix}`;
      let candidateKey = `${t}||${fy}||${normalizeKey(candidate)}`;
      while (used.has(candidateKey)) {
        suffix += 1;
        candidate = `${dn} ${suffix}`;
        candidateKey = `${t}||${fy}||${normalizeKey(candidate)}`;
      }

      used.add(candidateKey);

      if (!dryRun) {
        await col.updateOne({ _id: d._id }, { $set: { documentNumber: candidate } });
      }
      updated += 1;
      console.log(`[documents] profileId=${String(profileId)} _id=${String(d._id)} documentNumber="${dn}" -> "${candidate}" (type=${t || 'null'} fy=${fy || 'null'})`);
    }
  }

  return updated;
}

await mongoose.connect(mongoUri);
try {
  console.log(`Running duplicate cleanup (profile-scoped). dryRun=${dryRun}`);

  const c1 = await ensureUniqueNames({ collectionName: 'customers', fieldName: 'name' });
  const c2 = await ensureUniqueNames({ collectionName: 'suppliers', fieldName: 'name' });
  const c3 = await ensureUniqueNames({ collectionName: 'items', fieldName: 'name' });
  const c4 = await ensureUniqueDocumentNumbers();

  console.log(`Done. Updated: customers=${c1}, suppliers=${c2}, items=${c3}, documents(documentNumber)=${c4}`);
} finally {
  await mongoose.disconnect();
}
