import mongoose from 'mongoose';

const URI = 'mongodb+srv://tellonted03angle_db_user:sfaVnPPpSAX0Qsc2@hukum.lfztkx9.mongodb.net/hukum?retryWrites=true&w=majority&appName=hukum';

async function test() {
  await mongoose.connect(URI);
  const Document = mongoose.model('Document', new mongoose.Schema({ status: String, type: String, date: String, grandTotal: Number, profileId: mongoose.Schema.Types.ObjectId }));
  const marchFinalInvoices = await Document.countDocuments({ date: { $regex: '^2026-03' }, status: 'final', type: 'invoice' });
  console.log('Final March Invoices count:', marchFinalInvoices);

  const sample = await Document.findOne({ date: { $regex: '^2026-03' }, status: 'final' });
  console.log('Sample Final March Doc Type:', sample.type);

  await mongoose.disconnect();
}
test();
