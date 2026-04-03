
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

const businessProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  businessName: String,
});

const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessProfile' },
  type: String,
  status: String,
  grandTotal: Number,
  date: String,
});

const User = mongoose.model('User', userSchema);
const BusinessProfile = mongoose.model('BusinessProfile', businessProfileSchema);
const Document = mongoose.model('Document', documentSchema);

async function checkData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'adityarajsir162@gmail.com';
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('User not found:', email);
      return;
    }

    console.log('User found:', user.email, `(${user._id})`);

    const profiles = await BusinessProfile.find({ userId: user._id });
    console.log('Profiles found:', profiles.length);

    for (const profile of profiles) {
      console.log(`--- Profile: ${profile.businessName} (${profile._id}) ---`);
      
      const invoices = await Document.countDocuments({ userId: user._id, profileId: profile._id, type: 'invoice' });
      const quotations = await Document.countDocuments({ userId: user._id, profileId: profile._id, type: 'quotation' });
      const nonDraftInvoices = await Document.countDocuments({ userId: user._id, profileId: profile._id, type: 'invoice', status: { $ne: 'draft' } });
      
      console.log(`Invoices: ${invoices}`);
      console.log(`Quotations: ${quotations}`);
      console.log(`Non-draft Invoices: ${nonDraftInvoices}`);

      if (nonDraftInvoices > 0) {
        const sampleInvoice = await Document.findOne({ userId: user._id, profileId: profile._id, type: 'invoice', status: { $ne: 'draft' } });
        console.log(`Sample non-draft invoice: ${JSON.stringify(sampleInvoice, null, 2)}`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkData();
