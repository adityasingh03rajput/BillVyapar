import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Document } from './src/models/Document.js';

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const total = await Document.countDocuments();
  console.log('Total Documents:', total);
  
  const sample = await Document.findOne().sort({ createdAt: -1 });
  console.log('Latest Document:', sample);
  
  const marchDocs = await Document.countDocuments({ date: { $regex: '^2026-03' } });
  console.log('March 2026 Documents:', marchDocs);

  const allTypes = await Document.aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);
  console.log('Document Types:', allTypes);

  await mongoose.disconnect();
}
check();
