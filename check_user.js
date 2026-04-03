
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in .env');
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
});

const User = mongoose.model('User', userSchema);

async function checkUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'adityarajsir162@gmai.com';
    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      console.log('User found:', user);
    } else {
      console.log('User not found with email:', email);
      // Check for gmail.com just in case
      const alternativeEmail = 'adityarajsir162@gmail.com';
      const altUser = await User.findOne({ email: alternativeEmail });
      if (altUser) {
        console.log('User found with alternative email:', altUser);
      } else {
        console.log('User not found with alternative email either');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUser();
