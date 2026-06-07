require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/medisync');
    console.log('Connected');
    const db = mongoose.connection.db;
    
    const collections = await db.listCollections().toArray();
    if (collections.some(c => c.name === 'payments')) {
      const indexes = await db.collection('payments').indexes();
      console.log('Indexes:', indexes);
      
      const hasTransactionIdIndex = indexes.some(idx => idx.name === 'transactionId_1');
      if (hasTransactionIdIndex) {
        await db.collection('payments').dropIndex('transactionId_1');
        console.log('Dropped transactionId_1 index!');
      } else {
        console.log('Index not found.');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
