import mongoose from 'mongoose';

const URI = 'mongodb+srv://tellonted03angle_db_user:sfaVnPPpSAX0Qsc2@hukum.lfztkx9.mongodb.net/hukum?retryWrites=true&w=majority&appName=hukum';

async function test() {
  await mongoose.connect(URI);
  const db = mongoose.connection.db;
  const doc = await db.collection('documents').findOne({ date: { $regex: '^2026-03' }, status: 'final' });
  
  if (doc) {
    console.log('Document ID:', doc._id);
    console.log('userId Type:', typeof doc.userId, doc.userId.constructor.name);
    console.log('profileId Type:', typeof doc.profileId, doc.profileId.constructor.name);
    console.log('type:', doc.type);
    console.log('status:', doc.status);
    console.log('grandTotal Type:', typeof doc.grandTotal);
  } else {
    console.log('No march final doc found');
  }

  await mongoose.disconnect();
}
test();
