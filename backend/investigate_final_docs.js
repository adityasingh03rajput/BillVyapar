import mongoose from 'mongoose';

const URI = 'mongodb+srv://tellonted03angle_db_user:sfaVnPPpSAX0Qsc2@hukum.lfztkx9.mongodb.net/hukum?retryWrites=true&w=majority&appName=hukum';

async function test() {
  await mongoose.connect(URI);
  const Document = mongoose.model('Document', new mongoose.Schema({ status: String, type: String, date: String, grandTotal: Number, profileId: mongoose.Schema.Types.ObjectId }));
  const finalDocs = await Document.find({ date: { $regex: '^2026-03' }, status: 'final' });
  console.log('Final Docs:', JSON.stringify(finalDocs, null, 2));

  await mongoose.disconnect();
}
test();
