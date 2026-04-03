
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  email: String,
  name: String,
});

const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: String,
});

const User = mongoose.model('User', userSchema);
const Document = mongoose.model('Document', documentSchema);

async function checkTodayData() {
  try {
    await mongoose.connect(MONGODB_URI);
    const email = 'adityarajsir162@gmail.com';
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) return;

    const today = '2026-04-01';
    const todayDocs = await Document.find({ userId: user._id, date: { $gte: today } });
    console.log(`Documents from ${today} onwards: ${todayDocs.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkTodayData();
