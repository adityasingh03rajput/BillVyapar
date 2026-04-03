import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const User = mongoose.model('User', new mongoose.Schema({ email: String }));
  const user = await User.findOne({ email: 'adityarajsir162@gmai.com' });
  if (!user) {
    console.log('User not found');
    return;
  }
  console.log('User ID:', user._id);

  const Profile = mongoose.model('BusinessProfile', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, businessName: String }));
  const profiles = await Profile.find({ userId: user._id });
  console.log('Profiles:', profiles.map(p => ({ id: p._id, name: p.businessName })));

  const Document = mongoose.model('Document', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, profileId: mongoose.Schema.Types.ObjectId, status: String, documentNumber: String, date: String }));
  for (const p of profiles) {
    const count = await Document.countDocuments({ profileId: p._id, status: { $ne: 'draft' } });
    console.log(`Final Documents for Profile ${p.businessName}:`, count);
    
    if (count === 0) {
       const drafts = await Document.countDocuments({ profileId: p._id });
       console.log(`Total Documents (inc drafts) for Profile ${p.businessName}:`, drafts);
    }
  }

  await mongoose.disconnect();
}
check();
