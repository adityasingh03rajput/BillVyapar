import mongoose from 'mongoose';

const URI = 'mongodb+srv://tellonted03angle_db_user:sfaVnPPpSAX0Qsc2@hukum.lfztkx9.mongodb.net/hukum?retryWrites=true&w=majority&appName=hukum';

async function test() {
  try {
    await mongoose.connect(URI);
    console.log('Connected!');

    const User = mongoose.model('User', new mongoose.Schema({ email: String }));
    const user = await User.findOne({ email: 'adityarajsir162@gmail.com' });
    console.log('User:', user ? user.email : 'Not Found');

    if (user) {
        const Document = mongoose.model('Document', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, type: String }));
        const count = await Document.countDocuments({ userId: user._id, type: 'invoice' });
        console.log('Invoices for user:', count);
    }

    await mongoose.disconnect();
  } catch (e) {
    console.error(e);
  }
}
test();
