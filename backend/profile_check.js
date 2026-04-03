import mongoose from 'mongoose';

const URI = 'mongodb+srv://tellonted03angle_db_user:sfaVnPPpSAX0Qsc2@hukum.lfztkx9.mongodb.net/hukum?retryWrites=true&w=majority&appName=hukum';

async function test() {
  try {
    await mongoose.connect(URI);
    const User = mongoose.model('User', new mongoose.Schema({ email: String }));
    const user = await User.findOne({ email: 'adityarajsir162@gmail.com' });
    if (!user) return;

    const Profile = mongoose.model('BusinessProfile', new mongoose.Schema({ businessName: String, userId: mongoose.Schema.Types.ObjectId }));
    const Document = mongoose.model('Document', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, profileId: mongoose.Schema.Types.ObjectId, type: String }));

    const profiles = await Profile.find({ userId: user._id });
    for (const p of profiles) {
        const count = await Document.countDocuments({ profileId: p._id, type: 'invoice' });
        console.log(`Profile: ${p.businessName}, ID: ${p._id}, Invoices: ${count}`);
    }

    await mongoose.disconnect();
  } catch (e) {
    console.error(e);
  }
}
test();
