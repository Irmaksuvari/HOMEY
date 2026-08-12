const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const collections = await db.listCollections().toArray();
  
  for (const collInfo of collections) {
    const collName = collInfo.name;
    const collection = db.collection(collName);
    const docs = await collection.find({}).toArray();
    
    let updatedCount = 0;
    
    for (const doc of docs) {
      const updateData = {};
      let hasUpdate = false;
      
      for (const key of Object.keys(doc)) {
        if (typeof doc[key] === 'string' && (key.endsWith('Id') || key.endsWith('ID') || key === '_id')) {
          const lower = doc[key].toLowerCase();
          if (doc[key] !== lower) {
            updateData[key] = lower;
            hasUpdate = true;
          }
        }
      }
      
      if (hasUpdate) {
        await collection.updateOne({ _id: doc._id }, { $set: updateData });
        updatedCount++;
      }
    }
    console.log(`Updated ${updatedCount} documents in ${collName}`);
  }
  
  console.log("UUID normalization complete.");
  process.exit(0);
}

run();
