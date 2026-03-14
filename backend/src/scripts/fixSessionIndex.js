import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
const col = db.collection('sessions');

const indexes = await col.indexes();
console.log('Current indexes on sessions:');
indexes.forEach(idx => console.log(' -', JSON.stringify(idx.key), idx.unique ? '(unique)' : ''));

// Drop any unique index on userId alone
for (const idx of indexes) {
  const keys = Object.keys(idx.key);
  if (keys.length === 1 && keys[0] === 'userId' && idx.unique) {
    console.log(`\nDropping stale unique index: ${idx.name}`);
    await col.dropIndex(idx.name);
    console.log('Dropped.');
  }
}

// Ensure correct compound index exists
await col.createIndex({ userId: 1, deviceId: 1 }, { unique: true });
console.log('\n✅ Compound index (userId+deviceId) ensured.');

await mongoose.disconnect();
console.log('Done.');
