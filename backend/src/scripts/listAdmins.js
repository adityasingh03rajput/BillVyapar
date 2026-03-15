import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { MasterAdmin } from '../models/MasterAdmin.js';

await mongoose.connect(process.env.MONGODB_URI);
const admins = await MasterAdmin.find({}, { email: 1, name: 1, role: 1, status: 1 }).lean();
console.log('Master admins in DB:');
admins.forEach(a => console.log(` - ${a.email} | role: ${a.role} | status: ${a.status}`));
await mongoose.disconnect();
