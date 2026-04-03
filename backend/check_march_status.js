import mongoose from 'mongoose';

const URI = 'mongodb+srv://tellonted03angle_db_user:sfaVnPPpSAX0Qsc2@hukum.lfztkx9.mongodb.net/hukum?retryWrites=true&w=majority&appName=hukum';

async function test() {
  await mongoose.connect(URI);
  const Document = mongoose.model('Document', new mongoose.Schema({ status: String, type: String, date: String, grandTotal: Number }));
  const marchDocs = await Document.find({ date: { $regex: '^2026-03' } }).limit(5);
  console.log('Sample March Documents:', marchDocs.map(d => ({ type: d.type, status: d.status, date: d.date, total: d.grandTotal })));
  
  const statusCounts = await Document.aggregate([
    { $match: { date: { $regex: '^2026-03' } } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  console.log('Status Counts for March:', statusCounts);

  await mongoose.disconnect();
}
test();
